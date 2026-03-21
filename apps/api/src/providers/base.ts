import type { FeedRequest } from '@doomschooling/shared';

/**
 * Shared utilities for building prompts and common provider logic.
 * Providers call helpers from here rather than constructing prompts themselves.
 */

const SENSITIVE_TOPIC_KEYWORDS = [
  'medical',
  'medicine',
  'diagnosis',
  'legal',
  'lawsuit',
  'financial advice',
  'investing',
  'vaccine',
  'suicide',
  'self-harm',
  'politics',
  'election',
  'abortion',
  'gun control',
];

export function isSensitiveTopic(topic: string): boolean {
  const lower = topic.toLowerCase();
  return SENSITIVE_TOPIC_KEYWORDS.some((kw) => lower.includes(kw));
}

export function getSensitiveTopicDisclaimer(topic: string): string {
  return (
    `⚠️ **Disclaimer:** The following discussion about "${topic}" is for ` +
    `educational purposes only. It does not constitute professional medical, ` +
    `legal, or financial advice. Always consult a qualified professional.`
  );
}

export function buildFeedPrompt(request: FeedRequest): string {
  const depthInstruction =
    request.depth === 'surface'
      ? 'Keep explanations brief and accessible. Avoid jargon.'
      : request.depth === 'deep'
        ? 'Go deep. Include nuance, edge cases, and expert-level detail.'
        : 'Balance accessibility with substance. Intermediate level.';

  const sensitiveNote = isSensitiveTopic(request.topic)
    ? `IMPORTANT: This topic may be sensitive. Include a disclaimer post at the top of the feed reminding readers this is educational content only, not professional advice.\n\n`
    : '';

  return `${sensitiveNote}You are generating a social media learning feed about: "${request.topic}"

${depthInstruction}

Generate a JSON object matching the GeneratedFeed schema. Requirements:
- Include 12–18 posts total
- Use ALL FIVE persona roles: expert, practitioner, learner, skeptic, enthusiast
- Interleave persona roles — do NOT cluster all expert posts together
- Include thread depth: some posts should be replies (depth 1 or 2) to earlier posts
- Include at least one code block post (postType: "code") if the topic involves code or commands
- Include at least one divider post (postType: "divider") to separate major sections
- Votes and timestamps are cosmetic — seed realistic-looking values
- suggestedNextTopics: provide exactly 5 follow-up topic strings

Persona naming convention for this topic:
- expert: a credentialed authority in the field
- practitioner: someone who applies this knowledge day-to-day
- learner: a curious newcomer asking the questions the reader is thinking
- skeptic: someone who challenges assumptions and adds nuance
- enthusiast: someone with infectious energy who uses analogies and wonder

Return only valid JSON. No markdown fences, no commentary.`;
}
