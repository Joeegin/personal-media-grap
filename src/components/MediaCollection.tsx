import { ExternalLink, Star } from "lucide-react";
import type { MediaItem, Tag } from "../domain/types";
import { mediaStatusLabels, mediaTypeLabels } from "../domain/labels";
import type { ViewMode } from "../hooks/useMediaLibrary";

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
            <div className="ratingRow" aria-label={item.rating ? `${item.rating} stars` : "No rating"}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={14}
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
  if (item.cover) {
    return <img className="cover" src={item.cover} alt="" />;
  }

  return (
    <div className={`cover placeholder ${item.type}`}>
      <span>{item.title.slice(0, 1).toLocaleUpperCase()}</span>
    </div>
  );
}
