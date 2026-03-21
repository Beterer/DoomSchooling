import { type ILLMProvider, type FeedRequest, type GeneratedFeed, type Post, GeneratedFeedSchema } from '@doomschooling/shared';

/**
 * Returns a hardcoded GeneratedFeed for UI development and CI environments.
 * The feed is always about "JavaScript Closures" regardless of the request topic,
 * but the returned id/topic/generatedAt fields reflect the actual request.
 *
 * Exercises all UI states:
 *   - All five persona roles
 *   - Thread depths 0, 1, 2, and 3
 *   - A code block post
 *   - A long text post
 *   - A divider post
 *   - 5 suggested next topics
 */
export class MockProvider implements ILLMProvider {
  readonly supportsImageGeneration = false;
  readonly providerName = 'mock';

  async generateFeed(request: FeedRequest): Promise<GeneratedFeed> {
    const feed = buildMockFeed(request);
    // Always validate our own output — catch schema drift early.
    return GeneratedFeedSchema.parse(feed);
  }

  async generateImage(_prompt: string): Promise<Buffer | null> {
    return null;
  }
}

function buildMockFeed(request: FeedRequest): GeneratedFeed {
  const topic = request.topic;

  const personas = {
    expert: {
      id: 'persona-expert',
      displayName: 'Dr. Scope',
      handle: '@dr_scope',
      role: 'expert' as const,
      avatarColor: '#4F46E5',
      avatarInitials: 'DS',
    },
    practitioner: {
      id: 'persona-practitioner',
      displayName: 'Senior Dev',
      handle: '@senior_dev',
      role: 'practitioner' as const,
      avatarColor: '#0891B2',
      avatarInitials: 'SD',
    },
    learner: {
      id: 'persona-learner',
      displayName: 'CodeNewbie',
      handle: '@code_newbie',
      role: 'learner' as const,
      avatarColor: '#16A34A',
      avatarInitials: 'CN',
    },
    skeptic: {
      id: 'persona-skeptic',
      displayName: 'EdgeCaser',
      handle: '@edge_caser',
      role: 'skeptic' as const,
      avatarColor: '#DC2626',
      avatarInitials: 'EC',
    },
    enthusiast: {
      id: 'persona-enthusiast',
      displayName: 'JS Wizard',
      handle: '@js_wizard',
      role: 'enthusiast' as const,
      avatarColor: '#D97706',
      avatarInitials: 'JW',
    },
  } as const;

  const posts: Post[] = [
    // ── Top-level: expert opens the thread ──────────────────────────────
    {
      id: 'post-01',
      persona: personas.expert,
      postType: 'text' as const,
      content:
        `## What is a Closure?\n\n` +
        `A **closure** is a function that retains access to the variables of its ` +
        `enclosing lexical scope even after that scope has finished executing.\n\n` +
        `In JavaScript, every function forms a closure over the scope in which it ` +
        `was defined. The function "closes over" the variables it references — ` +
        `those variables are kept alive in memory as long as the function itself ` +
        `is reachable.\n\n` +
        `This is not a quirk. It's a fundamental property of first-class functions ` +
        `in languages with lexical scoping.`,
      depth: 0,
      parentId: null,
      votes: 312,
      timestamp: '4h ago',
    },

    // ── Depth 1: learner replies to expert ──────────────────────────────
    {
      id: 'post-02',
      persona: personas.learner,
      postType: 'text' as const,
      content:
        `Wait, "lexical scope" — can you unpack that? I keep hearing it but ` +
        `I'm not sure I fully get what makes a scope "lexical" vs anything else.`,
      depth: 1,
      parentId: 'post-01',
      votes: 88,
      timestamp: '4h ago',
    },

    // ── Depth 2: expert replies to learner ──────────────────────────────
    {
      id: 'post-03',
      persona: personas.expert,
      postType: 'text' as const,
      content:
        `Great question. **Lexical** means "based on where the code is written," ` +
        `not where or when it's called.\n\n` +
        `If a function is written inside another function, it gets access to that ` +
        `outer function's variables — full stop. Doesn't matter how or from where ` +
        `the inner function is eventually invoked. The scope is determined at ` +
        `*author time*, not *runtime*.`,
      depth: 2,
      parentId: 'post-02',
      votes: 74,
      timestamp: '3h ago',
    },

    // ── Depth 3: enthusiast piles on ────────────────────────────────────
    {
      id: 'post-04',
      persona: personas.enthusiast,
      postType: 'text' as const,
      content:
        `Okay think of it like a **backpack**. 🎒\n\n` +
        `When a function is born, JavaScript packs up all the variables in its ` +
        `surrounding scope and straps that backpack to the function. Wherever ` +
        `the function travels — passed as a callback, returned from another ` +
        `function, stored in an array — its backpack comes with it.\n\n` +
        `The backpack *is* the closure.`,
      depth: 3,
      parentId: 'post-03',
      votes: 201,
      timestamp: '3h ago',
    },

    // ── Divider ─────────────────────────────────────────────────────────
    {
      id: 'post-05',
      persona: personas.expert,
      postType: 'divider' as const,
      content: 'Closures in Practice',
      depth: 0,
      parentId: null,
      votes: 0,
      timestamp: '3h ago',
    },

    // ── Top-level: practitioner with real-world use case ────────────────
    {
      id: 'post-06',
      persona: personas.practitioner,
      postType: 'text' as const,
      content:
        `The pattern I use closures for most day-to-day is **function factories** ` +
        `— functions that return customized functions.\n\n` +
        `A classic example: creating multiple validators that each close over a ` +
        `different threshold value. You write the logic once and stamp out ` +
        `specialized versions without repeating yourself.`,
      depth: 0,
      parentId: null,
      votes: 145,
      timestamp: '3h ago',
    },

    // ── Depth 1: code block under practitioner ──────────────────────────
    {
      id: 'post-07',
      persona: personas.practitioner,
      postType: 'code' as const,
      language: 'javascript',
      content:
        `// Function factory — each validator closes over its own \`min\` value\n` +
        `function makeMinValidator(min) {\n` +
        `  return function validate(value) {\n` +
        `    return value >= min\n` +
        `      ? { ok: true }\n` +
        `      : { ok: false, message: \`Must be at least \${min}\` };\n` +
        `  };\n` +
        `}\n\n` +
        `const validateAge   = makeMinValidator(18);\n` +
        `const validateScore = makeMinValidator(0);\n\n` +
        `validateAge(21);    // { ok: true }\n` +
        `validateAge(16);    // { ok: false, message: 'Must be at least 18' }\n` +
        `validateScore(-5);  // { ok: false, message: 'Must be at least 0' }`,
      depth: 1,
      parentId: 'post-06',
      votes: 189,
      timestamp: '2h ago',
    },

    // ── Depth 2: learner asks about the code ────────────────────────────
    {
      id: 'post-08',
      persona: personas.learner,
      postType: 'text' as const,
      content:
        `Oh! So \`min\` is captured in the closure each time \`makeMinValidator\` ` +
        `runs, and the returned \`validate\` function remembers *its own* \`min\`? ` +
        `Each call to \`makeMinValidator\` creates a brand new, independent closure?`,
      depth: 2,
      parentId: 'post-07',
      votes: 56,
      timestamp: '2h ago',
    },

    // ── Depth 2: practitioner confirms ──────────────────────────────────
    {
      id: 'post-09',
      persona: personas.practitioner,
      postType: 'text' as const,
      content:
        `Exactly right. Each invocation of the outer function creates a fresh ` +
        `scope — and therefore a fresh closure. \`validateAge\` and \`validateScore\` ` +
        `are completely independent. Changing one won't affect the other.`,
      depth: 2,
      parentId: 'post-07',
      votes: 92,
      timestamp: '2h ago',
    },

    // ── Top-level: skeptic challenges ───────────────────────────────────
    {
      id: 'post-10',
      persona: personas.skeptic,
      postType: 'text' as const,
      content:
        `Worth flagging: closures are a common source of **memory leaks** in ` +
        `long-lived applications.\n\n` +
        `If a closure captures a large object, that object stays in memory for ` +
        `as long as the closure is reachable. Event listeners are the classic ` +
        `trap — attach a listener that closes over a DOM node or component state, ` +
        `forget to remove it, and you've got a leak.\n\n` +
        `Closures are powerful but not free.`,
      depth: 0,
      parentId: null,
      votes: 134,
      timestamp: '2h ago',
    },

    // ── Depth 1: expert adds nuance ─────────────────────────────────────
    {
      id: 'post-11',
      persona: personas.expert,
      postType: 'text' as const,
      content:
        `This is correct and worth taking seriously. The fix is usually simple — ` +
        `store only what you need, not the whole parent scope. Or use a WeakRef ` +
        `if the captured value should be GC-eligible.\n\n` +
        `Modern JS engines are quite good at garbage-collecting unreachable ` +
        `closures, but "unreachable" is the key word. Lingering event listeners ` +
        `or global caches that hold references will keep closures — and their ` +
        `captured values — alive indefinitely.`,
      depth: 1,
      parentId: 'post-10',
      votes: 107,
      timestamp: '1h ago',
    },

    // ── Depth 1: enthusiast with a long analogy post ─────────────────────
    {
      id: 'post-12',
      persona: personas.enthusiast,
      postType: 'text' as const,
      content:
        `Okay so to extend the backpack analogy — yes, the backpack is amazing ` +
        `and you should use it. BUT. If you shove a whole *sofa* in the backpack ` +
        `and then leave the backpack in a room forever, that sofa is never getting ` +
        `garbage collected. The room is stuck with a sofa-filled backpack until ` +
        `something explicitly lets go of it.\n\n` +
        `The lesson: pack smart. Close over primitives and small values when you ` +
        `can. If you must close over big objects, make sure there's a cleanup ` +
        `path. \`removeEventListener\`, \`useEffect\` cleanup functions, WeakMaps ` +
        `as caches — these exist for exactly this reason.\n\n` +
        `Closures aren't scary. They're just bags. Don't hoard.`,
      depth: 1,
      parentId: 'post-10',
      votes: 278,
      timestamp: '1h ago',
    },

    // ── Top-level: practitioner wraps up with the module pattern ────────
    {
      id: 'post-13',
      persona: personas.practitioner,
      postType: 'text' as const,
      content:
        `One more pattern worth knowing: the **module pattern**. Before ES modules ` +
        `existed, closures were how JavaScript developers created private state.\n\n` +
        `An IIFE closes over private variables and returns only a public API. ` +
        `Libraries like jQuery were built almost entirely on this pattern. Even ` +
        `today, understanding it is key to reading a lot of legacy codebases.`,
      depth: 0,
      parentId: null,
      votes: 98,
      timestamp: '45m ago',
    },

    // ── Depth 1: skeptic pushes back ────────────────────────────────────
    {
      id: 'post-14',
      persona: personas.skeptic,
      postType: 'text' as const,
      content:
        `That's a bit historical at this point though, isn't it? ES modules, ` +
        `\`class\` private fields (\`#field\`), WeakMaps — we have real encapsulation ` +
        `tools now. The IIFE module pattern is worth knowing for reading old code, ` +
        `but I wouldn't reach for it in a new project.`,
      depth: 1,
      parentId: 'post-13',
      votes: 63,
      timestamp: '30m ago',
    },

    // ── Depth 2: practitioner concedes and redirects ─────────────────────
    {
      id: 'post-15',
      persona: personas.practitioner,
      postType: 'text' as const,
      content:
        `Fair. I teach it because it makes *why* we needed ES modules more ` +
        `intuitive — but you're right that it's not a live recommendation for ` +
        `greenfield code. Private class fields are the modern answer.`,
      depth: 2,
      parentId: 'post-14',
      votes: 41,
      timestamp: '20m ago',
    },
  ];

  return {
    id: `mock-${Date.now()}`,
    topic,
    posts,
    suggestedNextTopics: [
      'JavaScript Scope and the Scope Chain',
      'The Event Loop and Async Callbacks',
      'Higher-Order Functions and Functional Programming',
      'JavaScript Prototype Chain',
      'Memory Management and Garbage Collection in JS',
    ],
    generatedAt: new Date().toISOString(),
  };
}
