import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { ExternalLink, Sparkles, Megaphone, ShieldAlert, CheckCircle2, Heart, Share2, Info } from "lucide-react";

export interface HeroicAd {
  id: string;
  brand: string;
  handle: string;
  verified: boolean;
  avatarEmoji: string;
  category: string;
  title: string;
  copy: string;
  imageBg: string;
  imageEmoji: string;
  badgeText: string;
  ctaText: string;
  likes: number;
  promoCode?: string;
}

export const HEROIC_ADS: HeroicAd[] = [
  {
    id: "ad-1",
    brand: "Detnerat Corp.",
    handle: "@detnerat_official",
    verified: true,
    avatarEmoji: "👔",
    category: "Equipamiento & Moda Heroica",
    title: "¡Ropa adaptable para Quirks de Gigantismo y Mutaciones!",
    copy: "No más trajes rotos tras la transformación. La nueva línea Detnerat Flex-Ester se expande hasta un 400% sin perder durabilidad. Aprobado por la Comisión de Seguridad Pública.",
    imageBg: "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-amber-300",
    imageEmoji: "🦸‍♂️⚡",
    badgeText: "PATROCINADO • DETNERAT GEAR",
    ctaText: "Ver Colección Especial ↗",
    likes: 14200,
    promoCode: "HEROSPHERE20",
  },
  {
    id: "ad-2",
    brand: "Póliza Endeavor & Asociados",
    handle: "@endeavor_insurance",
    verified: true,
    avatarEmoji: "🔥",
    category: "Seguros de Combate",
    title: "¿Daños colaterales por fuego o explosiones en tu edificio?",
    copy: "¿Tu negocio quedó calcinado durante un arresto de villanos? Cobertura Express en 24 horas. ¡Protegemos tu patrimonio contra llamas de alta intensidad y colapsos estructurales!",
    imageBg: "bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white",
    imageEmoji: "🚒💥",
    badgeText: "ANUNCIO PATROCINADO",
    ctaText: "Cotizar Póliza Gratis ↗",
    likes: 8930,
    promoCode: "FUEGOZERO",
  },
  {
    id: "ad-3",
    brand: "Plus Ultra Labs",
    handle: "@plusultra_supps",
    verified: true,
    avatarEmoji: "💪",
    category: "Suplementos Heroicos",
    title: "¡Proteína Smash Power • Sabor Banana Smash!",
    copy: "Supera tus límites en cada entrenamiento. Formulado con aminoácidos concentrados para Quirks de súper fuerza y regeneración muscular acelerada. ¡Sabor increíble sin azúcar añadida!",
    imageBg: "bg-gradient-to-r from-blue-600 via-indigo-700 to-amber-400 text-white",
    imageEmoji: "🏋️‍♂️🔥",
    badgeText: "PATROCINADO • PLUS ULTRA",
    ctaText: "Pedir Frasco de 2KG ↗",
    likes: 31500,
    promoCode: "PLUSULTRA15",
  },
  {
    id: "ad-4",
    brand: "Academia Shiketsu",
    handle: "@shiketsu_admissions",
    verified: true,
    avatarEmoji: "🎓",
    category: "Formación de Licencias",
    title: "Curso Intensivo de Recuperación de Licencia Provisional",
    copy: "¿No lograste pasar el examen de la Comisión? Inscripciones abiertas para el programa de formación táctica y manejo de multitudes en Shiketsu. ¡Aprende disciplina de elite!",
    imageBg: "bg-gradient-to-r from-zinc-900 via-blue-950 to-zinc-900 text-blue-200",
    imageEmoji: "🏛️🛡️",
    badgeText: "ANUNCIO EDUCATIVO",
    ctaText: "Más Información ↗",
    likes: 6720,
  },
  {
    id: "ad-5",
    brand: "Ryukyu VIP Dragon Transport",
    handle: "@ryukyu_air_vip",
    verified: true,
    avatarEmoji: "🐉",
    category: "Transporte Aéreo Urgente",
    title: "Traslado Táctico y Vuelo VIP para Agencias Pro",
    copy: "Llega a cualquier zona de desastre o alfombra roja en minutos. Cobertura nacional con escolta aérea. Servicio exclusivo para agencias registradas y celebridades.",
    imageBg: "bg-gradient-to-r from-emerald-800 via-teal-900 to-zinc-900 text-emerald-200",
    imageEmoji: "✈️🐲",
    badgeText: "PATROCINADO • DRAGON AIR",
    ctaText: "Reservar Vuelo Táctico ↗",
    likes: 12400,
  },
  {
    id: "ad-6",
    brand: "Support Gear Mei Labs",
    handle: "@support_babies_tech",
    verified: true,
    avatarEmoji: "⚙️",
    category: "Gadgets y Soporte Técnico",
    title: "¿Tu Quirk sobrecalienta tus extremidades? ¡Tengo un Bebé para eso!",
    copy: "Gadgets a medida, suelas de propulsión, visores térmicos y guantes de control de compresión. Diagnóstico inicial sin costo en nuestro taller de invenciones.",
    imageBg: "bg-gradient-to-r from-pink-600 via-purple-700 to-amber-500 text-white",
    imageEmoji: "🧪🔧",
    badgeText: "ANUNCIO • INNOVACIÓN",
    ctaText: "Diseñar mi Gadget ↗",
    likes: 22800,
    promoCode: "MYBABY10",
  },
  {
    id: "ad-7",
    brand: "Bravado Hero PR Consultants",
    handle: "@bravado_pr_agency",
    verified: true,
    avatarEmoji: "📢",
    category: "Relaciones Públicas & Crisis",
    title: "¿Un chisme en Herosphere afectó tu Rating de Carisma?",
    copy: "Especialistas en limpieza de imagen, conferencias de disculpa sincera y posicionamiento en el Hero Billboard Chart. No dejes que la prensa arruine tu carrera.",
    imageBg: "bg-gradient-to-r from-amber-500 via-yellow-600 to-zinc-900 text-black",
    imageEmoji: "🎤✨",
    badgeText: "PATROCINADO • PR HEROES",
    ctaText: "Agendar Asesoría Privada ↗",
    likes: 5410,
  },
];

interface HeroicAdCardProps {
  ad?: HeroicAd;
  adIndex?: number;
  compact?: boolean;
}

export const HeroicAdCard: React.FC<HeroicAdCardProps> = ({ ad, adIndex = 0, compact = false }) => {
  const safeIndex = Math.floor(Math.abs(adIndex || 0)) % HEROIC_ADS.length;
  const selectedAd = ad || HEROIC_ADS[safeIndex] || HEROIC_ADS[0];
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(selectedAd?.likes || 1000);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-3 border-black rounded-xl p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Top Ad Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded border border-black flex items-center gap-1">
            <Megaphone className="w-3 h-3 text-red-600" /> {selectedAd.badgeText}
          </span>
          <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-0.5">
            <Info className="w-3 h-3" /> Publicidad
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shrink-0 border border-black">
            {selectedAd.avatarEmoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-black truncate">{selectedAd.brand}</span>
              {selectedAd.verified && <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-500 shrink-0 text-white" />}
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold block truncate">{selectedAd.handle}</span>
          </div>
        </div>

        <p className="text-xs font-bold text-zinc-800 line-clamp-2 mb-2">
          {selectedAd.title}
        </p>

        {/* Clear CTA Tag (Not a fake interactive app button) */}
        <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-[10px] font-black">
          <span className="text-amber-900 bg-amber-200/80 px-2 py-1 rounded border border-amber-400 flex items-center gap-1">
            {selectedAd.ctaText}
          </span>
          {selectedAd.promoCode && (
            <span className="text-red-600 bg-white px-1.5 py-0.5 rounded border border-red-300 font-mono">
              CÓDIGO: {selectedAd.promoCode}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-3 border-black rounded-xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] relative transition-all hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] my-2">
      {/* Social Media Ad Top Banner */}
      <div className="bg-amber-300 text-black px-4 py-1.5 border-b-3 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-black text-amber-300 text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase flex items-center gap-1">
            <Megaphone className="w-3 h-3 text-amber-400" /> ANUNCIO PATROCINADO
          </span>
          <span className="text-xs font-black uppercase tracking-tight text-black hidden sm:inline">
            {selectedAd.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-black/80 bg-white/70 px-2 py-0.5 rounded border border-black/30">
          <Sparkles className="w-3 h-3 text-amber-600" /> Red Social Heroica
        </div>
      </div>

      {/* Brand Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-red-500 border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {selectedAd.avatarEmoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-sm text-black uppercase tracking-tight">{selectedAd.brand}</h4>
              {selectedAd.verified && (
                <span title="Cuenta Verificada de la Comisión Heroica">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-500 text-white" />
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-semibold">{selectedAd.handle} • Promocionado</p>
          </div>
        </div>

        <Badge variant="manga" className="bg-zinc-100 text-zinc-800 text-[10px] border-zinc-400">
          Anuncio Oficial
        </Badge>
      </div>

      {/* Ad Content */}
      <div className="px-4 py-2">
        <h3 className="font-black text-base text-zinc-900 mb-1 leading-snug">
          {selectedAd.title}
        </h3>
        <p className="text-xs font-semibold text-zinc-700 leading-relaxed">
          {selectedAd.copy}
        </p>
      </div>

      {/* Visual Ad Banner Area */}
      <div className={`mx-4 my-2 p-4 rounded-lg border-2 border-black ${selectedAd.imageBg} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30">
            {selectedAd.imageEmoji}
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded text-white inline-block mb-1">
              OFERTA EXCLUSIVA HEROSPHERE
            </span>
            <p className="font-black text-sm leading-tight uppercase">
              {selectedAd.title}
            </p>
          </div>
        </div>

        {selectedAd.promoCode && (
          <div className="bg-white text-black px-3 py-1.5 rounded-md border-2 border-black font-mono font-black text-xs text-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[9px] text-zinc-500 block font-sans uppercase font-bold">Usa el Código:</span>
            <span className="text-red-600 tracking-wider">{selectedAd.promoCode}</span>
          </div>
        )}
      </div>

      {/* Explicit Ad Action Bar - Clearly marked as sponsored call-to-action */}
      <div className="p-4 pt-2 bg-zinc-50 border-t-2 border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-black transition-all cursor-pointer ${
              liked ? "bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-white" : "text-red-500"}`} />
            <span>{likesCount.toLocaleString()}</span>
          </button>

          <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5" /> Compartido 1.2k veces
          </span>
        </div>

        {/* Clear Ad CTA Tag */}
        <a
          href="#ad-info"
          onClick={(e) => {
            e.preventDefault();
            alert(`[Patrocinado por ${selectedAd.brand}]: Gracias por interactuar con este anuncio oficial en Herosphere.`);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <span>{selectedAd.ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
