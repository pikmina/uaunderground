import React, { useState } from "react";
import { Rumor, Character, EmojiReactionKey, AdminUser } from "../types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Flame, MessageSquare, Plus, Filter, Trash2, Shield } from "lucide-react";

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

  const filteredRumors = rumors.filter((r) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "general") return !r.characterId;
    return r.characterId === selectedFilter;
  });

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
          className="font-black text-sm uppercase px-5 py-5"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Soltar un Rumor
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-black uppercase text-zinc-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filtrar:
        </span>
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-3 py-1 text-xs font-bold rounded-full border-2 border-black transition-all cursor-pointer shrink-0 ${
            selectedFilter === "all"
              ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]"
              : "bg-white text-black hover:bg-amber-100"
          }`}
        >
          Todos los Rumores ({rumors.length})
        </button>
        <button
          onClick={() => setSelectedFilter("general")}
          className={`px-3 py-1 text-xs font-bold rounded-full border-2 border-black transition-all cursor-pointer shrink-0 ${
            selectedFilter === "general"
              ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]"
              : "bg-white text-black hover:bg-amber-100"
          }`}
        >
          🏛️ Toda la Academia U.A.
        </button>
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => setSelectedFilter(char.id)}
            className={`px-3 py-1 text-xs font-bold rounded-full border-2 border-black transition-all cursor-pointer shrink-0 ${
              selectedFilter === char.id
                ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]"
                : "bg-white text-black hover:bg-amber-100"
            }`}
          >
            👤 {char.name}
          </button>
        ))}
      </div>

      {/* Rumors List */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRumors.map((rumor) => {
            const char = characters.find((c) => c.id === rumor.characterId);
            return (
              <div
                key={rumor.id}
                className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div>
                  {/* Top Target Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-100">
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
                <div className="pt-2 border-t-2 border-zinc-100 flex items-center gap-1.5 flex-wrap">
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
                        className="px-2 py-1 rounded-lg border-2 border-black bg-zinc-50 hover:bg-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
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
  );
};
