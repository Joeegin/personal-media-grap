use std::fs;
use std::path::Path;
use std::time::SystemTime;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

const ALLOWED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const MAX_FILE_SIZE: u64 = 20 * 1024 * 1024; // 20 MB

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:personal-media-graph.db", migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![save_cover_file, delete_cover_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn save_cover_file(app: tauri::AppHandle, source: String) -> Result<String, String> {
    let src = Path::new(&source);

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
        return Err(format!("Unsupported file type: .{}", ext));
    }

    let metadata = fs::metadata(src).map_err(|e| format!("Cannot read file: {}", e))?;
    if metadata.len() > MAX_FILE_SIZE {
        return Err(format!(
            "File too large: {} bytes (max {})",
            metadata.len(),
            MAX_FILE_SIZE
        ));
    }

    let mut covers_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {}", e))?;
    covers_dir.push("covers");
    fs::create_dir_all(&covers_dir).map_err(|e| format!("Cannot create covers dir: {}", e))?;

    let nanos = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| format!("System time error: {}", e))?
        .as_nanos();

    let filename = format!("{:x}.{}", nanos, ext);
    let dest = covers_dir.join(&filename);

    fs::copy(src, &dest).map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(dest.to_string_lossy().into_owned())
}

#[tauri::command]
fn delete_cover_file(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    if file_path.exists() {
        fs::remove_file(file_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    Ok(())
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
