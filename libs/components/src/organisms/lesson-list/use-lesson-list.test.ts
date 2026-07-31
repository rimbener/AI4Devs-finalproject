jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import type { LessonListState } from './lesson-list.types';
import { useLessonList } from './use-lesson-list';

const mockUseLocalization = useLocalization as jest.Mock;

describe('useLessonList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({ t: (key: string) => key });
  });

  it('starts with pendingDeleteId null', async () => {
    const { result } = await renderHook(() => useLessonList({ state: 'content' }));

    expect(result.current.pendingDeleteId).toBeNull();
  });

  it('setPendingDeleteId updates the pending delete id', async () => {
    const { result } = await renderHook(() => useLessonList({ state: 'content' }));

    await act(async () => {
      result.current.setPendingDeleteId('lesson-1');
    });

    expect(result.current.pendingDeleteId).toBe('lesson-1');
  });

  it.each([
    ['loading', 'home.loading'],
    ['empty', 'home.empty'],
    ['error', 'home.error'],
  ] as const)('announces %s state via AccessibilityInfo with %s', async (state, key) => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    await renderHook(() => useLessonList({ state }));

    expect(announceSpy).toHaveBeenCalledWith(key);
    announceSpy.mockRestore();
  });

  it('does not announce anything when state is content', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    await renderHook(() => useLessonList({ state: 'content' }));

    expect(announceSpy).not.toHaveBeenCalled();
    announceSpy.mockRestore();
  });

  it('re-announces when state changes across a re-render', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    const { rerender } = await renderHook(
      ({ state }: { state: LessonListState }) => useLessonList({ state }),
      { initialProps: { state: 'loading' as const } },
    );
    expect(announceSpy).toHaveBeenCalledWith('home.loading');

    announceSpy.mockClear();
    await rerender({ state: 'error' as const });
    expect(announceSpy).toHaveBeenCalledWith('home.error');

    announceSpy.mockRestore();
  });

  it('does not re-announce when re-rendered with the same state', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    const { rerender } = await renderHook(
      ({ state }: { state: LessonListState }) => useLessonList({ state }),
      { initialProps: { state: 'loading' as const } },
    );
    expect(announceSpy).toHaveBeenCalledTimes(1);

    announceSpy.mockClear();
    await rerender({ state: 'loading' as const });
    expect(announceSpy).not.toHaveBeenCalled();

    announceSpy.mockRestore();
  });
});
