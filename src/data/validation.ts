import { z } from "zod";
import { MEDIA_STATUSES, MEDIA_TYPES, RELATION_TYPES } from "../domain/types";

const currentYear = new Date().getFullYear();

export const mediaDraftSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required").max(180),
  creator: z.string().trim().max(180).default(""),
  type: z.enum(MEDIA_TYPES),
  status: z.enum(MEDIA_STATUSES),
  year: z
    .number()
    .int()
    .min(1800)
    .max(currentYear + 5)
    .nullable(),
  cover: z.string().trim().max(1000).default(""),
  sourceUrl: z.string().trim().max(1000).default(""),
  rating: z.number().int().min(1).max(5).nullable(),
  review: z.string().max(20000).default("")
});

export const relationInputSchema = z
  .object({
    fromId: z.string().min(1),
    toId: z.string().min(1),
    type: z.enum(RELATION_TYPES)
  })
  .refine((value) => value.fromId !== value.toId, {
    message: "A media item cannot relate to itself",
    path: ["toId"]
  });
