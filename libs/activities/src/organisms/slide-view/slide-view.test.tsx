jest.mock('../../molecules/slide-image/slide-image', () => ({
  SlideImage: ({
    image,
    layout,
  }: {
    image?: { imageId: string };
    layout?: 'stacked' | 'split';
  }) => {
    const { Text } = require('react-native');
    if (!image) return null;
    return <Text testID={`slide-image-${layout ?? 'stacked'}`}>{layout ?? 'stacked'}</Text>;
  },
}));
jest.mock('./use-slide-layout', () => ({
  useSlideLayout: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock('../../templates/multiple-choice/multiple-choice', () => ({
  MultipleChoice: ({
    slide,
    initialAnswer,
  }: {
    slide: { content: string };
    initialAnswer?: { activityType?: string; selectedOptionId?: string } | null;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="activity-multiple-choice">
        <Text>{slide.content}</Text>
        {initialAnswer ? (
          <Text testID="mc-initial">
            {`${initialAnswer.activityType}:${initialAnswer.selectedOptionId ?? 'none'}`}
          </Text>
        ) : null}
      </View>
    );
  },
}));
jest.mock('../../templates/fill-in-the-blank/fill-in-the-blank', () => ({
  FillInTheBlank: ({
    slide,
    initialAnswer,
  }: {
    slide: { content: string };
    initialAnswer?: { submittedAnswer?: string } | null;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="activity-fill-in-the-blank">
        <Text>{slide.content}</Text>
        {initialAnswer?.submittedAnswer ? (
          <Text testID="fitb-initial">{initialAnswer.submittedAnswer}</Text>
        ) : null}
      </View>
    );
  },
}));
jest.mock('../../templates/matching/matching', () => ({
  Matching: ({
    slide,
    initialAnswer,
  }: {
    slide: { content: string };
    initialAnswer?: { isCorrect?: boolean } | null;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="activity-matching">
        <Text>{slide.content}</Text>
        {initialAnswer ? (
          <Text testID="matching-initial">{String(initialAnswer.isCorrect)}</Text>
        ) : null}
      </View>
    );
  },
}));
jest.mock('../../templates/flashcard/flashcard', () => ({
  Flashcard: ({
    slide,
    initialAnswer,
  }: {
    slide: { content: string };
    initialAnswer?: { recalled?: boolean } | null;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="activity-flashcard">
        <Text>{slide.content}</Text>
        {initialAnswer ? (
          <Text testID="flashcard-initial">{String(initialAnswer.recalled)}</Text>
        ) : null}
      </View>
    );
  },
}));
jest.mock('../../molecules/open-ended-body/open-ended-body', () => ({
  OpenEndedBody: ({
    slide,
    initialAnswer,
  }: {
    slide: { content: string };
    initialAnswer?: { activityType?: string; submittedAnswer?: string } | null;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="activity-open-ended">
        <Text>{slide.content}</Text>
        {initialAnswer ? (
          <Text testID="oe-initial">
            {`${initialAnswer.activityType}:${initialAnswer.submittedAnswer ?? 'none'}`}
          </Text>
        ) : null}
      </View>
    );
  },
}));

import type {
  FillInTheBlankAnswer,
  FillInTheBlankSlide,
  FlashcardAnswer,
  FlashcardSlide,
  InstructionalSlide,
  MatchingAnswer,
  MatchingSlide,
  MultipleChoiceAnswer,
  MultipleChoiceSlide,
  OpenEndedAnswer,
  OpenEndedSlide,
} from '@helsoft/types';
import { render, screen } from '@testing-library/react-native';

import { SlideView } from './slide-view';
import { useSlideLayout } from './use-slide-layout';

const mockedUseSlideLayout = jest.mocked(useSlideLayout);
const I18N = {
  splitBody: 'player.slideBody.scroll',
} as const;

const instructional: InstructionalSlide = {
  id: 'slide-1',
  lessonId: 'lesson-1',
  title: 'Photosynthesis',
  content: 'Plants convert light into energy.',
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
  title: 'Blank',
  content: 'The capital is ____',
  position: 2,
  kind: 'activity',
  activityType: 'fill-in-the-blank',
  acceptedAnswers: ['Paris'],
};

const matching: MatchingSlide = {
  id: 'slide-4',
  lessonId: 'lesson-1',
  title: 'Match',
  content: 'Match the pairs',
  position: 3,
  kind: 'activity',
  activityType: 'matching',
  leftItems: [{ id: 'l1', label: 'FR' }],
  rightItems: [{ id: 'r1', label: 'Paris' }],
  correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
};

const flashcard: FlashcardSlide = {
  id: 'slide-5',
  lessonId: 'lesson-1',
  title: 'Card',
  content: 'Front prompt',
  position: 4,
  kind: 'activity',
  activityType: 'flashcard',
  back: 'Back answer',
};

const openEnded: OpenEndedSlide = {
  id: 'slide-6',
  lessonId: 'lesson-1',
  title: 'Essay',
  content: 'Explain photosynthesis',
  position: 5,
  kind: 'activity',
  activityType: 'open-ended',
  modelAnswer: 'Light to energy',
};

describe('SlideView', () => {
  beforeEach(() => {
    mockedUseSlideLayout.mockReturnValue({ isSplit: false });
  });

  // @s5 — instructional shows title + content text.
  it('renders an instructional slide title and content', async () => {
    await render(<SlideView slide={instructional} />);

    expect(screen.getByText('Photosynthesis')).toBeTruthy();
    expect(screen.getByText('Plants convert light into energy.')).toBeTruthy();
  });

  // @s6 — each activity type renders its wrapper with the prompt.
  it.each([
    ['multiple-choice', multipleChoice, 'activity-multiple-choice'],
    ['fill-in-the-blank', fillBlank, 'activity-fill-in-the-blank'],
    ['matching', matching, 'activity-matching'],
    ['flashcard', flashcard, 'activity-flashcard'],
    ['open-ended', openEnded, 'activity-open-ended'],
  ] as const)('renders the %s activity wrapper with its prompt', async (_type, slide, testId) => {
    await render(<SlideView slide={slide} />);

    expect(screen.getByText(slide.title)).toBeTruthy();
    expect(screen.getByTestId(testId)).toBeTruthy();
    expect(screen.getByText(slide.content)).toBeTruthy();
  });

  // @s12 — SlideView forwards stored answer to the activity wrapper.
  it('forwards initialAnswer to the multiple-choice wrapper', async () => {
    const answer: MultipleChoiceAnswer = {
      slideId: multipleChoice.id,
      activityType: 'multiple-choice',
      selectedOptionId: 'opt-a',
      correctOptionId: 'opt-a',
      isCorrect: true,
    };
    await render(<SlideView slide={multipleChoice} initialAnswer={answer} />);

    expect(screen.getByTestId('mc-initial').props.children).toBe('multiple-choice:opt-a');
  });

  it('forwards initialAnswer to fill-in-the-blank, matching, flashcard, and open-ended', async () => {
    const fitb: FillInTheBlankAnswer = {
      slideId: fillBlank.id,
      activityType: 'fill-in-the-blank',
      submittedAnswer: 'Paris',
      acceptedAnswerShown: 'Paris',
      isCorrect: true,
    };
    const matchAns: MatchingAnswer = {
      slideId: matching.id,
      activityType: 'matching',
      pairs: [{ leftId: 'l1', rightId: 'r1', isCorrect: true }],
      correctPairCount: 1,
      totalPairCount: 1,
      isCorrect: true,
    };
    const flashAns: FlashcardAnswer = {
      slideId: flashcard.id,
      activityType: 'flashcard',
      recalled: true,
      isCorrect: true,
    };
    const oeAns: OpenEndedAnswer = {
      slideId: openEnded.id,
      activityType: 'open-ended',
      submittedAnswer: 'prior essay',
    };

    await render(<SlideView slide={fillBlank} initialAnswer={fitb} />);
    expect(screen.getByTestId('fitb-initial').props.children).toBe('Paris');

    await render(<SlideView slide={matching} initialAnswer={matchAns} />);
    expect(screen.getByTestId('matching-initial').props.children).toBe('true');

    await render(<SlideView slide={flashcard} initialAnswer={flashAns} />);
    expect(screen.getByTestId('flashcard-initial').props.children).toBe('true');

    await render(<SlideView slide={openEnded} initialAnswer={oeAns} />);
    expect(screen.getByTestId('oe-initial').props.children).toBe('open-ended:prior essay');
  });

  // Mutation — activityType gate must drop mismatched initialAnswer (not `true ? answer`).
  it('does not forward a mismatched activityType initialAnswer to the wrapper', async () => {
    const oeAns: OpenEndedAnswer = {
      slideId: multipleChoice.id,
      activityType: 'open-ended',
      submittedAnswer: 'wrong type',
    };

    await render(<SlideView slide={multipleChoice} initialAnswer={oeAns} />);
    expect(screen.queryByTestId('mc-initial')).toBeNull();

    await render(<SlideView slide={fillBlank} initialAnswer={oeAns} />);
    expect(screen.queryByTestId('fitb-initial')).toBeNull();

    await render(<SlideView slide={matching} initialAnswer={oeAns} />);
    expect(screen.queryByTestId('matching-initial')).toBeNull();

    await render(<SlideView slide={flashcard} initialAnswer={oeAns} />);
    expect(screen.queryByTestId('flashcard-initial')).toBeNull();

    const mcAns: MultipleChoiceAnswer = {
      slideId: openEnded.id,
      activityType: 'multiple-choice',
      selectedOptionId: 'opt-a',
      correctOptionId: 'opt-a',
      isCorrect: true,
    };
    await render(<SlideView slide={openEnded} initialAnswer={mcAns} />);
    expect(screen.queryByTestId('oe-initial')).toBeNull();
  });

  // Mutation — instructional content + root/title styles from StyleSheet.
  it('applies root gap and title/content typography styles on instructional slides', async () => {
    await render(<SlideView slide={instructional} />);

    const title = screen.getByText('Photosynthesis');
    const content = screen.getByText('Plants convert light into energy.');
    expect(title.props.style).toEqual(
      expect.objectContaining({ fontFamily: 'Sora', fontSize: 24, color: '#1c1a17' }),
    );
    expect(content.props.style).toEqual(
      expect.objectContaining({
        fontFamily: 'IBM Plex Sans',
        fontSize: 16,
        color: '#1c1a17',
      }),
    );
    expect(title.parent?.props.style).toEqual(expect.objectContaining({ gap: 12, flex: 1 }));
  });

  // @s1, @s2, @s3, @s12 — split keeps title first, then isolated image and scrolling body panes.
  it('renders a bounded 50/50 split row for a portrait image', async () => {
    const imageSlide: InstructionalSlide = {
      ...instructional,
      image: {
        imageId: 'image-1',
        storagePath: 'slides/image-1.png',
        width: 400,
        height: 800,
      },
    };
    mockedUseSlideLayout.mockReturnValue({ isSplit: true });

    await render(<SlideView slide={imageSlide} availableHeight={600} />);

    const row = screen.getByTestId('slide-split-row');
    const imagePane = screen.getByTestId('slide-image-pane');
    const bodyPane = screen.getByTestId('slide-body-pane');
    const bodyScroll = screen.getByTestId('slide-body-scroll');

    expect(screen.getByText('Photosynthesis')).toBeTruthy();
    expect(screen.getByTestId('slide-image-split')).toBeTruthy();
    expect(screen.getByText('Plants convert light into energy.')).toBeTruthy();
    expect(row.props.style).toEqual(
      expect.objectContaining({ flexDirection: 'row', gap: 16, flex: 1 }),
    );
    expect(row.props.style).not.toEqual(expect.objectContaining({ height: 600 }));
    expect(row.parent?.props.style).toEqual(expect.objectContaining({ height: 600, gap: 12 }));
    expect(imagePane.props.style).toEqual(expect.objectContaining({ flex: 1 }));
    expect(bodyPane.props.style).toEqual(expect.objectContaining({ flex: 1 }));
    // The ScrollView is a direct child of the pane (no nested footer host — the activity
    // footer registers on the outer LessonPlayer provider, not on the split pane).
    expect(bodyScroll.parent).toBe(bodyPane);
    expect(bodyScroll.props).toEqual(
      expect.objectContaining({
        accessible: true,
        accessibilityLabel: I18N.splitBody,
        focusable: true,
      }),
    );
    expect(row.children).toEqual([imagePane, bodyPane]);
    expect(mockedUseSlideLayout).toHaveBeenCalledWith({
      image: imageSlide.image,
      availableHeight: 600,
    });
  });

  // Mutation — a split tree still needs a positive measured height before it is height-bounded.
  it('does not height-bound a split tree when the measured height is zero', async () => {
    const imageSlide: InstructionalSlide = {
      ...instructional,
      image: {
        imageId: 'image-1',
        storagePath: 'slides/image-1.png',
        width: 400,
        height: 800,
      },
    };
    mockedUseSlideLayout.mockReturnValue({ isSplit: true });

    await render(<SlideView slide={imageSlide} availableHeight={0} />);

    expect(screen.getByText('Photosynthesis').parent?.props.style).toEqual(
      expect.objectContaining({ flex: 1 }),
    );
    expect(screen.getByTestId('slide-body-scroll').props.style).toEqual(
      expect.objectContaining({ flex: 1 }),
    );
  });

  // @s11 — every content kind uses the same image-left, body-right split wrapper.
  it.each([
    ['instructional', instructional],
    ['multiple-choice', multipleChoice],
    ['fill-in-the-blank', fillBlank],
    ['matching', matching],
    ['flashcard', flashcard],
    ['open-ended', openEnded],
  ] as const)('renders the %s kind in the split layout', async (_kind, slide) => {
    const imageSlide = {
      ...slide,
      image: {
        imageId: 'image-1',
        storagePath: 'slides/image-1.png',
        width: 400,
        height: 800,
      },
    };
    mockedUseSlideLayout.mockReturnValue({ isSplit: true });

    await render(<SlideView slide={imageSlide} availableHeight={600} />);

    expect(screen.getByTestId('slide-split-row')).toBeTruthy();
    expect(screen.getByTestId('slide-image-split')).toBeTruthy();
    expect(screen.getByTestId('slide-body-scroll')).toBeTruthy();
  });

  // @s6, @s14 — stacked fallback preserves the existing image-before-body order.
  it('keeps a non-split image above the body', async () => {
    const imageSlide: InstructionalSlide = {
      ...instructional,
      image: {
        imageId: 'image-1',
        storagePath: 'slides/image-1.png',
        width: 400,
        height: 800,
      },
    };

    await render(<SlideView slide={imageSlide} availableHeight={600} />);

    expect(screen.getByTestId('slide-image-stacked')).toBeTruthy();
    expect(screen.queryByTestId('slide-split-row')).toBeNull();
    expect(screen.queryByTestId('slide-body-scroll')).toBeNull();
  });

  // @s7 — text-only slides do not introduce an image column.
  it('keeps text-only slides without image panes', async () => {
    await render(<SlideView slide={instructional} availableHeight={600} />);

    expect(screen.queryByTestId('slide-image-stacked')).toBeNull();
    expect(screen.queryByTestId('slide-image-pane')).toBeNull();
  });
});
