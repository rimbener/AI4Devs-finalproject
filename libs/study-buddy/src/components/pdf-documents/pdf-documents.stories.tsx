import type { Decorator, Meta, StoryObj } from '@storybook/react-native-web-vite';

import { configurePdfDocumentsMock, configureProfileMock } from '../../../.storybook/mocks/hooks';
import { PdfDocuments } from './pdf-documents';

const SAMPLE_DOCUMENTS = [
  {
    id: 'doc-1',
    filename: 'notes.pdf',
    pageCount: 12,
    createdAt: '2026-07-13T12:00:00.000Z',
    status: 'ready' as const,
    lessonId: null,
  },
  {
    id: 'doc-2',
    filename: 'retry-me.pdf',
    pageCount: 4,
    createdAt: '2026-07-12T12:00:00.000Z',
    status: 'failed' as const,
    lessonId: null,
  },
  {
    id: 'doc-3',
    filename: 'done.pdf',
    pageCount: 3,
    createdAt: '2026-07-11T12:00:00.000Z',
    status: 'generated' as const,
    lessonId: 'lesson-1',
  },
];

const withMocks =
  (config: {
    documents?: Parameters<typeof configurePdfDocumentsMock>[0];
    profile?: Parameters<typeof configureProfileMock>[0];
  }): Decorator =>
  (StoryFn) => {
    if (config.documents) configurePdfDocumentsMock(config.documents);
    if (config.profile) configureProfileMock(config.profile);
    return <StoryFn />;
  };

const meta = {
  title: 'Features/PdfDocuments',
  component: PdfDocuments,
} satisfies Meta<typeof PdfDocuments>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Content — heading + ready/failed/generated rows + upload trigger. */
export const Content: Story = {
  decorators: [
    withMocks({
      documents: { documents: SAMPLE_DOCUMENTS },
      profile: {
        profile: {
          plan: 'paid',
          keySource: 'platform',
          showKeySettings: false,
          showAds: false,
          canCreate: true,
        },
      },
    }),
  ],
};

/** Creation disabled — generated lessons remain openable while Generate/Retry stay hidden. */
export const CreationDisabled: Story = {
  decorators: [
    withMocks({
      documents: { documents: SAMPLE_DOCUMENTS },
      profile: {
        profile: {
          plan: 'free',
          keySource: 'user',
          showKeySettings: true,
          showAds: true,
          canCreate: false,
        },
      },
    }),
  ],
};

/** Loading — spinner while usePdfDocuments fetches. */
export const Loading: Story = {
  decorators: [withMocks({ documents: { isLoading: true } })],
};

/** Empty — no extracted PDFs yet. */
export const Empty: Story = {
  decorators: [withMocks({ documents: { documents: [] } })],
};

/** Load failure — retry affordance (list empty). */
export const LoadError: Story = {
  decorators: [
    withMocks({ documents: { documents: [], error: new globalThis.Error('load failed') } }),
  ],
};
