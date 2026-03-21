import type { FeedRequest, ContinueFeedRequest } from '@doomschooling/shared';
import { isSensitiveTopic } from '../providers/base.js';

/**
 * Builds the full system + user prompt pair for feed generation.
 * All providers use this — prompt logic never lives inside a provider.
 */

const SCHEMA_EXAMPLE = `{
  "id": "<unique-string>",
  "topic": "<the requested topic>",
  "posts": [
    {
      "id": "post-01",
      "persona": {
        "id": "persona-expert",
        "displayName": "Dr. Example",
        "handle": "@dr_example",
        "role": "expert",
        "avatarColor": "#4F46E5",
        "avatarInitials": "DE"
      },
      "content": "Markdown content here...",
      "postType": "text",
      "depth": 0,
      "parentId": null,
      "votes": 142,
      "timestamp": "4h ago"
    }
  ],
  "suggestedNextTopics": ["Topic A", "Topic B", "Topic C", "Topic D", "Topic E"],
  "generatedAt": "<ISO 8601 datetime>"
}`;

export function buildFeedSystemPrompt(): string {
  return `You are a social media feed generator for an educational platform called DoomSchooling.
Your job is to create a realistic-looking social media thread that teaches people about any topic — history, science, cooking, art, coding, philosophy, anything.

The feed should feel like scrolling Reddit or Twitter/X: multiple distinct personas discussing, debating, explaining, and riffing on the topic.

You MUST respond with a single valid JSON object — no markdown fences, no commentary, no text before or after the JSON.

The JSON must conform to this schema:
${SCHEMA_EXAMPLE}

Rules for the JSON:
- "id" fields must be unique strings (e.g. "post-01", "post-02", etc. for posts; "persona-expert", "persona-practitioner", etc. for personas)
- "postType" must be one of: "text", "code", "image", "divider"
- "role" must be one of: "expert", "practitioner", "learner", "skeptic", "enthusiast"
- "depth" is an integer >= 0. Top-level posts have depth 0. Replies have depth 1, replies-to-replies have depth 2. Do not exceed depth 3.
- "parentId" must reference the "id" of the post being replied to (null for depth-0 posts)
- "votes" are cosmetic integers — use realistic-looking values (10–400 range)
- "timestamp" is a cosmetic relative string like "4h ago", "2h ago", "45m ago" — posts should appear chronologically ordered
- "avatarColor" must be a valid hex color string (e.g. "#4F46E5")
- "avatarInitials" must be 1-2 uppercase characters
- "handle" must start with @ and use snake_case
- "content" supports markdown formatting
- "language" field is required when postType is "code" (e.g. "javascript", "python", "bash")
- IMPORTANT: postType "code" is ONLY for real, runnable source code relevant to the topic. Never use "code" to present pseudocode, metaphors, analogies, or non-technical concepts in code-like syntax. If the topic is not about programming or software, do not use postType "code" at all
- For posts with postType "image": set "imageAlt" to a detailed description of the image to generate (this will be used to create the image). Set "imageUrl" to null — it will be populated automatically after generation. The "content" field should contain the text that accompanies the image.
- "suggestedNextTopics" must contain exactly 5 strings — follow-up topics the reader might want to explore next
- "generatedAt" must be a valid ISO 8601 datetime string`;
}

export function buildFeedUserPrompt(request: FeedRequest): string {
  const depthInstruction =
    request.depth === 'surface'
      ? 'Keep explanations brief, approachable, and jargon-free. Aim for someone encountering this topic for the first time.'
      : request.depth === 'deep'
        ? 'Go deep. Include nuance, edge cases, expert-level detail, and primary sources where appropriate.'
        : 'Balance accessibility with substance. Assume the reader has basic familiarity but wants to learn more.';

  const sensitiveNote = isSensitiveTopic(request.topic)
    ? `IMPORTANT: This topic may be sensitive. The FIRST post in the feed must be a disclaimer (postType: "text", depth: 0) reminding readers this is educational content only, not professional medical, legal, or financial advice.\n\n`
    : '';

  return `${sensitiveNote}Generate a social media learning feed about: "${request.topic}"

Depth level: ${request.depth ?? 'intermediate'}
${depthInstruction}

Requirements:
1. Generate 12–18 posts total
2. Use ALL FIVE persona roles — every role must appear at least twice:
   - expert: a credentialed authority (gives definitions, context, citations)
   - practitioner: someone who applies this knowledge day-to-day (real-world examples)
   - learner: a curious newcomer (asks the questions the reader is thinking)
   - skeptic: challenges assumptions (adds nuance, flags caveats)
   - enthusiast: infectious energy (analogies, wonder, "here's the wild part")
3. Give each persona a topic-appropriate display name, handle, and avatar. Names should feel natural for the domain — not generic.
4. INTERLEAVE persona roles throughout the feed — do NOT cluster all expert posts at the top
5. Include realistic threading:
   - Several top-level posts (depth 0) introducing different subtopics
   - Replies (depth 1) that respond to or build on top-level posts
   - Some deeper replies (depth 2) for back-and-forth exchanges
   - Use parentId correctly to build reply chains
6. Include at least one divider post (postType: "divider") to separate major sections of the discussion
7. Only use postType "code" if the topic is specifically about programming, software, or a technical tool that involves actual code syntax. For non-technical topics (history, cooking, art, science, etc.), do NOT include code posts
8. Include 2 posts with postType "image" where a visual would enhance understanding. The imageAlt field should describe the image in detail (e.g. "A diagram showing the layers of Earth's atmosphere with temperature gradients"). The content field should contain the post text that accompanies the image
9. suggestedNextTopics: exactly 5 related topics the reader might want to explore next

Return ONLY the JSON object. No other text.`;
}

export function buildContinueFeedUserPrompt(request: ContinueFeedRequest): string {
  const depthInstruction =
    request.depth === 'surface'
      ? 'Keep explanations brief, approachable, and jargon-free.'
      : request.depth === 'deep'
        ? 'Go deep. Include nuance, edge cases, and expert-level detail.'
        : 'Balance accessibility with substance. Intermediate level.';

  const personaSummary = request.personas
    .map((p) => `- ${p.displayName} (${p.handle}), role: ${p.role}, id: "${p.id}", avatarColor: "${p.avatarColor}", avatarInitials: "${p.avatarInitials}"`)
    .join('\n');

  const recentContext = request.lastPosts
    .map((p) => `[${p.persona.handle}] (post id: "${p.id}", depth: ${p.depth}): ${p.content.slice(0, 200)}`)
    .join('\n');

  const startId = request.postIdCounter;

  return `Continue the social media learning feed about: "${request.topic}"

${depthInstruction}

These are the existing personas — you MUST reuse them exactly (same id, displayName, handle, role, avatarColor, avatarInitials):
${personaSummary}

Here are the most recent posts for context (continue the discussion naturally from here):
${recentContext}

Requirements:
1. Generate 6–10 NEW posts that continue the discussion
2. Use the SAME personas listed above — do not create new ones
3. Explore new subtopics or go deeper on what was being discussed
4. Continue interleaving persona roles
5. Post IDs must start from "post-${String(startId).padStart(2, '0')}" and increment
6. Include a mix of depths — some top-level posts (depth 0) and some replies to previous or new posts
7. Do NOT repeat content from the recent posts shown above
8. Only use postType "code" if the topic is specifically about programming, software, or a technical tool that involves actual code syntax. For non-technical topics (history, cooking, art, science, etc.), do NOT include code posts — use "text" instead

Return ONLY a JSON object with a single "posts" array. No other fields. No other text.`;
}
