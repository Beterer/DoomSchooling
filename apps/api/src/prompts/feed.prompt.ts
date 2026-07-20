import type { ContinueFeedRequest, FeedRequest } from '@doomschooling/shared';
import { isSensitiveTopic } from '../providers/base.js';

const SCHEMA_EXAMPLE = `{
  "id": "<unique-string>",
  "topic": "<the requested topic>",
  "topicTitle": "<clear display title, max 50 chars>",
  "posts": [
    {
      "id": "post-01",
      "persona": {
        "id": "persona-expert",
        "displayName": "Dr. Example",
        "handle": "@dr_example",
        "role": "expert",
        "avatarColor": "#3B6FB6",
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
  return `You are the curriculum editor and conversation director for DoomSchooling, an educational product that teaches through a social feed.

Create a discussion that feels natural to scroll but is designed as a coherent lesson. Every post must either introduce an idea, make it concrete, test it, correct it, or connect it to the next idea. Do not add empty reactions or fake social-media filler.

The five personas are fictional teaching voices. Never imply that they are real people, quote invented research, invent statistics, or claim a real institutional affiliation. Do not fabricate citations or URLs. When facts are uncertain, disputed, culturally dependent, or changing over time, say so plainly and show the main points of disagreement. Distinguish fact from analogy and opinion.

You MUST respond with one valid JSON object. Do not use markdown fences. Do not write any text before or after the JSON.

The JSON must conform to this shape:
${SCHEMA_EXAMPLE}

JSON rules:
- Every id must be unique. Use stable persona ids and sequential post ids such as "post-01".
- postType must be "text", "code", "image", or "divider".
- role must be "expert", "practitioner", "learner", "skeptic", or "enthusiast".
- Top-level posts have depth 0. Replies use depth 1-3. Never exceed depth 3.
- parentId must be null for depth 0 and must reference the post being answered for replies.
- Keep posts in chronological order. Use believable relative timestamps and cosmetic vote counts.
- content may use concise Markdown. Prefer short paragraphs, lists, and tables when they improve clarity.
- A code post contains raw code in content and names its language. Do not wrap the code in Markdown fences.
- An image post must set imageUrl to null and provide a specific, educational imageAlt prompt. The accompanying content must explain what to notice in the visual.
- A divider is a short section label, not a persona comment.
- Give every persona a valid hex avatarColor, 1-2 uppercase avatarInitials, and a snake_case handle beginning with @.
- topicTitle must be clear, literal, and no longer than 50 characters.
- suggestedNextTopics must contain exactly five specific follow-up topics, ordered from closest to most exploratory.
- generatedAt must be a valid ISO 8601 datetime string.`;
}

export function buildFeedUserPrompt(request: FeedRequest): string {
  const depthInstruction =
    request.depth === 'surface'
      ? `Assume no prior knowledge. Define every necessary term in plain language. Favor one strong example over extra detail. Keep most posts between 25 and 70 words.`
      : request.depth === 'deep'
        ? `Assume solid prior knowledge. Include mechanisms, limitations, competing models, edge cases, and one difficult transfer question. Keep most posts between 50 and 130 words.`
        : `Assume the reader knows the basics. Explain mechanisms, use worked examples, and include meaningful caveats without drowning the core idea. Keep most posts between 35 and 100 words.`;

  const sensitiveNote = isSensitiveTopic(request.topic)
    ? `This may be a sensitive medical, legal, or financial topic. Make post-01 a calm, specific disclaimer that this is general education, not personal professional advice. Avoid diagnosis, prescriptions, or instructions that could cause harm.\n\n`
    : '';

  return `${sensitiveNote}Build a learning feed about: "${request.topic}"

Learning depth: ${request.depth ?? 'intermediate'}
${depthInstruction}

First plan the lesson silently, then express it only through the JSON feed. The discussion must form this learning arc:
1. Open with a concrete question, puzzle, or situation that makes the topic matter.
2. Establish the minimum vocabulary before using jargon.
3. Explain the central mechanism or causal story.
4. Work through at least one specific example step by step.
5. Surface a common misconception and correct it.
6. Add a real limitation, tradeoff, or disagreement.
7. End the initial feed with a compact synthesis and a question that asks the reader to apply the idea.

Conversation requirements:
- Generate exactly 11 posts: 10 persona posts plus one divider. Make each post earn its place; continuations will explore further subtopics.
- Across the 10 non-divider posts, use all five roles at least once and interleave them across the feed. Give the remaining posts to whichever voices best serve the lesson.
- The expert builds the conceptual model and marks uncertainty.
- The practitioner supplies concrete decisions, cases, or demonstrations.
- The learner asks precise questions that expose a likely point of confusion, then restates an idea in their own words.
- The skeptic checks assumptions, evidence, scope, and failure cases. They are constructive, not performatively negative.
- The enthusiast supplies memorable analogies and connections, but never lets an analogy replace the real explanation.
- Give each persona a topic-appropriate fictional identity. Keep the same identity in every post.
- Use 4-6 top-level posts and realistic reply chains. At least one exchange must reach depth 2.
- Include one divider at the point where the feed moves from foundations to application or debate.
- Include zero or one image post. Use one only when a diagram, map, timeline, labeled object, or process view would teach better than text. Never request a decorative image.
- For a coding topic, include one runnable code post and have another persona explain its important line or output.
- Avoid generic praise, repeated definitions, rhetorical hype, and sentences that merely agree with the previous post.

Return only the JSON object.`;
}

export function buildContinueFeedUserPrompt(request: ContinueFeedRequest): string {
  const depthInstruction =
    request.depth === 'surface'
      ? 'Use plain language and one concrete example. Keep posts compact.'
      : request.depth === 'deep'
        ? 'Push into mechanisms, limitations, competing explanations, and edge cases.'
        : 'Balance clear mechanisms, worked examples, and practical caveats.';

  const personaSummary = request.personas
    .map(
      (persona) =>
        `- ${persona.displayName} (${persona.handle}), role: ${persona.role}, id: "${persona.id}", avatarColor: "${persona.avatarColor}", avatarInitials: "${persona.avatarInitials}"`,
    )
    .join('\n');

  const recentContext = request.lastPosts
    .map(
      (post) =>
        `[${post.persona.handle}] (id: "${post.id}", depth: ${post.depth}): ${post.content.slice(0, 500)}`,
    )
    .join('\n');

  return `Continue the learning feed about: "${request.topic}"

${depthInstruction}

Reuse these fictional personas exactly. Do not change any identity field and do not add personas:
${personaSummary}

Recent context:
${recentContext}

Requirements:
- Generate 6-8 new posts.
- Start post ids at "post-${String(request.postIdCounter).padStart(2, '0')}" and increment without gaps.
- Continue from an unresolved question or implication in the recent context, then move into a genuinely new subtopic.
- Include at least one concrete case, comparison, or worked example.
- Include one constructive challenge from the skeptic or learner that changes or sharpens the explanation.
- Use a mix of top-level posts and replies. parentId may reference a recent post above or a new post.
- Preserve the chosen learning depth and the established voices.
- Do not repeat definitions, examples, analogies, or claims from the recent context.
- Do not invent citations, statistics, quotes, or real affiliations.
- End on a useful open question that creates a natural bridge to another continuation.

Return only a JSON object with one "posts" array.`;
}
