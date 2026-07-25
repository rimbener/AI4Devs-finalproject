import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { isValidEmail } from '../../test-utils/auth-test-factories';
import { SignInForm } from './sign-in-form';

const SIGN_IN_DELAY_MS = 400;

const meta = {
  title: 'Organisms/SignInForm',
  component: SignInForm,
  args: {
    onSignIn: () => setTimeout(() => {}, SIGN_IN_DELAY_MS),
    onNavigateToSignUp: () => {},
    isValidEmail,
    isSigningIn: false,
    error: null,
  },
} satisfies Meta<typeof SignInForm>;

export default meta;

type Story = StoryObj<typeof meta>;

// Content (Empty/Content) — pristine form; typing + submit exercises isValidEmail inline validation.
export const Default: Story = {};

// Loading — isSigningIn drives LoginForm's Loading affordance.
export const Loading: Story = {
  args: {
    isSigningIn: true,
  },
};

// Error (@s5) — invalid_credentials banner.
export const InvalidCredentials: Story = {
  args: {
    error: 'invalid_credentials',
  },
};

// Error (@s6) — network_error banner; form stays editable.
export const NetworkError: Story = {
  args: {
    error: 'network_error',
  },
};
