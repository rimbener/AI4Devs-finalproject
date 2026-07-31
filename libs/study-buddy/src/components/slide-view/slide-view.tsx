import { SlideView as SlideViewOrganism, type SlideViewProps } from '@helsoft/activities';

/** Thin feature wiring — organism owns slide rendering. */
export const SlideView = (props: SlideViewProps) => <SlideViewOrganism {...props} />;
