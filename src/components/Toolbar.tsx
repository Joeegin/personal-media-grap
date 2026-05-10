import { Grid2X2, List, Network, Plus, Search } from "lucide-react";
import type { MediaType } from "../domain/types";
import { MEDIA_TYPES } from "../domain/types";
import { mediaTypeLabels } from "../domain/labels";
import type { LibraryFilters, ViewMode } from "../hooks/useMediaLibrary";

interface ToolbarProps {
  filters: LibraryFilters;
  onFiltersChange(filters: LibraryFilters): void;
  viewMode: ViewMode;
  onViewModeChange(viewMode: ViewMode): void;
  onCreate(): void;
}

export function Toolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  onCreate
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="searchBox">
        <Search size={16} />
        <input
          value={filters.query}
          onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
          placeholder="Search title, creator, tag, review"
          aria-label="Search library"
        />
      </div>

      <select
        value={filters.type}
        onChange={(event) =>
          onFiltersChange({ ...filters, type: event.target.value as MediaType | "all" })
        }
        aria-label="Filter by type"
      >
        <option value="all">All types</option>
        {MEDIA_TYPES.map((type) => (
          <option key={type} value={type}>
            {mediaTypeLabels[type]}
          </option>
        ))}
      </select>

      <div className="segmented" aria-label="View mode">
        <button
          className={viewMode === "grid" ? "active" : ""}
          onClick={() => onViewModeChange("grid")}
          title="Grid"
          aria-label="Grid view"
        >
          <Grid2X2 size={16} />
        </button>
        <button
          className={viewMode === "list" ? "active" : ""}
          onClick={() => onViewModeChange("list")}
          title="List"
          aria-label="List view"
        >
          <List size={16} />
        </button>
        <button
          className={viewMode === "graph" ? "active" : ""}
          onClick={() => onViewModeChange("graph")}
          title="Graph"
          aria-label="Graph view"
        >
          <Network size={16} />
        </button>
      </div>

      <button className="primaryButton" onClick={onCreate}>
        <Plus size={16} />
        Add
      </button>
    </header>
  );
}
