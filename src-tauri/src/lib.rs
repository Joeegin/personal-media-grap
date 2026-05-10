use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:personal-media-graph.db", migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_media_graph_tables",
        sql: r#"
            CREATE TABLE IF NOT EXISTS media_items (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                creator TEXT NOT NULL DEFAULT '',
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                year INTEGER,
                cover TEXT NOT NULL DEFAULT '',
                source_url TEXT NOT NULL DEFAULT '',
                rating INTEGER,
                review TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
            );

            CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS media_tags (
                media_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (media_id, tag_id),
                FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS media_relations (
                id TEXT PRIMARY KEY NOT NULL,
                from_id TEXT NOT NULL,
                to_id TEXT NOT NULL,
                type TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                UNIQUE (from_id, to_id, type),
                CHECK (from_id <> to_id),
                FOREIGN KEY (from_id) REFERENCES media_items(id) ON DELETE CASCADE,
                FOREIGN KEY (to_id) REFERENCES media_items(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS media_items_status_idx ON media_items(status);
            CREATE INDEX IF NOT EXISTS media_items_type_idx ON media_items(type);
            CREATE INDEX IF NOT EXISTS media_relations_from_idx ON media_relations(from_id);
            CREATE INDEX IF NOT EXISTS media_relations_to_idx ON media_relations(to_id);
        "#,
        kind: MigrationKind::Up,
    }]
}
