import React, { useState, useEffect } from "react";
import {
  AppStateData,
  Character,
  RankingAttribute,
  AdminUser,
  SystemConfig,
  Rumor,
  CharacterComment,
} from "../types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import {
  KeyRound,
  Users,
  Shield,
  Sliders,
  AlertOctagon,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  Save,
  Lock,
  Mail,
  UserPlus,
  Eye,
  Sparkles,
  ArrowLeft,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { getAttributeIcon, HEROIC_ICONS } from "../lib/heroIcons";

interface AdminDashboardProps {
  config: SystemConfig;
  characters: Character[];
  attributes: RankingAttribute[];
  admins: AdminUser[];
  currentAdmin: AdminUser;
  initialSubTab?: "password" | "characters" | "attributes" | "admins" | "moderation";
  initialEditingCharId?: string | null;
  onClearInitialEditingChar?: () => void;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => Promise<boolean>;
  onCreateCharacter: (char: Partial<Character>) => Promise<boolean>;
  onUpdateCharacter: (id: string, char: Partial<Character>) => Promise<boolean>;
  onDuplicateCharacter: (id: string) => Promise<boolean>;
  onDeleteCharacter: (id: string) => Promise<boolean>;
  onCreateAttribute: (attr: Partial<RankingAttribute>) => Promise<boolean>;
  onUpdateAttribute: (id: string, attr: Partial<RankingAttribute>) => Promise<boolean>;
  onDuplicateAttribute: (id: string) => Promise<boolean>;
  onDeleteAttribute: (id: string) => Promise<boolean>;
  onCreateAdmin: (admin: { email: string; username: string; password: string; role: string }) => Promise<boolean>;
  onDeleteAdmin: (id: string) => Promise<boolean>;
  rumors: Rumor[];
  comments: CharacterComment[];
  onDeleteRumor: (id: string) => Promise<boolean>;
  onDeleteComment: (id: string) => Promise<boolean>;
}

const PRESET_AVATARS = [
  { name: "Izuku Midoriya", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80" },
  { name: "Katsuki Bakugo", url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80" },
  { name: "Shoto Todoroki", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" },
  { name: "Ochaco Uraraka", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80" },
  { name: "Eijiro Kirishima", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80" },
  { name: "Momo Yaoyorozu", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80" },
  { name: "Fumikage Tokoyami", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" },
  { name: "Shota Aizawa", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80" },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  config,
  characters,
  attributes,
  admins,
  currentAdmin,
  initialSubTab,
  initialEditingCharId,
  onClearInitialEditingChar,
  onUpdateConfig,
  onCreateCharacter,
  onUpdateCharacter,
  onDuplicateCharacter,
  onDeleteCharacter,
  onCreateAttribute,
  onUpdateAttribute,
  onDuplicateAttribute,
  onDeleteAttribute,
  onCreateAdmin,
  onDeleteAdmin,
  rumors,
  comments,
  onDeleteRumor,
  onDeleteComment,
}) => {
  const [activeTab, setActiveTab] = useState<"password" | "characters" | "attributes" | "admins" | "moderation">(
    initialSubTab || "characters"
  );
  const [characterView, setCharacterView] = useState<"list" | "create" | "edit">("list");
  const [charSearchTerm, setCharSearchTerm] = useState("");

  // Notifications
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Password & Config State
  const [commPassword, setCommPassword] = useState("");
  const [passHint, setPassHint] = useState(config.passwordHint || "");
  const [siteNotice, setSiteNotice] = useState(config.siteNotice || "");
  const [savingConfig, setSavingConfig] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    const payload: Partial<SystemConfig> = {
      passwordHint: passHint.trim(),
      siteNotice: siteNotice.trim(),
    };
    if (commPassword.trim()) {
      payload.communityPassword = commPassword.trim();
    }
    const ok = await onUpdateConfig(payload);
    setSavingConfig(false);
    if (ok) {
      setCommPassword("");
      notify("¡Configuración guardada con éxito! La contraseña comunitaria está cifrada.");
    } else {
      notify("Error al guardar la configuración.", "error");
    }
  };

  // 2. Character Form State
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charForm, setCharForm] = useState({
    name: "",
    alias: "",
    age: 16,
    classCourse: "Clase 1-A (Heroísmo)",
    quirk: "",
    avatarUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
    bio: "",
    rankings: {} as Record<string, number>,
  });
  const [savingChar, setSavingChar] = useState(false);

  // Load character into edit form (Separate Edit Page)
  const startEditingCharacter = (char: Character) => {
    setEditingCharId(char.id);
    const initialRankings: Record<string, number> = {};
    attributes.forEach((attr) => {
      initialRankings[attr.id] = char.rankings?.[attr.id] ?? 5;
    });
    setCharForm({
      name: char.name,
      alias: char.alias || "",
      age: Number(char.age) || 16,
      classCourse: char.classCourse || "Clase 1-A (Heroísmo)",
      quirk: char.quirk || "",
      avatarUrl: char.avatarUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
      bio: char.bio || "",
      rankings: initialRankings,
    });
    setCharacterView("edit");
    setActiveTab("characters");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartCreate = () => {
    resetCharForm();
    setCharacterView("create");
    setActiveTab("characters");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    resetCharForm();
    setCharacterView("list");
    if (onClearInitialEditingChar) {
      onClearInitialEditingChar();
    }
  };

  // Synchronize when initial props change
  useEffect(() => {
    if (initialEditingCharId) {
      const found = characters.find((c) => c.id === initialEditingCharId);
      if (found) {
        startEditingCharacter(found);
      }
    } else if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialEditingCharId, initialSubTab, characters]);

  const resetCharForm = () => {
    setEditingCharId(null);
    const initialRankings: Record<string, number> = {};
    attributes.forEach((attr) => {
      initialRankings[attr.id] = 5;
    });
    setCharForm({
      name: "",
      alias: "",
      age: 16,
      classCourse: "Clase 1-A (Heroísmo)",
      quirk: "",
      avatarUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
      bio: "",
      rankings: initialRankings,
    });
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charForm.name.trim()) {
      notify("El nombre del personaje es obligatorio.", "error");
      return;
    }

    setSavingChar(true);
    let ok = false;
    if (editingCharId) {
      ok = await onUpdateCharacter(editingCharId, charForm);
      if (ok) {
        notify(`¡Personaje "${charForm.name}" actualizado correctamente!`);
        setCharacterView("list");
        if (onClearInitialEditingChar) {
          onClearInitialEditingChar();
        }
      }
    } else {
      ok = await onCreateCharacter(charForm);
      if (ok) {
        notify(`¡Nuevo personaje "${charForm.name}" creado con éxito!`);
        setCharacterView("list");
        resetCharForm();
      }
    }
    setSavingChar(false);
    if (!ok) notify("Error al guardar personaje.", "error");
  };

  // 3. Dynamic Attribute Form State
  const [attributeView, setAttributeView] = useState<"list" | "create" | "edit">("list");
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [attrForm, setAttrForm] = useState({
    name: "",
    iconName: "Zap",
    description: "",
    color: "#fbbf24",
  });
  const [iconCategoryFilter, setIconCategoryFilter] = useState<string>("all");
  const [savingAttr, setSavingAttr] = useState(false);

  const startCreatingAttr = () => {
    setEditingAttrId(null);
    setAttrForm({
      name: "",
      iconName: "Zap",
      description: "",
      color: "#fbbf24",
    });
    setAttributeView("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditingAttr = (attr: RankingAttribute) => {
    setEditingAttrId(attr.id);
    setAttrForm({
      name: attr.name,
      iconName: attr.iconName,
      description: attr.description,
      color: attr.color,
    });
    setAttributeView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelAttrForm = () => {
    setEditingAttrId(null);
    setAttrForm({ name: "", iconName: "Zap", description: "", color: "#fbbf24" });
    setAttributeView("list");
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.name.trim()) {
      notify("El nombre del atributo es obligatorio.", "error");
      return;
    }

    setSavingAttr(true);
    let ok = false;
    if (editingAttrId) {
      ok = await onUpdateAttribute(editingAttrId, attrForm);
      if (ok) notify(`Atributo "${attrForm.name}" actualizado.`);
    } else {
      ok = await onCreateAttribute(attrForm);
      if (ok) notify(`Nuevo atributo "${attrForm.name}" creado.`);
    }
    setSavingAttr(false);
    if (ok) {
      setEditingAttrId(null);
      setAttrForm({ name: "", iconName: "Zap", description: "", color: "#fbbf24" });
      setAttributeView("list");
    } else {
      notify("Error al procesar el atributo.", "error");
    }
  };

  // Custom in-app confirmation modal state (replaces native window.confirm which is blocked in iframes)
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    title: string;
    itemName: string;
    message: string;
    action: () => Promise<void> | void;
  }>({
    open: false,
    title: "",
    itemName: "",
    message: "",
    action: () => {},
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = (
    title: string,
    itemName: string,
    message: string,
    action: () => Promise<void> | void
  ) => {
    setDeleteModal({
      open: true,
      title,
      itemName,
      message,
      action,
    });
  };

  const executeDelete = async () => {
    if (!deleteModal.action) return;
    setIsDeleting(true);
    try {
      await deleteModal.action();
    } catch (err) {
      console.error("Error executing delete:", err);
    } finally {
      setIsDeleting(false);
      setDeleteModal((prev) => ({ ...prev, open: false }));
    }
  };

  const [duplicatingCharId, setDuplicatingCharId] = useState<string | null>(null);
  const [duplicatingAttrId, setDuplicatingAttrId] = useState<string | null>(null);

  const handleDuplicateCharAction = async (char: Character) => {
    setDuplicatingCharId(char.id);
    try {
      const ok = await onDuplicateCharacter(char.id);
      if (ok) {
        notify(`✅ ¡Personaje "${char.name}" duplicado con éxito! Se ha creado una copia en la lista.`);
      } else {
        notify("No se pudo duplicar el personaje.", "error");
      }
    } catch (err) {
      notify("Error inesperado al duplicar el personaje.", "error");
    } finally {
      setDuplicatingCharId(null);
    }
  };

  const handleDuplicateAttrAction = async (attr: RankingAttribute) => {
    setDuplicatingAttrId(attr.id);
    try {
      const ok = await onDuplicateAttribute(attr.id);
      if (ok) {
        notify(`✅ ¡Atributo "${attr.name}" duplicado con éxito! Se ha creado una copia en la lista.`);
      } else {
        notify("No se pudo duplicar el atributo.", "error");
      }
    } catch (err) {
      notify("Error inesperado al duplicar el atributo.", "error");
    } finally {
      setDuplicatingAttrId(null);
    }
  };

  // 4. Admin Users State
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("moderator");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      notify("Ingresa correo y contraseña para el nuevo administrador.", "error");
      return;
    }

    setCreatingAdmin(true);
    const ok = await onCreateAdmin({
      email: newAdminEmail.trim(),
      username: newAdminUser.trim() || newAdminEmail.split("@")[0],
      password: newAdminPassword.trim(),
      role: newAdminRole,
    });
    setCreatingAdmin(false);
    if (ok) {
      notify(`Administrador ${newAdminEmail} registrado correctamente.`);
      setNewAdminEmail("");
      setNewAdminUser("");
      setNewAdminPassword("");
    } else {
      notify("No se pudo crear el administrador (quizá el correo ya existe).", "error");
    }
  };

  // 5. Prohibited Words State
  const [newWord, setNewWord] = useState("");
  const [wordList, setWordList] = useState<string[]>(config.prohibitedWords || []);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newWord.trim().toLowerCase();
    if (!clean) return;
    if (wordList.includes(clean)) {
      notify("Esa palabra ya está en la lista de prohibidas.", "error");
      return;
    }

    const updated = [...wordList, clean];
    setWordList(updated);
    setNewWord("");
    const ok = await onUpdateConfig({ prohibitedWords: updated });
    if (ok) notify(`Palabra "${clean}" agregada a la moderación.`);
  };

  const handleRemoveWord = async (word: string) => {
    const updated = wordList.filter((w) => w !== word);
    setWordList(updated);
    const ok = await onUpdateConfig({ prohibitedWords: updated });
    if (ok) notify(`Palabra "${word}" retirada de la moderación.`);
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-black text-white p-5 rounded-xl border-3 border-black shadow-[5px_5px_0px_0px_rgba(251,191,36,1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Panel de Administración y Moderación
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Sesión iniciada como:{" "}
              <strong className="text-amber-400 font-black">{currentAdmin.email}</strong>{" "}
              ({currentAdmin.username} • Rol: {currentAdmin.role})
            </p>
          </div>

          <Badge variant="manga" className="text-xs">
            Staff UA Underground
          </Badge>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg border-2 border-black font-black text-xs flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
            statusMessage.type === "success"
              ? "bg-green-300 text-black"
              : "bg-red-400 text-white"
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1.5 gap-1 bg-zinc-900 border-3 border-black">
          <TabsTrigger
            value="characters"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            Personajes ({characters.length})
          </TabsTrigger>
          <TabsTrigger
            value="attributes"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <Sliders className="w-3.5 h-3.5 mr-1" />
            Atributos ({attributes.length})
          </TabsTrigger>
          <TabsTrigger
            value="moderation"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <AlertOctagon className="w-3.5 h-3.5 mr-1" />
            Moderación
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1" />
            Contraseña
          </TabsTrigger>
          <TabsTrigger
            value="admins"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <Shield className="w-3.5 h-3.5 mr-1" />
            Admins ({admins.length})
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: CHARACTERS CRUD & SEPARATED EDIT/CREATE ================= */}
        <TabsContent value="characters" className="space-y-6">
          {/* VIEW 1: SEPARATE EDIT PAGE */}
          {characterView === "edit" && (
            <div className="space-y-6">
              {/* Back navigation header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToList}
                    className="border-2 border-black font-black text-xs h-9 px-3 hover:bg-amber-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Volver a la lista de personajes
                  </Button>
                  <span className="text-zinc-300 font-bold hidden sm:inline">|</span>
                  <div className="text-xs font-bold text-zinc-600 hidden sm:block">
                    Editando ficha de <span className="font-black text-black uppercase">"{charForm.name || "Personaje"}"</span>
                  </div>
                </div>
                <Badge variant="outline" className="border-2 border-black bg-amber-300 text-black font-black text-xs px-3 py-1 self-start sm:self-auto">
                  Página de Edición Separada
                </Badge>
              </div>

              {/* Edit Hero Header */}
              <div className="bg-amber-300 border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-lg border-2 border-black bg-zinc-200 overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <img
                    src={charForm.avatarUrl}
                    alt={charForm.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black uppercase text-black tracking-tight leading-none">
                    Editar: {charForm.name || "Ficha de Personaje"}
                  </h2>
                  <p className="text-xs text-zinc-800 font-semibold mt-1">
                    {charForm.alias ? `"${charForm.alias}" • ` : ""}{charForm.classCourse} • {charForm.age} años
                  </p>
                  <p className="text-[11px] text-zinc-700 font-medium mt-0.5">
                    Modifica los datos del personaje a continuación. Al presionar "Guardar Cambios del Personaje", todos los datos se sincronizan al instante en el perfil, en los comentarios, en los rankings y en la base de datos Firestore.
                  </p>
                </div>
              </div>

              {/* Edit Form */}
              <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardHeader className="bg-zinc-100 border-b-2 border-black py-4">
                  <CardTitle className="text-lg font-black uppercase text-black">
                    Formulario de Edición de Ficha
                  </CardTitle>
                  <CardDescription className="text-zinc-700 font-semibold text-xs">
                    Completa o actualiza la información básica y atributos de ranking del personaje.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSaveCharacter}>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Nombre Completo *
                        </Label>
                        <Input
                          type="text"
                          value={charForm.name}
                          onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                          placeholder="Ej: Katsuki Bakugo"
                          className="border-2 border-black font-semibold text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Apodo Escolar / Héroe
                        </Label>
                        <Input
                          type="text"
                          value={charForm.alias}
                          onChange={(e) => setCharForm({ ...charForm, alias: e.target.value })}
                          placeholder="Ej: Lord Explosión / Chico Mitad"
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Edad
                        </Label>
                        <Input
                          type="number"
                          value={charForm.age}
                          onChange={(e) => setCharForm({ ...charForm, age: Number(e.target.value) })}
                          min={10}
                          max={99}
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Curso / Clase
                        </Label>
                        <Input
                          type="text"
                          value={charForm.classCourse}
                          onChange={(e) => setCharForm({ ...charForm, classCourse: e.target.value })}
                          placeholder="Ej: Clase 1-A (Heroísmo)"
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Don / Quirk (Opcional)
                        </Label>
                        <Input
                          type="text"
                          value={charForm.quirk}
                          onChange={(e) => setCharForm({ ...charForm, quirk: e.target.value })}
                          placeholder="Ej: Explosión, Mitad Frío Mitad Caliente..."
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>
                    </div>

                    {/* Avatar URL, Live Preview & Presets */}
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-zinc-700 flex items-center justify-between">
                        <span>URL de la Foto / Avatar *</span>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          (Pega un enlace directo o escoge un avatar preestablecido)
                        </span>
                      </Label>
                      <div className="flex gap-3 items-center">
                        <Input
                          type="url"
                          value={charForm.avatarUrl}
                          onChange={(e) => setCharForm({ ...charForm, avatarUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="border-2 border-black font-semibold text-xs flex-1"
                          required
                        />
                        <div className="w-14 h-14 rounded-lg border-2 border-black bg-zinc-200 overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <img
                            src={charForm.avatarUrl}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                      </div>

                      {/* Preset avatar quick picks */}
                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-zinc-600 mb-1.5">
                          Avatares sugeridos para pruebas rápidas:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_AVATARS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setCharForm({ ...charForm, avatarUrl: preset.url })}
                              className={`text-[10px] font-bold px-2 py-1 rounded border border-black transition-all cursor-pointer ${
                                charForm.avatarUrl === preset.url
                                  ? "bg-black text-white"
                                  : "bg-zinc-100 hover:bg-zinc-200 text-black"
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase text-zinc-700">
                        Descripción / Biografía para la Ficha
                      </Label>
                      <Textarea
                        value={charForm.bio}
                        onChange={(e) => setCharForm({ ...charForm, bio: e.target.value })}
                        placeholder="Escribe detalles del personaje, anécdotas o reputación en el campus..."
                        className="border-2 border-black text-xs font-semibold min-h-[70px]"
                      />
                    </div>

                    {/* Dynamic Attributes Sliders */}
                    <div className="border-2 border-black rounded-lg p-3 bg-amber-50/70 space-y-3">
                      <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Puntuaciones de Ranking (Escala 1 al 10)
                      </h4>
                      <p className="text-[11px] text-zinc-600 font-semibold">
                        Ajusta los sliders de cada atributo de ranking para este personaje:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {attributes.map((attr) => {
                          const currentVal = charForm.rankings[attr.id] ?? 5;
                          return (
                            <div
                              key={attr.id}
                              className="bg-white border-2 border-black rounded p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs font-black uppercase">
                                <span className="flex items-center gap-1.5">
                                  {getAttributeIcon(attr.iconName)}
                                  <span>{attr.name}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-black text-white text-xs font-black">
                                  {currentVal} / 10
                                </span>
                              </div>

                              <div className="px-1">
                                <Slider
                                  value={[currentVal]}
                                  min={1}
                                  max={10}
                                  step={1}
                                  onValueChange={([val]) => {
                                    setCharForm({
                                      ...charForm,
                                      rankings: {
                                        ...charForm.rankings,
                                        [attr.id]: val,
                                      },
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
                      <Button
                        type="submit"
                        variant="hero"
                        disabled={savingChar}
                        className="font-black uppercase text-sm px-6 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        <Save className="w-4 h-4 mr-1.5" />
                        {savingChar ? "Guardando cambios..." : "Guardar Cambios del Personaje"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToList}
                        className="border-2 border-black font-bold text-sm h-10 px-4 cursor-pointer"
                      >
                        Cancelar y Volver
                      </Button>

                      {editingCharId && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            const char = characters.find((c) => c.id === editingCharId);
                            const name = char?.name || charForm.name;
                            requestDelete(
                              "Eliminar Personaje",
                              name,
                              `¿Deseas eliminar permanentemente a ${name}? Todos sus rankings y comentarios serán eliminados.`,
                              async () => {
                                const ok = await onDeleteCharacter(editingCharId);
                                if (ok) {
                                  notify(`Personaje "${name}" eliminado correctamente.`);
                                  handleBackToList();
                                } else {
                                  notify("No se pudo eliminar el personaje.", "error");
                                }
                              }
                            );
                          }}
                          className="border-2 border-black font-black uppercase text-xs h-10 px-4 ml-auto hover:bg-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Eliminar Personaje
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </form>
              </Card>
            </div>
          )}

          {/* VIEW 2: SEPARATE CREATE PAGE */}
          {characterView === "create" && (
            <div className="space-y-6">
              {/* Back navigation header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToList}
                    className="border-2 border-black font-black text-xs h-9 px-3 hover:bg-amber-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Volver a la lista de personajes
                  </Button>
                  <span className="text-zinc-300 font-bold hidden sm:inline">|</span>
                  <div className="text-xs font-bold text-zinc-600 hidden sm:block">
                    Creación de nueva ficha de personaje
                  </div>
                </div>
                <Badge variant="outline" className="border-2 border-black bg-emerald-300 text-black font-black text-xs px-3 py-1 self-start sm:self-auto">
                  Nuevo Personaje
                </Badge>
              </div>

              {/* Create Hero Header */}
              <div className="bg-amber-300 border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-black uppercase text-black tracking-tight leading-none flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  Crear Nuevo Personaje de Rol
                </h2>
                <p className="text-xs text-zinc-800 font-semibold mt-1">
                  Ingresa los datos del nuevo estudiante o profesor de la UA y define las puntuaciones iniciales de cada ranking.
                </p>
              </div>

              {/* Create Form */}
              <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardHeader className="bg-zinc-100 border-b-2 border-black py-4">
                  <CardTitle className="text-lg font-black uppercase text-black">
                    Formulario de Registro de Personaje
                  </CardTitle>
                  <CardDescription className="text-zinc-700 font-semibold text-xs">
                    El personaje aparecerá inmediatamente en la galería pública y en las tablas de rankings.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSaveCharacter}>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Nombre Completo *
                        </Label>
                        <Input
                          type="text"
                          value={charForm.name}
                          onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                          placeholder="Ej: Eijiro Kirishima"
                          className="border-2 border-black font-semibold text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Apodo Escolar / Héroe
                        </Label>
                        <Input
                          type="text"
                          value={charForm.alias}
                          onChange={(e) => setCharForm({ ...charForm, alias: e.target.value })}
                          placeholder="Ej: Red Riot"
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Edad
                        </Label>
                        <Input
                          type="number"
                          value={charForm.age}
                          onChange={(e) => setCharForm({ ...charForm, age: Number(e.target.value) })}
                          min={10}
                          max={99}
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Curso / Clase
                        </Label>
                        <Input
                          type="text"
                          value={charForm.classCourse}
                          onChange={(e) => setCharForm({ ...charForm, classCourse: e.target.value })}
                          placeholder="Ej: Clase 1-A (Heroísmo)"
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Don / Quirk (Opcional)
                        </Label>
                        <Input
                          type="text"
                          value={charForm.quirk}
                          onChange={(e) => setCharForm({ ...charForm, quirk: e.target.value })}
                          placeholder="Ej: Endurecimiento..."
                          className="border-2 border-black font-semibold text-sm"
                        />
                      </div>
                    </div>

                    {/* Avatar URL, Live Preview & Presets */}
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-zinc-700 flex items-center justify-between">
                        <span>URL de la Foto / Avatar *</span>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          (Pega enlace directo o escoge un avatar de muestra)
                        </span>
                      </Label>
                      <div className="flex gap-3 items-center">
                        <Input
                          type="url"
                          value={charForm.avatarUrl}
                          onChange={(e) => setCharForm({ ...charForm, avatarUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="border-2 border-black font-semibold text-xs flex-1"
                          required
                        />
                        <div className="w-14 h-14 rounded-lg border-2 border-black bg-zinc-200 overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <img
                            src={charForm.avatarUrl}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                      </div>

                      {/* Preset avatar quick picks */}
                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-zinc-600 mb-1.5">
                          Avatares sugeridos para pruebas rápidas:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_AVATARS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setCharForm({ ...charForm, avatarUrl: preset.url })}
                              className={`text-[10px] font-bold px-2 py-1 rounded border border-black transition-all cursor-pointer ${
                                charForm.avatarUrl === preset.url
                                  ? "bg-black text-white"
                                  : "bg-zinc-100 hover:bg-zinc-200 text-black"
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase text-zinc-700">
                        Descripción / Biografía para la Ficha
                      </Label>
                      <Textarea
                        value={charForm.bio}
                        onChange={(e) => setCharForm({ ...charForm, bio: e.target.value })}
                        placeholder="Escribe detalles del personaje, anécdotas o reputación en el campus..."
                        className="border-2 border-black text-xs font-semibold min-h-[70px]"
                      />
                    </div>

                    {/* Dynamic Attributes Sliders */}
                    <div className="border-2 border-black rounded-lg p-3 bg-amber-50/70 space-y-3">
                      <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Puntuaciones de Ranking Iniciales (Escala 1 al 10)
                      </h4>
                      <p className="text-[11px] text-zinc-600 font-semibold">
                        Ajusta los sliders de los atributos para la ficha:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {attributes.map((attr) => {
                          const currentVal = charForm.rankings[attr.id] ?? 5;
                          return (
                            <div
                              key={attr.id}
                              className="bg-white border-2 border-black rounded p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs font-black uppercase">
                                <span className="flex items-center gap-1.5">
                                  {getAttributeIcon(attr.iconName)}
                                  <span>{attr.name}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-black text-white text-xs font-black">
                                  {currentVal} / 10
                                </span>
                              </div>

                              <div className="px-1">
                                <Slider
                                  value={[currentVal]}
                                  min={1}
                                  max={10}
                                  step={1}
                                  onValueChange={([val]) => {
                                    setCharForm({
                                      ...charForm,
                                      rankings: {
                                        ...charForm.rankings,
                                        [attr.id]: val,
                                      },
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
                      <Button
                        type="submit"
                        variant="hero"
                        disabled={savingChar}
                        className="font-black uppercase text-sm px-6 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        {savingChar ? "Creando..." : "Crear Personaje"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToList}
                        className="border-2 border-black font-bold text-sm h-10 px-4 cursor-pointer"
                      >
                        Cancelar y Volver
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>
            </div>
          )}

          {/* VIEW 3: MAIN CHARACTERS LIST VIEW */}
          {characterView === "list" && (
            <div className="space-y-4">
              {/* Header Box with user-requested "Crear nuevo personaje" button */}
              <div className="bg-white border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase text-black flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    Gestión de Personajes ({characters.length})
                  </h3>
                  <p className="text-xs text-zinc-600 font-semibold mt-1">
                    Supervisa las fichas de los personajes, edítalas en una página separada o añade nuevas fichas.
                  </p>
                </div>

                {/* The Button requested: "Crear nuevo personaje" */}
                <Button
                  type="button"
                  variant="hero"
                  onClick={handleStartCreate}
                  className="font-black uppercase text-xs sm:text-sm px-4 sm:px-6 py-2.5 flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer bg-amber-400 text-black shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  Crear nuevo personaje
                </Button>
              </div>

              {/* Search Bar */}
              <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
                <Input
                  type="text"
                  value={charSearchTerm}
                  onChange={(e) => setCharSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, apodo, don o clase..."
                  className="border-none shadow-none focus-visible:ring-0 text-xs sm:text-sm font-semibold h-8 p-0"
                />
                {charSearchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCharSearchTerm("")}
                    className="h-6 w-6 p-0 hover:bg-zinc-100 rounded-full"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-500" />
                  </Button>
                )}
              </div>

              {/* Characters List Table with Actions */}
              <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {characters.filter((c) => {
                  if (!charSearchTerm.trim()) return true;
                  const term = charSearchTerm.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(term) ||
                    (c.alias && c.alias.toLowerCase().includes(term)) ||
                    (c.quirk && c.quirk.toLowerCase().includes(term)) ||
                    (c.classCourse && c.classCourse.toLowerCase().includes(term))
                  );
                }).length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm font-black uppercase text-zinc-400">
                      No se encontraron personajes que coincidan con la búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-zinc-200">
                    {characters
                      .filter((c) => {
                        if (!charSearchTerm.trim()) return true;
                        const term = charSearchTerm.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(term) ||
                          (c.alias && c.alias.toLowerCase().includes(term)) ||
                          (c.quirk && c.quirk.toLowerCase().includes(term)) ||
                          (c.classCourse && c.classCourse.toLowerCase().includes(term))
                        );
                      })
                      .map((char) => (
                        <div
                          key={char.id}
                          className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-50/60 p-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg border-2 border-black overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-zinc-200">
                              <img
                                src={char.avatarUrl}
                                alt={char.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80";
                                }}
                              />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-black text-base uppercase text-black">
                                  {char.name}
                                </h4>
                                <Badge variant="classUa" className="text-[10px]">
                                  {char.classCourse}
                                </Badge>
                                {char.quirk && (
                                  <Badge variant="outline" className="border-zinc-400 text-zinc-700 text-[10px] bg-zinc-50">
                                    Don: {char.quirk}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-zinc-600 font-semibold mt-0.5">
                                {char.alias ? `"${char.alias}" • ` : ""}{char.age} años
                              </p>

                              {/* Mini ranking attribute badges */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {attributes.slice(0, 4).map((attr) => {
                                  const val = char.rankings?.[attr.id] ?? 5;
                                  return (
                                    <span
                                      key={attr.id}
                                      className="inline-flex items-center gap-1 text-[10px] font-black bg-zinc-100 border border-zinc-300 rounded px-1.5 py-0.5"
                                    >
                                      {getAttributeIcon(attr.iconName)}
                                      <span className="truncate max-w-[60px]">{attr.name}:</span>
                                      <span className="text-amber-700">{val}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Actions: Editar opens separate edit page */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => startEditingCharacter(char)}
                              className="border-2 border-black font-black text-xs h-8 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-300 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={duplicatingCharId === char.id}
                              onClick={() => handleDuplicateCharAction(char)}
                              className="border-2 border-black font-bold text-xs h-8 px-2.5 hover:bg-sky-200 cursor-pointer disabled:opacity-60"
                              title="Duplicar personaje"
                            >
                              {duplicatingCharId === char.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  Duplicando...
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 mr-1" />
                                  Duplicar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                requestDelete(
                                  "Eliminar Personaje",
                                  char.name,
                                  `¿Deseas eliminar a ${char.name} de la base de datos de la UA? Esta acción borrará sus calificaciones y comentarios asociados.`,
                                  async () => {
                                    const ok = await onDeleteCharacter(char.id);
                                    if (ok) {
                                      notify(`Personaje "${char.name}" eliminado correctamente.`);
                                    } else {
                                      notify("No se pudo eliminar el personaje.", "error");
                                    }
                                  }
                                );
                              }}
                              className="border-2 border-black font-bold text-xs h-8 px-2.5 cursor-pointer hover:bg-red-600"
                              title="Eliminar personaje"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ================= TAB 3: DYNAMIC ATTRIBUTES ================= */}
        <TabsContent value="attributes" className="space-y-6">
          {attributeView === "list" ? (
            /* VISTA DE LISTA */
            <div className="space-y-6">
              {/* Header con botón para Crear Nuevo Atributo */}
              <div className="bg-white border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-400 border-2 border-black">
                      <Sliders className="w-5 h-5 text-black" />
                    </span>
                    <h3 className="text-xl font-black uppercase text-black">
                      Atributos de Ranking ({attributes.length})
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-600 font-semibold max-w-2xl">
                    Métricas de evaluación del campus escolar (Fuerza, Carisma, Intelecto, Caos, etc.). Cada atributo se actualiza de inmediato en las fichas de estudiantes y en la tabla de clasificaciones.
                  </p>
                </div>
                <Button
                  onClick={startCreatingAttr}
                  variant="hero"
                  className="font-black uppercase shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm h-11 px-5"
                >
                  <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
                  Crear Nuevo Atributo
                </Button>
              </div>

              {/* Grid de Atributos */}
              {attributes.length === 0 ? (
                <div className="bg-white border-3 border-black rounded-xl p-10 text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-16 h-16 bg-amber-100 rounded-full border-2 border-black flex items-center justify-center mx-auto">
                    <Sliders className="w-8 h-8 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-lg uppercase text-black">No hay atributos registrados</h4>
                    <p className="text-xs text-zinc-600 font-semibold max-w-md mx-auto">
                      Crea tu primer atributo de ranking para calificar las habilidades y reputación de los personajes de la U.A.
                    </p>
                  </div>
                  <Button
                    onClick={startCreatingAttr}
                    variant="hero"
                    className="font-black uppercase"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crear Primer Atributo
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="bg-white border-3 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-black text-black font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              style={{ backgroundColor: attr.color }}
                            >
                              {getAttributeIcon(attr.iconName, "w-4 h-4")}
                            </div>
                            <div>
                              <h4 className="font-black text-base uppercase text-black leading-tight">
                                {attr.name}
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase">
                                Icono: {attr.iconName}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-black bg-zinc-100 font-black text-xs">
                            Escala {attr.min} - {attr.max}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-600 font-medium line-clamp-2 mt-1">
                          {attr.description || "Sin descripción asignada."}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-zinc-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingAttr(attr)}
                          className="border-2 border-black font-black text-xs h-8 hover:bg-amber-300"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={duplicatingAttrId === attr.id}
                          onClick={() => handleDuplicateAttrAction(attr)}
                          className="border-2 border-black font-black text-xs h-8 hover:bg-sky-200 cursor-pointer disabled:opacity-60"
                          title="Duplicar atributo"
                        >
                          {duplicatingAttrId === attr.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Duplicando...
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1" /> Duplicar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            requestDelete(
                              "Eliminar Atributo",
                              attr.name,
                              `¿Deseas eliminar el atributo "${attr.name}"? Se borrará de todas las fichas de estudiantes y de la tabla de posiciones.`,
                              async () => {
                                const ok = await onDeleteAttribute(attr.id);
                                if (ok) {
                                  notify(`Atributo "${attr.name}" eliminado correctamente.`);
                                } else {
                                  notify("No se pudo eliminar el atributo.", "error");
                                }
                              }
                            );
                          }}
                          className="border-2 border-black font-black text-xs h-8 cursor-pointer hover:bg-red-600"
                          title="Eliminar atributo"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* PÁGINA SEPARADA DE CREACIÓN / EDICIÓN */
            <div className="space-y-4">
              {/* Barra superior de navegación / Volver */}
              <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3">
                <Button
                  onClick={cancelAttrForm}
                  variant="outline"
                  className="border-2 border-black font-black uppercase text-xs h-9 hover:bg-zinc-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5 stroke-[3]" />
                  Volver a la Lista de Atributos
                </Button>
                <div className="flex items-center gap-2">
                  <Badge className="bg-black text-white font-black text-xs uppercase px-2.5 py-1">
                    {attributeView === "edit" ? "Modo Edición de Atributo" : "Modo Nuevo Atributo"}
                  </Badge>
                  {attributeView === "edit" && (
                    <span className="text-xs font-black text-zinc-600">
                      ID: {editingAttrId}
                    </span>
                  )}
                </div>
              </div>

              {/* Form Card dedicado */}
              <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardHeader className="bg-amber-300 border-b-2 border-black">
                  <CardTitle className="text-xl font-black uppercase text-black flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-black" />
                    {attributeView === "edit" ? `Editar Atributo: ${attrForm.name || "Sin nombre"}` : "Crear Nuevo Atributo de Ranking"}
                  </CardTitle>
                  <CardDescription className="text-zinc-800 font-semibold text-xs">
                    {attributeView === "edit"
                      ? "Modifica el nombre, icono representativo, color de barra o leyenda de este atributo."
                      : "Define una nueva métrica para evaluar a los personajes. Se agregará automáticamente a todas las fichas de alumnos y a la tabla de posiciones."}
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSaveAttribute}>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Nombre del Atributo *
                        </Label>
                        <Input
                          type="text"
                          value={attrForm.name}
                          onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                          placeholder="Ej: Fuerza Física, Intelecto, Caos..."
                          className="border-2 border-black font-semibold text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700 flex items-center justify-between">
                          <span>Icono Temático de Héroe</span>
                          <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
                            Vista previa:
                            <span
                              className="w-6 h-6 rounded-full inline-flex items-center justify-center border-2 border-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              style={{ backgroundColor: attrForm.color || "#fbbf24" }}
                            >
                              {getAttributeIcon(attrForm.iconName, "w-3.5 h-3.5")}
                            </span>
                          </span>
                        </Label>
                        <select
                          value={attrForm.iconName}
                          onChange={(e) => setAttrForm({ ...attrForm, iconName: e.target.value })}
                          className="flex h-9 w-full rounded-md border-2 border-black bg-white text-zinc-900 px-3 py-1 text-sm font-semibold shadow-sm focus-visible:outline-none cursor-pointer"
                        >
                          <optgroup label="🏆 Heroísmo, Honor y Liderazgo">
                            {HEROIC_ICONS.filter((i) => i.category === "heroism").map((icon) => (
                              <option key={icon.id} value={icon.id}>
                                {icon.emoji} {icon.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="⚔️ Combate y Dones (Quirks)">
                            {HEROIC_ICONS.filter((i) => i.category === "combat").map((icon) => (
                              <option key={icon.id} value={icon.id}>
                                {icon.emoji} {icon.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🏋️ Capacidad Física y Movilidad">
                            {HEROIC_ICONS.filter((i) => i.category === "physical").map((icon) => (
                              <option key={icon.id} value={icon.id}>
                                {icon.emoji} {icon.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🧠 Estrategia, Rescate y Apoyo">
                            {HEROIC_ICONS.filter((i) => i.category === "tactical").map((icon) => (
                              <option key={icon.id} value={icon.id}>
                                {icon.emoji} {icon.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="👥 Social y Carisma">
                            {HEROIC_ICONS.filter((i) => i.category === "social").map((icon) => (
                              <option key={icon.id} value={icon.id}>
                                {icon.emoji} {icon.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase text-zinc-700">
                          Color de la Barra
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={attrForm.color}
                            onChange={(e) => setAttrForm({ ...attrForm, color: e.target.value })}
                            className="h-9 w-12 rounded border-2 border-black cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={attrForm.color}
                            onChange={(e) => setAttrForm({ ...attrForm, color: e.target.value })}
                            className="border-2 border-black font-semibold text-xs flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase text-zinc-700">
                        Descripción / Leyenda
                      </Label>
                      <Input
                        type="text"
                        value={attrForm.description}
                        onChange={(e) => setAttrForm({ ...attrForm, description: e.target.value })}
                        placeholder="Breve explicación de lo que mide este ranking..."
                        className="border-2 border-black font-semibold text-xs"
                      />
                    </div>

                    {/* Heroic Icon Quick Grid Picker */}
                    <div className="border-2 border-black rounded-lg p-3 bg-zinc-50 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase text-zinc-800 flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-amber-500" />
                          Catálogo Visual de Iconos Heroicos ({HEROIC_ICONS.length} disponibles)
                        </span>
                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap items-center gap-1">
                          {[
                            { id: "all", label: "Todos" },
                            { id: "heroism", label: "🏆 Heroísmo" },
                            { id: "combat", label: "⚔️ Combate" },
                            { id: "physical", label: "🏋️ Físico" },
                            { id: "tactical", label: "🧠 Táctico" },
                            { id: "social", label: "👥 Social" },
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setIconCategoryFilter(cat.id)}
                              className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                iconCategoryFilter === cat.id
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-zinc-700 border-zinc-300 hover:border-black"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1.5 bg-white rounded-lg border-2 border-black">
                        {HEROIC_ICONS.filter(
                          (item) => iconCategoryFilter === "all" || item.category === iconCategoryFilter
                        ).map((item) => {
                          const isSelected = attrForm.iconName.toLowerCase() === item.id.toLowerCase();
                          const IconComp = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAttrForm({ ...attrForm, iconName: item.id })}
                              className={`flex items-center gap-2 p-1.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-black bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 font-black"
                                  : "border-zinc-200 hover:border-black bg-zinc-50/70 hover:bg-white text-zinc-700"
                              }`}
                              title={item.description}
                            >
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center border border-black shrink-0"
                                style={{
                                  backgroundColor: isSelected ? attrForm.color || "#fbbf24" : "#ffffff",
                                  color: "#000000",
                                }}
                              >
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black truncate leading-tight">
                                  {item.name.split(" (")[0]}
                                </p>
                                <p className="text-[9px] text-zinc-500 truncate font-semibold">
                                  {item.categoryLabel.split(" ")[0]}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Icon Description / Lore Card */}
                      {(() => {
                        const currentSelected = HEROIC_ICONS.find(
                          (i) => i.id.toLowerCase() === attrForm.iconName.toLowerCase()
                        );
                        if (!currentSelected) return null;
                        return (
                          <div className="flex items-center gap-2 text-xs text-zinc-700 font-semibold bg-amber-100/70 p-2 rounded-md border-2 border-amber-400">
                            <span className="text-base">{currentSelected.emoji}</span>
                            <span className="leading-snug">
                              <strong className="text-black">{currentSelected.name}:</strong> {currentSelected.description}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="pt-3 flex items-center gap-3">
                      <Button
                        type="submit"
                        variant="hero"
                        disabled={savingAttr}
                        className="font-black uppercase h-10 px-6 text-sm"
                      >
                        <Save className="w-4 h-4 mr-1.5" />
                        {savingAttr
                          ? "Guardando..."
                          : attributeView === "edit"
                          ? "Actualizar Atributo"
                          : "Guardar Nuevo Atributo"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelAttrForm}
                        className="border-2 border-black font-black uppercase text-xs h-10 px-4 hover:bg-zinc-100 cursor-pointer"
                      >
                        Cancelar
                      </Button>

                      {attributeView === "edit" && editingAttrId && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            const current = attributes.find((a) => a.id === editingAttrId);
                            const name = current?.name || attrForm.name;
                            requestDelete(
                              "Eliminar Atributo",
                              name,
                              `¿Deseas eliminar el atributo "${name}"? Se borrará de todas las fichas de estudiantes y de la tabla de posiciones.`,
                              async () => {
                                const ok = await onDeleteAttribute(editingAttrId);
                                if (ok) {
                                  notify(`Atributo "${name}" eliminado correctamente.`);
                                  cancelAttrForm();
                                } else {
                                  notify("No se pudo eliminar el atributo.", "error");
                                }
                              }
                            );
                          }}
                          className="border-2 border-black font-black uppercase text-xs h-10 px-4 ml-auto hover:bg-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Eliminar Atributo
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </form>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ================= TAB: PASSWORD & ACCESS ================= */}
        <TabsContent value="password">
          <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardHeader className="bg-amber-300 border-b-2 border-black">
              <CardTitle className="text-xl font-black uppercase text-black flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Contraseña de Acceso de la Comunidad
              </CardTitle>
              <CardDescription className="text-zinc-800 font-semibold text-xs">
                Esta es la contraseña que deben ingresar los miembros de la comunidad para entrar al sitio. Cámbiala cuando sea necesario.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveConfig}>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-zinc-700">
                    Nueva Contraseña Comunitaria
                  </Label>
                  <Input
                    type="text"
                    value={commPassword}
                    onChange={(e) => setCommPassword(e.target.value)}
                    placeholder="Escribe una nueva contraseña para actualizarla (o deja en blanco para mantener la actual)..."
                    className="font-bold border-2 border-black text-sm"
                  />
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Protegida con cifrado irreversible seguro (hash con salt).</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-semibold">
                    Última actualización: {new Date(config.lastPasswordChange).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-zinc-700">
                    Pista de la Contraseña (Visible en la pantalla de bloqueo)
                  </Label>
                  <Input
                    type="text"
                    value={passHint}
                    onChange={(e) => setPassHint(e.target.value)}
                    placeholder="Ej: Busca la palabra clave en el canal #anuncios-rol..."
                    className="border-2 border-black text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-zinc-700">
                    Aviso Superior del Tablón (Mensaje Clandestino)
                  </Label>
                  <Textarea
                    value={siteNotice}
                    onChange={(e) => setSiteNotice(e.target.value)}
                    placeholder="Aviso visible en la barra superior..."
                    className="border-2 border-black text-xs font-semibold min-h-[60px]"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={savingConfig}
                    className="font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    {savingConfig ? "Guardando..." : "Guardar Nueva Contraseña y Avisos"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        {/* ================= TAB 4: ADMIN USERS ================= */}
        <TabsContent value="admins" className="space-y-6">
          {/* Create Admin Form */}
          <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardHeader className="bg-amber-300 border-b-2 border-black">
              <CardTitle className="text-xl font-black uppercase text-black flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Registrar Nuevo Usuario Administrador
              </CardTitle>
              <CardDescription className="text-zinc-800 font-semibold text-xs">
                Crea cuentas adicionales para los moderadores o narradores del foro de rol de My Hero Academia.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleCreateAdmin}>
              <CardContent className="p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-zinc-700">
                      Correo Electrónico *
                    </Label>
                    <Input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="moderador@gmail.com"
                      className="border-2 border-black font-semibold text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-zinc-700">
                      Nombre / Nickname
                    </Label>
                    <Input
                      type="text"
                      value={newAdminUser}
                      onChange={(e) => setNewAdminUser(e.target.value)}
                      placeholder="Ej: Aizawa Sensei"
                      className="border-2 border-black font-semibold text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-zinc-700">
                      Contraseña *
                    </Label>
                    <Input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres..."
                      className="border-2 border-black font-semibold text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-zinc-700">
                      Rol
                    </Label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="flex h-9 w-full rounded-md border-2 border-black bg-background px-3 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none cursor-pointer"
                    >
                      <option value="moderator">Moderador (Editar y moderar)</option>
                      <option value="superadmin">SuperAdmin (Acceso total)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={creatingAdmin}
                    className="font-black uppercase"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {creatingAdmin ? "Creando..." : "Crear Cuenta de Administrador"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Admins List Table */}
          <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase text-black mb-3">
              Administradores Activos ({admins.length})
            </h3>

            <div className="divide-y-2 divide-zinc-200">
              {admins.map((adm) => {
                const isPrimary = adm.role === "superadmin";
                return (
                  <div
                    key={adm.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-black text-amber-400 flex items-center justify-center font-black text-sm border-2 border-black">
                        {adm.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-black">
                            {adm.username}
                          </span>
                          {isPrimary && (
                            <Badge variant="secret" className="text-[10px]">
                              SuperAdmin Principal
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-black font-bold text-[10px] uppercase">
                            {adm.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 font-semibold">{adm.email}</p>
                      </div>
                    </div>

                    {!isPrimary && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          requestDelete(
                            "Eliminar Administrador",
                            adm.email,
                            `¿Deseas revocar los privilegios y eliminar permanentemente al administrador "${adm.email}"?`,
                            async () => {
                              await onDeleteAdmin(adm.id);
                              notify(`Administrador "${adm.email}" eliminado.`);
                            }
                          );
                        }}
                        className="border-2 border-black text-xs font-bold h-8 cursor-pointer hover:bg-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ================= TAB 5: MODERATION & WORDS ================= */}
        <TabsContent value="moderation" className="space-y-6">
          {/* Prohibited Words Card */}
          <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardHeader className="bg-amber-300 border-b-2 border-black">
              <CardTitle className="text-xl font-black uppercase text-black flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                Moderación de Palabras Restringidas
              </CardTitle>
              <CardDescription className="text-zinc-800 font-semibold text-xs">
                Cualquier rumor o comentario que contenga estas palabras será bloqueado antes de publicarse para mantener un ambiente de rol seguro y divertido.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleAddWord} className="flex gap-2 max-w-md">
                <Input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Escribe una palabra a bloquear..."
                  className="border-2 border-black font-semibold text-xs"
                />
                <Button type="submit" variant="hero" className="font-black text-xs uppercase">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Bloquear
                </Button>
              </form>

              <div>
                <Label className="text-xs font-black uppercase text-zinc-700 mb-2 block">
                  Lista de Términos Bloqueados ({wordList.length})
                </Label>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-zinc-50 border-2 border-black rounded-lg">
                  {wordList.map((w) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 border border-red-400 text-red-900 font-bold text-xs shadow-xs"
                    >
                      <span>{w}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWord(w)}
                        title="Desbloquear palabra"
                        className="text-red-700 hover:text-black cursor-pointer font-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Moderation Table */}
          <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase text-black mb-2">
              Auditoría de Rumores y Comentarios
            </h3>
            <p className="text-xs text-zinc-600 font-semibold mb-4">
              Aquí puedes revisar los mensajes publicados y su correo de autor para intervenir si alguien vulnera las normas del rol.
            </p>

            <div className="space-y-3">
              {rumors.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="p-3 border-2 border-black rounded-lg bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secret" className="text-[10px]">
                        RUMOR
                      </Badge>
                      <span className="font-black text-black">{r.authorName}</span>
                      <span className="text-zinc-500 font-semibold">({r.authorEmail})</span>
                    </div>
                    <p className="font-semibold text-zinc-900">"{r.content}"</p>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      requestDelete(
                        "Eliminar Rumor",
                        `De: ${r.authorName}`,
                        `¿Deseas eliminar permanentemente este rumor: "${r.content}"?`,
                        async () => {
                          await onDeleteRumor(r.id);
                          notify("Rumor eliminado.");
                        }
                      );
                    }}
                    className="border-2 border-black text-xs font-black shrink-0 h-7 cursor-pointer hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL IN-APP DE CONFIRMACIÓN DE ELIMINACIÓN (REEMPLAZA WINDOW.CONFIRM) */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border-4 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-black flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase text-black leading-tight">
                    {deleteModal.title}
                  </h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase">
                    Confirmación requerida
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setDeleteModal((prev) => ({ ...prev, open: false }))}
                className="p-1 rounded border-2 border-black hover:bg-zinc-100 cursor-pointer"
                disabled={isDeleting}
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border-2 border-black rounded-lg space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded bg-black text-white text-xs font-black uppercase max-w-full truncate">
                {deleteModal.itemName}
              </span>
              <p className="text-xs text-zinc-800 font-semibold leading-relaxed">
                {deleteModal.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModal((prev) => ({ ...prev, open: false }))}
                disabled={isDeleting}
                className="border-2 border-black font-black uppercase text-xs h-10 px-4 hover:bg-zinc-100 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={executeDelete}
                disabled={isDeleting}
                className="border-2 border-black font-black uppercase text-xs h-10 px-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* FLOATING STATUS TOAST (VISIBLE IN ALL SCROLL POSITIONS) */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-4 rounded-xl border-3 border-black font-black text-xs sm:text-sm flex items-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
              statusMessage.type === "success"
                ? "bg-amber-300 text-black"
                : "bg-red-500 text-white"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-green-800" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
            )}
            <span className="flex-1 leading-snug">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
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
};
