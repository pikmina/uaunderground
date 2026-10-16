import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Character, RankingAttribute, AdminUser } from "../types";
import {
  MessageCircle,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Sparkles,
  Users,
  Flame,
  Zap,
  HelpCircle,
  User,
  Loader2,
} from "lucide-react";

interface CharacterCardProps {
  character: Character;
  attributes: RankingAttribute[];
  onSelect: (char: Character, tab?: "profile" | "rumors" | "comments") => void;
  onDropRumor: (char: Character) => void;
  adminUser: AdminUser | null;
  onEdit?: (char: Character) => void;
  onDuplicate?: (char: Character) => void;
  onDelete?: (char: Character) => void;
  commentCount: number;
  rumorCount: number;
}

import { getAttributeIcon } from "../lib/heroIcons";
export { getAttributeIcon };

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  attributes,
  onSelect,
  onDropRumor,
  adminUser,
  onEdit,
  onDuplicate,
  onDelete,
  commentCount,
  rumorCount,
}) => {
  const [imgSrc, setImgSrc] = useState(character.avatarUrl);
  const [imgError, setImgError] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Re-sync if prop updates
  React.useEffect(() => {
    setImgSrc(character.avatarUrl);
    setImgError(false);
  }, [character.avatarUrl]);

  const handleDuplicate = async () => {
    if (!onDuplicate || isDuplicating) return;
    setIsDuplicating(true);
    try {
      await onDuplicate(character);
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Card className="border-3 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col sm:flex-row overflow-hidden relative group h-auto sm:h-[360px]">
      
      {/* Photo side */}
      <div className="w-full sm:w-[240px] shrink-0 border-b-3 sm:border-b-0 sm:border-r-3 border-black relative bg-zinc-100 h-64 sm:h-full overflow-hidden">
        {/* Top Tape Sticker effect */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <Badge variant="classUa" className="text-[11px] uppercase tracking-wide">
            {character.classCourse}
          </Badge>
        </div>

        {/* Photo Container */}
        {!imgError ? (
          <img
            src={imgSrc}
            alt={character.name}
            onError={() => {
              setImgError(true);
            }}
            className="w-full h-full object-cover object-top filter contrast-105 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-amber-100 text-zinc-600 p-4 text-center">
            <User className="w-12 h-12 text-amber-500 mb-1" />
            <span className="text-xs font-bold text-black uppercase">Foto no disponible</span>
            <span className="text-[10px] text-zinc-500 truncate max-w-full">
              {character.avatarUrl}
            </span>
          </div>
        )}

        {/* Comic overlay title bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8 text-white">
          <h3 className="font-black text-xl leading-tight uppercase drop-shadow tracking-tight">
            {character.name}
          </h3>
          {character.alias && (
            <p className="text-amber-300 text-xs font-bold tracking-wide truncate">
              "{character.alias}"
            </p>
          )}
        </div>
      </div>

      {/* Content side */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          {/* Basic Info Tags */}
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 pb-1 border-b border-zinc-200">
            {character.age !== undefined && character.age !== null && String(character.age).trim() !== "" ? (
              <span>
                Edad: <strong className="text-black font-black">{character.age} años</strong>
              </span>
            ) : (
              <span className="text-amber-800 font-black bg-amber-200 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                {character.group || "Héroe / Celebridad"}
              </span>
            )}
            {character.quirk && (
              <span className="truncate max-w-[170px] text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-300 font-bold" title={character.quirk}>
                ⚡ {character.quirk}
              </span>
            )}
          </div>

          {/* Ranking Bars Grid */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] uppercase font-black tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Rankings Herosphere</span>
              <span className="text-black font-bold">Escala 1 - 10</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {attributes.map((attr) => {
                const score = character.rankings?.[attr.id] ?? 5;
                const percentage = (score / 10) * 100;
                return (
                  <div
                    key={attr.id}
                    className="bg-zinc-50 border-2 border-black rounded p-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex items-center justify-between text-[11px] font-black uppercase mb-1">
                      <span className="flex items-center gap-1 truncate text-zinc-800">
                        {getAttributeIcon(attr.iconName)}
                        <span className="truncate">{attr.name}</span>
                      </span>
                      <span className="px-1 bg-black text-white rounded text-[10px] font-black">
                        {score}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden border border-black">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: attr.color || "#fbbf24",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unified Counter Pill: Opiniones */}
          <div className="flex items-center pt-2 text-xs font-bold text-zinc-600">
            {(() => {
              const totalOpinions = (rumorCount || 0) + (commentCount || 0);
              return (
                <button
                  onClick={() => onSelect(character, "opinions" as any)}
                  className="flex items-center gap-1.5 bg-amber-100 px-3 py-1.5 rounded-lg border-2 border-black text-black hover:bg-amber-200 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-xs"
                >
                  <MessageCircle className="w-4 h-4 text-amber-600 fill-amber-300" />
                  <span>{totalOpinions} {totalOpinions === 1 ? "Opinión" : "Opiniones"}</span>
                </button>
              );
            })()}
          </div>
        </CardContent>

        <CardFooter className="p-3 pt-0 flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2 w-full pt-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => onSelect(character, "profile")}
              className="flex-1 bg-black text-white hover:bg-zinc-800 font-bold border-2 border-black"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Perfil</span>
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => onDropRumor(character)}
              className="font-black text-xs px-2.5"
              title="Dejar una opinión o chisme sobre este personaje"
            >
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span>Opinar</span>
            </Button>
          </div>

          {/* Admin Controls */}
          {adminUser && onEdit && onDuplicate && onDelete && (
            <div className="flex items-center justify-between w-full pt-1 border-t border-dashed border-zinc-300 mt-1">
              <span className="text-[10px] uppercase font-black text-red-600">Admin:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(character)}
                  className="h-7 px-2 text-[11px] font-bold border-black hover:bg-amber-200"
                  title="Editar personaje"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDuplicating}
                  onClick={handleDuplicate}
                  className="h-7 px-2 text-[11px] font-bold border-black hover:bg-sky-200 cursor-pointer disabled:opacity-60"
                  title="Duplicar ficha de personaje"
                >
                  {isDuplicating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(character)}
                  className="h-7 px-2 text-[11px] font-bold border-black"
                  title="Eliminar personaje"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  );
};
