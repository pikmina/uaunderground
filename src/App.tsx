import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, matchPath } from "react-router-dom";
import {
  Character,
  RankingAttribute,
  Rumor,
  CharacterComment,
  AdminUser,
  SystemConfig,
  EmojiReactionKey,
  FyeoPost,
  FyeoComment,
} from "./types";
import {
  fetchFirestoreState,
  testConnection,
  verifyCommunityPasswordFirestore,
  adminLoginFirestore,
  reactToRumorFirestore,
  reactToCommentFirestore,
  addRumorFirestore,
  addCommentFirestore,
  saveCharacterFirestore,
  deleteCharacterFirestore,
  saveAttributeFirestore,
  deleteAttributeFirestore,
  updateConfigFirestore,
  fetchAdminsFirestore,
  saveAdminFirestore,
  deleteAdminFirestore,
  deleteRumorFirestore,
  deleteCommentFirestore,
  addFyeoCommentFirestore,
  reactToFyeoPostFirestore,
  reactToFyeoCommentFirestore,
  deleteFyeoPostFirestore,
} from "./firebase";
import { TopNavbar } from "./components/TopNavbar";
import { Gatekeeper } from "./components/Gatekeeper";
import { CharacterCard } from "./components/CharacterCard";
import { CharacterDetailDialog } from "./components/CharacterDetailDialog";
import { CreateRumorDialog } from "./components/CreateRumorDialog";
import { AdminLoginDialog } from "./components/AdminLoginDialog";
import { RumorFeed } from "./components/RumorFeed";
import { FyeoFeed } from "./components/FyeoFeed";
import { LeaderboardView } from "./components/LeaderboardView";
import { AdminDashboard } from "./components/AdminDashboard";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import {
  Users,
  Search,
  Plus,
  Flame,
  Shield,
  Filter,
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Copy,
  X,
  Plus,
} from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/alumnos", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Access and gatekeeper state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("ua_unlocked") === "true";
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = sessionStorage.getItem("ua_admin");
    return saved ? JSON.parse(saved) : null;
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem("ua_admin_token");
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const getAdminHeaders = (extraHeaders: Record<string, string> = {}) => {
    const token = adminToken || sessionStorage.getItem("ua_admin_token") || "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };
  };

  // App core state
  const [config, setConfig] = useState<SystemConfig>({
    communityPassword: "",
    passwordHint: "",
    lastPasswordChange: new Date().toISOString(),
    prohibitedWords: [],
    siteNotice: "",
  });
  const [attributes, setAttributes] = useState<RankingAttribute[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [comments, setComments] = useState<CharacterComment[]>([]);
  const [fyeoPosts, setFyeoPosts] = useState<FyeoPost[]>([]);
  const [fyeoComments, setFyeoComments] = useState<FyeoComment[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(true);
  
  let activeTab: "characters" | "rumors" | "rankings" | "admin" | "fyeo" = "characters";
  if (location.pathname.startsWith("/buzon")) activeTab = "rumors";
  else if (location.pathname.startsWith("/news")) activeTab = "fyeo";
  else if (location.pathname.startsWith("/rankings")) activeTab = "rankings";
  else if (location.pathname.startsWith("/admin")) activeTab = "admin";
  else if (location.pathname.startsWith("/alumnos")) activeTab = "characters";

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  // Dialogs
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailDialogInitialTab, setDetailDialogInitialTab] = useState<"profile" | "comments" | "rumors">("profile");
  const [createRumorOpen, setCreateRumorOpen] = useState(false);
  const [createRumorTargetChar, setCreateRumorTargetChar] = useState<Character | null>(null);
  const [adminInitialSubTab, setAdminInitialSubTab] = useState<"password" | "characters" | "attributes" | "admins" | "moderation" | "fyeo">("characters");
  const [adminEditingCharId, setAdminEditingCharId] = useState<string | null>(null);
  const [adminInitialFyeoAction, setAdminInitialFyeoAction] = useState<{ action: "create" | "edit", postId?: string } | null>(null);

  // Global Toast Notifications
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // In-app Deletion Confirmation Dialog
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    title: string;
    itemName: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    title: "",
    itemName: "",
    message: "",
    onConfirm: () => {},
  });
  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);

  const executeAppDelete = async () => {
    if (!deleteConfirmDialog.onConfirm) return;
    setIsConfirmDeleting(true);
    try {
      await deleteConfirmDialog.onConfirm();
    } catch (err) {
      console.error("Error executing delete:", err);
      showToast("Ocurrió un error al eliminar.", "error");
    } finally {
      setIsConfirmDeleting(false);
      setDeleteConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const handleOpenEditCharacterInAdmin = (char: Character) => {
    if (!adminUser) {
      setShowAdminLogin(true);
      return;
    }
    setAdminInitialSubTab("characters");
    setAdminEditingCharId(char.id);
    navigate("/admin");
    setShowDetailDialog(false);
  };

  // Fetch state from server / Firestore
  const fetchState = async () => {
    try {
      setLoading(true);
      // 1. Try Firebase Firestore (Cloud Database) first
      try {
        const fbData = await fetchFirestoreState();
        if (fbData.characters && fbData.characters.length > 0) {
          if (fbData.config) setConfig((prev) => ({ ...prev, ...fbData.config }));
          if (fbData.attributes) setAttributes(fbData.attributes);
          if (fbData.characters) setCharacters(fbData.characters);
          if (fbData.rumors) setRumors(fbData.rumors);
          if (fbData.comments) setComments(fbData.comments);
          if (adminUser) fetchAdminData();
          return;
        }
      } catch (fbErr) {
        console.warn("Firestore fetch error, attempting API fallback:", fbErr);
      }

      // 2. Fallback to API endpoint
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
        if (data.attributes) setAttributes(data.attributes);
        if (data.characters) setCharacters(data.characters);
        if (data.rumors) setRumors(data.rumors);
        if (data.comments) setComments(data.comments);
        if (data.fyeoPosts) setFyeoPosts(data.fyeoPosts);
        if (data.fyeoComments) setFyeoComments(data.fyeoComments);
      }

      // If admin, fetch admin users and full config
      if (adminUser) {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Error fetching state:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async (tokenOverride?: string) => {
    try {
      // 1. Fetch from Firestore
      try {
        const fbAdmins = await fetchAdminsFirestore();
        if (fbAdmins && fbAdmins.length > 0) {
          setAdminsList(fbAdmins);
        }
      } catch (e) {
        console.warn("Firestore admins fetch error:", e);
      }

      // 2. Also try API if running
      const token = tokenOverride || adminToken || sessionStorage.getItem("ua_admin_token") || "";
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [usersRes, confRes] = await Promise.all([
        fetch("/api/admin/users", { headers }).catch(() => null),
        fetch("/api/admin/config-full", { headers }).catch(() => null),
      ]);
      if (usersRes && usersRes.ok) {
        const users = await usersRes.json();
        setAdminsList(users);
      }
      if (confRes && confRes.ok) {
        const fullConf = await confRes.json();
        if (fullConf.config) setConfig(fullConf.config);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  useEffect(() => {
    testConnection().catch(() => {});
    fetchState();
  }, []);

  useEffect(() => {
    if (adminUser) {
      fetchAdminData();
    }
  }, [adminUser]);

  // Unlock site with community password (Firebase + Server)
  const handleUnlock = async (pwd: string) => {
    try {
      // 1. Primary: Verify directly via Firestore (100% Vercel compatible)
      const fbResult = await verifyCommunityPasswordFirestore(pwd);
      if (fbResult.success) {
        setIsUnlocked(true);
        sessionStorage.setItem("ua_unlocked", "true");
        // Notify API in background if online
        fetch("/api/auth/community", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pwd }),
        }).catch(() => {});
        return { success: true };
      }

      // 2. Secondary: Fallback to API check
      const res = await fetch("/api/auth/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {}
      if (res.ok && data.success) {
        setIsUnlocked(true);
        sessionStorage.setItem("ua_unlocked", "true");
        return { success: true };
      }
      return { success: false, message: fbResult.message || data.message || `Contraseña no válida (${res.status})` };
    } catch {
      return { success: false, message: "Error al verificar la contraseña." };
    }
  };

  // Admin login (Firebase + Server)
  const handleAdminLogin = async (email: string, pass: string) => {
    try {
      // 1. Primary: Direct Firestore admin login (100% Vercel compatible)
      const fbAuth = await adminLoginFirestore(email, pass);
      if (fbAuth.success && fbAuth.user) {
        setAdminUser(fbAuth.user);
        setAdminToken(fbAuth.token || `fb_token_${Date.now()}`);
        sessionStorage.setItem("ua_admin", JSON.stringify(fbAuth.user));
        sessionStorage.setItem("ua_admin_token", fbAuth.token || `fb_token_${Date.now()}`);
        setIsUnlocked(true);
        sessionStorage.setItem("ua_unlocked", "true");
        fetchAdminData(fbAuth.token);
        // Ping API in background
        fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pass }),
        }).catch(() => {});
        return { success: true };
      }

      // 2. Secondary: Fallback to API login
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {}
      if (res.ok && data.success) {
        setAdminUser(data.user);
        setAdminToken(data.token);
        sessionStorage.setItem("ua_admin", JSON.stringify(data.user));
        if (data.token) {
          sessionStorage.setItem("ua_admin_token", data.token);
        }
        setIsUnlocked(true);
        sessionStorage.setItem("ua_unlocked", "true");
        fetchAdminData(data.token);
        return { success: true };
      }
      return { success: false, error: fbAuth.error || data.error || `Credenciales incorrectas (${res.status})` };
    } catch {
      return { success: false, error: "Error en el servidor de autenticación" };
    }
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setAdminToken(null);
    sessionStorage.removeItem("ua_admin");
    sessionStorage.removeItem("ua_admin_token");
    if (activeTab === "admin") navigate("/alumnos");
  };

  const handleLockSite = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("ua_unlocked");
  };

  // Reactions
  const handleReactRumor = async (rumorId: string, emoji: EmojiReactionKey) => {
    try {
      // Optimistic update
      setRumors((prev) =>
        prev.map((r) =>
          r.id === rumorId
            ? {
                ...r,
                reactions: {
                  ...r.reactions,
                  [emoji]: (r.reactions?.[emoji] || 0) + 1,
                },
              }
            : r
        )
      );
      // Persist to Cloud Firestore
      reactToRumorFirestore(rumorId, emoji).catch(console.error);
      // Sync with API
      fetch(`/api/rumors/${rumorId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      }).catch(() => {});
    } catch (err) {
      console.error("Error reacting to rumor:", err);
    }
  };

  const handleReactComment = async (commId: string, emoji: EmojiReactionKey) => {
    try {
      // Optimistic update
      setComments((prev) =>
        prev.map((c) =>
          c.id === commId
            ? {
                ...c,
                reactions: {
                  ...c.reactions,
                  [emoji]: (c.reactions?.[emoji] || 0) + 1,
                },
              }
            : c
        )
      );
      // Persist to Cloud Firestore
      reactToCommentFirestore(commId, emoji).catch(console.error);
      // Sync with API
      fetch(`/api/comments/${commId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      }).catch(() => {});
    } catch (err) {
      console.error("Error reacting to comment:", err);
    }
  };

  // Post Rumor
  const handlePostRumor = async (
    characterId: string | null,
    authorName: string,
    authorEmail: string,
    content: string
  ) => {
    try {
      const targetChar = characters.find((c) => c.id === characterId);
      const newRumor: Rumor = {
        id: `rumor-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        characterId: characterId || undefined,
        characterName: targetChar?.name || undefined,
        authorName: authorName.trim() || "Anónimo UA",
        authorEmail: authorEmail.trim(),
        content: content.trim(),
        reactions: { "🔥": 0, "😱": 0, "💀": 0, "👀": 0, "🤫": 0 },
        timestamp: new Date().toISOString(),
      };

      // 1. Save directly to Cloud Firestore
      await addRumorFirestore(newRumor);
      setRumors((prev) => [newRumor, ...prev]);

      // 2. Sync to API in background
      fetch("/api/rumors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, authorName, authorEmail, content }),
      }).catch(() => {});

      return { success: true };
    } catch (err: any) {
      console.error("Error posting rumor:", err);
      return { success: false, error: err?.message || "No se pudo publicar el rumor." };
    }
  };

  // Post Comment
  const handlePostComment = async (
    characterId: string,
    authorName: string,
    authorEmail: string,
    content: string
  ) => {
    try {
      const newComment: CharacterComment = {
        id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        characterId,
        authorName: authorName.trim() || "Estudiante Anónimo",
        authorEmail: authorEmail.trim(),
        content: content.trim(),
        reactions: { "🔥": 0, "😱": 0, "💀": 0, "👀": 0, "🤫": 0 },
        timestamp: new Date().toISOString(),
      };

      // 1. Save directly to Cloud Firestore
      await addCommentFirestore(newComment);
      setComments((prev) => [newComment, ...prev]);

      // 2. Sync to API in background
      fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, authorName, authorEmail, content }),
      }).catch(() => {});

      return { success: true };
    } catch (err: any) {
      console.error("Error posting comment:", err);
      return { success: false, error: err?.message || "No se pudo publicar el comentario." };
    }
  };

  const handlePostFyeoComment = async (postId: string, authorName: string, authorEmail: string, content: string) => {
    try {
      const newComment: FyeoComment = {
        id: "fyeocomm_" + Date.now().toString(),
        postId,
        authorName,
        authorEmail,
        content,
        timestamp: new Date().toISOString(),
        reactions: { "🔥": 0, "😱": 0, "💀": 0, "👀": 0, "🤫": 0 }
      };
      
      await addFyeoCommentFirestore(newComment);
      setFyeoComments(prev => [newComment, ...prev]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Error de red" };
    }
  };

  const handleReactFyeoPost = async (postId: string, emoji: EmojiReactionKey) => {
    try {
      // Optimistic update
      setFyeoPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                reactions: {
                  ...p.reactions,
                  [emoji]: (p.reactions?.[emoji] || 0) + 1,
                },
              }
            : p
        )
      );
      // Sync with API
      await reactToFyeoPostFirestore(postId, emoji);
    } catch (err) {}
  };

  const handleReactFyeoComment = async (commId: string, emoji: EmojiReactionKey) => {
    try {
      // Optimistic update
      setFyeoComments((prev) =>
        prev.map((c) =>
          c.id === commId
            ? {
                ...c,
                reactions: {
                  ...c.reactions,
                  [emoji]: (c.reactions?.[emoji] || 0) + 1,
                },
              }
            : c
        )
      );
      // Sync with API
      await reactToFyeoCommentFirestore(commId, emoji);
    } catch (err) {}
  };

  // Admin Actions with Cloud Firestore Persistence
  const handleUpdateConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      await updateConfigFirestore(newConfig);
      setConfig((prev) => ({ ...prev, ...newConfig }));
      fetch("/api/admin/config", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(newConfig),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateCharacter = async (char: Partial<Character>) => {
    try {
      const newChar: Character = {
        id: char.id || `char-${Date.now()}`,
        name: char.name || "Nuevo Personaje",
        alias: char.alias || "",
        age: char.age || 16,
        classCourse: char.classCourse || "1-A",
        quirk: char.quirk || "",
        avatarUrl: char.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        bio: char.bio || "",
        rankings: char.rankings || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveCharacterFirestore(newChar);
      setCharacters((prev) => [newChar, ...prev]);
      fetch("/api/admin/characters", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(newChar),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdateCharacter = async (id: string, char: Partial<Character>) => {
    try {
      const existing = characters.find((c) => c.id === id);
      if (!existing) return false;
      const updated: Character = {
        ...existing,
        ...char,
        updatedAt: new Date().toISOString(),
      };
      await saveCharacterFirestore(updated);
      setCharacters((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (selectedCharacter?.id === id) setSelectedCharacter(updated);
      fetch(`/api/admin/characters/${id}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(char),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleDuplicateCharacter = async (idOrChar: string | Character) => {
    try {
      const id = typeof idOrChar === "string" ? idOrChar : idOrChar?.id;
      const char = characters.find((c) => c.id === id);
      if (!char) {
        showToast("No se encontró el personaje para duplicar.", "error");
        return false;
      }
      const newId = `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const duplicated: Character = {
        ...char,
        id: newId,
        name: `${char.name} (Copia)`,
        alias: char.alias ? `${char.alias} (Copia)` : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. INMEDIATA actualización optimista de estado: el personaje aparece instantáneamente
      setCharacters((prev) => [duplicated, ...prev]);

      // 2. Notificación explícita al usuario
      showToast(`¡Copia creada! Se ha duplicado a "${duplicated.name}" con éxito.`, "success");

      // 3. Persistir en Firestore y Servidor en segundo plano
      saveCharacterFirestore(duplicated).catch((fbErr) => {
        console.warn("Firestore duplicate character warning:", fbErr);
      });
      fetch("/api/admin/characters", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(duplicated),
      }).catch(() => {});

      return true;
    } catch (err) {
      console.error("Error duplicating character:", err);
      showToast("Error inesperado al duplicar el personaje.", "error");
      return false;
    }
  };

  const requestDeleteCharacterGlobal = (char: Character) => {
    setDeleteConfirmDialog({
      open: true,
      title: "Eliminar Personaje",
      itemName: char.name,
      message: `¿Estás seguro de que deseas eliminar la ficha de ${char.name}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        await handleDeleteCharacter(char.id);
      },
    });
  };

  const handleDeleteCharacter = async (idOrChar: string | Character) => {
    try {
      const id = typeof idOrChar === "string" ? idOrChar : idOrChar?.id;
      if (!id) return false;
      const charToDelete = characters.find((c) => c.id === id);
      const charName = charToDelete?.name || "Personaje";

      // 1. INMEDIATA actualización optimista de estado: se retira instantáneamente
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      setComments((prev) => prev.filter((c) => c.characterId !== id));
      if (selectedCharacter?.id === id) setShowDetailDialog(false);

      // 2. Notificación explícita de confirmación de borrado
      showToast(`Personaje "${charName}" eliminado correctamente.`, "success");

      // 3. Persistir borrado en Firestore y Servidor
      deleteCharacterFirestore(id).catch((fbErr) => {
        console.warn("Firestore delete character warning:", fbErr);
      });
      fetch(`/api/admin/characters/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      }).catch(() => {});

      return true;
    } catch (err) {
      console.error("Error deleting character:", err);
      showToast("Error al eliminar el personaje.", "error");
      return false;
    }
  };

  const handleCreateAttribute = async (attr: Partial<RankingAttribute>) => {
    try {
      const newAttr: RankingAttribute = {
        id: attr.id || `attr-${Date.now()}`,
        name: attr.name || "Nuevo Atributo",
        iconName: attr.iconName || "Sparkles",
        description: attr.description || "",
        min: attr.min ?? 1,
        max: attr.max ?? 10,
        color: attr.color || "#e11d48",
      };
      try {
        await saveAttributeFirestore(newAttr);
      } catch (fbErr) {
        console.warn("Firestore create attribute warning:", fbErr);
      }
      setAttributes((prev) => [...prev, newAttr]);
      fetch("/api/admin/attributes", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(newAttr),
      }).catch(() => {});
      return true;
    } catch (err) {
      console.error("Error creating attribute:", err);
      return false;
    }
  };

  const handleUpdateAttribute = async (id: string, attr: Partial<RankingAttribute>) => {
    try {
      const existing = attributes.find((a) => a.id === id);
      if (!existing) return false;
      const updated: RankingAttribute = { ...existing, ...attr };
      try {
        await saveAttributeFirestore(updated);
      } catch (fbErr) {
        console.warn("Firestore update attribute warning:", fbErr);
      }
      setAttributes((prev) => prev.map((a) => (a.id === id ? updated : a)));
      fetch(`/api/admin/attributes/${id}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(attr),
      }).catch(() => {});
      return true;
    } catch (err) {
      console.error("Error updating attribute:", err);
      return false;
    }
  };

  const handleDuplicateAttribute = async (idOrAttr: string | RankingAttribute) => {
    try {
      const id = typeof idOrAttr === "string" ? idOrAttr : idOrAttr?.id;
      const attr = attributes.find((a) => a.id === id);
      if (!attr) {
        showToast("No se encontró el atributo para duplicar.", "error");
        return false;
      }
      const newId = `attr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const duplicated: RankingAttribute = {
        ...attr,
        id: newId,
        name: `${attr.name} (Copia)`,
      };

      // 1. INMEDIATA actualización optimista de estado
      setAttributes((prev) => [...prev, duplicated]);

      // 2. Notificación explícita al usuario
      showToast(`¡Copia creada! Se ha duplicado el atributo "${duplicated.name}" con éxito.`, "success");

      // 3. Persistir en Firestore y Servidor en segundo plano
      saveAttributeFirestore(duplicated).catch((fbErr) => {
        console.warn("Firestore duplicate attribute warning:", fbErr);
      });
      fetch("/api/admin/attributes", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(duplicated),
      }).catch(() => {});

      return true;
    } catch (err) {
      console.error("Error duplicating attribute:", err);
      showToast("Error inesperado al duplicar el atributo.", "error");
      return false;
    }
  };

  const handleDeleteAttribute = async (idOrAttr: string | RankingAttribute) => {
    try {
      const id = typeof idOrAttr === "string" ? idOrAttr : idOrAttr?.id;
      if (!id) return false;
      const attr = attributes.find((a) => a.id === id);
      const attrName = attr?.name || "Atributo";

      // 1. INMEDIATA actualización optimista de estado
      setAttributes((prev) => prev.filter((a) => a.id !== id));
      // Limpiar rankings en todos los personajes de la memoria local
      setCharacters((prev) =>
        prev.map((c) => {
          if (c.rankings && id in c.rankings) {
            const nextRankings = { ...c.rankings };
            delete nextRankings[id];
            return { ...c, rankings: nextRankings };
          }
          return c;
        })
      );

      // 2. Notificación explícita de confirmación de borrado
      showToast(`Atributo "${attrName}" eliminado de los rankings.`, "success");

      // 3. Persistir borrado en Firestore y Servidor
      deleteAttributeFirestore(id).catch((fbErr) => {
        console.warn("Firestore delete attribute warning:", fbErr);
      });
      fetch(`/api/admin/attributes/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      }).catch(() => {});

      return true;
    } catch (err) {
      console.error("Error deleting attribute:", err);
      showToast("Error al eliminar el atributo.", "error");
      return false;
    }
  };

  const handleCreateAdmin = async (admin: {
    email: string;
    username: string;
    password: string;
    role: string;
  }) => {
    try {
      const newAdmin: AdminUser & { password?: string } = {
        id: `admin-${Date.now()}`,
        email: admin.email,
        username: admin.username,
        role: admin.role as "superadmin" | "moderator",
        createdAt: new Date().toISOString(),
        password: admin.password,
      };
      await saveAdminFirestore(newAdmin);
      const { password: _, ...safeAdmin } = newAdmin;
      setAdminsList((prev) => [...prev, safeAdmin]);
      fetch("/api/admin/users", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(admin),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteAdminFirestore(id);
      setAdminsList((prev) => prev.filter((a) => a.id !== id));
      fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteRumor = async (id: string) => {
    try {
      await deleteRumorFirestore(id);
      setRumors((prev) => prev.filter((r) => r.id !== id));
      fetch(`/api/admin/rumors/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteCommentFirestore(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  // Open detail dialog
  const openCharacterDetail = (char: Character, tab: "profile" | "comments" | "rumors" = "profile") => {
    setSelectedCharacter(char);
    setDetailDialogInitialTab(tab);
    setShowDetailDialog(true);
    
    // URL friendlifier
    const safeClass = char.classCourse.toLowerCase().replace(/[^a-z0-9]/g, '') || 'na';
    const safeName = (char.alias || char.name).toLowerCase().replace(/[^a-z0-9]/g, '-');
    navigate(`/alumnos/${safeClass}/${safeName}`);
  };

  // URL listener for character profiles
  useEffect(() => {
    if (!loading && characters.length > 0) {
      const match = matchPath("/alumnos/:classId/:name", location.pathname);
      if (match) {
        const { classId, name } = match.params;
        const found = characters.find(c => {
          const cClass = c.classCourse.toLowerCase().replace(/[^a-z0-9]/g, '') || 'na';
          const cName = (c.alias || c.name).toLowerCase().replace(/[^a-z0-9]/g, '-');
          return cClass === classId && cName === name;
        });
        if (found && (!showDetailDialog || selectedCharacter?.id !== found.id)) {
          setSelectedCharacter(found);
          setShowDetailDialog(true);
        }
      } else if (location.pathname === "/alumnos") {
        setShowDetailDialog(false);
      }
    }
  }, [location.pathname, loading, characters]);

  // Open rumor creation for specific character
  const openCreateRumorForChar = (char: Character) => {
    setCreateRumorTargetChar(char);
    setCreateRumorOpen(true);
  };

  // Unique classes for filtering
  const availableClasses = Array.from(new Set(characters.map((c) => c.classCourse))).filter(Boolean);

  // Filtered characters
  const filteredCharacters = characters.filter((char) => {
    const matchesSearch =
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (char.quirk && char.quirk.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass =
      selectedClassFilter === "all" || char.classCourse === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  // If not unlocked, display the Gatekeeper screen
  if (!isUnlocked) {
    return (
      <>
        <Gatekeeper
          onUnlock={handleUnlock}
          passwordHint={config.passwordHint}
          onOpenAdminLogin={() => setShowAdminLogin(true)}
        />
        <AdminLoginDialog
          open={showAdminLogin}
          onOpenChange={setShowAdminLogin}
          onLogin={handleAdminLogin}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans selection:bg-amber-300 selection:text-black">
      {/* Top Navbar */}
      <TopNavbar
        adminUser={adminUser}
        onAdminLogout={handleAdminLogout}
        siteNotice={config.siteNotice}
        onLockSite={handleLockSite}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
            <p className="font-bold text-sm uppercase">Cargando base de datos de UA Underground...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: CHARACTERS DIRECTORY */}
            {activeTab === "characters" && (
              <div className="space-y-6">
                {/* Search & Action Bar */}
                <div className="bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre de alumno, apodo o don (quirk)..."
                      className="pl-9 text-sm font-semibold border-2 border-black"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                      <button
                        onClick={() => setSelectedClassFilter("all")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer ${
                          selectedClassFilter === "all"
                            ? "bg-amber-400 text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-black"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        Todas las Clases ({characters.length})
                      </button>
                      {availableClasses.map((cls) => (
                        <button
                          key={cls}
                          onClick={() => setSelectedClassFilter(cls)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer shrink-0 ${
                            selectedClassFilter === cls
                              ? "bg-amber-400 text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-black"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() => {
                        setCreateRumorTargetChar(null);
                        setCreateRumorOpen(true);
                      }}
                      className="font-black uppercase text-xs shrink-0"
                    >
                      <Flame className="w-3.5 h-3.5 mr-1 text-red-600" />
                      Soltar Chisme
                    </Button>
                    
                    {adminUser && (
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => {
                          setAdminEditingCharId(null);
                          setAdminInitialSubTab("characters");
                          navigate("/admin");
                        }}
                        className="font-black uppercase text-xs shrink-0 border-2 border-black"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Crear Alumno
                      </Button>
                    )}
                  </div>
                </div>

                {/* Character Cards Grid */}
                {filteredCharacters.length === 0 ? (
                  <div className="text-center py-16 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <Users className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
                    <h3 className="font-black text-lg text-black uppercase">
                      No se encontraron alumnos
                    </h3>
                    <p className="text-xs text-zinc-500 font-semibold mt-1 mb-4">
                      Intenta con otro término de búsqueda o cambia el filtro de clase.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedClassFilter("all");
                      }}
                      className="border-2 border-black font-bold text-xs"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredCharacters.map((char) => {
                      const charRumorsCount = rumors.filter((r) => r.characterId === char.id).length;
                      const charCommentsCount = comments.filter((c) => c.characterId === char.id).length;
                      return (
                        <CharacterCard
                          key={char.id}
                          character={char}
                          attributes={attributes}
                          onSelect={openCharacterDetail}
                          onDropRumor={openCreateRumorForChar}
                          adminUser={adminUser}
                          onEdit={(c) => handleOpenEditCharacterInAdmin(c)}
                          onDuplicate={handleDuplicateCharacter}
                          onDelete={requestDeleteCharacterGlobal}
                          commentCount={charCommentsCount}
                          rumorCount={charRumorsCount}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: RUMORS FEED */}
            {activeTab === "rumors" && (
              <RumorFeed
                rumors={rumors}
                characters={characters}
                onReactRumor={handleReactRumor}
                onOpenCreateRumor={() => {
                  setCreateRumorTargetChar(null);
                  setCreateRumorOpen(true);
                }}
                adminUser={adminUser}
                onDeleteRumor={handleDeleteRumor}
              />
            )}

            {/* VIEW 3: FYEO */}
            {activeTab === "fyeo" && (
              <FyeoFeed
                posts={fyeoPosts}
                comments={fyeoComments}
                isAdmin={!!adminUser}
                onReactPost={handleReactFyeoPost}
                onReactComment={handleReactFyeoComment}
                onPostComment={handlePostFyeoComment}
                onCreatePost={() => {
                  setAdminInitialFyeoAction({ action: "create" });
                  navigate("/admin");
                }}
                onEditPost={(postId) => {
                  setAdminInitialFyeoAction({ action: "edit", postId });
                  navigate("/admin");
                }}
                onDeletePost={async (postId) => {
                  if (adminUser) {
                    try {
                      await deleteFyeoPostFirestore(postId);
                      setFyeoPosts(prev => prev.filter(p => p.id !== postId));
                      showToast("Comunicado eliminado", "success");
                    } catch (err) {
                      showToast("Error al eliminar", "error");
                    }
                  }
                }}
              />
            )}

            {/* VIEW 4: LEADERBOARDS & RANKINGS */}
            {activeTab === "rankings" && (
              <LeaderboardView
                characters={characters}
                attributes={attributes}
                onSelectCharacter={openCharacterDetail}
              />
            )}

            {/* VIEW 5: ADMIN DASHBOARD */}
            {activeTab === "admin" && adminUser && (
              <AdminDashboard
                config={config}
                characters={characters}
                attributes={attributes}
                admins={adminsList}
                currentAdmin={adminUser}
                initialSubTab={adminInitialSubTab}
                initialEditingCharId={adminEditingCharId}
                onClearInitialEditingChar={() => setAdminEditingCharId(null)}
                initialFyeoAction={adminInitialFyeoAction}
                onClearInitialFyeoAction={() => setAdminInitialFyeoAction(null)}
                onUpdateConfig={handleUpdateConfig}
                onCreateCharacter={handleCreateCharacter}
                onUpdateCharacter={handleUpdateCharacter}
                onDuplicateCharacter={handleDuplicateCharacter}
                onDeleteCharacter={handleDeleteCharacter}
                onCreateAttribute={handleCreateAttribute}
                onUpdateAttribute={handleUpdateAttribute}
                onDuplicateAttribute={handleDuplicateAttribute}
                onDeleteAttribute={handleDeleteAttribute}
                onCreateAdmin={handleCreateAdmin}
                onDeleteAdmin={handleDeleteAdmin}
                rumors={rumors}
                comments={comments}
                fyeoPosts={fyeoPosts}
                fyeoComments={fyeoComments}
                onDeleteRumor={handleDeleteRumor}
                onDeleteComment={handleDeleteComment}
                onAddFyeoPost={(post) => setFyeoPosts(prev => [post, ...prev])}
                onUpdateFyeoPost={(updated) => setFyeoPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
                onDeleteFyeoPost={(id) => setFyeoPosts(prev => prev.filter(p => p.id !== id))}
                onDeleteFyeoComment={(id) => setFyeoComments(prev => prev.filter(c => c.id !== id))}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-black bg-white py-6 px-4 text-center select-none mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="bg-black text-amber-300 px-2 py-0.5 rounded font-black text-xs">
              UA UNDERGROUND
            </span>
            <span>Complemento para Foro de Rol de My Hero Academia</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (adminUser) navigate("/admin");
                else setShowAdminLogin(true);
              }}
              className="text-zinc-800 hover:text-black font-black underline cursor-pointer flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              {adminUser ? "Panel de Administrador" : "Acceso Moderadores"}
            </button>
            <span>•</span>
            <button
              onClick={handleLockSite}
              className="text-zinc-500 hover:text-red-600 cursor-pointer"
            >
              Cerrar Tablón
            </button>
          </div>
        </div>
      </footer>

      {/* DIALOGS */}
      {/* 1. Character Detail & Comments Dialog */}
      <CharacterDetailDialog
        character={selectedCharacter}
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open);
          if (!open) navigate("/alumnos");
        }}
        initialTab={detailDialogInitialTab}
        attributes={attributes}
        rumors={rumors}
        comments={comments}
        adminUser={adminUser}
        onPostComment={handlePostComment}
        onReactComment={handleReactComment}
        onReactRumor={handleReactRumor}
        onDeleteComment={handleDeleteComment}
        onOpenCreateRumor={openCreateRumorForChar}
        onEditCharacter={handleOpenEditCharacterInAdmin}
        prohibitedWords={config.prohibitedWords}
      />

      {/* 2. Create Rumor Dialog */}
      <CreateRumorDialog
        open={createRumorOpen}
        onOpenChange={setCreateRumorOpen}
        characters={characters}
        targetCharacter={createRumorTargetChar}
        onPostRumor={handlePostRumor}
        prohibitedWords={config.prohibitedWords}
      />

      {/* 3. Admin Login Dialog */}
      <AdminLoginDialog
        open={showAdminLogin}
        onOpenChange={setShowAdminLogin}
        onLogin={handleAdminLogin}
      />

      {/* CONFIRMATION DIALOG */}
      {deleteConfirmDialog.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-xl p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-black">{deleteConfirmDialog.title}</h2>
            </div>
            <p className="text-sm font-bold text-zinc-700 mb-6">
              {deleteConfirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isConfirmDeleting}
                onClick={() => setDeleteConfirmDialog({ ...deleteConfirmDialog, open: false })}
                className="px-4 py-2 border-2 border-black rounded-lg font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={isConfirmDeleting}
                onClick={executeAppDelete}
                className="px-4 py-2 border-2 border-black rounded-lg font-bold bg-red-500 hover:bg-red-400 text-white transition-colors cursor-pointer flex items-center justify-center min-w-[100px] disabled:opacity-60"
              >
                {isConfirmDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1000] max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-4 rounded-xl border-3 border-black font-black text-xs sm:text-sm flex items-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
              toastMessage.type === "success"
                ? "bg-amber-300 text-black"
                : toastMessage.type === "error"
                ? "bg-red-500 text-white"
                : "bg-sky-300 text-black"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-green-800" />
            ) : toastMessage.type === "error" ? (
              <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 shrink-0 text-black" />
            )}
            <span className="flex-1 leading-snug">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded hover:bg-black/10 transition-colors cursor-pointer shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
