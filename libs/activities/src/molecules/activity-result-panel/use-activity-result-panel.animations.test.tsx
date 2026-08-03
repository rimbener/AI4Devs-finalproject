import { renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { SUBMIT_SLIDE_DISTANCE } from './activity-result-panel.helpers';
import { useActivityResultPanelAnimations } from './use-activity-result-panel.animations';

type RenderMode = 'hidden' | 'submit' | 'result';

describe('useActivityResultPanelAnimations', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the slide-up offset for the entrance animation', async () => {
    const { result } = await renderHook(() => useActivityResultPanelAnimations('submit'));
    const style = result.current.animatedStyle as unknown as {
      opacity: unknown;
      transform: [{ translateY: { __getValue: () => number } }];
    };

    expect(style.opacity).toBeDefined();
    expect(style.transform[0].translateY.__getValue()).toBe(SUBMIT_SLIDE_DISTANCE);
  });

  it('replays the entrance animation whenever a visible mode appears', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    } as never);
    const { rerender } = await renderHook(
      ({ mode }: { mode: RenderMode }) => useActivityResultPanelAnimations(mode),
      { initialProps: { mode: 'hidden' } },
    );

    expect(timingSpy).not.toHaveBeenCalled();

    await rerender({ mode: 'submit' });
    expect(timingSpy).toHaveBeenCalledTimes(1);

    await rerender({ mode: 'result' });
    expect(timingSpy).toHaveBeenCalledTimes(2);
  });

  it('does not animate while hidden', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    } as never);
    await renderHook(() => useActivityResultPanelAnimations('hidden'));

    expect(timingSpy).not.toHaveBeenCalled();
  });

  it('does not replay when a re-render keeps the same visible mode (e.g. keystrokes)', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    } as never);
    const { rerender } = await renderHook(
      ({ mode }: { mode: RenderMode }) => useActivityResultPanelAnimations(mode),
      { initialProps: { mode: 'submit' } },
    );

    expect(timingSpy).toHaveBeenCalledTimes(1);

    await rerender({ mode: 'submit' });
    await rerender({ mode: 'submit' });

    expect(timingSpy).toHaveBeenCalledTimes(1);
  });
});
