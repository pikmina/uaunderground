import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Shield, Users, MessageSquare, Trophy, Lock, LogOut } from "lucide-react";
import { AdminUser } from "../types";

interface TopNavbarProps {
  activeTab: "characters" | "rumors" | "rankings" | "admin";
  onTabChange: (tab: "characters" | "rumors" | "rankings" | "admin") => void;
  adminUser: AdminUser | null;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  siteNotice: string;
  onLockSite: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onTabChange,
  adminUser,
  onOpenAdminLogin,
  onAdminLogout,
  siteNotice,
  onLockSite,
}) => {
  return (
    <header className="border-b-4 border-black bg-amber-400 select-none">
      {/* Notice Banner */}
      {siteNotice && (
        <div className="bg-black text-amber-300 text-xs sm:text-sm font-bold px-4 py-1.5 flex items-center justify-between border-b-2 border-black overflow-hidden">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] uppercase font-black shrink-0 animate-pulse">
              TOP SECRET
            </span>
            <span className="truncate">{siteNotice}</span>
          </div>
          <button
            onClick={onLockSite}
            title="Bloquear acceso y volver a pedir contraseña"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white shrink-0 ml-3 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bloquear</span>
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-3 py-1.5 rounded font-black text-xl sm:text-2xl tracking-tighter uppercase transform -rotate-1 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] border-2 border-black">
            UA UNDERGROUND
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[11px] font-black uppercase text-black tracking-widest leading-none">
              HERO ACADEMY LEAKS & CHISMES
            </span>
            <span className="text-[10px] font-semibold text-zinc-800">
              Foro de Rol MHA • No Oficial
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button
            variant={activeTab === "characters" ? "hero" : "outline"}
            size="sm"
            onClick={() => onTabChange("characters")}
            className="font-bold border-2 border-black"
          >
            <Users className="w-4 h-4" />
            <span>Personajes</span>
          </Button>

          <Button
            variant={activeTab === "rumors" ? "hero" : "outline"}
            size="sm"
            onClick={() => onTabChange("rumors")}
            className="font-bold border-2 border-black"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Buzón de Chismes</span>
          </Button>

          <Button
            variant={activeTab === "rankings" ? "hero" : "outline"}
            size="sm"
            onClick={() => onTabChange("rankings")}
            className="font-bold border-2 border-black"
          >
            <Trophy className="w-4 h-4" />
            <span>Rankings</span>
          </Button>

          {/* Admin Tab or Admin Login */}
          {adminUser ? (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l-2 border-black">
              <Button
                variant={activeTab === "admin" ? "heroDestructive" : "default"}
                size="sm"
                onClick={() => onTabChange("admin")}
                className="font-black border-2 border-black"
              >
                <Shield className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Panel Admin</span>
                <span className="sm:hidden">Admin</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAdminLogout}
                title="Cerrar sesión de administrador"
                className="hover:bg-amber-500 text-black h-8 w-8"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAdminLogin}
              className="text-black hover:bg-amber-500 font-bold ml-1 border border-transparent hover:border-black text-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Staff Admin</span>
            </Button>
          )}
        </nav>
      </div>

      {adminUser && (
        <div className="bg-red-600 text-white text-xs px-4 py-1 flex items-center justify-between font-bold border-t border-black">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wide">Modo Administrador Activo:</span>
            <Badge variant="outline" className="bg-white text-black border-black font-black text-[10px]">
              {adminUser.username} ({adminUser.email})
            </Badge>
          </div>
          <span className="text-[11px] opacity-90 hidden sm:inline">
            Puedes editar personajes, cambiar la contraseña comunitaria y moderar contenido.
          </span>
        </div>
      )}
    </header>
  );
};
