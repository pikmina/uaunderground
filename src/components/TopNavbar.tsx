import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Shield, Users, MessageSquare, Trophy, Lock, LogOut } from "lucide-react";
import { AdminUser } from "../types";
import { Link, useLocation } from "react-router-dom";

interface TopNavbarProps {
  adminUser: AdminUser | null;
  onAdminLogout: () => void;
  siteNotice: string;
  onLockSite: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  adminUser,
  onAdminLogout,
  siteNotice,
  onLockSite,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

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
            variant={currentPath.startsWith("/alumnos") || currentPath === "/" ? "hero" : "outline"}
            size="sm"
            asChild
            className="font-bold border-2 border-black"
          >
            <Link to="/alumnos">
              <Users className="w-4 h-4" />
              <span>Alumnos</span>
            </Link>
          </Button>

          <Button
            variant={currentPath.startsWith("/buzon") ? "hero" : "outline"}
            size="sm"
            asChild
            className="font-bold border-2 border-black"
          >
            <Link to="/buzon">
              <MessageSquare className="w-4 h-4" />
              <span>Buzón de Chismes</span>
            </Link>
          </Button>

          {adminUser && (
            <Button
              variant={currentPath.startsWith("/news") ? "heroDestructive" : "outline"}
              size="sm"
              asChild
              className={`font-bold border-2 border-black ${!currentPath.startsWith("/news") ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}`}
            >
              <Link to="/news">
                <Shield className="w-4 h-4" />
                <span>News</span>
              </Link>
            </Button>
          )}

          <Button
            variant={currentPath.startsWith("/rankings") ? "hero" : "outline"}
            size="sm"
            asChild
            className="font-bold border-2 border-black"
          >
            <Link to="/rankings">
              <Trophy className="w-4 h-4" />
              <span>Rankings</span>
            </Link>
          </Button>
        </nav>
      </div>

      {adminUser && (
        <div className="bg-red-600 text-white text-xs px-4 py-1.5 flex items-center justify-between font-bold border-t border-black">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wide">Modo Administrador Activo:</span>
            <Badge variant="outline" className="bg-white text-black border-black font-black text-[10px]">
              {adminUser.username}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] opacity-90 hidden md:inline">
              Puedes editar personajes, contraseñas y moderar contenido.
            </span>
            <Link to="/admin" className="text-white hover:text-amber-300 underline cursor-pointer font-bold">
              Panel
            </Link>
            <button
              onClick={onAdminLogout}
              className="flex items-center gap-1 text-white hover:text-amber-300 underline cursor-pointer ml-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
