import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ActivitySubmitResult } from './activity-submit-result';

const submitLabel = 'Submit';

describe('ActivitySubmitResult', () => {
  it('renders nothing while the activity is incomplete and there is no result', async () => {
    await render(
      <ActivitySubmitResult
        submitLabel={submitLabel}
        canSubmit={false}
        hasResult={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.toJSON()).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reveals the submit button once the activity is complete', async () => {
    await render(
      <ActivitySubmitResult
        submitLabel={submitLabel}
        canSubmit
        hasResult={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: submitLabel })).toBeTruthy();
  });

  it('calls onSubmit when the submit button is pressed', async () => {
    const onSubmit = jest.fn();
    await render(
      <ActivitySubmitResult
        submitLabel={submitLabel}
        canSubmit
        hasResult={false}
        onSubmit={onSubmit}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: submitLabel }));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('replaces the submit button with the result children when a result is present', async () => {
    await render(
      <ActivitySubmitResult submitLabel={submitLabel} canSubmit hasResult onSubmit={jest.fn()}>
        <Text>All correct!</Text>
      </ActivitySubmitResult>,
    );

    expect(screen.getByText('All correct!')).toBeTruthy();
    expect(screen.queryByRole('button', { name: submitLabel })).toBeNull();
  });

  it('forwards submitTestID to the submit button', async () => {
    await render(
      <ActivitySubmitResult
        submitLabel={submitLabel}
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
      <ActivitySubmitResult
        submitLabel={submitLabel}
        canSubmit
        hasResult
        onSubmit={jest.fn()}
        resultTestID="result-test"
      >
        <Text>Done</Text>
      </ActivitySubmitResult>,
    );

    expect(screen.getByTestId('result-test')).toBeTruthy();
  });

  it('swaps the button for the result when the activity is submitted', async () => {
    const { rerender } = await render(
      <ActivitySubmitResult
        submitLabel={submitLabel}
        canSubmit
        hasResult={false}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: submitLabel })).toBeTruthy();

    await rerender(
      <ActivitySubmitResult submitLabel={submitLabel} canSubmit hasResult onSubmit={jest.fn()}>
        <Text>All correct!</Text>
      </ActivitySubmitResult>,
    );

    expect(screen.getByText('All correct!')).toBeTruthy();
    expect(screen.queryByRole('button', { name: submitLabel })).toBeNull();
  });
});
