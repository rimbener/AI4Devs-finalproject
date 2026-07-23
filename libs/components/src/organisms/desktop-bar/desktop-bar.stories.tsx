import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text } from 'react-native';
import { DesktopBar } from './desktop-bar';

const meta = {
  title: 'Organisms/DesktopBar',
  component: DesktopBar,
  args: {
    brandLabel: 'AI Study Buddy',
    avatar: <Text>HL</Text>,
    home: { label: 'My lessons', active: true, onPress: () => undefined },
    pdfFiles: { label: 'My PDF files', onPress: () => undefined },
  },
} satisfies Meta<typeof DesktopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Content: Story = {};

export const UnderlineIndicator: Story = {
  args: { indicatorVariant: 'underline' },
};

export const DotIndicator: Story = {
  args: { indicatorVariant: 'dot' },
};

export const AlertsBadge: Story = {
  args: { alertsBadgeCount: 2 },
};

export const PdfFilesActive: Story = {
  args: {
    home: { label: 'My lessons', onPress: () => undefined },
    pdfFiles: { label: 'My PDF files', active: true, onPress: () => undefined },
  },
};
