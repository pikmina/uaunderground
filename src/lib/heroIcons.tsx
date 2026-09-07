import React from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Sword,
  Flame,
  Zap,
  Target,
  Crosshair,
  Dumbbell,
  Footprints,
  Wind,
  Activity,
  Heart,
  Trophy,
  Medal,
  Award,
  Crown,
  Compass,
  Brain,
  Eye,
  Radio,
  Siren,
  Hand,
  Users,
  Sparkles,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export interface HeroIconItem {
  id: string;
  name: string;
  category: "heroism" | "combat" | "physical" | "tactical" | "social";
  categoryLabel: string;
  emoji: string;
  icon: LucideIcon;
  description: string;
}

export const HEROIC_ICONS: HeroIconItem[] = [
  // 1. Heroísmo, Honor y Liderazgo
  {
    id: "Trophy",
    name: "Trofeo (Plus Ultra / N° 1)",
    category: "heroism",
    categoryLabel: "Heroísmo y Liderazgo",
    emoji: "🏆",
    icon: Trophy,
    description: "Símbolo de la paz, victoria absoluta y estatus número uno.",
  },
  {
    id: "Medal",
    name: "Medalla de Honor",
    category: "heroism",
    categoryLabel: "Heroísmo y Liderazgo",
    emoji: "🎖️",
    icon: Medal,
    description: "Condecoración por actos heroicos y mérito en batalla.",
  },
  {
    id: "Award",
    name: "Licencia de Héroe Pro",
    category: "heroism",
    categoryLabel: "Heroísmo y Liderazgo",
    emoji: "🏅",
    icon: Award,
    description: "Licencia oficial expedida por la Comisión de Seguridad Pública.",
  },
  {
    id: "Crown",
    name: "Corona (Símbolo de la Paz)",
    category: "heroism",
    categoryLabel: "Heroísmo y Liderazgo",
    emoji: "👑",
    icon: Crown,
    description: "Autoridad moral, grandeza heroica y pilar de la sociedad.",
  },
  {
    id: "Heart",
    name: "Corazón de Héroe (Valentía)",
    category: "heroism",
    categoryLabel: "Heroísmo y Liderazgo",
    emoji: "❤️",
    icon: Heart,
    description: "Determinación indomable, compasión y sacrificio desinteresado.",
  },
  {
    id: "Compass",
    name: "Brújula Moral (Justicia)",
    category: "heroism",
    categoryLabel: "Heroísmo y Liderazgo",
    emoji: "🧭",
    icon: Compass,
    description: "Liderazgo ético, rectitud y serenidad ante la adversidad.",
  },
  {
    id: "GraduationCap",
    name: "Academia U.A. (Formación)",
    category: "heroism",
    categoryLabel: "Heroísmo y Liderazgo",
    emoji: "🎓",
    icon: GraduationCap,
    description: "Excelencia académica y entrenamiento heroico en U.A. High.",
  },

  // 2. Combate y Dones (Quirks)
  {
    id: "Shield",
    name: "Escudo (Defensa Heroica)",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "🛡️",
    icon: Shield,
    description: "Capacidad de resistir ataques y proteger a los aliados.",
  },
  {
    id: "ShieldCheck",
    name: "Guardia Imparable",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "🔰",
    icon: ShieldCheck,
    description: "Blindaje seguro y defensa impenetrable.",
  },
  {
    id: "ShieldAlert",
    name: "Alerta de Rescate",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "🚨",
    icon: ShieldAlert,
    description: "Intervención urgente en situaciones de catástrofe.",
  },
  {
    id: "Swords",
    name: "Espadas Cruzadas (Duelo)",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "⚔️",
    icon: Swords,
    description: "Habilidad en combate cuerpo a cuerpo y técnicas marciales.",
  },
  {
    id: "Sword",
    name: "Espada (Ataque Ofensivo)",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "🗡️",
    icon: Sword,
    description: "Poder de penetración e impacto ofensivo letal.",
  },
  {
    id: "Flame",
    name: "Fuego (Poder Explosivo)",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "🔥",
    icon: Flame,
    description: "Dones ígneos, explosiones devastadoras o furia combativa.",
  },
  {
    id: "Zap",
    name: "Rayo (Poder Eléctrico / Velocidad)",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "⚡",
    icon: Zap,
    description: "Dones eléctricos, descargas y aceleración cinética extrema.",
  },
  {
    id: "Target",
    name: "Diana (Precisión Táctica)",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "🎯",
    icon: Target,
    description: "Ataques certeros a larga distancia sin daño colateral.",
  },
  {
    id: "Crosshair",
    name: "Enfoque / Francotirador",
    category: "combat",
    categoryLabel: "Combate y Dones",
    emoji: "🎯",
    icon: Crosshair,
    description: "Concentración milimétrica para neutralizar villanos en movimiento.",
  },

  // 3. Capacidad Física y Movilidad
  {
    id: "Dumbbell",
    name: "Fuerza Física (One For All)",
    category: "physical",
    categoryLabel: "Capacidad Física y Movilidad",
    emoji: "🏋️",
    icon: Dumbbell,
    description: "Potencia muscular masiva, levantamiento y choque contundente.",
  },
  {
    id: "Footprints",
    name: "Agilidad y Parkour",
    category: "physical",
    categoryLabel: "Capacidad Física y Movilidad",
    emoji: "👣",
    icon: Footprints,
    description: "Destreza acrobática y desplazamiento veloz en rascacielos.",
  },
  {
    id: "Wind",
    name: "Viento (Velocidad Sónica)",
    category: "physical",
    categoryLabel: "Capacidad Física y Movilidad",
    emoji: "💨",
    icon: Wind,
    description: "Ráfagas atmosféricas y aceleración sónica en persecución.",
  },
  {
    id: "Activity",
    name: "Reflejos e Instinto",
    category: "physical",
    categoryLabel: "Capacidad Física y Movilidad",
    emoji: "📈",
    icon: Activity,
    description: "Tiempo de reacción instantáneo y sexto sentido en batalla.",
  },

  // 4. Estrategia, Rescate y Apoyo (Support)
  {
    id: "Brain",
    name: "Intelecto Táctico (Análisis Deku)",
    category: "tactical",
    categoryLabel: "Estrategia y Apoyo",
    emoji: "🧠",
    icon: Brain,
    description: "Estrategia analítica, deducción y predicción de dones rivales.",
  },
  {
    id: "Eye",
    name: "Visión / Vigilancia (Eraser Head)",
    category: "tactical",
    categoryLabel: "Estrategia y Apoyo",
    emoji: "👁️",
    icon: Eye,
    description: "Detección de amenazas ocultas y observación de debilidades.",
  },
  {
    id: "Siren",
    name: "Sirena (Héroe de Rescate)",
    category: "tactical",
    categoryLabel: "Estrategia y Apoyo",
    emoji: "🚨",
    icon: Siren,
    description: "Especialista en desastres naturales, búsqueda y evacuación.",
  },
  {
    id: "Hand",
    name: "Mano Amiga (Salvar Vidas)",
    category: "tactical",
    categoryLabel: "Estrategia y Apoyo",
    emoji: "🤝",
    icon: Hand,
    description: "Extender la mano para salvar vidas con una sonrisa tranquilizadora.",
  },
  {
    id: "Radio",
    name: "Radio (Comunicaciones)",
    category: "tactical",
    categoryLabel: "Estrategia y Apoyo",
    emoji: "📻",
    icon: Radio,
    description: "Coordinación en red con patrullas de héroes y la policía.",
  },

  // 5. Social y Carisma
  {
    id: "Users",
    name: "Trabajo en Equipo / Social",
    category: "social",
    categoryLabel: "Social y Carisma",
    emoji: "👥",
    icon: Users,
    description: "Sinergia en escuadrón y compañerismo en la clase.",
  },
  {
    id: "Sparkles",
    name: "Carisma y Presencia Heroica",
    category: "social",
    categoryLabel: "Social y Carisma",
    emoji: "✨",
    icon: Sparkles,
    description: "Estilo deslumbrante, aura inspiradora y popularidad en los medios.",
  },
];

export function getAttributeIcon(iconName: string, className = "w-3.5 h-3.5") {
  const normalized = (iconName || "").toLowerCase().trim();
  const matched = HEROIC_ICONS.find(
    (item) => item.id.toLowerCase() === normalized
  );

  if (matched) {
    const IconComp = matched.icon;
    return <IconComp className={className} />;
  }

  // Fallback synonyms
  switch (normalized) {
    case "users":
    case "social":
    case "amigos":
      return <Users className={className} />;
    case "sparkles":
    case "atractivo":
    case "belleza":
      return <Sparkles className={className} />;
    case "flame":
    case "caos":
    case "fuego":
      return <Flame className={className} />;
    case "zap":
    case "carisma":
    case "poder":
      return <Zap className={className} />;
    case "shield":
    case "defensa":
      return <Shield className={className} />;
    case "swords":
    case "combate":
      return <Swords className={className} />;
    case "trophy":
    case "victoria":
      return <Trophy className={className} />;
    case "brain":
    case "inteligencia":
      return <Brain className={className} />;
    case "heart":
    case "valentia":
      return <Heart className={className} />;
    default:
      return <Zap className={className} />;
  }
}
