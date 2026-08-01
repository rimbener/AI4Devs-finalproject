jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

import type { SlideProgressSlide } from '@helsoft/components';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonPlayerNavigator } from './lesson-player-navigator';

const slides: SlideProgressSlide[] = [{ type: 'lesson' }, { type: 'activity' }];

describe('LessonPlayerNavigator', () => {
  it('renders progress and wires back/next when enabled', async () => {
    const onBack = jest.fn();
    const onNext = jest.fn();
    await render(
      <LessonPlayerNavigator
        slides={slides}
        current={0}
        label="1 of 2"
        canGoBack
        canGoNext
        onBack={onBack}
        onNext={onNext}
      />,
    );

    expect(screen.getByLabelText('player.back')).toBeTruthy();
    expect(screen.getByLabelText('player.next')).toBeTruthy();
    expect(screen.getByText('1 of 2')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('player.back'));
    await fireEvent.press(screen.getByLabelText('player.next'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('omits nav buttons when back/next are disabled', async () => {
    await render(
      <LessonPlayerNavigator
        slides={slides}
        current={0}
        label="1 of 2"
        canGoBack={false}
        canGoNext={false}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText('player.back')).toBeNull();
    expect(screen.queryByLabelText('player.next')).toBeNull();
  });
});
