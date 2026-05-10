import type { LibrarySnapshot, MediaDraft, MediaItem, MediaRelation, Tag } from "../domain/types";
import { createId } from "./id";
import { demoMedia, demoTags } from "./demoSeed";
import type { MediaRepository, RelationInput } from "./repository";
import { mediaDraftSchema, relationInputSchema } from "./validation";

export class MemoryMediaRepository implements MediaRepository {
  private mediaItems = new Map<string, MediaItem>();
  private tags = new Map<string, Tag>();
  private mediaTags = new Map<string, Set<string>>();
  private relations = new Map<string, MediaRelation>();
  private seeded = false;

  constructor(private readonly seedDemoData = false) {}

  async initialize() {
    if (!this.seedDemoData || this.seeded) {
      return;
    }

    this.seeded = true;
    const ids = new Map<string, string>();

    for (const draft of demoMedia) {
      const id = await this.saveMedia(draft);
      ids.set(draft.title, id);
      await this.setMediaTags(id, demoTags[draft.title] ?? []);
    }

    const perfectBlue = ids.get("Perfect Blue");
    const severance = ids.get("Severance");
    if (perfectBlue && severance) {
      await this.createRelation({
        fromId: perfectBlue,
        toId: severance,
        type: "SIMILAR_TO"
      });
    }
  }

  async listLibrary(): Promise<LibrarySnapshot> {
    const tags = [...this.tags.values()].sort((a, b) => a.name.localeCompare(b.name));
    const mediaItems = [...this.mediaItems.values()].sort((a, b) => b.updatedAt - a.updatedAt);
    const mediaTags: Record<string, Tag[]> = {};

    for (const item of mediaItems) {
      const tagIds = this.mediaTags.get(item.id) ?? new Set<string>();
      mediaTags[item.id] = [...tagIds]
        .map((id) => this.tags.get(id))
        .filter((tag): tag is Tag => Boolean(tag))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      mediaItems,
      tags,
      mediaTags,
      relations: [...this.relations.values()].sort((a, b) => a.createdAt - b.createdAt)
    };
  }

  async saveMedia(input: MediaDraft) {
    const draft = mediaDraftSchema.parse(input);
    const now = Date.now();
    const existing = draft.id ? this.mediaItems.get(draft.id) : undefined;
    const id = existing?.id ?? createId("media");

    this.mediaItems.set(id, {
      ...draft,
      id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });

    return id;
  }

  async deleteMedia(id: string) {
    this.mediaItems.delete(id);
    this.mediaTags.delete(id);

    for (const [relationId, relation] of this.relations) {
      if (relation.fromId === id || relation.toId === id) {
        this.relations.delete(relationId);
      }
    }
  }

  async setMediaTags(mediaId: string, tagNames: string[]) {
    const normalized = normalizeTagNames(tagNames);
    const nextTagIds = new Set<string>();

    for (const name of normalized) {
      const existing = [...this.tags.values()].find(
        (tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase()
      );
      const tag = existing ?? { id: createId("tag"), name };
      this.tags.set(tag.id, tag);
      nextTagIds.add(tag.id);
    }

    this.mediaTags.set(mediaId, nextTagIds);
    this.pruneUnusedTags();
  }

  async createRelation(input: RelationInput) {
    const relation = relationInputSchema.parse(input);
    const exists = [...this.relations.values()].some(
      (item) =>
        item.fromId === relation.fromId &&
        item.toId === relation.toId &&
        item.type === relation.type
    );

    if (exists) {
      return;
    }

    const id = createId("rel");
    this.relations.set(id, {
      id,
      ...relation,
      createdAt: Date.now()
    });
  }

  async deleteRelation(id: string) {
    this.relations.delete(id);
  }

  private pruneUnusedTags() {
    const used = new Set([...this.mediaTags.values()].flatMap((tagIds) => [...tagIds]));
    for (const tagId of this.tags.keys()) {
      if (!used.has(tagId)) {
        this.tags.delete(tagId);
      }
    }
  }
}

export function normalizeTagNames(tagNames: string[]) {
  return [
    ...new Set(
      tagNames
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 48))
    )
  ];
}
