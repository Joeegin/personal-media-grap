import { useEffect, useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import type { MediaItem, Tag } from "../domain/types";
import { mediaStatusLabels, mediaTypeLabels } from "../domain/labels";
import type { ViewMode } from "../hooks/useMediaLibrary";
import { loadCoverSrc } from "../utils/cover";

interface MediaCollectionProps {
  items: MediaItem[];
  mediaTags: Record<string, Tag[]>;
  selectedId: string | null;
  viewMode: Exclude<ViewMode, "graph">;
  onSelect(id: string): void;
}

export function MediaCollection({
  items,
  mediaTags,
  selectedId,
  viewMode,
  onSelect
}: MediaCollectionProps) {
  if (items.length === 0) {
    return (
      <div className="emptyState">
        <h2>No matching media</h2>
        <p>Add a new item or loosen the active filters.</p>
      </div>
    );
  }

  return (
    <section className={viewMode === "grid" ? "mediaGrid" : "mediaList"} aria-label="Media items">
      {items.map((item) => (
        <button
          key={item.id}
          className={selectedId === item.id ? "mediaCard active" : "mediaCard"}
          onClick={() => onSelect(item.id)}
        >
          <Cover item={item} />
          <div className="mediaCardBody">
            <div className="mediaMetaRow">
              <span>{mediaTypeLabels[item.type]}</span>
              <span>{mediaStatusLabels[item.status]}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{[item.creator, item.year].filter(Boolean).join(" · ") || "No creator yet"}</p>
            <div className="ratingRow" aria-label={item.rating ? `${item.rating}/10` : "No rating"}>
              {Array.from({ length: 10 }, (_, index) => (
                <Star
                  key={index}
                  size={11}
                  fill={item.rating && index < item.rating ? "currentColor" : "none"}
                />
              ))}
            </div>
            <div className="chipRow">
              {(mediaTags[item.id] ?? []).slice(0, 3).map((tag) => (
                <span key={tag.id} className="chip">
                  {tag.name}
                </span>
              ))}
              {item.sourceUrl ? <ExternalLink size={14} className="linkHint" /> : null}
            </div>
          </div>
        </button>
      ))}
    </section>
  );
}

function Cover({ item }: { item: MediaItem }) {
  const [imgError, setImgError] = useState(false);
  const [localSrc, setLocalSrc] = useState("");

  const isRemote = item.cover.startsWith("http://") || item.cover.startsWith("https://");

  useEffect(() => {
    if (isRemote || !item.cover) {
      setLocalSrc("");
      return;
    }

    let cancelled = false;
    setImgError(false);

    loadCoverSrc(item.cover).then((src) => {
      if (!cancelled) setLocalSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [item.id, item.cover, isRemote]);

  useEffect(() => {
    setImgError(false);
  }, [item.id, item.cover]);

  const src = isRemote ? item.cover : localSrc;

  if (src && !imgError) {
    return (
      <img
        className="cover"
        src={src}
        alt=""
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`cover placeholder ${item.type}`}>
      <span>{item.title.slice(0, 1).toLocaleUpperCase()}</span>
    </div>
  );
}
