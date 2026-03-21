export type PostType = 'text' | 'code' | 'image' | 'divider';

export type PersonaRole =
  | 'expert'
  | 'practitioner'
  | 'learner'
  | 'skeptic'
  | 'enthusiast';

export interface Persona {
  id: string;
  displayName: string;
  handle: string;
  role: PersonaRole;
  avatarColor: string;
  avatarInitials: string;
}

export interface Post {
  id: string;
  persona: Persona;
  content: string;
  postType: PostType;
  language?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  depth: number;
  parentId?: string | null;
  votes: number;
  timestamp: string;
}

export interface FeedRequest {
  topic: string;
  depth?: 'surface' | 'intermediate' | 'deep';
}

export interface GeneratedFeed {
  id: string;
  topic: string;
  posts: Post[];
  suggestedNextTopics: string[];
  generatedAt: string;
}
