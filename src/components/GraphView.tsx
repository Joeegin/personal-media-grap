import { useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler
} from "@xyflow/react";
import type { LibrarySnapshot } from "../domain/types";
import { relationTypeLabels } from "../domain/labels";

interface GraphViewProps {
  snapshot: LibrarySnapshot;
  selectedId: string | null;
  onSelectMedia(id: string): void;
  onSelectTag(id: string): void;
}

export function GraphView({ snapshot, selectedId, onSelectMedia, onSelectTag }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => buildGraph(snapshot, selectedId), [snapshot, selectedId]);
  const handleNodeClick: NodeMouseHandler = (_, node) => {
    if (node.data.kind === "media") {
      onSelectMedia(node.data.id as string);
    }
    if (node.data.kind === "tag") {
      onSelectTag(node.data.id as string);
    }
  };

  if (snapshot.mediaItems.length === 0) {
    return (
      <div className="emptyState">
        <h2>No graph yet</h2>
        <p>Add media and tags to build the first local knowledge graph.</p>
      </div>
    );
  }

  return (
    <div className="graphSurface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.25}
        maxZoom={1.8}
        onNodeClick={handleNodeClick}
      >
        <Background gap={28} color="#d8d2c8" />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function buildGraph(snapshot: LibrarySnapshot, selectedId: string | null) {
  const mediaCount = Math.max(snapshot.mediaItems.length, 1);
  const mediaRadius = Math.max(220, mediaCount * 34);
  const centerX = 360;
  const centerY = 300;

  const mediaNodes: Node[] = snapshot.mediaItems.map((item, index) => {
    const angle = (index / mediaCount) * Math.PI * 2 - Math.PI / 2;
    return {
      id: `media:${item.id}`,
      position: {
        x: centerX + Math.cos(angle) * mediaRadius,
        y: centerY + Math.sin(angle) * mediaRadius
      },
      data: {
        id: item.id,
        kind: "media",
        label: item.title
      },
      className: selectedId === item.id ? "graphNode media selected" : "graphNode media"
    };
  });

  const tagNodes: Node[] = snapshot.tags.map((tag, index) => ({
    id: `tag:${tag.id}`,
    position: {
      x: 40 + (index % 2) * 180,
      y: 80 + index * 72
    },
    data: {
      id: tag.id,
      kind: "tag",
      label: `#${tag.name}`
    },
    className: "graphNode tag"
  }));

  const tagEdges: Edge[] = Object.entries(snapshot.mediaTags).flatMap(([mediaId, tags]) =>
    tags.map((tag) => ({
      id: `tag-edge:${mediaId}:${tag.id}`,
      source: `media:${mediaId}`,
      target: `tag:${tag.id}`,
      label: "tagged",
      className: "graphEdge tag"
    }))
  );

  const relationEdges: Edge[] = snapshot.relations.map((relation) => ({
    id: `relation:${relation.id}`,
    source: `media:${relation.fromId}`,
    target: `media:${relation.toId}`,
    label: relationTypeLabels[relation.type],
    animated: relation.type === "SIMILAR_TO",
    className: "graphEdge relation"
  }));

  return {
    nodes: [...mediaNodes, ...tagNodes],
    edges: [...tagEdges, ...relationEdges]
  };
}
