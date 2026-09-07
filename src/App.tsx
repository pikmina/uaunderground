import React, { useState, useEffect } from "react";
import {
  Character,
  RankingAttribute,
  Rumor,
  CharacterComment,
  AdminUser,
  SystemConfig,
  EmojiReactionKey,
} from "./types";
import {
  fetchFirestoreState,
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
} from "./firebase";
import { TopNavbar } from "./components/TopNavbar";
import { Gatekeeper } from "./components/Gatekeeper";
import { CharacterCard } from "./components/CharacterCard";
import { CharacterDetailDialog } from "./components/CharacterDetailDialog";
import { CreateRumorDialog } from "./components/CreateRumorDialog";
import { AdminLoginDialog } from "./components/AdminLoginDialog";
import { RumorFeed } from "./components/RumorFeed";
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
} from "lucide-react";

export default function App() {
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
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"characters" | "rumors" | "rankings" | "admin">("characters");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  // Dialogs
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [createRumorOpen, setCreateRumorOpen] = useState(false);
  const [createRumorTargetChar, setCreateRumorTargetChar] = useState<Character | null>(null);

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
    if (activeTab === "admin") setActiveTab("characters");
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

  const handleDuplicateCharacter = async (id: string) => {
    try {
      const char = characters.find((c) => c.id === id);
      if (!char) return false;
      const duplicated: Character = {
        ...char,
        id: `char-${Date.now()}`,
        name: `${char.name} (Copia)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveCharacterFirestore(duplicated);
      setCharacters((prev) => [duplicated, ...prev]);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    try {
      await deleteCharacterFirestore(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      setComments((prev) => prev.filter((c) => c.characterId !== id));
      if (selectedCharacter?.id === id) setShowDetailDialog(false);
      fetch(`/api/admin/characters/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      }).catch(() => {});
      return true;
    } catch {
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
      await saveAttributeFirestore(newAttr);
      setAttributes((prev) => [...prev, newAttr]);
      fetch("/api/admin/attributes", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(newAttr),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdateAttribute = async (id: string, attr: Partial<RankingAttribute>) => {
    try {
      const existing = attributes.find((a) => a.id === id);
      if (!existing) return false;
      const updated: RankingAttribute = { ...existing, ...attr };
      await saveAttributeFirestore(updated);
      setAttributes((prev) => prev.map((a) => (a.id === id ? updated : a)));
      fetch(`/api/admin/attributes/${id}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(attr),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  };

  const handleDuplicateAttribute = async (id: string) => {
    try {
      const attr = attributes.find((a) => a.id === id);
      if (!attr) return false;
      const duplicated: RankingAttribute = {
        ...attr,
        id: `attr-${Date.now()}`,
        name: `${attr.name} (Copia)`,
      };
      await saveAttributeFirestore(duplicated);
      setAttributes((prev) => [...prev, duplicated]);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    try {
      await deleteAttributeFirestore(id);
      setAttributes((prev) => prev.filter((a) => a.id !== id));
      fetch(`/api/admin/attributes/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      }).catch(() => {});
      return true;
    } catch {
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
  const openCharacterDetail = (char: Character) => {
    setSelectedCharacter(char);
    setShowDetailDialog(true);
  };

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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        adminUser={adminUser}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
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
                  </div>
                </div>

                {/* Character Cards Grid */}
                {filteredCharacters.length === 0 ? (
                  <div className="text-center py-16 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <Users className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
                    <h3 className="font-black text-lg text-black uppercase">
                      No se encontraron personajes
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          onEdit={(c) => {
                            setActiveTab("admin");
                          }}
                          onDuplicate={handleDuplicateCharacter}
                          onDelete={handleDeleteCharacter}
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

            {/* VIEW 3: LEADERBOARDS & RANKINGS */}
            {activeTab === "rankings" && (
              <LeaderboardView
                characters={characters}
                attributes={attributes}
                onSelectCharacter={openCharacterDetail}
              />
            )}

            {/* VIEW 4: ADMIN DASHBOARD */}
            {activeTab === "admin" && adminUser && (
              <AdminDashboard
                config={config}
                characters={characters}
                attributes={attributes}
                admins={adminsList}
                currentAdmin={adminUser}
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
                onDeleteRumor={handleDeleteRumor}
                onDeleteComment={handleDeleteComment}
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
                if (adminUser) setActiveTab("admin");
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
        onOpenChange={setShowDetailDialog}
        attributes={attributes}
        rumors={rumors}
        comments={comments}
        adminUser={adminUser}
        onPostComment={handlePostComment}
        onReactComment={handleReactComment}
        onReactRumor={handleReactRumor}
        onDeleteComment={handleDeleteComment}
        onOpenCreateRumor={openCreateRumorForChar}
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
    </div>
  );
}
