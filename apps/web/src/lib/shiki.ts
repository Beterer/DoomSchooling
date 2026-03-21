import { createHighlighter, type Highlighter } from 'shiki';

let cachedHighlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!cachedHighlighter) {
    cachedHighlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [
        'javascript',
        'typescript',
        'tsx',
        'jsx',
        'python',
        'rust',
        'go',
        'java',
        'bash',
        'sh',
        'sql',
        'json',
        'html',
        'css',
        'yaml',
        'markdown',
      ],
    });
  }
  return cachedHighlighter;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    const highlighter = await getHighlighter();
    const loadedLangs = highlighter.getLoadedLanguages();
    const resolvedLang = loadedLangs.includes(lang) ? lang : 'bash';
    return highlighter.codeToHtml(code, { lang: resolvedLang, theme: 'github-dark' });
  } catch {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre class="shiki"><code>${escaped}</code></pre>`;
  }
}
