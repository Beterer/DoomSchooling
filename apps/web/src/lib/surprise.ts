const RECENT_SURPRISES_KEY = 'doomschooling:surprise-topics:v1';
const MAX_RECENT_SURPRISES = 15;

function normalizeTopic(topic: string) {
  return topic.trim().toLocaleLowerCase();
}

/** Recent surprise topics, newest first, so the next pick can skip them. */
export function loadRecentSurpriseTopics(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(RECENT_SURPRISES_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((topic): topic is string => typeof topic === 'string' && topic.trim().length > 0)
      .slice(0, MAX_RECENT_SURPRISES);
  } catch {
    return [];
  }
}

export function rememberSurpriseTopic(topic: string): void {
  const recent = loadRecentSurpriseTopics().filter(
    (recentTopic) => normalizeTopic(recentTopic) !== normalizeTopic(topic),
  );

  try {
    localStorage.setItem(
      RECENT_SURPRISES_KEY,
      JSON.stringify([topic, ...recent].slice(0, MAX_RECENT_SURPRISES)),
    );
  } catch {
    // Storage can be full or blocked. Repeats are harmless, so skip remembering.
  }
}

/** Picks a random topic from the local pool, skipping ones the reader has just seen when possible. */
export function pickFallbackTopic(
  pool: readonly string[],
  avoidTopics: readonly string[],
  random: () => number = Math.random,
): string {
  const avoid = new Set(avoidTopics.map(normalizeTopic));
  const fresh = pool.filter((topic) => !avoid.has(normalizeTopic(topic)));
  const choices = fresh.length > 0 ? fresh : pool;
  const index = Math.min(Math.floor(random() * choices.length), choices.length - 1);
  const topic = choices[index];
  if (topic === undefined) throw new Error('Cannot pick a surprise topic from an empty pool');
  return topic;
}
