import { isTauri } from "@tauri-apps/api/core";
import { MemoryMediaRepository } from "./memoryRepository";
import type { MediaRepository } from "./repository";
import { createSqlMediaRepository } from "./sqlRepository";

export async function createMediaRepository(): Promise<MediaRepository> {
  if (isTauri()) {
    return createSqlMediaRepository();
  }

  return new MemoryMediaRepository(import.meta.env.DEV);
}
