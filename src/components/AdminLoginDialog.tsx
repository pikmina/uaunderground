import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Shield, Lock, Mail, AlertCircle } from "lucide-react";

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminLoginDialog: React.FC<AdminLoginDialogProps> = ({
  open,
  onOpenChange,
  onLogin,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onLogin(email.trim(), password);
      if (!res.success) {
        setError(res.error || "Credenciales incorrectas.");
      } else {
        onOpenChange(false);
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="bg-zinc-900 text-white -m-6 p-4 mb-2 rounded-t-lg border-b-2 border-black">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white border border-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-black tracking-tight">
                Acceso de Administrador
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                Exclusivo para el staff de rol y moderadores de UA Underground.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="bg-red-100 border-2 border-red-600 text-red-700 text-xs font-bold p-2.5 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="admin-email" className="text-xs uppercase font-black text-zinc-700">
              Usuario o Correo Electrónico
            </Label>
            <div className="relative">
              <Input
                id="admin-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com o usuario"
                className="pl-9 text-sm font-semibold border-2 border-black"
                required
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              Acceso restringido únicamente para personal autorizado del tablón.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="text-xs uppercase font-black text-zinc-700">
              Contraseña de Administrador
            </Label>
            <div className="relative">
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña personal..."
                className="pl-9 text-sm font-semibold border-2 border-black"
                required
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
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
              disabled={loading}
              className="font-black uppercase"
            >
              {loading ? "Entrando..." : "Acceder al Panel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
