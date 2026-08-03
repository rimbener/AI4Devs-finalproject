jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

import {
  ACTIVITY_FOOTER_COLLAPSE_TEST_ID,
  ACTIVITY_FOOTER_NEXT_TEST_ID,
} from '@helsoft/activities/test-ids';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  ACTIVITY_FOOTER_SCROLL_TEST_ID,
  ActivityScrollViewProvider,
} from '../../activity-scroll-view-provider/activity-scroll-view-provider';
import { ActivityResultContent } from '../../atoms/activity-result-content/activity-result-content';
import { ActivityResultPanel } from './activity-result-panel';

const submitLabel = 'activity.result.submit';
const explanation = 'Paris is the capital of France.';

describe('ActivityResultPanel', () => {
  it('renders nothing while the activity is incomplete and there is no result', async () => {
    await render(<ActivityResultPanel canSubmit={false} hasResult={false} onSubmit={jest.fn()} />);

    expect(screen.toJSON()).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reveals the submit button once the activity is complete', async () => {
    await render(<ActivityResultPanel canSubmit hasResult={false} onSubmit={jest.fn()} />);

    expect(screen.getByRole('button', { name: submitLabel })).toBeTruthy();
  });

  it('calls onSubmit when the submit button is pressed', async () => {
    const onSubmit = jest.fn();
    await render(<ActivityResultPanel canSubmit hasResult={false} onSubmit={onSubmit} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: submitLabel }));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('replaces the submit button with the result children when a result is present', async () => {
    await render(
      <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
        <Text>Correct</Text>
      </ActivityResultPanel>,
    );

    expect(screen.getByText('Correct')).toBeTruthy();
    expect(screen.queryByRole('button', { name: submitLabel })).toBeNull();
  });

  it('collapses the results panel to the toggle arrow and expands it back', async () => {
    await render(
      <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
        <ActivityResultContent isCorrect explanation={explanation} />
      </ActivityResultPanel>,
    );

    expect(screen.getByText('activity.result.correct')).toBeTruthy();
    const toggle = screen.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID);
    expect(toggle.props.accessibilityLabel).toBe('activity.footer.collapseResults');

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(screen.queryByText(explanation)).toBeNull();
    expect(toggle.props.accessibilityLabel).toBe('activity.footer.expandResults');

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(screen.getByText(explanation)).toBeTruthy();
    expect(toggle.props.accessibilityLabel).toBe('activity.footer.collapseResults');
  });

  it('forwards submitTestID to the submit button', async () => {
    await render(
      <ActivityResultPanel
        canSubmit
        hasResult={false}
        onSubmit={jest.fn()}
        submitTestID="submit-test"
      />,
    );

    expect(screen.getByTestId('submit-test')).toBeTruthy();
  });

  it('forwards resultTestID to the result container', async () => {
    await render(
      <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()} resultTestID="result-test">
        <Text>Done</Text>
      </ActivityResultPanel>,
    );

    expect(screen.getByTestId('result-test')).toBeTruthy();
  });

  it('swaps the button for the result when the activity is submitted', async () => {
    const { rerender } = await render(
      <ActivityResultPanel canSubmit hasResult={false} onSubmit={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: submitLabel })).toBeTruthy();

    await rerender(
      <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
        <Text>Correct</Text>
      </ActivityResultPanel>,
    );

    expect(screen.getByText('Correct')).toBeTruthy();
    expect(screen.queryByRole('button', { name: submitLabel })).toBeNull();
  });
});

describe('ActivityResultPanel inside a ActivityScrollViewProvider (pinned footer)', () => {
  it('renders the submit button below the ScrollView instead of inside its content', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult={false} onSubmit={jest.fn()} />
      </ActivityScrollViewProvider>,
    );

    expect(within(screen.getByTestId('provided-scroll')).queryByRole('button')).toBeNull();
    expect(screen.getByRole('button', { name: submitLabel })).toBeTruthy();
  });

  it('does not mount a footer host ScrollView while the activity is hidden', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit={false} hasResult={false} onSubmit={jest.fn()} />
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByTestId(ACTIVITY_FOOTER_SCROLL_TEST_ID)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('pins the footer in a scroll-capped container so tall results never clip', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <Text>Tall result</Text>
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    const footerScroll = screen.getByTestId(ACTIVITY_FOOTER_SCROLL_TEST_ID);
    expect(footerScroll.props.nestedScrollEnabled).toBe(true);
    expect(footerScroll).toHaveStyle({ maxHeight: '45%' });
    expect(within(footerScroll).getByText('Tall result')).toBeTruthy();
  });

  it('shows a Next button outside the results panel and calls onNext', async () => {
    const onNext = jest.fn();
    await render(
      <ActivityScrollViewProvider testID="provided-scroll" onFooterNext={onNext}>
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <Text>Correct</Text>
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    expect(screen.getByRole('button', { name: 'player.continue' })).toBeTruthy();
    const next = screen.getByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID);

    await act(async () => {
      fireEvent.press(next);
    });

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('hides the Next button in the submit state and when no forward action is provided', async () => {
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll" onFooterNext={jest.fn()}>
        <ActivityResultPanel canSubmit hasResult={false} onSubmit={jest.fn()} />
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <Text>Correct</Text>
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();
  });

  it('floats the collapse toggle over the results top-right and collapses to the arrow height', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()} resultTestID="result-test">
          <ActivityResultContent isCorrect explanation={explanation} />
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    const toggle = screen.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID);
    expect(toggle).toBeTruthy();
    expect(screen.getByText(explanation)).toBeTruthy();

    await act(async () => {
      fireEvent.press(toggle);
    });

    // Collapsed: the explanation unmounts; the results card stays with the toggle arrow.
    expect(screen.queryByText(explanation)).toBeNull();
    expect(screen.getByTestId('result-test')).toBeTruthy();
    expect(screen.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID));
    });

    expect(screen.getByText(explanation)).toBeTruthy();
  });

  it('replaces the pinned button with the result below the ScrollView on submit', async () => {
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult={false} onSubmit={jest.fn()} />
      </ActivityScrollViewProvider>,
    );
    expect(screen.getByRole('button', { name: submitLabel })).toBeTruthy();

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <Text>Correct</Text>
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    expect(screen.getByText('Correct')).toBeTruthy();
    expect(screen.queryByRole('button', { name: submitLabel })).toBeNull();
  });

  it('removes the pinned footer when the activity goes back to hidden', async () => {
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult={false} onSubmit={jest.fn()} />
      </ActivityScrollViewProvider>,
    );
    expect(screen.getByRole('button', { name: submitLabel })).toBeTruthy();

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit={false} hasResult={false} onSubmit={jest.fn()} />
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByRole('button', { name: submitLabel })).toBeNull();
  });

  it('presses the pinned button with the latest onSubmit even across parent re-renders', async () => {
    const onSubmit = jest.fn();
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult={false} onSubmit={onSubmit} />
      </ActivityScrollViewProvider>,
    );

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult={false} onSubmit={onSubmit} />
      </ActivityScrollViewProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: submitLabel }));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // Fragility guard: a parent re-render that already has a result must re-register the
  // latest children/collapse state in the pinned footer, not keep the stale node.
  it('re-registers updated result children when mode is already result', async () => {
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <Text>First result</Text>
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );
    expect(screen.getByText('First result')).toBeTruthy();

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <Text>Updated result</Text>
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByText('First result')).toBeNull();
    expect(screen.getByText('Updated result')).toBeTruthy();
  });

  // Regression: a parent re-render must update the pinned footer's data, NOT swap the
  // footer element. Swapping would remount ActivityResultContent and wipe its internal
  // collapse state (and restart the entrance animation). The provider owns one stable
  // node; the panel only feeds it data.
  it('keeps result child state (collapse) across a parent re-render', async () => {
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <ActivityResultContent isCorrect explanation={explanation} />
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    const toggle = screen.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID);
    await act(async () => {
      fireEvent.press(toggle);
    });
    expect(screen.queryByText(explanation)).toBeNull();

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <ActivityResultPanel canSubmit hasResult onSubmit={jest.fn()}>
          <ActivityResultContent isCorrect explanation={explanation} />
        </ActivityResultPanel>
      </ActivityScrollViewProvider>,
    );

    // Still collapsed — the node did not remount.
    expect(screen.queryByText(explanation)).toBeNull();
    expect(screen.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID)).toBeTruthy();
  });
});
