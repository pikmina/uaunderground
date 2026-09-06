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
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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

  // Fetch state from server
  const fetchState = async () => {
    try {
      setLoading(true);
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

  const fetchAdminData = async () => {
    try {
      const [usersRes, confRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/config-full"),
      ]);
      if (usersRes.ok) {
        const users = await usersRes.json();
        setAdminsList(users);
      }
      if (confRes.ok) {
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

  // Unlock site with community password
  const handleUnlock = async (pwd: string) => {
    try {
      const res = await fetch("/api/auth/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        sessionStorage.setItem("ua_unlocked", "true");
        return { success: true };
      }
      return { success: false, message: data.message || "Contraseña inválida" };
    } catch {
      return { success: false, message: "Error al verificar la contraseña." };
    }
  };

  // Admin login
  const handleAdminLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminUser(data.user);
        sessionStorage.setItem("ua_admin", JSON.stringify(data.user));
        // Auto-unlock site as well
        setIsUnlocked(true);
        sessionStorage.setItem("ua_unlocked", "true");
        fetchAdminData();
        return { success: true };
      }
      return { success: false, error: data.error || "Credenciales incorrectas" };
    } catch {
      return { success: false, error: "Error en el servidor de autenticación" };
    }
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    sessionStorage.removeItem("ua_admin");
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
      await fetch(`/api/rumors/${rumorId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
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
      await fetch(`/api/comments/${commId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
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
      const res = await fetch("/api/rumors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, authorName, authorEmail, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "No se pudo publicar." };
      }
      setRumors((prev) => [data, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: "Error de red al publicar rumor." };
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
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, authorName, authorEmail, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "No se pudo comentar." };
      }
      setComments((prev) => [data, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: "Error de red al comentar." };
    }
  };

  // Admin Actions
  const handleUpdateConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig((prev) => ({ ...prev, ...data.config }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleCreateCharacter = async (char: Partial<Character>) => {
    try {
      const res = await fetch("/api/admin/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(char),
      });
      if (res.ok) {
        const created = await res.json();
        setCharacters((prev) => [created, ...prev]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateCharacter = async (id: string, char: Partial<Character>) => {
    try {
      const res = await fetch(`/api/admin/characters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(char),
      });
      if (res.ok) {
        const updated = await res.json();
        setCharacters((prev) => prev.map((c) => (c.id === id ? updated : c)));
        if (selectedCharacter?.id === id) setSelectedCharacter(updated);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDuplicateCharacter = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/characters/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const duplicated = await res.json();
        setCharacters((prev) => [duplicated, ...prev]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/characters/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCharacters((prev) => prev.filter((c) => c.id !== id));
        setComments((prev) => prev.filter((c) => c.characterId !== id));
        if (selectedCharacter?.id === id) setShowDetailDialog(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleCreateAttribute = async (attr: Partial<RankingAttribute>) => {
    try {
      const res = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attr),
      });
      if (res.ok) {
        const created = await res.json();
        setAttributes((prev) => [...prev, created]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateAttribute = async (id: string, attr: Partial<RankingAttribute>) => {
    try {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attr),
      });
      if (res.ok) {
        const updated = await res.json();
        setAttributes((prev) => prev.map((a) => (a.id === id ? updated : a)));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDuplicateAttribute = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/attributes/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const duplicated = await res.json();
        setAttributes((prev) => [...prev, duplicated]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAttributes((prev) => prev.filter((a) => a.id !== id));
        return true;
      }
      return false;
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
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(admin),
      });
      if (res.ok) {
        const created = await res.json();
        setAdminsList((prev) => [...prev, created]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAdminsList((prev) => prev.filter((a) => a.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteRumor = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/rumors/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRumors((prev) => prev.filter((r) => r.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        return true;
      }
      return false;
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
