jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

import type { InstructionalSlide, MultipleChoiceAnswer, MultipleChoiceSlide } from '@helsoft/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { SlideView } from './slide-view';

// Slides here carry no image, so useSlideImageUrl's query stays disabled — the provider
// just has to exist for useQueryClient() not to throw.
const renderWithQueryClient = (element: ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
};

const instructional: InstructionalSlide = {
  id: 'slide-1',
  lessonId: 'lesson-1',
  title: 'Photosynthesis',
  content: 'Plants convert light into chemical energy.',
  position: 0,
  kind: 'instructional',
};

const multipleChoice: MultipleChoiceSlide = {
  id: 'slide-2',
  lessonId: 'lesson-1',
  title: 'Capitals',
  content: 'What is the capital of France?',
  position: 1,
  kind: 'activity',
  activityType: 'multiple-choice',
  options: [
    { id: 'opt-a', label: 'Paris' },
    { id: 'opt-b', label: 'Berlin' },
  ],
  correctOptionId: 'opt-a',
};

const gradedAnswer: MultipleChoiceAnswer = {
  slideId: multipleChoice.id,
  activityType: 'multiple-choice',
  selectedOptionId: 'opt-b',
  correctOptionId: 'opt-a',
  isCorrect: false,
};

describe('SlideView', () => {
  // Thin wiring → organism owns rendering; proves slide is forwarded and instructional
  // content renders through the real SlideView organism.
  it('forwards slide to the SlideView organism and renders instructional content', async () => {
    await renderWithQueryClient(<SlideView slide={instructional} />);

    expect(screen.getByRole('header')).toHaveTextContent(instructional.title);
    expect(screen.getByText(instructional.content)).toBeTruthy();
  });

  it('forwards onAnswered to the organism and reports the graded activity answer once', async () => {
    const onAnswered = jest.fn();
    await renderWithQueryClient(<SlideView slide={multipleChoice} onAnswered={onAnswered} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Berlin/ }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'activity.mcq.submit' }));
    });

    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(onAnswered).toHaveBeenCalledWith(gradedAnswer);
  });

  it('forwards initialAnswer and rehydrates the activity organism already locked', async () => {
    const onAnswered = jest.fn();
    await renderWithQueryClient(
      <SlideView slide={multipleChoice} onAnswered={onAnswered} initialAnswer={gradedAnswer} />,
    );

    expect(screen.getByRole('button', { name: /Paris/ }).props.accessibilityState.disabled).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: /Berlin/ }).props.accessibilityState.disabled).toBe(
      true,
    );
    expect(screen.queryByRole('button', { name: 'activity.mcq.submit' })).toBeNull();
    expect(onAnswered).not.toHaveBeenCalled();
  });
});
