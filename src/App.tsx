import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { DetailPanel } from "./components/DetailPanel";
import { GraphView } from "./components/GraphView";
import { MediaCollection } from "./components/MediaCollection";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { useMediaLibrary } from "./hooks/useMediaLibrary";

export default function App() {
  const library = useMediaLibrary();

  useEffect(() => {
    const delays = [0, 200, 500, 1000, 2000];
    const timers: ReturnType<typeof setTimeout>[] = [];

    const tryActivate = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        // Step 1: activate NSApp via the working activateIgnoringOtherApps API
        await invoke("activate_app");
        // Step 2: make the window key. tao's setFocus() may internally call
        // the broken [NSApp activate], but the app is already active from step 1.
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setFocus();
      } catch {
        // Non-Tauri context or IPC failure — ignore.
      }
    };

    for (const delay of delays) {
      timers.push(setTimeout(() => {
        tryActivate();
      }, delay));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

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
