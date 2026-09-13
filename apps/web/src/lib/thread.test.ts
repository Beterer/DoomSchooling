import assert from 'node:assert/strict';
import test from 'node:test';
import type { Post } from '@doomschooling/shared';
import { buildThreadTree, countReplies, type ThreadNode } from './thread.ts';

function post(id: string, depth: number, postType: Post['postType'] = 'text'): Post {
  return {
    id,
    persona: {
      id: 'persona-1',
      displayName: 'Dr. Reyes',
      handle: '@reyes',
      role: 'expert',
      avatarInitials: 'DR',
      avatarColor: '#3457d5',
    },
    postType,
    content: id,
    depth,
    parentId: null,
    votes: 0,
    timestamp: '1h',
  };
}

function shape(nodes: ThreadNode[]): unknown[] {
  return nodes.map((node) =>
    node.children.length > 0 ? { [node.post.id]: shape(node.children) } : node.post.id,
  );
}

test('keeps top-level posts as separate roots', () => {
  const tree = buildThreadTree([post('a', 0), post('b', 0), post('c', 0)]);

  assert.deepEqual(shape(tree), ['a', 'b', 'c']);
});

test('nests each reply under the nearest earlier post with a smaller depth', () => {
  const tree = buildThreadTree([
    post('a', 0),
    post('a1', 1),
    post('a1x', 2),
    post('a1xy', 3),
    post('a2', 1),
    post('a2x', 2),
    post('b', 0),
  ]);

  assert.deepEqual(shape(tree), [
    { a: [{ a1: [{ a1x: ['a1xy'] }] }, { a2: ['a2x'] }] },
    'b',
  ]);
});

test('attaches a reply that skips a depth level to the closest shallower post', () => {
  const tree = buildThreadTree([post('a', 0), post('a-deep', 2)]);

  assert.deepEqual(shape(tree), [{ a: ['a-deep'] }]);
});

test('treats a reply with no earlier parent as a root', () => {
  const tree = buildThreadTree([post('orphan', 2), post('a', 0)]);

  assert.deepEqual(shape(tree), ['orphan', 'a']);
});

test('does not nest replies across a divider', () => {
  const tree = buildThreadTree([post('a', 0), post('divider', 0, 'divider'), post('reply', 1)]);

  assert.deepEqual(shape(tree), ['a', 'divider', 'reply']);
});

test('preserves the original post order when flattened depth-first', () => {
  const posts = [post('a', 0), post('a1', 1), post('a1x', 2), post('a2', 1), post('b', 0), post('b1', 1)];
  const flattened: string[] = [];
  const walk = (nodes: ThreadNode[]) => {
    for (const node of nodes) {
      flattened.push(node.post.id);
      walk(node.children);
    }
  };

  walk(buildThreadTree(posts));

  assert.deepEqual(flattened, posts.map((item) => item.id));
});

test('counts every nested reply below a post', () => {
  const [root] = buildThreadTree([post('a', 0), post('a1', 1), post('a1x', 2), post('a2', 1)]);

  assert.ok(root);
  assert.equal(countReplies(root), 3);
});
