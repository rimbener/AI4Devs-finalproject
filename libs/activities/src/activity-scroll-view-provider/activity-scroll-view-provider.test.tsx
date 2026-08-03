import { ACTIVITY_FOOTER_NEXT_TEST_ID } from '@helsoft/activities/test-ids';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { type ReactNode, useEffect } from 'react';
import { Text } from 'react-native';

import {
  ACTIVITY_FOOTER_SCROLL_TEST_ID,
  ActivityScrollViewProvider,
  useActivityFooter,
} from './activity-scroll-view-provider';

jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

/** Registers a result footer with the given children (mirrors ActivityResultPanel). */
const FooterProbe = ({ node }: { node?: ReactNode }) => {
  const footer = useActivityFooter();
  useEffect(() => {
    footer?.setFooterData(node ? { renderMode: 'result', hasResult: true, children: node } : null);
    return () => footer?.setFooterData(null);
  }, [footer, node]);
  return null;
};

describe('ActivityScrollViewProvider', () => {
  it('forwards ScrollView props to the rendered ScrollView', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll" contentContainerStyle={{ padding: 8 }}>
        <Text>inside</Text>
      </ActivityScrollViewProvider>,
    );

    expect(screen.getByTestId('provided-scroll')).toBeTruthy();
    expect(screen.getByText('inside')).toBeTruthy();
  });

  it('applies onLayout to the wrapper frame and forwards wrapperTestID', async () => {
    const onLayout = jest.fn();
    await render(
      <ActivityScrollViewProvider
        testID="provided-scroll"
        wrapperTestID="provided-frame"
        onLayout={onLayout}
      >
        <Text>inside</Text>
      </ActivityScrollViewProvider>,
    );

    await fireEvent(screen.getByTestId('provided-frame'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 480 } },
    });

    expect(onLayout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('provided-frame')).toBeTruthy();
  });

  it('exposes no footer setter outside the provider', async () => {
    let captured: unknown;
    const Probe = () => {
      captured = useActivityFooter();
      return <Text>probe</Text>;
    };

    await render(<Probe />);

    expect(captured).toBeNull();
  });

  it('exposes onNext to the footer from onFooterNext', async () => {
    const onNext = jest.fn();
    const NextProbe = () => {
      const footer = useActivityFooter();
      useEffect(() => {
        footer?.onNext?.();
      }, [footer]);
      return null;
    };

    await render(
      <ActivityScrollViewProvider onFooterNext={onNext}>
        <NextProbe />
      </ActivityScrollViewProvider>,
    );

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows the Next button immediately for slides without an activity footer (instructional)', async () => {
    const onNext = jest.fn();
    await render(
      <ActivityScrollViewProvider testID="provided-scroll" onFooterNext={onNext}>
        <Text>Welcome</Text>
      </ActivityScrollViewProvider>,
    );

    const next = screen.getByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID);
    expect(screen.getByRole('button', { name: 'player.continue' })).toBeTruthy();

    await fireEvent.press(next);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('hides the Next button when no forward action is provided', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <Text>Welcome</Text>
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();
  });

  it('hides the Next button when setNextVisible(false) is called', async () => {
    const FooterProbe = () => {
      const footer = useActivityFooter();
      useEffect(() => {
        footer?.setNextVisible(false);
        return () => footer?.setNextVisible(true);
      }, [footer]);
      return null;
    };

    await render(
      <ActivityScrollViewProvider testID="provided-scroll" onFooterNext={jest.fn()}>
        <FooterProbe />
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();
  });

  it('renders a registered footer below the ScrollView', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <Text>content</Text>
        <FooterProbe node={<Text>footer</Text>} />
      </ActivityScrollViewProvider>,
    );

    expect(within(screen.getByTestId('provided-scroll')).queryByText('footer')).toBeNull();
    expect(screen.getByText('footer')).toBeTruthy();
  });

  it('pins the footer in a scroll-capped container so tall footers never clip', async () => {
    await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <FooterProbe node={<Text>footer</Text>} />
      </ActivityScrollViewProvider>,
    );

    const footerScroll = screen.getByTestId(ACTIVITY_FOOTER_SCROLL_TEST_ID);
    expect(footerScroll.props.nestedScrollEnabled).toBe(true);
    expect(footerScroll).toHaveStyle({ maxHeight: '45%' });
    expect(within(footerScroll).getByText('footer')).toBeTruthy();
  });

  it('swaps the rendered footer when the registered node changes', async () => {
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <FooterProbe node={<Text>first</Text>} />
      </ActivityScrollViewProvider>,
    );
    expect(screen.getByText('first')).toBeTruthy();

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <FooterProbe node={<Text>second</Text>} />
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByText('first')).toBeNull();
    expect(screen.getByText('second')).toBeTruthy();
  });

  it('clears the footer when the registered node is removed', async () => {
    const { rerender } = await render(
      <ActivityScrollViewProvider testID="provided-scroll">
        <FooterProbe node={<Text>footer</Text>} />
      </ActivityScrollViewProvider>,
    );
    expect(screen.getByText('footer')).toBeTruthy();

    await rerender(
      <ActivityScrollViewProvider testID="provided-scroll">
        <FooterProbe />
      </ActivityScrollViewProvider>,
    );

    expect(screen.queryByText('footer')).toBeNull();
  });
});
