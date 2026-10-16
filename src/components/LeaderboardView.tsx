import React, { useState } from "react";
import { Character, RankingAttribute } from "../types";
import { Badge } from "./ui/badge";
import { Trophy, Flame, Sparkles, Users, Zap, Medal } from "lucide-react";
import { getAttributeIcon } from "./CharacterCard";

interface LeaderboardViewProps {
  characters: Character[];
  attributes: RankingAttribute[];
  onSelectCharacter: (char: Character) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  characters,
  attributes,
  onSelectCharacter,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [activeAttrId, setActiveAttrId] = useState<string>(
    attributes.length > 0 ? attributes[0].id : ""
  );

  const currentAttr = attributes.find((a) => a.id === activeAttrId) || attributes[0];

  const getCharGroup = (char: Character): string => {
    if (char.group) return char.group;
    if (char.category === "hero") return "Héroes";
    return "Aspirantes a Héroes";
  };

  const groupCounts = {
    all: characters.length,
    heroes: characters.filter((c) => getCharGroup(c) === "Héroes").length,
    aspirantes: characters.filter((c) => getCharGroup(c) === "Aspirantes a Héroes").length,
    celebridades: characters.filter((c) => getCharGroup(c) === "Celebridades").length,
    otros: characters.filter((c) => getCharGroup(c) === "Otros").length,
  };

  // Filter characters by group first
  const filteredByGroup = characters.filter((c) => {
    if (selectedGroup === "all") return true;
    return getCharGroup(c) === selectedGroup;
  });

  // Sort characters by the active attribute descending
  const sorted = [...filteredByGroup].sort((a, b) => {
    const scoreA = a.rankings?.[currentAttr?.id || ""] ?? 0;
    const scoreB = b.rankings?.[currentAttr?.id || ""] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-white border-3 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-black tracking-tight">
              Tablas de Posiciones de Herosphere
            </h2>
          </div>
        </div>
        <p className="text-xs font-semibold text-zinc-600">
          Ranking de la industria heroica según los atributos y valoraciones de la comunidad.
        </p>

        {/* Group Filter Buttons */}
        <div className="pt-2 border-t border-zinc-200">
          <label className="text-xs font-black uppercase text-zinc-500 block mb-2">
            Filtrar Ranking por Grupo:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedGroup("all")}
              className={`px-3 py-1.5 rounded-lg border-2 border-black font-black text-xs transition-all cursor-pointer shrink-0 ${
                selectedGroup === "all"
                  ? "bg-black text-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Todos los Grupos ({groupCounts.all})
            </button>
            <button
              onClick={() => setSelectedGroup("Héroes")}
              className={`px-3 py-1.5 rounded-lg border-2 border-black font-black text-xs transition-all cursor-pointer shrink-0 ${
                selectedGroup === "Héroes"
                  ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Héroes ({groupCounts.heroes})
            </button>
            <button
              onClick={() => setSelectedGroup("Aspirantes a Héroes")}
              className={`px-3 py-1.5 rounded-lg border-2 border-black font-black text-xs transition-all cursor-pointer shrink-0 ${
                selectedGroup === "Aspirantes a Héroes"
                  ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Aspirantes a Héroes ({groupCounts.aspirantes})
            </button>
            <button
              onClick={() => setSelectedGroup("Celebridades")}
              className={`px-3 py-1.5 rounded-lg border-2 border-black font-black text-xs transition-all cursor-pointer shrink-0 ${
                selectedGroup === "Celebridades"
                  ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Celebridades ({groupCounts.celebridades})
            </button>
            <button
              onClick={() => setSelectedGroup("Otros")}
              className={`px-3 py-1.5 rounded-lg border-2 border-black font-black text-xs transition-all cursor-pointer shrink-0 ${
                selectedGroup === "Otros"
                  ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Otros ({groupCounts.otros})
            </button>
          </div>
        </div>

        {/* Attribute Selector Pills */}
        <div className="pt-2 border-t border-zinc-200">
          <label className="text-xs font-black uppercase text-zinc-500 block mb-2">
            Seleccionar Atributo:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {attributes.map((attr) => (
              <button
                key={attr.id}
                onClick={() => setActiveAttrId(attr.id)}
                className={`px-3 py-1.5 rounded-lg border-2 border-black font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  currentAttr?.id === attr.id
                    ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {getAttributeIcon(attr.iconName)}
                <span>Top {attr.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="bg-white border-3 border-black rounded-xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black text-white px-4 py-2.5 flex items-center justify-between font-black uppercase text-xs">
          <span>
            Clasificación ({selectedGroup === "all" ? "Todos los Grupos" : selectedGroup}) por: {currentAttr?.name}
          </span>
          <span>Puntuación (1-10)</span>
        </div>

        {sorted.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-bold text-xs uppercase">
            No hay personajes registrados en la categoría {selectedGroup}.
          </div>
        ) : (
          <div className="divide-y-2 divide-zinc-200">
            {sorted.map((char, index) => {
              const score = char.rankings?.[currentAttr?.id || ""] ?? 0;
              let rankBadgeColor = "bg-zinc-100 text-black";
              if (index === 0) rankBadgeColor = "bg-amber-400 text-black border-2 border-black";
              if (index === 1) rankBadgeColor = "bg-zinc-300 text-black border-2 border-black";
              if (index === 2) rankBadgeColor = "bg-amber-700 text-white border-2 border-black";

              return (
                <div
                  key={char.id}
                  onClick={() => onSelectCharacter(char)}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-amber-50/70 transition-colors cursor-pointer"
                >
                  {/* Left: Rank, Avatar, Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${rankBadgeColor}`}
                    >
                      #{index + 1}
                    </div>

                    <div className="w-12 h-12 rounded-lg border-2 border-black overflow-hidden bg-zinc-200 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base text-black uppercase truncate">
                          {char.name}
                        </h4>
                        {index === 0 && (
                          <span className="text-xs">👑</span>
                        )}
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-black bg-zinc-100">
                          {getCharGroup(char)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                        <span className="truncate">{char.classCourse}</span>
                        {char.alias && (
                          <span className="hidden sm:inline italic text-zinc-500">
                            • "{char.alias}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Progress */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block w-32 bg-zinc-200 h-3 rounded-full overflow-hidden border border-black">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(score / 10) * 100}%`,
                          backgroundColor: currentAttr?.color || "#fbbf24",
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-black px-2.5 py-1 rounded bg-amber-200 border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                        {score}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

