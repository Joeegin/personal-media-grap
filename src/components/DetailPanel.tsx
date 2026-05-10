import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FolderOpen, Link2, Save, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { LibrarySnapshot, MediaDraft, MediaItem, RelationType } from "../domain/types";
import { MEDIA_STATUSES, MEDIA_TYPES, RELATION_TYPES } from "../domain/types";
import { mediaStatusLabels, mediaTypeLabels, relationTypeLabels } from "../domain/labels";
import { isTauri } from "@tauri-apps/api/core";
import { getIncomingRelations, getOutgoingRelations } from "../data/repository";
import { loadCoverSrc } from "../utils/cover";

interface DetailPanelProps {
  item: MediaItem | null;
  snapshot: LibrarySnapshot;
  onSave(draft: MediaDraft): Promise<void>;
  onDelete(id: string): Promise<void>;
  onSetTags(mediaId: string, tagNames: string[]): Promise<void>;
  onCreateRelation(fromId: string, toId: string, type: RelationType): Promise<void>;
  onDeleteRelation(id: string): Promise<void>;
}

const emptyDraft: MediaDraft = {
  title: "",
  creator: "",
  type: "movie",
  status: "planned",
  year: null,
  cover: "",
  sourceUrl: "",
  rating: null,
  review: ""
};

export function DetailPanel({
  item,
  snapshot,
  onSave,
  onDelete,
  onSetTags,
  onCreateRelation,
  onDeleteRelation
}: DetailPanelProps) {
  const [draft, setDraft] = useState<MediaDraft>(emptyDraft);
  const [tagText, setTagText] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState<RelationType>("SIMILAR_TO");
  const [preview, setPreview] = useState(true);
  const [coverError, setCoverError] = useState(false);
  const [coverPreviewSrc, setCoverPreviewSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCoverError(false);
    setCoverPreviewSrc("");

    if (!draft.cover) return;

    loadCoverSrc(draft.cover).then((src) => {
      if (!cancelled) setCoverPreviewSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.cover]);

  useEffect(() => {
    if (!item) {
      setDraft(emptyDraft);
      setTagText("");
      return;
    }

    setDraft({
      id: item.id,
      title: item.title,
      creator: item.creator,
      type: item.type,
      status: item.status,
      year: item.year,
      cover: item.cover,
      sourceUrl: item.sourceUrl,
      rating: item.rating,
      review: item.review
    });
    setTagText((snapshot.mediaTags[item.id] ?? []).map((tag) => tag.name).join(", "));
  }, [item, snapshot.mediaTags]);

  const relationRows = useMemo(() => {
    if (!item) {
      return [];
    }

    const byId = new Map(snapshot.mediaItems.map((media) => [media.id, media]));
    return [
      ...getOutgoingRelations(item.id, snapshot.relations).map((relation) => ({
        relation,
        direction: "to",
        peer: byId.get(relation.toId)
      })),
      ...getIncomingRelations(item.id, snapshot.relations).map((relation) => ({
        relation,
        direction: "from",
        peer: byId.get(relation.fromId)
      }))
    ];
  }, [item, snapshot.mediaItems, snapshot.relations]);

  if (!item) {
    return (
      <aside className="detailPanel empty">
        <h2>No item selected</h2>
        <p>Create or select media to edit metadata, tags, review, and graph relations.</p>
      </aside>
    );
  }

  async function handleChooseFile() {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp"] }]
    });
    if (!selected) return;

    const { invoke } = await import("@tauri-apps/api/core");
    const destPath = await invoke("save_cover_file", { source: selected });
    setDraft((prev) => ({ ...prev, cover: destPath as string }));
    setCoverError(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSave(draft);
    if (draft.id) {
      await onSetTags(
        draft.id,
        tagText.split(",").map((tag) => tag.trim())
      );
    }
  }

  async function handleAddRelation() {
    if (!draft.id || !targetId) {
      return;
    }
    await onCreateRelation(draft.id, targetId, relationType);
    setTargetId("");
  }

  return (
    <aside className="detailPanel">
      <form onSubmit={handleSubmit}>
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Selected media</p>
            <h2>{item.title}</h2>
          </div>
          <button type="button" className="iconButton danger" onClick={() => onDelete(item.id)}>
            <Trash2 size={16} />
          </button>
        </div>

        <label>
          Title
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            required
          />
        </label>

        <label>
          Creator
          <input
            value={draft.creator}
            onChange={(event) => setDraft({ ...draft, creator: event.target.value })}
          />
        </label>

        <div className="fieldGrid">
          <label>
            Type
            <select
              value={draft.type}
              onChange={(event) => setDraft({ ...draft, type: event.target.value as MediaDraft["type"] })}
            >
              {MEDIA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {mediaTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value as MediaDraft["status"] })
              }
            >
              {MEDIA_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {mediaStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="fieldGrid">
          <label>
            Year
            <div className="stepper">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft.year ?? ""}
                onChange={(event) => {
                  const raw = event.target.value.replace(/\D/g, "");
                  setDraft({
                    ...draft,
                    year: raw ? Number(raw) : null
                  });
                }}
              />
              <div className="stepperButtons">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      year: (draft.year ?? new Date().getFullYear()) + 1
                    })
                  }
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      year: (draft.year ?? new Date().getFullYear()) - 1
                    })
                  }
                >
                  <ChevronDown size={15} />
                </button>
              </div>
            </div>
          </label>
          <label>
            Rating
            <div className="stepper">
              <input
                type="text"
                inputMode="numeric"
                value={draft.rating ?? ""}
                readOnly
                placeholder="—"
              />
              <div className="stepperButtons">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      rating: Math.min(5, (draft.rating ?? 0) + 1)
                    })
                  }
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      rating: draft.rating ? (draft.rating > 1 ? draft.rating - 1 : null) : null
                    })
                  }
                >
                  <ChevronDown size={15} />
                </button>
              </div>
            </div>
          </label>
        </div>

        <label>
          Cover
          <div className="coverField">
            <input
              value={draft.cover}
              onChange={(event) => {
                setDraft({ ...draft, cover: event.target.value });
                setCoverError(false);
              }}
              placeholder="Paste a URL or choose a file"
            />
            {isTauri() ? (
              <button type="button" onClick={handleChooseFile}>
                <FolderOpen size={15} />
                Choose file
              </button>
            ) : null}
          </div>
          {coverPreviewSrc && !coverError ? (
            <div className="coverPreview">
              <img
                src={coverPreviewSrc}
                alt=""
                onError={() => setCoverError(true)}
              />
            </div>
          ) : null}
        </label>

        <label>
          Source URL
          <div className="inlineInput">
            <input
              value={draft.sourceUrl}
              onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })}
            />
            {draft.sourceUrl ? (
              <a href={draft.sourceUrl} target="_blank" rel="noreferrer" aria-label="Open source URL">
                <ExternalLink size={16} />
              </a>
            ) : null}
          </div>
        </label>

        <label>
          Tags
          <input value={tagText} onChange={(event) => setTagText(event.target.value)} />
        </label>

        <div className="reviewHeader">
          <span>Review</span>
          <button type="button" onClick={() => setPreview((value) => !value)}>
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="markdownPreview">
            <ReactMarkdown>{draft.review || "_No notes yet._"}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={draft.review}
            onChange={(event) => setDraft({ ...draft, review: event.target.value })}
            rows={8}
          />
        )}

        <button className="saveButton" type="submit">
          <Save size={16} />
          Save changes
        </button>
      </form>

      <section className="relationsEditor">
        <div className="sectionTitle">
          <Link2 size={15} />
          Relations
        </div>
        <div className="relationComposer">
          <select value={relationType} onChange={(event) => setRelationType(event.target.value as RelationType)}>
            {RELATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {relationTypeLabels[type]}
              </option>
            ))}
          </select>
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            <option value="">Target media</option>
            {snapshot.mediaItems
              .filter((media) => media.id !== item.id)
              .map((media) => (
                <option key={media.id} value={media.id}>
                  {media.title}
                </option>
              ))}
          </select>
          <button type="button" onClick={handleAddRelation}>
            Add
          </button>
        </div>
        <div className="relationList">
          {relationRows.length === 0 ? <p>No relations yet.</p> : null}
          {relationRows.map(({ relation, direction, peer }) => (
            <div key={relation.id} className="relationItem">
              <span>
                {direction === "to" ? "To" : "From"} {peer?.title ?? "Missing media"} ·{" "}
                {relationTypeLabels[relation.type]}
              </span>
              <button onClick={() => onDeleteRelation(relation.id)} aria-label="Delete relation">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
