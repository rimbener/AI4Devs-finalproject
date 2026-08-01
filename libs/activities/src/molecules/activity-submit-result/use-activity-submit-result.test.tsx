import { renderHook } from '@testing-library/react-native';

import * as helpers from './activity-submit-result.helpers';
import { useActivitySubmitResult } from './use-activity-submit-result';

describe('useActivitySubmitResult', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('scrolls the result into view once when hasResult flips true — independent of children', async () => {
    const scrollSpy = jest.spyOn(helpers, 'scrollNodeIntoView').mockImplementation(() => {});
    const { rerender } = await renderHook(
      ({ hasResult, canSubmit }: { hasResult: boolean; canSubmit: boolean }) =>
        useActivitySubmitResult(hasResult, canSubmit),
      { initialProps: { hasResult: false, canSubmit: true } },
    );

    expect(scrollSpy).not.toHaveBeenCalled();

    await rerender({ hasResult: true, canSubmit: true });
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    await rerender({ hasResult: true, canSubmit: true });
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it('scrolls the submit button into view when it becomes available', async () => {
    const scrollSpy = jest.spyOn(helpers, 'scrollNodeIntoView').mockImplementation(() => {});
    const { rerender } = await renderHook(
      ({ hasResult, canSubmit }: { hasResult: boolean; canSubmit: boolean }) =>
        useActivitySubmitResult(hasResult, canSubmit),
      { initialProps: { hasResult: false, canSubmit: false } },
    );

    expect(scrollSpy).not.toHaveBeenCalled();

    await rerender({ hasResult: false, canSubmit: true });
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    await rerender({ hasResult: false, canSubmit: false });
    await rerender({ hasResult: false, canSubmit: true });
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it('does not scroll on mount even when the submit button is already available', async () => {
    const scrollSpy = jest.spyOn(helpers, 'scrollNodeIntoView').mockImplementation(() => {});
    await renderHook(() => useActivitySubmitResult(false, true));

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('stops scrolling when there is no result', async () => {
    const scrollSpy = jest.spyOn(helpers, 'scrollNodeIntoView').mockImplementation(() => {});
    const { rerender } = await renderHook(
      ({ hasResult, canSubmit }: { hasResult: boolean; canSubmit: boolean }) =>
        useActivitySubmitResult(hasResult, canSubmit),
      { initialProps: { hasResult: false, canSubmit: true } },
    );

    await rerender({ hasResult: false, canSubmit: true });
    await rerender({ hasResult: false, canSubmit: false });

    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
