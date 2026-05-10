import { invoke, isTauri } from "@tauri-apps/api/core";

const cache = new Map<string, string>();

export async function loadCoverSrc(cover: string): Promise<string> {
  if (!cover) return "";
  if (cover.startsWith("http://") || cover.startsWith("https://")) {
    return cover;
  }
  if (!isTauri()) return cover;

  const cached = cache.get(cover);
  if (cached) return cached;

  try {
    const bytes = await invoke<number[]>("read_cover_file", { path: cover });
    const uint8 = new Uint8Array(bytes);
    const blob = new Blob([uint8], { type: mimeFromPath(cover) });
    const url = URL.createObjectURL(blob);
    cache.set(cover, url);
    return url;
  } catch {
    return "";
  }
}

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp"
  };
  return map[ext ?? ""] ?? "image/png";
}
