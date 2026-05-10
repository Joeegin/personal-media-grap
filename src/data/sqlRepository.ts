import type { LibrarySnapshot, MediaDraft, MediaItem, MediaRelation, Tag } from "../domain/types";
import { createId } from "./id";
import { demoMedia, demoTags } from "./demoSeed";
import { normalizeTagNames } from "./memoryRepository";
import type { MediaRepository, RelationInput } from "./repository";
import { mediaDraftSchema, relationInputSchema } from "./validation";

const DATABASE_URL = "sqlite:personal-media-graph.db";

type SqlValue = string | number | null;

interface SqlDatabase {
  execute(sql: string, params?: SqlValue[]): Promise<{ rowsAffected?: number; lastInsertId?: number }>;
  select<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
}

interface MediaRow {
  id: string;
  title: string;
  creator: string;
  type: MediaItem["type"];
  status: MediaItem["status"];
  year: number | null;
  cover: string;
  source_url: string;
  rating: number | null;
  review: string;
  created_at: number;
  updated_at: number;
}

interface RelationRow {
  id: string;
  from_id: string;
  to_id: string;
  type: MediaRelation["type"];
  created_at: number;
}

interface MediaTagRow {
  media_id: string;
  tag_id: string;
}

export async function createSqlMediaRepository(): Promise<SqlMediaRepository> {
  const { default: Database } = await import("@tauri-apps/plugin-sql");
  const db = (await Database.load(DATABASE_URL)) as SqlDatabase;
  return new SqlMediaRepository(db);
}

export class SqlMediaRepository implements MediaRepository {
  constructor(private readonly db: SqlDatabase) {}

  async initialize() {
    await this.db.execute("PRAGMA foreign_keys = ON");

    if (import.meta.env.DEV) {
      await this.seedIfEmpty();
    }
  }

  async listLibrary(): Promise<LibrarySnapshot> {
    const mediaRows = await this.db.select<MediaRow>(
      `SELECT id, title, creator, type, status, year, cover, source_url, rating, review, created_at, updated_at
       FROM media_items
       ORDER BY updated_at DESC`
    );
    const tags = await this.db.select<Tag>("SELECT id, name FROM tags ORDER BY lower(name)");
    const mediaTagRows = await this.db.select<MediaTagRow>(
      "SELECT media_id, tag_id FROM media_tags"
    );
    const relationRows = await this.db.select<RelationRow>(
      `SELECT id, from_id, to_id, type, created_at
       FROM media_relations
       ORDER BY created_at ASC`
    );

    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    const mediaTags: Record<string, Tag[]> = {};
    for (const item of mediaRows) {
      mediaTags[item.id] = [];
    }
    for (const row of mediaTagRows) {
      const tag = tagsById.get(row.tag_id);
      if (tag) {
        mediaTags[row.media_id] = [...(mediaTags[row.media_id] ?? []), tag];
      }
    }

    for (const mediaId of Object.keys(mediaTags)) {
      mediaTags[mediaId].sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      mediaItems: mediaRows.map(mapMediaRow),
      tags,
      mediaTags,
      relations: relationRows.map(mapRelationRow)
    };
  }

  async saveMedia(input: MediaDraft) {
    const draft = mediaDraftSchema.parse(input);
    const now = Date.now();
    const id = draft.id ?? createId("media");

    if (draft.id) {
      await this.db.execute(
        `UPDATE media_items
         SET title = ?, creator = ?, type = ?, status = ?, year = ?, cover = ?, source_url = ?, rating = ?, review = ?, updated_at = ?
         WHERE id = ?`,
        [
          draft.title,
          draft.creator,
          draft.type,
          draft.status,
          draft.year,
          draft.cover,
          draft.sourceUrl,
          draft.rating,
          draft.review,
          now,
          id
        ]
      );
      return id;
    }

    await this.db.execute(
      `INSERT INTO media_items
       (id, title, creator, type, status, year, cover, source_url, rating, review, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        draft.title,
        draft.creator,
        draft.type,
        draft.status,
        draft.year,
        draft.cover,
        draft.sourceUrl,
        draft.rating,
        draft.review,
        now,
        now
      ]
    );

    return id;
  }

  async deleteMedia(id: string) {
    await this.db.execute("DELETE FROM media_items WHERE id = ?", [id]);
  }

  async setMediaTags(mediaId: string, tagNames: string[]) {
    const tagIds: string[] = [];

    for (const name of normalizeTagNames(tagNames)) {
      await this.db.execute("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)", [
        createId("tag"),
        name
      ]);
      const [tag] = await this.db.select<Tag>("SELECT id, name FROM tags WHERE name = ? LIMIT 1", [
        name
      ]);
      if (tag) {
        tagIds.push(tag.id);
      }
    }

    await this.db.execute("DELETE FROM media_tags WHERE media_id = ?", [mediaId]);
    for (const tagId of tagIds) {
      await this.db.execute(
        "INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?)",
        [mediaId, tagId]
      );
    }
    await this.db.execute(
      `DELETE FROM tags
       WHERE id NOT IN (SELECT DISTINCT tag_id FROM media_tags)`
    );
  }

  async createRelation(input: RelationInput) {
    const relation = relationInputSchema.parse(input);
    await this.db.execute(
      `INSERT OR IGNORE INTO media_relations (id, from_id, to_id, type, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [createId("rel"), relation.fromId, relation.toId, relation.type, Date.now()]
    );
  }

  async deleteRelation(id: string) {
    await this.db.execute("DELETE FROM media_relations WHERE id = ?", [id]);
  }

  private async seedIfEmpty() {
    const [row] = await this.db.select<{ total: number }>("SELECT COUNT(*) as total FROM media_items");
    if (row?.total > 0) {
      return;
    }

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
}

function mapMediaRow(row: MediaRow): MediaItem {
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    type: row.type,
    status: row.status,
    year: row.year,
    cover: row.cover,
    sourceUrl: row.source_url,
    rating: row.rating,
    review: row.review,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRelationRow(row: RelationRow): MediaRelation {
  return {
    id: row.id,
    fromId: row.from_id,
    toId: row.to_id,
    type: row.type,
    createdAt: row.created_at
  };
}
