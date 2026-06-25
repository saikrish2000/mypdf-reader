import { useEffect, useState } from 'react';

/** Matches Tailwind `sm` (640px) — two-page spread in flip mode at this width and up. */
const SPREAD_LAYOUT_MIN_PX = 640;

export function useSpreadLayout() {
  const [isSpreadLayout, setIsSpreadLayout] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia(`(min-width: ${SPREAD_LAYOUT_MIN_PX}px)`).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${SPREAD_LAYOUT_MIN_PX}px)`);
    const update = () => setIsSpreadLayout(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isSpreadLayout;
}
