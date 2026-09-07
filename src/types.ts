export interface RankingAttribute {
  id: string;
  name: string;
  iconName: string;
  description: string;
  min: number;
  max: number;
  color: string;
}

export interface Character {
  id: string;
  name: string;
  alias: string;
  age: number | string;
  classCourse: string;
  quirk?: string;
  avatarUrl: string;
  bio?: string;
  rankings: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export type EmojiReactionKey = "🔥" | "😱" | "💀" | "👀" | "🤫";

export interface Rumor {
  id: string;
  characterId?: string | null;
  characterName?: string;
  authorName: string;
  authorEmail: string; // Guardado privado para seguridad/moderación, nunca visible en público
  content: string;
  reactions: Record<EmojiReactionKey, number>;
  timestamp: string;
}

export interface CharacterComment {
  id: string;
  characterId: string;
  authorName: string;
  authorEmail: string; // Privado
  content: string;
  reactions: Record<EmojiReactionKey, number>;
  timestamp: string;
}

export interface FyeoPost {
  id: string;
  title: string;
  content: string; // HTML format from TipTap
  authorAlias: string;
  authorAvatar: string;
  createdAt: string;
  updatedAt: string;
  reactions?: Record<EmojiReactionKey, number>;
}

export interface FyeoComment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string; // Private
  content: string;
  reactions: Record<EmojiReactionKey, number>;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "superadmin" | "moderator";
  createdAt: string;
  password?: string; // Solo en memoria / servidor
}

export interface SystemConfig {
  communityPassword?: string;
  hasCommunityPassword?: boolean;
  passwordHint: string;
  lastPasswordChange: string;
  prohibitedWords: string[];
  siteNotice: string;
}

export interface AppStateData {
  config: SystemConfig;
  attributes: RankingAttribute[];
  characters: Character[];
  rumors: Rumor[];
  comments: CharacterComment[];
  admins: AdminUser[];
  fyeoPosts: FyeoPost[];
  fyeoComments: FyeoComment[];
}
