import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Lock, KeyRound, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";

interface GatekeeperProps {
  onUnlock: (password: string) => Promise<{ success: boolean; message?: string }>;
  passwordHint?: string;
  onOpenAdminLogin: () => void;
}

export const Gatekeeper: React.FC<GatekeeperProps> = ({
  onUnlock,
  passwordHint,
  onOpenAdminLogin,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Por favor ingresa la contraseña compartida en Discord.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onUnlock(password.trim());
      if (!res.success) {
        setError(res.message || "Contraseña incorrecta.");
      }
    } catch {
      setError("Ocurrió un error al verificar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Comic Halftone Effect */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Hero Badge */}
      <div className="z-10 mb-6 text-center">
        <Badge
          variant="secret"
          className="text-xs px-4 py-1 mb-2 tracking-widest uppercase border-2 border-black inline-flex items-center gap-1.5"
        >
          <ShieldAlert className="w-4 h-4" />
          ACCESO RESTRINGIDO A ESTUDIANTES DE LA UA
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tighter uppercase drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] -rotate-1">
          UA UNDERGROUND
        </h1>
        <p className="text-zinc-400 text-sm mt-1 font-medium">
          El portal clandestino de chismes, perfiles y rankings de héroes
        </p>
      </div>

      {/* Main Lock Card */}
      <Card className="w-full max-w-md border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <CardHeader className="text-center pb-2 bg-amber-300 border-b-2 border-black rounded-t-lg">
          <div className="mx-auto w-12 h-12 bg-black text-amber-300 rounded-full flex items-center justify-center mb-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black uppercase text-black tracking-tight">
            Terminal del Campus
          </CardTitle>
          <CardDescription className="text-zinc-800 font-semibold text-xs">
            Ingresa la contraseña comunitaria compartida en el servidor de Discord o dentro del juego.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label
                htmlFor="community-password"
                className="text-xs font-black uppercase text-zinc-800 flex items-center justify-between"
              >
                <span>Contraseña de Acceso</span>
                <span className="text-[10px] text-zinc-500 font-normal">
                  (Compartida en la comunidad)
                </span>
              </label>
              <div className="relative">
                <Input
                  id="community-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Escribe la clave secreta..."
                  className="pl-10 text-base font-bold tracking-wide border-2 border-black"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-600 text-red-700 text-xs font-bold p-2.5 rounded flex items-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {passwordHint && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs font-bold text-zinc-600 hover:text-black flex items-center gap-1 cursor-pointer underline"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{showHint ? "Ocultar pista" : "¿No recuerdas la contraseña? Ver pista"}</span>
                </button>
                {showHint && (
                  <div className="mt-2 bg-amber-50 border-2 border-dashed border-amber-500 text-zinc-800 text-xs p-2.5 rounded font-semibold">
                    <span className="font-bold text-amber-700">Pista del servidor: </span>
                    {passwordHint}
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              variant="hero"
              disabled={loading}
              className="w-full text-base py-5 font-black uppercase"
            >
              {loading ? (
                "Verificando..."
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Entrar al Tablón
                </span>
              )}
            </Button>

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
              >
                ¿Eres moderador o administrador? Iniciar sesión aquí
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Comic Quote footer */}
      <div className="text-center mt-6 text-zinc-500 text-xs font-semibold max-w-sm">
        "¡Recuerda que este sitio es para complementar el rol y divertirnos entre héroes!"
      </div>
    </div>
  );
};
