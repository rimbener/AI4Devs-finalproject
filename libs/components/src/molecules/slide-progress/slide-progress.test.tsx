import { fireEvent, render, screen } from '@testing-library/react-native';

import { SlideProgress } from './slide-progress';

describe('SlideProgress', () => {
  it('renders labeled segments for lesson and activity slides', async () => {
    await render(
      <SlideProgress
        slides={[{ type: 'lesson' }, { type: 'activity' }]}
        current={1}
      />,
    );

    expect(screen.getByRole('button', { name: 'Lesson 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Activity 2' })).toBeTruthy();
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

    fireEvent.press(screen.getByRole('button', { name: 'Activity 2' }));
    expect(onSeek).toHaveBeenCalledWith(1);
  });
});
