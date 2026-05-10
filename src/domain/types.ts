export const MEDIA_TYPES = [
  "movie",
  "book",
  "anime",
  "series",
  "comic",
  "game",
  "podcast",
  "other"
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_STATUSES = [
  "planned",
  "watching",
  "completed",
  "dropped"
] as const;

export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const RELATION_TYPES = [
  "SIMILAR_TO",
  "ADAPTATION_OF",
  "SAME_CREATOR",
  "PART_OF_SERIES"
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export interface MediaItem {
  id: string;
  title: string;
  creator: string;
  type: MediaType;
  status: MediaStatus;
  year: number | null;
  cover: string;
  sourceUrl: string;
  rating: number | null;
  review: string;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface MediaRelation {
  id: string;
  fromId: string;
  toId: string;
  type: RelationType;
  createdAt: number;
}

export interface MediaDraft {
  id?: string;
  title: string;
  creator: string;
  type: MediaType;
  status: MediaStatus;
  year: number | null;
  cover: string;
  sourceUrl: string;
  rating: number | null;
  review: string;
}

export interface LibrarySnapshot {
  mediaItems: MediaItem[];
  tags: Tag[];
  mediaTags: Record<string, Tag[]>;
  relations: MediaRelation[];
}

export interface GraphNode {
  id: string;
  label: string;
  kind: "media" | "tag";
  mediaId?: string;
  tagId?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationId?: string;
}
