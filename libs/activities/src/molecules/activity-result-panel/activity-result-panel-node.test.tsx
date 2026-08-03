jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: (obj: Record<string, unknown>) => obj.web,
}));

jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.web },
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    View: (props: any) => React.createElement('View', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    Text: (props: any) => React.createElement('Text', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    ScrollView: (props: any) => React.createElement('ScrollView', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    TextInput: (props: any) => React.createElement('TextInput', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    TouchableOpacity: (props: any) => React.createElement('TouchableOpacity', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    Pressable: (props: any) => React.createElement('Pressable', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock StyleSheet
    StyleSheet: { create: (s: any) => s, flatten: (s: any) => s },
    useWindowDimensions: () => ({ width: 800, height: 600 }),
    Animated: {
      // biome-ignore lint/suspicious/noExplicitAny: mock props
      View: (props: any) => React.createElement('AnimatedView', props),
      Value: class AnimatedValue {
        _value: unknown;
        // biome-ignore lint/suspicious/noExplicitAny: mock animated value
        constructor(val: any) {
          this._value = val;
        }
        setValue = jest.fn();
        interpolate = jest.fn(() => ({}));
      },
      // biome-ignore lint/suspicious/noExplicitAny: mock callback
      timing: () => ({ start: (cb?: any) => cb?.(), stop: jest.fn() }),
      // biome-ignore lint/suspicious/noExplicitAny: mock callback
      spring: () => ({ start: (cb?: any) => cb?.(), stop: jest.fn() }),
    },
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    FlatList: (props: any) => React.createElement('FlatList', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    VirtualizedList: (props: any) => React.createElement('VirtualizedList', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    ActivityIndicator: (props: any) => React.createElement('ActivityIndicator', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    Modal: (props: any) => React.createElement('Modal', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    Image: (props: any) => React.createElement('Image', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    KeyboardAvoidingView: (props: any) => React.createElement('KeyboardAvoidingView', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    SafeAreaView: (props: any) => React.createElement('SafeAreaView', props),
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    StatusBar: (props: any) => React.createElement('StatusBar', props),
  };
});

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ActivityResultPanelNode } from './activity-result-panel-node';

// Configure unistyles theme so StyleSheet.create resolves theme values.
StyleSheet.configure({
  themes: {
    light: {
      spacing: {
        s0: 0,
        s1: 4,
        s2: 8,
        s3: 12,
        s4: 16,
        s5: 20,
        s6: 24,
        s8: 32,
        s10: 40,
        s12: 48,
        s14: 56,
        s16: 64,
        s20: 80,
        s24: 96,
      },
      layout: {
        gutter: 16,
        pageMargin: 24,
        contentMax: 1200,
        contentReading: 640,
        touchTarget: 48,
        iconSize: 24,
      },
      duration: { medium4: 300 },
      easing: { emphasizedDecelerate: 'ease-out' },
      shape: {
        none: 0,
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 28,
        full: 999,
        button: 999,
        card: 12,
        dialog: 28,
        textField: 4,
        chip: 8,
        fab: 16,
        sheet: 28,
      },
      colors: {
        primary: '#000',
        onPrimary: '#fff',
        primaryContainer: '#000',
        onPrimaryContainer: '#fff',
        secondary: '#000',
        onSecondary: '#fff',
        secondaryContainer: '#000',
        onSecondaryContainer: '#fff',
        tertiary: '#000',
        onTertiary: '#fff',
        tertiaryContainer: '#d4edda',
        onTertiaryContainer: '#155724',
        error: '#000',
        onError: '#fff',
        errorContainer: '#f8d7da',
        onErrorContainer: '#721c24',
        surface: '#fff',
        onSurface: '#000',
        surfaceVariant: '#000',
        onSurfaceVariant: '#666',
        outline: '#000',
        outlineVariant: '#000',
        background: '#fff',
        onBackground: '#000',
        surfaceDisabled: '#000',
        onSurfaceDisabled: '#000',
        inverseSurface: '#000',
        inverseOnSurface: '#000',
        scrim: '#000',
        shadow: '#000',
        // biome-ignore lint/suspicious/noExplicitAny: mock theme colors
      } as any,
      typography: {
        displayLarge: {
          fontFamily: 'System',
          fontSize: 57,
          lineHeight: 64,
          fontWeight: '400',
          letterSpacing: -0.25,
        },
        displayMedium: {
          fontFamily: 'System',
          fontSize: 45,
          lineHeight: 52,
          fontWeight: '400',
          letterSpacing: 0,
        },
        displaySmall: {
          fontFamily: 'System',
          fontSize: 36,
          lineHeight: 44,
          fontWeight: '400',
          letterSpacing: 0,
        },
        headlineLarge: {
          fontFamily: 'System',
          fontSize: 32,
          lineHeight: 40,
          fontWeight: '400',
          letterSpacing: 0,
        },
        headlineMedium: {
          fontFamily: 'System',
          fontSize: 28,
          lineHeight: 36,
          fontWeight: '400',
          letterSpacing: 0,
        },
        headlineSmall: {
          fontFamily: 'System',
          fontSize: 24,
          lineHeight: 32,
          fontWeight: '400',
          letterSpacing: 0,
        },
        titleLarge: {
          fontFamily: 'System',
          fontSize: 22,
          lineHeight: 28,
          fontWeight: '400',
          letterSpacing: 0,
        },
        titleMedium: {
          fontFamily: 'System',
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '500',
          letterSpacing: 0.15,
        },
        titleSmall: {
          fontFamily: 'System',
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '500',
          letterSpacing: 0.1,
        },
        bodyLarge: {
          fontFamily: 'System',
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '400',
          letterSpacing: 0.5,
        },
        bodyMedium: {
          fontFamily: 'System',
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '400',
          letterSpacing: 0.25,
        },
        bodySmall: {
          fontFamily: 'System',
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '400',
          letterSpacing: 0.4,
        },
        labelLarge: {
          fontFamily: 'System',
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '500',
          letterSpacing: 0.1,
        },
        labelMedium: {
          fontFamily: 'System',
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '500',
          letterSpacing: 0.5,
        },
        labelSmall: {
          fontFamily: 'System',
          fontSize: 11,
          lineHeight: 16,
          fontWeight: '500',
          letterSpacing: 0.5,
        },
      },
      padding: { buttonX: 24, card: 16, dialog: 24, listItem: 16 },
      // biome-ignore lint/suspicious/noExplicitAny: mock theme object
    } as any,
  },
  // biome-ignore lint/suspicious/noExplicitAny: mock theme config
} as any);

const mockOnSubmit = jest.fn();

describe('ActivityResultPanelNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when renderMode is hidden', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="hidden"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
      />,
    );
    expect(screen.toJSON()).toBeNull();
  });

  it('renders submit button when renderMode is submit', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
        submitTestID="submit-btn"
      />,
    );
    expect(screen.getByTestId('submit-btn')).toBeTruthy();
  });

  it('renders result children when hasResult is true', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="result"
        hasResult
        onSubmitRef={{ current: mockOnSubmit }}
        resultTestID="result-container"
      >
        <Text>Correct answer</Text>
      </ActivityResultPanelNode>,
    );
    expect(screen.getByTestId('result-container')).toBeTruthy();
    expect(screen.getByText('Correct answer')).toBeTruthy();
  });

  it('calls onSubmitRef when submit button is pressed', async () => {
    const onSubmitRef = { current: mockOnSubmit };
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={onSubmitRef}
        submitTestID="submit-btn"
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-btn'));
    });
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('applies collapsable={false} to the submit button wrapper View', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
      />,
    );
    const json = screen.toJSON();
    const viewWithCollapsable = findViewWithCollapsable(json);
    expect(viewWithCollapsable).toMatchObject({ props: { collapsable: false } });
  });

  // biome-ignore lint/suspicious/noExplicitAny: recursive tree traversal
  function findViewWithCollapsable(node: any): any {
    if (node && node.props && node.props.collapsable !== undefined) return node;
    if (node?.children) {
      for (const child of node.children) {
        const found = findViewWithCollapsable(child);
        if (found) return found;
      }
    }
    return null;
  }

  it('forwards submitTestID to the submit button', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
        submitTestID="custom-submit-id"
      />,
    );
    expect(screen.getByTestId('custom-submit-id')).toBeTruthy();
  });

  it('forwards resultTestID to the result Card', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="result"
        hasResult
        onSubmitRef={{ current: mockOnSubmit }}
        resultTestID="custom-result-id"
      >
        <Text>Result</Text>
      </ActivityResultPanelNode>,
    );
    expect(screen.getByTestId('custom-result-id')).toBeTruthy();
  });

  it('applies web-specific width (80% of viewport) to submit button', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
        submitTestID="submit-btn"
      />,
    );
    const button = screen.getByTestId('submit-btn');
    const style = button.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flatStyle.width).toBe(640); // 800 * 0.8
  });

  it('applies web-specific maxWidth to submit button', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
        submitTestID="submit-btn"
      />,
    );
    const button = screen.getByTestId('submit-btn');
    const styles = Array.isArray(button.props.style) ? button.props.style : [button.props.style];
    const hasMaxWidth = styles.some((s: Record<string, unknown>) => s?.maxWidth !== undefined);
    expect(hasMaxWidth).toBe(true);
  });

  it('applies web-specific marginHorizontal auto to submit button', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
        submitTestID="submit-btn"
      />,
    );
    const button = screen.getByTestId('submit-btn');
    const style = button.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flatStyle.marginHorizontal).toBe('auto');
  });

  it('applies web-specific marginTop (s3) to submit button', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="submit"
        hasResult={false}
        onSubmitRef={{ current: mockOnSubmit }}
        submitTestID="submit-btn"
      />,
    );
    const button = screen.getByTestId('submit-btn');
    const style = button.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flatStyle.marginTop).toBe(12); // theme.spacing.s3
  });

  it('renders result container with children', async () => {
    await render(
      <ActivityResultPanelNode
        renderMode="result"
        hasResult
        onSubmitRef={{ current: mockOnSubmit }}
        resultTestID="result-panel"
      >
        <Text>Score: 80%</Text>
      </ActivityResultPanelNode>,
    );
    expect(screen.getByTestId('result-panel')).toBeTruthy();
    expect(screen.getByText('Score: 80%')).toBeTruthy();
  });
});
