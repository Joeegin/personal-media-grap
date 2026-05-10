import type { MediaStatus, MediaType, RelationType } from "./types";

export const mediaTypeLabels: Record<MediaType, string> = {
  movie: "Movie",
  book: "Book",
  anime: "Anime",
  series: "Series",
  comic: "Comic",
  game: "Game",
  podcast: "Podcast",
  other: "Other"
};

export const mediaStatusLabels: Record<MediaStatus, string> = {
  planned: "Want",
  watching: "Active",
  completed: "Done",
  dropped: "Dropped"
};

export const relationTypeLabels: Record<RelationType, string> = {
  SIMILAR_TO: "Similar to",
  ADAPTATION_OF: "Adaptation of",
  SAME_CREATOR: "Same creator",
  PART_OF_SERIES: "Part of series"
};
