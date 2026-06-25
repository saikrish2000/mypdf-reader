import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const LG_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false,
  );

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, []);

  return isMobile;
}

/** ponytail: matches Tailwind lg — used for hero 2-col + Spline gate */
export function useMinLg() {
  const [minLg, setMinLg] = React.useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`).matches
      : false,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const onChange = () => setMinLg(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return minLg;
}
