jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SlideProgress } from './slide-progress';

const mockUseLocalization = useLocalization as jest.Mock;

describe('SlideProgress', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({
      t: (key: string, options?: { n?: number }) =>
        options?.n != null ? `${key} ${options.n}` : key,
    });
  });

  it('renders labeled segments for lesson and activity slides', async () => {
    await render(<SlideProgress slides={[{ type: 'lesson' }, { type: 'activity' }]} current={1} />);

    expect(screen.getByRole('button', { name: 'player.progress.lesson 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'player.progress.activity 2' })).toBeTruthy();
  });

  it('calls onSeek with the segment index', async () => {
    const onSeek = jest.fn();
    await render(
      <SlideProgress
        slides={[{ type: 'lesson' }, { type: 'activity' }]}
        current={0}
        onSeek={onSeek}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'player.progress.activity 2' }));
    expect(onSeek).toHaveBeenCalledWith(1);
  });
});
