jest.mock('../../templates/open-ended/open-ended', () => ({
  OpenEnded: ({
    prompt,
    unavailable,
    onSubmit,
  }: {
    prompt: string;
    unavailable?: boolean;
    onSubmit: (value: string) => void;
  }) => {
    const { Text, Pressable } = require('react-native');
    if (unavailable) return <Text testID="open-ended-unavailable">unavailable</Text>;
    return (
      <>
        <Text testID="open-ended-prompt">{prompt}</Text>
        <Pressable testID="open-ended-submit" onPress={() => onSubmit('learner answer')} />
      </>
    );
  },
}));

import type { OpenEndedSlide } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { OpenEndedBody } from './open-ended-body';

const slide: OpenEndedSlide = {
  id: 's1',
  lessonId: 'lesson-1',
  title: 'Explain',
  content: 'What is photosynthesis?',
  position: 0,
  kind: 'activity',
  activityType: 'open-ended',
  modelAnswer: 'Conversion of light to chemical energy',
};

describe('OpenEndedBody', () => {
  it('wires a valid slide into OpenEnded and reports onAnswered once', async () => {
    const onAnswered = jest.fn();
    await render(<OpenEndedBody slide={slide} onAnswered={onAnswered} />);

    expect(screen.getByTestId('open-ended-prompt')).toHaveTextContent(slide.content);
    fireEvent.press(screen.getByTestId('open-ended-submit'));

    expect(onAnswered).toHaveBeenCalledWith({
      slideId: 's1',
      activityType: 'open-ended',
      submittedAnswer: 'learner answer',
    });
  });

  it('marks empty content as unavailable', async () => {
    await render(
      <OpenEndedBody
        slide={{ ...slide, content: '   ', modelAnswer: 'x', title: 'Empty' }}
        onAnswered={jest.fn()}
      />,
    );

    expect(screen.getByTestId('open-ended-unavailable')).toBeTruthy();
  });

  it('marks empty model answer as unavailable', async () => {
    await render(<OpenEndedBody slide={{ ...slide, modelAnswer: '   ' }} onAnswered={jest.fn()} />);

    expect(screen.getByTestId('open-ended-unavailable')).toBeTruthy();
  });

  it('ignores a second submit and does not call onAnswered again', async () => {
    const onAnswered = jest.fn();
    await render(<OpenEndedBody slide={slide} onAnswered={onAnswered} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('open-ended-submit'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('open-ended-submit'));
    });

    expect(onAnswered).toHaveBeenCalledTimes(1);
  });

  it('ignores submit when an initialAnswer is already present', async () => {
    const onAnswered = jest.fn();
    await render(
      <OpenEndedBody
        slide={slide}
        onAnswered={onAnswered}
        initialAnswer={{
          slideId: slide.id,
          activityType: 'open-ended',
          submittedAnswer: 'already answered',
        }}
      />,
    );

    fireEvent.press(screen.getByTestId('open-ended-submit'));

    expect(onAnswered).not.toHaveBeenCalled();
  });
});
