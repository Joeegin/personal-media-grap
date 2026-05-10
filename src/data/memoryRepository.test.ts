import { describe, expect, it } from "vitest";
import { MemoryMediaRepository } from "./memoryRepository";

describe("MemoryMediaRepository", () => {
  it("creates media records and tags", async () => {
    const repo = new MemoryMediaRepository();
    await repo.initialize();

    const mediaId = await repo.saveMedia({
      title: "Arrival",
      creator: "Denis Villeneuve",
      type: "movie",
      status: "completed",
      year: 2016,
      cover: "",
      sourceUrl: "",
      rating: 5,
      review: "Language, memory, and time."
    });
    await repo.setMediaTags(mediaId, ["science fiction", "language", "science fiction"]);

    const snapshot = await repo.listLibrary();
    expect(snapshot.mediaItems).toHaveLength(1);
    expect(snapshot.mediaTags[mediaId].map((tag) => tag.name)).toEqual([
      "language",
      "science fiction"
    ]);
  });

  it("deduplicates and deletes relations when media is removed", async () => {
    const repo = new MemoryMediaRepository();
    await repo.initialize();
    const first = await repo.saveMedia({
      title: "Book",
      creator: "",
      type: "book",
      status: "planned",
      year: null,
      cover: "",
      sourceUrl: "",
      rating: null,
      review: ""
    });
    const second = await repo.saveMedia({
      title: "Film",
      creator: "",
      type: "movie",
      status: "planned",
      year: null,
      cover: "",
      sourceUrl: "",
      rating: null,
      review: ""
    });

    await repo.createRelation({ fromId: first, toId: second, type: "ADAPTATION_OF" });
    await repo.createRelation({ fromId: first, toId: second, type: "ADAPTATION_OF" });
    expect((await repo.listLibrary()).relations).toHaveLength(1);

    await repo.deleteMedia(second);
    expect((await repo.listLibrary()).relations).toHaveLength(0);
  });
});
