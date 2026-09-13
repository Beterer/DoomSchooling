import type { Post } from '@doomschooling/shared';

export interface ThreadNode {
  post: Post;
  children: ThreadNode[];
}

/**
 * Turns the flat, depth-annotated post list into reply trees.
 *
 * A reply belongs to the nearest earlier post with a smaller depth. This mirrors how the
 * feed already reads top to bottom and keeps the original order, even when an LLM-provided
 * `parentId` points somewhere unexpected.
 */
export function buildThreadTree(posts: Post[]): ThreadNode[] {
  const roots: ThreadNode[] = [];
  const ancestors: ThreadNode[] = [];

  for (const post of posts) {
    const node: ThreadNode = { post, children: [] };

    if (post.postType === 'divider') {
      roots.push(node);
      ancestors.length = 0;
      continue;
    }

    while (ancestors.length > 0 && ancestors[ancestors.length - 1]!.post.depth >= post.depth) {
      ancestors.pop();
    }

    const parent = ancestors[ancestors.length - 1];
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    ancestors.push(node);
  }

  return roots;
}

export function countReplies(node: ThreadNode): number {
  return node.children.reduce((total, child) => total + 1 + countReplies(child), 0);
}
