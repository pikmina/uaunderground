import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Character,
  RankingAttribute,
  Rumor,
  CharacterComment,
  AdminUser,
  EmojiReactionKey,
} from "../types";
import { getAttributeIcon } from "./CharacterCard";
import {
  Sparkles,
  MessageCircle,
  Flame,
  User,
  Send,
  AlertTriangle,
  Trash2,
  Lock,
  Edit2,
} from "lucide-react";

interface CharacterDetailDialogProps {
  character: Character | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "profile" | "comments" | "rumors";
  attributes: RankingAttribute[];
  rumors: Rumor[];
  comments: CharacterComment[];
  adminUser: AdminUser | null;
  onPostComment: (
    charId: string,
    authorName: string,
    authorEmail: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>;
  onReactComment: (commId: string, emoji: EmojiReactionKey) => void;
  onReactRumor: (rumorId: string, emoji: EmojiReactionKey) => void;
  onDeleteComment?: (commId: string) => void;
  onOpenCreateRumor: (char: Character) => void;
  onEditCharacter?: (char: Character) => void;
  prohibitedWords: string[];
}

const EMOJIS: { key: EmojiReactionKey; label: string }[] = [
  { key: "🔥", label: "Picante" },
  { key: "😱", label: "Impacto" },
  { key: "💀", label: "Fatal" },
  { key: "👀", label: "Atento" },
  { key: "🤫", label: "Secreto" },
];

export const CharacterDetailDialog: React.FC<CharacterDetailDialogProps> = ({
  character,
  open,
  onOpenChange,
  initialTab = "profile",
  attributes,
  rumors,
  comments,
  adminUser,
  onPostComment,
  onReactComment,
  onReactRumor,
  onDeleteComment,
  onOpenCreateRumor,
  onEditCharacter,
  prohibitedWords,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "comments" | "rumors">(initialTab);

  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // Comment form state
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState(false);

  if (!character) return null;

  // Filtered lists for this character
  const charRumors = rumors.filter((r) => r.characterId === character.id);
  const charComments = comments.filter((c) => c.characterId === character.id);

  // Check prohibited words on the fly
  const detectProhibited = (text: string) => {
    const lower = text.toLowerCase();
    return prohibitedWords.find((w) => w && lower.includes(w.toLowerCase().trim()));
  };

  const currentViolation = detectProhibited(commentText);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);

    if (!commentEmail.trim() || !commentEmail.includes("@")) {
      setCommentError("Debes ingresar un correo válido (se mantiene confidencial).");
      return;
    }
    if (!commentText.trim() || commentText.trim().length < 3) {
      setCommentError("El comentario debe tener al menos 3 caracteres.");
      return;
    }

    if (currentViolation) {
      setCommentError(
        `Tu comentario contiene una palabra prohibida ("${currentViolation}"). Por favor edítalo.`
      );
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await onPostComment(
        character.id,
        commentName.trim() || "Estudiante Anónimo",
        commentEmail.trim(),
        commentText.trim()
      );
      if (!res.success) {
        setCommentError(res.error || "No se pudo publicar el comentario.");
      } else {
        setCommentText("");
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
      }
    } catch {
      setCommentError("Error de conexión al enviar comentario.");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white text-zinc-950">
        {/* Header Hero */}
        <div className="bg-amber-400 p-4 border-b-3 border-black relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-black overflow-hidden bg-black shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={character.avatarUrl}
                alt={character.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="classUa" className="text-xs">
                  {character.classCourse}
                </Badge>
                <Badge variant="manga" className="text-xs bg-white text-black">
                  {character.age} años
                </Badge>
                {character.quirk && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-black font-bold text-xs">
                    ⚡ {character.quirk}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-black uppercase text-black tracking-tight drop-shadow leading-none">
                {character.name}
              </DialogTitle>
              {character.alias && (
                <p className="text-zinc-800 font-black text-sm italic">
                  "{character.alias}"
                </p>
              )}
              {adminUser && onEditCharacter && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditCharacter(character)}
                    className="bg-white hover:bg-amber-100 text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 h-7 px-2.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar Ficha de Personaje
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="p-4 pt-3 bg-white">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="profile" className="text-xs sm:text-sm font-black">
                <User className="w-3.5 h-3.5 mr-1" />
                Ficha & Rankings
              </TabsTrigger>
              <TabsTrigger value="rumors" className="text-xs sm:text-sm font-black">
                <Flame className="w-3.5 h-3.5 mr-1" />
                Rumores ({charRumors.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs sm:text-sm font-black">
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                Comentarios ({charComments.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: PROFILE & RANKINGS */}
            <TabsContent value="profile" className="space-y-4">
              {character.bio && (
                <div className="bg-zinc-50 border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs font-black uppercase text-zinc-500 mb-1">
                    Descripción / Ficha Escolar
                  </h4>
                  <p className="text-sm font-semibold text-zinc-800 leading-relaxed">
                    {character.bio}
                  </p>
                </div>
              )}

              <div className="border-2 border-black rounded-lg p-3 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200">
                  <h4 className="text-sm font-black uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Puntuaciones del Campus (1 a 10)
                  </h4>
                  <span className="text-xs text-zinc-500 font-bold">
                    Votaciones de la comunidad
                  </span>
                </div>

                <div className="space-y-3">
                  {attributes.map((attr) => {
                    const score = character.rankings?.[attr.id] ?? 5;
                    const percent = (score / 10) * 100;
                    return (
                      <div key={attr.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-black uppercase">
                          <span className="flex items-center gap-1.5">
                            {getAttributeIcon(attr.iconName)}
                            <span>{attr.name}</span>
                          </span>
                          <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-black">
                            {score} / 10
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 h-3 rounded-full overflow-hidden border-2 border-black">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: attr.color || "#fbbf24",
                            }}
                          />
                        </div>
                        {attr.description && (
                          <p className="text-[10px] text-zinc-500 font-medium italic">
                            {attr.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="hero"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenCreateRumor(character);
                  }}
                  className="font-black"
                >
                  <Flame className="w-4 h-4 mr-1 text-red-600" />
                  Soltar un rumor sobre {character.name}
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: RUMORS */}
            <TabsContent value="rumors" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-zinc-700">
                  Chismes registrados sobre {character.name}
                </h4>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenCreateRumor(character);
                  }}
                  className="text-xs font-black"
                >
                  <Flame className="w-3.5 h-3.5 mr-1 text-red-600" />
                  Añadir Rumor
                </Button>
              </div>

              {charRumors.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-zinc-300 rounded-lg bg-zinc-50">
                  <Flame className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-zinc-600">
                    Aún no hay rumores registrados sobre este estudiante.
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    ¡Sé el primero en revelar algún chisme del campus!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {charRumors.map((rumor) => (
                    <div
                      key={rumor.id}
                      className="border-2 border-black rounded-lg p-3 bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex items-center justify-between text-xs text-zinc-500 font-bold mb-1.5 border-b border-amber-200 pb-1">
                        <span className="text-black font-black flex items-center gap-1">
                          👤 {rumor.authorName}
                        </span>
                        <span>{new Date(rumor.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 leading-snug">
                        "{rumor.content}"
                      </p>

                      {/* Emoji Reactions */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-amber-200 flex-wrap">
                        <span className="text-[11px] font-black uppercase text-zinc-500 mr-1">
                          Reacciones:
                        </span>
                        {EMOJIS.map(({ key, label }) => {
                          const count = rumor.reactions?.[key] || 0;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => onReactRumor(rumor.id, key)}
                              className="px-2 py-0.5 rounded-full border border-black bg-white hover:bg-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                              title={label}
                            >
                              <span>{key}</span>
                              <span className="text-[11px] font-black text-black">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: ANONYMOUS COMMENTS */}
            <TabsContent value="comments" className="space-y-4">
              {/* Comment Post Form */}
              <form
                onSubmit={handleCommentSubmit}
                className="bg-zinc-50 border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-black flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                    Deja un comentario anónimo
                  </h4>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    Correo confidencial para seguridad
                  </span>
                </div>

                {commentError && (
                  <div className="bg-red-100 border border-red-500 text-red-700 text-xs p-2 rounded font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{commentError}</span>
                  </div>
                )}
                {commentSuccess && (
                  <div className="bg-green-100 border border-green-500 text-green-800 text-xs p-2 rounded font-bold">
                    ¡Comentario publicado en el muro del personaje!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] font-bold text-zinc-700">
                      Tu Apodo en el Rol (Público)
                    </Label>
                    <Input
                      type="text"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Ej: Estudiante de 1-B, Chico del comedor"
                      className="text-xs border-2 border-black"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-zinc-700 flex items-center justify-between">
                      <span>Tu Correo (Obligatorio / Oculto)</span>
                    </Label>
                    <Input
                      type="email"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      placeholder="Para moderación interna..."
                      className="text-xs border-2 border-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-zinc-700">
                    Comentario
                  </Label>
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe tu mensaje... (Recuerda mantener el respeto dentro del juego)"
                    className="text-xs border-2 border-black min-h-[60px]"
                    required
                  />
                  {currentViolation && (
                    <p className="text-[11px] text-red-600 font-bold mt-1">
                      ⚠️ Contiene la palabra restringida: "{currentViolation}".
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="hero"
                    size="sm"
                    disabled={submittingComment || !!currentViolation}
                    className="font-black text-xs"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    {submittingComment ? "Publicando..." : "Publicar Comentario"}
                  </Button>
                </div>
              </form>

              {/* Comments Thread */}
              <div className="space-y-2.5">
                {charComments.length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 font-bold py-6">
                    No hay comentarios todavía en esta ficha. ¡Sé el primero en opinar!
                  </p>
                ) : (
                  charComments.map((comm) => (
                    <div
                      key={comm.id}
                      className="bg-white border-2 border-black rounded-lg p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-1">
                        <span className="font-black text-black">
                          💬 {comm.authorName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]">
                            {new Date(comm.timestamp).toLocaleDateString()}
                          </span>
                          {adminUser && onDeleteComment && (
                            <button
                              onClick={() => onDeleteComment(comm.id)}
                              title="Eliminar comentario (Modo Administrador)"
                              className="text-red-500 hover:text-red-700 cursor-pointer p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-zinc-800">
                        {comm.content}
                      </p>

                      {/* Comment Emoji Reactions */}
                      <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-zinc-100 flex-wrap">
                        {EMOJIS.map(({ key }) => {
                          const count = comm.reactions?.[key] || 0;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => onReactComment(comm.id, key)}
                              className="px-1.5 py-0.5 rounded border border-zinc-400 bg-zinc-50 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>{key}</span>
                              <span className="text-[10px] font-black">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
