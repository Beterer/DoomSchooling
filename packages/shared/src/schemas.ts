import { z } from 'zod';

export const PersonaRoleSchema = z.enum([
  'expert',
  'practitioner',
  'learner',
  'skeptic',
  'enthusiast',
]);

export const PostTypeSchema = z.enum(['text', 'code', 'image', 'divider']);

export const PersonaSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  handle: z.string(),
  role: PersonaRoleSchema,
  avatarColor: z.string(),
  avatarInitials: z.string().max(2),
});

export const PostSchema = z.object({
  id: z.string(),
  persona: PersonaSchema,
  content: z.string(),
  postType: PostTypeSchema,
  language: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  imageAlt: z.string().nullable().optional(),
  depth: z.number().int().min(0),
  parentId: z.string().nullable().optional(),
  votes: z.number().int(),
  timestamp: z.string(),
});

export const FeedRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  depth: z.enum(['surface', 'intermediate', 'deep']).optional(),
});

export const GeneratedFeedSchema = z.object({
  id: z.string(),
  topic: z.string(),
  topicTitle: z.string().max(50),
  posts: z.array(PostSchema),
  suggestedNextTopics: z.array(z.string()).min(4).max(6),
  generatedAt: z.string(),
});

export const ContinueFeedRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  depth: z.enum(['surface', 'intermediate', 'deep']).optional(),
  personas: z.array(PersonaSchema),
  lastPosts: z.array(PostSchema).min(1).max(5),
  postIdCounter: z.number().int().min(1),
});

export const FeedContinuationSchema = z.object({
  posts: z.array(PostSchema),
});

// --- /becuri: the lightbulb house call booking ---

export const BurntBulbCountSchema = z.enum(['1', '2', '3', 'many', 'all']);

export const BulbExtraSchema = z.enum([
  'ladder',
  'screwdriver',
  'snacks',
  'spare-bulbs',
  'hug',
  'flashlight',
]);

export const BulbBookingSchema = z.object({
  refusals: z.number().int().min(0).max(9999),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'date is not a real date'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be a real HH:MM'),
  burntBulbs: BurntBulbCountSchema,
  extras: z.array(BulbExtraSchema).max(6),
  message: z.string().max(500),
});

export const BulbBookingEntrySchema = BulbBookingSchema.extend({
  id: z.string(),
  receivedAt: z.string(),
});

export const BulbBookingReceiptSchema = z.object({
  id: z.string(),
  receivedAt: z.string(),
});
