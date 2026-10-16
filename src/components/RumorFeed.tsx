import React, { useState, useMemo } from "react";
import { Rumor, Character, EmojiReactionKey, AdminUser } from "../types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Flame, MessageSquare, Plus, Filter, Trash2, Search, Users } from "lucide-react";

interface RumorFeedProps {
  rumors: Rumor[];
  characters: Character[];
  onReactRumor: (rumorId: string, emoji: EmojiReactionKey) => void;
  onOpenCreateRumor: () => void;
  adminUser: AdminUser | null;
  onDeleteRumor?: (rumorId: string) => void;
}

const EMOJIS: { key: EmojiReactionKey; label: string }[] = [
  { key: "🔥", label: "Picante" },
  { key: "😱", label: "Impacto" },
  { key: "💀", label: "Fatal" },
  { key: "👀", label: "Atento" },
  { key: "🤫", label: "Secreto" },
];

export const RumorFeed: React.FC<RumorFeedProps> = ({
  rumors,
  characters,
  onReactRumor,
  onOpenCreateRumor,
  adminUser,
  onDeleteRumor,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");

  const filteredRumors = rumors.filter((r) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "general") return !r.characterId;
    return r.characterId === selectedFilter;
  });

  const generalCount = rumors.filter((r) => !r.characterId).length;

  const charRumorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rumors.forEach((r) => {
      if (r.characterId) {
        counts[r.characterId] = (counts[r.characterId] || 0) + 1;
      }
    });
    return counts;
  }, [rumors]);

  const visibleCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    c.classCourse.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-600" />
              Muro Clandestino de Chismes
            </h2>
            <Badge variant="manga" className="text-xs">
              {rumors.length} Leaks
            </Badge>
          </div>
          <p className="text-xs font-semibold text-zinc-600 mt-0.5">
            Lo que se comenta en los pasillos de la UA. ¡Reacciona con emoticonos o añade tu chisme!
          </p>
        </div>

        <Button
          variant="hero"
          onClick={onOpenCreateRumor}
          className="font-black text-sm uppercase px-5 py-5 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Soltar un Rumor
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Rumors List (Single Column) */}
        <div className="lg:col-span-8 space-y-4">
          {filteredRumors.length === 0 ? (
            <div className="text-center py-16 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <MessageSquare className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <h3 className="font-black text-lg text-black uppercase">
                No hay rumores en esta categoría
              </h3>
              <p className="text-zinc-500 text-xs font-semibold max-w-sm mx-auto mt-1 mb-4">
                ¿Escuchaste algo en los vestidores o en la cafetería? ¡Sé el primero en compartirlo!
              </p>
              <Button variant="hero" onClick={onOpenCreateRumor} className="font-black text-xs">
                Publicar el primer rumor
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredRumors.map((rumor) => {
                const char = characters.find((c) => c.id === rumor.characterId);
                return (
                  <div
                    key={rumor.id}
                    className="bg-white border-3 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div>
                      {/* Top Target Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
                        <div className="flex items-center gap-1.5">
                          {char ? (
                            <Badge variant="classUa" className="text-[11px]">
                              👤 {char.name} ({char.classCourse})
                            </Badge>
                          ) : (
                            <Badge variant="manga" className="text-[11px] bg-amber-300 text-black">
                              🏛️ General Campus UA
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400 font-bold">
                            {new Date(rumor.timestamp).toLocaleDateString()}
                          </span>
                          {adminUser && onDeleteRumor && (
                            <button
                              onClick={() => onDeleteRumor(rumor.id)}
                              title="Eliminar rumor (Moderación)"
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Rumor Text */}
                      <p className="text-base font-bold text-zinc-900 leading-relaxed my-2">
                        "{rumor.content}"
                      </p>

                      <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1 mb-3">
                        <span>Filtrado por:</span>
                        <span className="text-black font-black bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                          {rumor.authorName}
                        </span>
                      </div>
                    </div>

                    {/* Emoji Reactions Bar */}
                    <div className="pt-2.5 border-t-2 border-zinc-100 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase text-zinc-400 mr-1">
                        Vota:
                      </span>
                      {EMOJIS.map(({ key, label }) => {
                        const count = rumor.reactions?.[key] || 0;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => onReactRumor(rumor.id, key)}
                            className="px-2.5 py-1 rounded-lg border-2 border-black bg-zinc-50 hover:bg-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                            title={label}
                          >
                            <span className="text-sm">{key}</span>
                            <span className="text-xs font-black text-black">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: Vertical Filters Sidebar */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-zinc-100">
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2 text-black">
                <Filter className="w-4 h-4 text-amber-500" />
                Filtros por Alumno
              </h3>
              <Badge variant="outline" className="text-[10px] font-black border-black bg-amber-100">
                {filteredRumors.length} Leaks
              </Badge>
            </div>

            {/* Quick Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-bold border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-zinc-50"
              />
            </div>

            {/* Vertical Filter Buttons List */}
            <div className="flex flex-col gap-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 scrollbar-thin">
              {/* Filter: All */}
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer flex items-center justify-between ${
                  selectedFilter === "all"
                    ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(251,191,36,1)] translate-x-0.5"
                    : "bg-white text-black hover:bg-amber-100"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>🔥</span> Todos los Rumores
                </span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                    selectedFilter === "all"
                      ? "bg-amber-400 text-black border-black"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}
                >
                  {rumors.length}
                </span>
              </button>

              {/* Filter: General UA */}
              <button
                type="button"
                onClick={() => setSelectedFilter("general")}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer flex items-center justify-between ${
                  selectedFilter === "general"
                    ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(251,191,36,1)] translate-x-0.5"
                    : "bg-white text-black hover:bg-amber-100"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>🏛️</span> Toda la Academia U.A.
                </span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                    selectedFilter === "general"
                      ? "bg-amber-400 text-black border-black"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}
                >
                  {generalCount}
                </span>
              </button>

              {/* Divider if characters exist */}
              {visibleCharacters.length > 0 && (
                <div className="pt-2 pb-1 text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Alumnos ({visibleCharacters.length})
                </div>
              )}

              {/* Filter: Characters List */}
              {visibleCharacters.map((char) => {
                const count = charRumorCounts[char.id] || 0;
                const isSelected = selectedFilter === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedFilter(char.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(251,191,36,1)] translate-x-0.5"
                        : "bg-white text-black hover:bg-amber-100"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>👤</span>
                      <span className="truncate">{char.name}</span>
                      <span className={`text-[10px] font-normal opacity-75 ${isSelected ? "text-amber-300" : "text-zinc-500"}`}>
                        ({char.classCourse})
                      </span>
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                        isSelected
                          ? "bg-amber-400 text-black border-black"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              {visibleCharacters.length === 0 && filterSearch && (
                <p className="text-[11px] text-zinc-400 font-bold text-center py-3">
                  No se encontró ningún alumno con "{filterSearch}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

