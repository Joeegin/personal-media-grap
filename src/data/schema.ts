import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { MediaStatus, MediaType, RelationType } from "../domain/types";

export const mediaItems = sqliteTable("media_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  creator: text("creator").notNull().default(""),
  type: text("type").$type<MediaType>().notNull(),
  status: text("status").$type<MediaStatus>().notNull(),
  year: integer("year"),
  cover: text("cover").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  rating: integer("rating"),
  review: text("review").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull()
});

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull()
  },
  (table) => ({
    nameIdx: uniqueIndex("tags_name_idx").on(table.name)
  })
);

export const mediaTags = sqliteTable(
  "media_tags",
  {
    mediaId: text("media_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.mediaId, table.tagId] })
  })
);

export const mediaRelations = sqliteTable(
  "media_relations",
  {
    id: text("id").primaryKey(),
    fromId: text("from_id")
      .$type<string>()
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    toId: text("to_id")
      .$type<string>()
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    type: text("type").$type<RelationType>().notNull(),
    createdAt: integer("created_at").notNull()
  },
  (table) => ({
    relationIdx: uniqueIndex("media_relations_unique_idx").on(
      table.fromId,
      table.toId,
      table.type
    )
  })
);
