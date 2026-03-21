import type { z } from 'zod';
import type {
  PersonaRoleSchema,
  PostTypeSchema,
  PersonaSchema,
  PostSchema,
  FeedRequestSchema,
  GeneratedFeedSchema,
} from './schemas.js';

// Derive all types from Zod schemas — single source of truth.
// Never write a type here that has a corresponding schema; use z.infer instead.

export type PersonaRole = z.infer<typeof PersonaRoleSchema>;
export type PostType = z.infer<typeof PostTypeSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type Post = z.infer<typeof PostSchema>;
export type FeedRequest = z.infer<typeof FeedRequestSchema>;
export type GeneratedFeed = z.infer<typeof GeneratedFeedSchema>;
