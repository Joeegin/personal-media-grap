import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

export function getCoverSrc(cover: string): string {
  if (!cover) return "";
  if (cover.startsWith("http://") || cover.startsWith("https://")) {
    return cover;
  }
  if (isTauri()) {
    return convertFileSrc(cover);
  }
  return cover;
}
