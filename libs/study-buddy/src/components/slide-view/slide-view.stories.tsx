import type {
  FillInTheBlankSlide,
  FlashcardSlide,
  InstructionalSlide,
  MatchingSlide,
  MultipleChoiceSlide,
  OpenEndedSlide,
} from '@helsoft/types';
import type { Decorator, Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { configureSlideImageUrlMock } from '../../../.storybook/mocks/hooks';
import { SlideView } from './slide-view';

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

const fillBlank: FillInTheBlankSlide = {
  id: 'slide-3',
  lessonId: 'lesson-1',
  title: 'Fill blank',
  content: 'The capital is ____',
  position: 2,
  kind: 'activity',
  activityType: 'fill-in-the-blank',
  acceptedAnswers: ['Paris'],
};

const matching: MatchingSlide = {
  id: 'slide-4',
  lessonId: 'lesson-1',
  title: 'Matching',
  content: 'Match countries to capitals',
  position: 3,
  kind: 'activity',
  activityType: 'matching',
  leftItems: [
    { id: 'l1', label: 'France' },
    { id: 'l2', label: 'Germany' },
  ],
  rightItems: [
    { id: 'r1', label: 'Paris' },
    { id: 'r2', label: 'Berlin' },
  ],
  correctPairs: [
    { leftId: 'l1', rightId: 'r1' },
    { leftId: 'l2', rightId: 'r2' },
  ],
};

const flashcard: FlashcardSlide = {
  id: 'slide-5',
  lessonId: 'lesson-1',
  title: 'Flashcard',
  content: 'What pigment absorbs light?',
  position: 4,
  kind: 'activity',
  activityType: 'flashcard',
  back: 'Chlorophyll',
};

const openEnded: OpenEndedSlide = {
  id: 'slide-6',
  lessonId: 'lesson-1',
  title: 'Open ended',
  content: 'Explain photosynthesis in one sentence.',
  position: 5,
  kind: 'activity',
  activityType: 'open-ended',
  modelAnswer: 'Plants convert light into chemical energy.',
};

const portraitInstructional: InstructionalSlide = {
  ...instructional,
  image: {
    imageId: 'slide-image-1',
    storagePath: 'slides/portrait-image.png',
    width: 400,
    height: 800,
    alt: 'Portrait leaf diagram',
  },
};

const withSlideImageUrlMock: Decorator = (Story) => {
  configureSlideImageUrlMock({
    url: 'https://picsum.photos/seed/study-buddy-slide-view/400/800',
    isLoading: false,
  });
  return <Story />;
};

const splitDecorator: Decorator = (Story) => (
  <View style={{ width: 960, height: 600, padding: 16 }}>
    <Story />
  </View>
);

const meta = {
  title: 'Features/SlideView',
  component: SlideView,
  decorators: [
    (Story) => (
      <View style={{ width: 360, padding: 16, minHeight: 400 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SlideView>;

export default meta;

type Story = StoryObj<typeof meta>;

// Thin wrapper → organism owns rendering per kind; this proves the app's single render
// entry point dispatches every slide kind correctly.
export const Instructional: Story = { args: { slide: instructional } };
export const MultipleChoice: Story = { args: { slide: multipleChoice } };
export const FillInTheBlank: Story = { args: { slide: fillBlank } };
export const Matching: Story = { args: { slide: matching } };
export const Flashcard: Story = { args: { slide: flashcard } };
export const OpenEnded: Story = { args: { slide: openEnded } };

// availableHeight passes straight through to the organism's split (side-by-side) layout.
export const SplitInstructional: Story = {
  args: { slide: portraitInstructional, availableHeight: 600 },
  decorators: [withSlideImageUrlMock, splitDecorator],
};
