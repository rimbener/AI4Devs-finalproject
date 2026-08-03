import { render, screen, within } from '@testing-library/react-native';

import { ActivityResultExplanation } from './activity-result-explanation';

/** Collect Text nodes whose only content is an empty string (omit-empty guard probes). */
const collectEmptyTextNodes = (node: unknown, out: unknown[] = []): unknown[] => {
  if (node == null) return out;
  if (Array.isArray(node)) {
    for (const child of node) collectEmptyTextNodes(child, out);
    return out;
  }
  if (typeof node === 'object') {
    const record = node as { type?: unknown; children?: unknown };
    if (record.type === 'Text') {
      const kids = record.children;
      if (
        kids === '' ||
        kids == null ||
        (Array.isArray(kids) && (kids.length === 0 || kids.every((c) => c === '')))
      ) {
        out.push(node);
      }
    }
    if ('children' in record) collectEmptyTextNodes(record.children, out);
  }
  return out;
};

describe('ActivityResultExplanation', () => {
  it('renders the heading and body inside the testID container', async () => {
    const { toJSON } = await render(
      <ActivityResultExplanation
        testID="activity-result-explanation"
        heading="Explanation"
        body="Paris is the capital of France."
      />,
    );

    const container = screen.getByTestId('activity-result-explanation');
    expect(within(container).getByText('Explanation')).toBeTruthy();
    expect(within(container).getByText('Paris is the capital of France.')).toBeTruthy();
    expect(collectEmptyTextNodes(toJSON())).toHaveLength(0);
  });

  it('omits the heading when none is provided', async () => {
    const { toJSON } = await render(
      <ActivityResultExplanation
        testID="activity-result-explanation"
        body="Paris is the capital of France."
      />,
    );

    expect(screen.queryByText('Explanation')).toBeNull();
    expect(screen.getByText('Paris is the capital of France.')).toBeTruthy();
    expect(collectEmptyTextNodes(toJSON())).toHaveLength(0);
  });

  it('omits the body when none is provided', async () => {
    const { toJSON } = await render(
      <ActivityResultExplanation testID="activity-result-explanation" heading="Explanation" />,
    );

    expect(screen.queryByText('Paris is the capital of France.')).toBeNull();
    expect(screen.getByText('Explanation')).toBeTruthy();
    expect(collectEmptyTextNodes(toJSON())).toHaveLength(0);
  });
});
