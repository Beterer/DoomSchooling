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
