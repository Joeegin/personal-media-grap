import type { MediaDraft } from "../domain/types";

export const demoMedia: MediaDraft[] = [
  {
    title: "Perfect Blue",
    creator: "Satoshi Kon",
    type: "anime",
    status: "completed",
    year: 1997,
    cover: "",
    sourceUrl: "https://www.imdb.com/title/tt0156887/",
    rating: 5,
    review: "A compact psychological thriller with sharp identity fractures."
  },
  {
    title: "Norwegian Wood",
    creator: "Haruki Murakami",
    type: "book",
    status: "completed",
    year: 1987,
    cover: "",
    sourceUrl: "",
    rating: 4,
    review: "A quiet memory piece. Useful tag anchors: grief, youth, Tokyo."
  },
  {
    title: "Severance",
    creator: "Dan Erickson",
    type: "series",
    status: "watching",
    year: 2022,
    cover: "",
    sourceUrl: "https://tv.apple.com/",
    rating: 5,
    review: "Workplace science fiction with clean visual grammar."
  }
];

export const demoTags: Record<string, string[]> = {
  "Perfect Blue": ["identity", "psychological", "animation"],
  "Norwegian Wood": ["memory", "literature"],
  Severance: ["work", "science fiction", "systems"]
};
