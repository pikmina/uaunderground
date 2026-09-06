import React, { useState } from "react";
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
} from "lucide-react";
import { getAttributeIcon } from "./CharacterCard";

interface AdminDashboardProps {
  config: SystemConfig;
  characters: Character[];
  attributes: RankingAttribute[];
  admins: AdminUser[];
  currentAdmin: AdminUser;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  config,
  characters,
  attributes,
  admins,
  currentAdmin,
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
  const [activeTab, setActiveTab] = useState<"password" | "characters" | "attributes" | "admins" | "moderation">("password");

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

  // Load character into edit form
  const startEditingCharacter = (char: Character) => {
    setEditingCharId(char.id);
    setCharForm({
      name: char.name,
      alias: char.alias,
      age: Number(char.age) || 16,
      classCourse: char.classCourse,
      quirk: char.quirk || "",
      avatarUrl: char.avatarUrl,
      bio: char.bio || "",
      rankings: { ...(char.rankings || {}) },
    });
    // Scroll to form
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

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
      if (ok) notify(`¡Personaje "${charForm.name}" actualizado correctamente!`);
    } else {
      ok = await onCreateCharacter(charForm);
      if (ok) notify(`¡Nuevo personaje "${charForm.name}" creado con éxito!`);
    }
    setSavingChar(false);
    if (ok) resetCharForm();
    else notify("Error al guardar personaje.", "error");
  };

  // 3. Dynamic Attribute Form State
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [attrForm, setAttrForm] = useState({
    name: "",
    iconName: "Zap",
    description: "",
    color: "#fbbf24",
  });
  const [savingAttr, setSavingAttr] = useState(false);

  const startEditingAttr = (attr: RankingAttribute) => {
    setEditingAttrId(attr.id);
    setAttrForm({
      name: attr.name,
      iconName: attr.iconName,
      description: attr.description,
      color: attr.color,
    });
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
    } else {
      notify("Error al procesar el atributo.", "error");
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
            value="password"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1" />
            Contraseña
          </TabsTrigger>
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
            value="admins"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <Shield className="w-3.5 h-3.5 mr-1" />
            Admins ({admins.length})
          </TabsTrigger>
          <TabsTrigger
            value="moderation"
            className="text-xs font-black py-2 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white"
          >
            <AlertOctagon className="w-3.5 h-3.5 mr-1" />
            Moderación
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: PASSWORD & ACCESS ================= */}
        <TabsContent value="password">
          <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardHeader className="bg-amber-300 border-b-2 border-black">
              <CardTitle className="text-xl font-black uppercase text-black flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Contraseña de Acceso de la Comunidad
              </CardTitle>
              <CardDescription className="text-zinc-800 font-semibold text-xs">
                Esta es la contraseña que deben ingresar los miembros del Discord para entrar al sitio. Cámbiala cuando sea necesario.
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
                    className="font-black uppercase"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    {savingConfig ? "Guardando..." : "Guardar Nueva Contraseña y Avisos"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        {/* ================= TAB 2: CHARACTERS CRUD ================= */}
        <TabsContent value="characters" className="space-y-6">
          {/* Character Editor Form */}
          <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardHeader className="bg-amber-300 border-b-2 border-black flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase text-black">
                  {editingCharId ? "Editar Ficha de Personaje" : "Crear Nuevo Personaje de Rol"}
                </CardTitle>
                <CardDescription className="text-zinc-800 font-semibold text-xs">
                  {editingCharId
                    ? "Modifica los datos y rankings. Al guardar, se reflejará al instante en todas las vistas."
                    : "Agrega un nuevo estudiante o profesor a la lista y define sus puntuaciones iniciales."}
                </CardDescription>
              </div>

              {editingCharId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetCharForm}
                  className="border-2 border-black font-bold text-xs"
                >
                  Cancelar Edición
                </Button>
              )}
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

                {/* Avatar URL & Live Preview */}
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase text-zinc-700 flex items-center justify-between">
                    <span>URL de la Foto / Avatar *</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      (Pega enlace directo a imagen JPG/PNG/WebP)
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
                    <div className="w-12 h-12 rounded border-2 border-black bg-zinc-200 overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <img
                        src={charForm.avatarUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80";
                        }}
                      />
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
                    className="border-2 border-black text-xs font-semibold min-h-[60px]"
                  />
                </div>

                {/* Dynamic Attributes Sliders */}
                <div className="border-2 border-black rounded-lg p-3 bg-amber-50/70 space-y-3">
                  <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Puntuaciones de Ranking (Escala 1 al 10)
                  </h4>
                  <p className="text-[11px] text-zinc-600 font-semibold">
                    Ajusta los sliders de los atributos configurados actualmente:
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

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={savingChar}
                    className="font-black uppercase"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {savingChar
                      ? "Guardando..."
                      : editingCharId
                      ? "Guardar Cambios del Personaje"
                      : "Crear Personaje"}
                  </Button>

                  {editingCharId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetCharForm}
                      className="border-2 border-black font-bold"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Characters List Table with Actions */}
          <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase text-black mb-3 flex items-center justify-between">
              <span>Lista de Personajes Registrados ({characters.length})</span>
            </h3>

            <div className="divide-y-2 divide-zinc-200">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded border-2 border-black overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-zinc-200">
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base uppercase text-black">
                          {char.name}
                        </h4>
                        <Badge variant="classUa" className="text-[10px]">
                          {char.classCourse}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-600 font-semibold">
                        "{char.alias}" • {char.age} años
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditingCharacter(char)}
                      className="border-2 border-black font-bold text-xs h-8 hover:bg-amber-200"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicateCharacter(char.id)}
                      className="border-2 border-black font-bold text-xs h-8 hover:bg-sky-200"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Duplicar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`¿Eliminar a ${char.name}? Esta acción no se puede deshacer.`)) {
                          onDeleteCharacter(char.id);
                        }
                      }}
                      className="border-2 border-black font-bold text-xs h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ================= TAB 3: DYNAMIC ATTRIBUTES ================= */}
        <TabsContent value="attributes" className="space-y-6">
          {/* Create / Edit Attribute Form */}
          <Card className="border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardHeader className="bg-amber-300 border-b-2 border-black flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase text-black">
                  {editingAttrId ? "Editar Atributo de Ranking" : "Crear Nuevo Atributo de Ranking"}
                </CardTitle>
                <CardDescription className="text-zinc-800 font-semibold text-xs">
                  Puedes agregar, editar, duplicar o borrar atributos. Impactan automáticamente en las fichas y tablas.
                </CardDescription>
              </div>
              {editingAttrId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingAttrId(null);
                    setAttrForm({ name: "", iconName: "Zap", description: "", color: "#fbbf24" });
                  }}
                  className="border-2 border-black font-bold text-xs"
                >
                  Cancelar
                </Button>
              )}
            </CardHeader>

            <form onSubmit={handleSaveAttribute}>
              <CardContent className="p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-zinc-700">
                      Nombre del Atributo *
                    </Label>
                    <Input
                      type="text"
                      value={attrForm.name}
                      onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                      placeholder="Ej: Inteligencia, Fuerza, Estilo..."
                      className="border-2 border-black font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase text-zinc-700">
                      Icono
                    </Label>
                    <select
                      value={attrForm.iconName}
                      onChange={(e) => setAttrForm({ ...attrForm, iconName: e.target.value })}
                      className="flex h-9 w-full rounded-md border-2 border-black bg-background px-3 py-1 text-sm font-semibold shadow-sm focus-visible:outline-none cursor-pointer"
                    >
                      <option value="Users">👥 Users (Social / Amigos)</option>
                      <option value="Sparkles">✨ Sparkles (Atractivo / Belleza)</option>
                      <option value="Zap">⚡ Zap (Carisma / Poder)</option>
                      <option value="Flame">🔥 Flame (Caos / Peligro)</option>
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

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={savingAttr}
                    className="font-black uppercase"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {savingAttr
                      ? "Guardando..."
                      : editingAttrId
                      ? "Actualizar Atributo"
                      : "Guardar Nuevo Atributo"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Attributes List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className="bg-white border-3 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center border border-black text-black font-black"
                        style={{ backgroundColor: attr.color }}
                      >
                        {getAttributeIcon(attr.iconName)}
                      </div>
                      <h4 className="font-black text-base uppercase text-black">
                        {attr.name}
                      </h4>
                    </div>
                    <Badge variant="outline" className="border-black font-bold text-xs">
                      Escala {attr.min} - {attr.max}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-600 font-medium">
                    {attr.description || "Sin descripción"}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-zinc-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditingAttr(attr)}
                    className="border-2 border-black font-bold text-xs h-7 hover:bg-amber-200"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicateAttribute(attr.id)}
                    className="border-2 border-black font-bold text-xs h-7 hover:bg-sky-200"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Duplicar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`¿Eliminar el atributo ${attr.name}? Se borrará de todas las fichas.`)) {
                        onDeleteAttribute(attr.id);
                      }
                    }}
                    className="border-2 border-black font-bold text-xs h-7"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
                          if (confirm(`¿Eliminar al administrador ${adm.email}?`)) {
                            onDeleteAdmin(adm.id);
                          }
                        }}
                        className="border-2 border-black text-xs font-bold h-8"
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
                      if (confirm("¿Eliminar este rumor?")) onDeleteRumor(r.id);
                    }}
                    className="border-2 border-black text-xs font-black shrink-0 h-7"
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
    </div>
  );
};
