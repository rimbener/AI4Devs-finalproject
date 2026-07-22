import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';

import { configurePdfExtractionMock } from '../../../.storybook/mocks/pdf-upload-extraction';
import { NewLessonDialog } from './new-lesson-dialog';

const withPdfExtractionMock =
  (config: Parameters<typeof configurePdfExtractionMock>[0]) => (StoryFn: () => ReactNode) => {
    configurePdfExtractionMock(config);
    return <StoryFn />;
  };

const meta = {
  title: 'Features/NewLessonDialog',
  component: NewLessonDialog,
  args: {},
} satisfies Meta<typeof NewLessonDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Idle trigger — choose-file button; dialog closed. */
export const Idle: Story = {
  decorators: [withPdfExtractionMock({ stage: 'idle' })],
};

/** Upload step open via generateDocumentId omitted — Storybook starts closed; open by clicking. */
export const UploadPanel: Story = {
  decorators: [withPdfExtractionMock({ stage: 'idle' })],
};

/** Generate step — opens dialog on generate for a known document. */
export const GenerateStep: Story = {
  args: {
    generateDocumentId: 'doc-story-1',
  },
  decorators: [withPdfExtractionMock({ stage: 'success' })],
};
