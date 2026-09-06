import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Character } from "../types";
import { Flame, ShieldAlert, Lock, AlertCircle } from "lucide-react";

interface CreateRumorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: Character[];
  targetCharacter: Character | null;
  onPostRumor: (
    charId: string | null,
    authorName: string,
    authorEmail: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>;
  prohibitedWords: string[];
}

export const CreateRumorDialog: React.FC<CreateRumorDialogProps> = ({
  open,
  onOpenChange,
  characters,
  targetCharacter,
  onPostRumor,
  prohibitedWords,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(
    targetCharacter ? targetCharacter.id : "general"
  );
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (targetCharacter) {
      setSelectedCharId(targetCharacter.id);
    } else {
      setSelectedCharId("general");
    }
  }, [targetCharacter, open]);

  // Check prohibited words
  const detectProhibited = (text: string) => {
    const lower = text.toLowerCase();
    return prohibitedWords.find((w) => w && lower.includes(w.toLowerCase().trim()));
  };

  const currentViolation = detectProhibited(content);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authorEmail.trim() || !authorEmail.includes("@")) {
      setError("Debes ingresar tu correo electrónico (es obligatorio pero se mantendrá privado).");
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      setError("El rumor debe tener al menos 5 caracteres.");
      return;
    }

    if (currentViolation) {
      setError(`No puedes publicar el rumor porque contiene la palabra restringida: "${currentViolation}".`);
      return;
    }

    setSubmitting(true);
    try {
      const charId = selectedCharId === "general" ? null : selectedCharId;
      const res = await onPostRumor(
        charId,
        authorName.trim() || "Estudiante Misterioso",
        authorEmail.trim(),
        content.trim()
      );

      if (!res.success) {
        setError(res.error || "No se pudo publicar el rumor.");
      } else {
        setContent("");
        setAuthorName("");
        onOpenChange(false);
      }
    } catch {
      setError("Error de red al enviar el rumor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="bg-amber-400 -m-6 p-4 mb-2 rounded-t-lg border-b-2 border-black">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-black text-amber-300 flex items-center justify-center border border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <Flame className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-black text-lg font-black uppercase tracking-tight">
                Soltar un Rumor en el Tablón
              </DialogTitle>
              <DialogDescription className="text-zinc-900 font-semibold text-xs">
                Comparte un chisme para el foro de rol. ¡Recuerda mantener el juego divertido!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="bg-red-100 border-2 border-red-600 text-red-800 text-xs font-bold p-2.5 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs uppercase font-black text-zinc-700">
              ¿A quién va dirigido el chisme?
            </Label>
            <select
              value={selectedCharId}
              onChange={(e) => setSelectedCharId(e.target.value)}
              className="flex h-9 w-full rounded-md border-2 border-black bg-background px-3 py-1 text-sm font-semibold shadow-sm focus-visible:outline-none cursor-pointer"
            >
              <option value="general">🏛️ Toda la Academia U.A. (General / Campus)</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  👤 {char.name} ({char.classCourse})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs uppercase font-black text-zinc-700">
                Tu Apodo en el Rol
              </Label>
              <Input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ej: Chica de 1-B, Vigilante..."
                className="text-xs border-2 border-black font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase font-black text-zinc-700 flex items-center justify-between">
                <span>Tu Correo</span>
                <span className="text-[10px] text-zinc-500 font-normal flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Privado
                </span>
              </Label>
              <Input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="text-xs border-2 border-black font-semibold"
                required
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium leading-tight">
            🔒 Tu correo no será visible para nadie en la web. Es una medida del staff para evitar acoso y que todos disfruten del rol en paz.
          </p>

          <div className="space-y-1">
            <Label className="text-xs uppercase font-black text-zinc-700">
              El Chisme / Rumor
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué viste en los pasillos? ¿Quién estaba con quién a escondidas?"
              className="border-2 border-black text-sm min-h-[90px] font-medium"
              required
            />
            {currentViolation && (
              <div className="bg-red-50 border border-red-400 text-red-700 text-xs p-2 rounded font-bold flex items-center gap-1.5 mt-1">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Palabra restringida detectada: "{currentViolation}".</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-black font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={submitting || !!currentViolation}
              className="font-black uppercase"
            >
              {submitting ? "Publicando..." : "Lanzar Rumor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
