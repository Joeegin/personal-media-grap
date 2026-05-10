import { isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  LibrarySnapshot,
  MediaDraft,
  MediaItem,
  MediaStatus,
  MediaType,
  RelationType
} from "../domain/types";
import { createMediaRepository } from "../data/createRepository";
import type { MediaRepository } from "../data/repository";

export type ViewMode = "grid" | "list" | "graph";

export interface LibraryFilters {
  query: string;
  status: MediaStatus | "all";
  type: MediaType | "all";
  tagId: string | "all";
}

const emptySnapshot: LibrarySnapshot = {
  mediaItems: [],
  tags: [],
  mediaTags: {},
  relations: []
};

export function useMediaLibrary() {
  const repositoryRef = useRef<MediaRepository | null>(null);
  const [snapshot, setSnapshot] = useState<LibrarySnapshot>(emptySnapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<LibraryFilters>({
    query: "",
    status: "all",
    type: "all",
    tagId: "all"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (activeRepository: MediaRepository) => {
      const nextSnapshot = await activeRepository.listLibrary();
      setSnapshot(nextSnapshot);
      setSelectedId((current) => {
        if (current && nextSnapshot.mediaItems.some((item) => item.id === current)) {
          return current;
        }
        return nextSnapshot.mediaItems[0]?.id ?? null;
      });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const repo = await createMediaRepository();
        if (cancelled) return;
        await repo.initialize();
        if (cancelled) return;
        repositoryRef.current = repo;
        await refresh(repo);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Failed to initialize library");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const filteredItems = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase();

    return snapshot.mediaItems.filter((item) => {
      if (filters.status !== "all" && item.status !== filters.status) {
        return false;
      }
      if (filters.type !== "all" && item.type !== filters.type) {
        return false;
      }
      if (
        filters.tagId !== "all" &&
        !(snapshot.mediaTags[item.id] ?? []).some((tag) => tag.id === filters.tagId)
      ) {
        return false;
      }
      if (!query) {
        return true;
      }

      const tagText = (snapshot.mediaTags[item.id] ?? []).map((tag) => tag.name).join(" ");
      return `${item.title} ${item.creator} ${item.year ?? ""} ${tagText} ${item.review}`
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [filters, snapshot]);

  const selectedItem = useMemo(
    () => snapshot.mediaItems.find((item) => item.id === selectedId) ?? null,
    [selectedId, snapshot.mediaItems]
  );

  const counts = useMemo(() => {
    return snapshot.mediaItems.reduce<Record<string, number>>(
      (acc, item) => {
        acc.all += 1;
        acc[item.status] += 1;
        return acc;
      },
      { all: 0, planned: 0, watching: 0, completed: 0, dropped: 0 }
    );
  }, [snapshot.mediaItems]);

  const runMutation = useCallback(
    async <T,>(action: (repo: MediaRepository) => Promise<T>): Promise<T | null> => {
      const repo = repositoryRef.current;
      if (!repo) {
        return null;
      }

      try {
        setError(null);
        const result = await action(repo);
        await refresh(repo);
        return result;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Library action failed");
        return null;
      }
    },
    [refresh]
  );

  const saveMedia = useCallback(
    async (draft: MediaDraft) => {
      const nextId = await runMutation((repo) => repo.saveMedia(draft));
      if (nextId) {
        setSelectedId(nextId);
      }
    },
    [runMutation]
  );

  const deleteMedia = useCallback(
    async (id: string) => {
      await runMutation(async (repo) => {
        const item = snapshot.mediaItems.find((m) => m.id === id);
        if (
          item?.cover &&
          !item.cover.startsWith("http") &&
          isTauri()
        ) {
          try {
            const { invoke } = await import("@tauri-apps/api/core");
            await invoke("delete_cover_file", { path: item.cover });
          } catch {
            // Best-effort cleanup; proceed with DB delete regardless
          }
        }
        await repo.deleteMedia(id);
      });
    },
    [runMutation, snapshot.mediaItems]
  );

  const setMediaTags = useCallback(
    async (mediaId: string, tagNames: string[]) => {
      await runMutation((repo) => repo.setMediaTags(mediaId, tagNames));
    },
    [runMutation]
  );

  const createRelation = useCallback(
    async (fromId: string, toId: string, type: RelationType) => {
      await runMutation((repo) => repo.createRelation({ fromId, toId, type }));
    },
    [runMutation]
  );

  const deleteRelation = useCallback(
    async (id: string) => {
      await runMutation((repo) => repo.deleteRelation(id));
    },
    [runMutation]
  );

  const createBlankMedia = useCallback(() => {
    const draft: MediaDraft = {
      title: "Untitled media",
      creator: "",
      type: "movie",
      status: "planned",
      year: null,
      cover: "",
      sourceUrl: "",
      rating: null,
      review: ""
    };
    void saveMedia(draft);
  }, [saveMedia]);

  const selectTag = useCallback((tagId: string) => {
    setFilters((current) => ({ ...current, tagId }));
    setViewMode("grid");
  }, []);

  return {
    snapshot,
    filteredItems,
    selectedItem,
    selectedId,
    setSelectedId,
    filters,
    setFilters,
    counts,
    viewMode,
    setViewMode,
    isLoading,
    error,
    createBlankMedia,
    saveMedia,
    deleteMedia,
    setMediaTags,
    createRelation,
    deleteRelation,
    selectTag
  };
}
