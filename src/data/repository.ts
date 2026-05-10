import type { LibrarySnapshot, MediaDraft, MediaRelation, RelationType } from "../domain/types";

export interface RelationInput {
  fromId: string;
  toId: string;
  type: RelationType;
}

export interface MediaRepository {
  initialize(): Promise<void>;
  listLibrary(): Promise<LibrarySnapshot>;
  saveMedia(draft: MediaDraft): Promise<string>;
  deleteMedia(id: string): Promise<void>;
  setMediaTags(mediaId: string, tagNames: string[]): Promise<void>;
  createRelation(input: RelationInput): Promise<void>;
  deleteRelation(id: string): Promise<void>;
}

export function getOutgoingRelations(mediaId: string, relations: MediaRelation[]) {
  return relations.filter((relation) => relation.fromId === mediaId);
}

export function getIncomingRelations(mediaId: string, relations: MediaRelation[]) {
  return relations.filter((relation) => relation.toId === mediaId);
}
