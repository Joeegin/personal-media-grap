import { BookMarked, Circle, Clapperboard, Tag as TagIcon } from "lucide-react";
import { MEDIA_STATUSES } from "../domain/types";
import type { MediaStatus, Tag } from "../domain/types";
import { mediaStatusLabels } from "../domain/labels";
import type { LibraryFilters } from "../hooks/useMediaLibrary";

interface SidebarProps {
  counts: Record<string, number>;
  tags: Tag[];
  filters: LibraryFilters;
  onFiltersChange(filters: LibraryFilters): void;
}

export function Sidebar({ counts, tags, filters, onFiltersChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brandBlock">
        <div className="brandMark">
          <Clapperboard size={18} />
        </div>
        <div>
          <p className="eyebrow">Local archive</p>
          <h1>Media Graph</h1>
        </div>
      </div>

      <nav className="navGroup" aria-label="Status filters">
        <button
          className={filters.status === "all" ? "navItem active" : "navItem"}
          onClick={() => onFiltersChange({ ...filters, status: "all" })}
        >
          <BookMarked size={16} />
          <span>All media</span>
          <strong>{counts.all ?? 0}</strong>
        </button>
        {MEDIA_STATUSES.map((status) => (
          <button
            key={status}
            className={filters.status === status ? "navItem active" : "navItem"}
            onClick={() => onFiltersChange({ ...filters, status })}
          >
            <Circle size={12} className={`statusDot ${status}`} />
            <span>{mediaStatusLabels[status as MediaStatus]}</span>
            <strong>{counts[status] ?? 0}</strong>
          </button>
        ))}
      </nav>

      <div className="navSectionTitle">
        <TagIcon size={14} />
        Tags
      </div>
      <nav className="tagList" aria-label="Tag filters">
        <button
          className={filters.tagId === "all" ? "tagFilter active" : "tagFilter"}
          onClick={() => onFiltersChange({ ...filters, tagId: "all" })}
        >
          Any tag
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            className={filters.tagId === tag.id ? "tagFilter active" : "tagFilter"}
            onClick={() => onFiltersChange({ ...filters, tagId: tag.id })}
          >
            {tag.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
