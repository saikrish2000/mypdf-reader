import type { MouseEvent } from 'react';

/** Smooth scroll to a landing section; respects scroll-snap on html */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function handleSectionNavClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (!href.startsWith('#')) return;
  e.preventDefault();
  scrollToSection(href.slice(1));
}
