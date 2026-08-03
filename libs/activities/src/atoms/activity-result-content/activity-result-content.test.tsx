jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

import { ACTIVITY_FOOTER_COLLAPSE_TEST_ID } from '@helsoft/activities/test-ids';
import { lightColors } from '@helsoft/components';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ActivityResultContent } from './activity-result-content';

const I18N = {
  correct: 'activity.result.correct',
  incorrect: 'activity.result.incorrect',
  collapse: 'activity.footer.collapseResults',
  expand: 'activity.footer.expandResults',
} as const;

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

describe('ActivityResultContent', () => {
  it('renders the correct banner politely without an alert role', async () => {
    await render(<ActivityResultContent isCorrect />);

    const banner = screen.getByTestId('activity-result-banner');
    expect(screen.getByText(I18N.correct)).toBeTruthy();
    expect(screen.getByText('check_circle', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('cancel', { includeHiddenElements: true })).toBeNull();
    expect(banner.props.accessibilityRole).toBeUndefined();
    expect(screen.getByText(I18N.correct).props.accessibilityLiveRegion).toBe('polite');
    expect(banner).toHaveStyle({ backgroundColor: lightColors.tertiaryContainer });
  });

  it('renders the incorrect banner with an alert role and an assertive live region', async () => {
    await render(<ActivityResultContent isCorrect={false} />);

    const banner = screen.getByTestId('activity-result-banner');
    expect(screen.getByText(I18N.incorrect)).toBeTruthy();
    expect(screen.getByText('cancel', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('check_circle', { includeHiddenElements: true })).toBeNull();
    expect(banner.props.accessibilityRole).toBe('alert');
    expect(screen.getByText(I18N.incorrect).props.accessibilityLiveRegion).toBe('assertive');
    expect(banner).toHaveStyle({ backgroundColor: lightColors.errorContainer });
  });

  it('shows the summary when provided', async () => {
    await render(<ActivityResultContent isCorrect summary="3 of 3 correct" />);

    expect(screen.getByText('3 of 3 correct')).toBeTruthy();
  });

  it('omits the summary when none is provided', async () => {
    const { toJSON } = await render(<ActivityResultContent isCorrect />);

    expect(screen.queryByText('3 of 3 correct')).toBeNull();
    expect(collectEmptyTextNodes(toJSON())).toHaveLength(0);
  });

  it('shows the explanation when provided', async () => {
    await render(<ActivityResultContent isCorrect explanation="Paris is the capital of France." />);

    expect(screen.getByTestId('activity-result-explanation')).toBeTruthy();
    expect(screen.getByText('Paris is the capital of France.')).toBeTruthy();
  });

  it('omits the explanation when none is provided', async () => {
    const { toJSON } = await render(<ActivityResultContent isCorrect />);

    expect(screen.queryByTestId('activity-result-explanation')).toBeNull();
    expect(collectEmptyTextNodes(toJSON())).toHaveLength(0);
  });

  it('collapses and expands the explanation via the top-right toggle', async () => {
    await render(<ActivityResultContent isCorrect explanation="Paris is the capital of France." />);
    expect(screen.getByText('Paris is the capital of France.')).toBeTruthy();

    const toggle = screen.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID);
    expect(toggle.props.accessibilityLabel).toBe(I18N.collapse);

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(screen.queryByText('Paris is the capital of France.')).toBeNull();
    expect(screen.queryByTestId('activity-result-explanation')).toBeNull();
    expect(toggle.props.accessibilityLabel).toBe(I18N.expand);

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(screen.getByText('Paris is the capital of France.')).toBeTruthy();
    expect(toggle.props.accessibilityLabel).toBe(I18N.collapse);
  });
});
