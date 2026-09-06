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
  const [activeAttrId, setActiveAttrId] = useState<string>(
    attributes.length > 0 ? attributes[0].id : ""
  );

  const currentAttr = attributes.find((a) => a.id === activeAttrId) || attributes[0];

  // Sort characters by the active attribute descending
  const sorted = [...characters].sort((a, b) => {
    const scoreA = a.rankings?.[currentAttr?.id || ""] ?? 0;
    const scoreB = b.rankings?.[currentAttr?.id || ""] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-white border-3 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
          <Trophy className="w-7 h-7 text-amber-500" />
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-black tracking-tight">
            Tablas de Posiciones de la UA
          </h2>
        </div>
        <p className="text-xs font-semibold text-zinc-600 mt-1">
          Ranking oficial no autorizado de estudiantes según las votaciones de la comunidad de rol.
        </p>

        {/* Attribute Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 scrollbar-none">
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

      {/* Leaderboard Table / Cards */}
      <div className="bg-white border-3 border-black rounded-xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black text-white px-4 py-2.5 flex items-center justify-between font-black uppercase text-xs">
          <span>Clasificación por: {currentAttr?.name}</span>
          <span>Puntuación (1-10)</span>
        </div>

        <div className="divide-y-2 divide-zinc-200">
          {sorted.map((char, index) => {
            const score = char.rankings?.[currentAttr?.id || ""] ?? 0;
            const isTop3 = index < 3;
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
      </div>
    </div>
  );
};
