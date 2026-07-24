import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';

import { RadioGroupSection } from './radio-group-section';

const compositionOptions = [
  { value: 'instructional-only', label: 'Instructional only' },
  { value: 'activity-only', label: 'Activity only' },
  { value: 'both', label: 'Both' },
];

const meta = {
  title: 'Molecules/RadioGroupSection',
  component: RadioGroupSection,
  args: {
    title: 'Lesson content',
    options: compositionOptions,
    value: 'both',
    onChange: () => {},
  },
} satisfies Meta<typeof RadioGroupSection>;

export default meta;

type Story = StoryObj<typeof meta>;

const InteractiveDemo = () => {
  const [value, setValue] = useState('both');
  return (
    <RadioGroupSection
      title="Lesson content"
      options={compositionOptions}
      value={value}
      onChange={setValue}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const ProviderPicker: Story = {
  args: {
    title: 'AI provider',
    options: [
      { value: 'groq', label: 'Groq' },
      { value: 'openai', label: 'OpenAI' },
      { value: 'anthropic', label: 'Anthropic' },
    ],
    value: 'groq',
    accessibilityLabel: 'AI provider',
  },
};
