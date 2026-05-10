import { AlertCircle } from "lucide-react";
import { DetailPanel } from "./components/DetailPanel";
import { GraphView } from "./components/GraphView";
import { MediaCollection } from "./components/MediaCollection";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { useMediaLibrary } from "./hooks/useMediaLibrary";

export default function App() {
  const library = useMediaLibrary();

  return (
    <div className="appFrame">
      <Sidebar
        counts={library.counts}
        tags={library.snapshot.tags}
        filters={library.filters}
        onFiltersChange={library.setFilters}
      />

      <main className="workspace">
        <Toolbar
          filters={library.filters}
          onFiltersChange={library.setFilters}
          viewMode={library.viewMode}
          onViewModeChange={library.setViewMode}
          onCreate={library.createBlankMedia}
        />

        {library.error ? (
          <div className="errorBanner">
            <AlertCircle size={16} />
            {library.error}
          </div>
        ) : null}

        {library.isLoading ? (
          <div className="emptyState">
            <h2>Loading library</h2>
            <p>Opening the local media database.</p>
          </div>
        ) : library.viewMode === "graph" ? (
          <GraphView
            snapshot={library.snapshot}
            selectedId={library.selectedId}
            onSelectMedia={library.setSelectedId}
            onSelectTag={library.selectTag}
          />
        ) : (
          <MediaCollection
            items={library.filteredItems}
            mediaTags={library.snapshot.mediaTags}
            selectedId={library.selectedId}
            viewMode={library.viewMode}
            onSelect={library.setSelectedId}
          />
        )}
      </main>

      <DetailPanel
        item={library.selectedItem}
        snapshot={library.snapshot}
        onSave={library.saveMedia}
        onDelete={library.deleteMedia}
        onSetTags={library.setMediaTags}
        onCreateRelation={library.createRelation}
        onDeleteRelation={library.deleteRelation}
      />
    </div>
  );
}
