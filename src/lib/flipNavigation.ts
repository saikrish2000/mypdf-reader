export function getSpread(
  page: number,
  totalPages: number,
  singlePageView: boolean,
  coverPage = 1,
) {
  if (singlePageView) {
    return { left: null as number | null, right: page, isCover: page === coverPage };
  }
  if (page === coverPage) {
    return { left: null, right: coverPage, isCover: true };
  }
  if (page < coverPage) {
    return { left: null, right: page, isCover: false };
  }

  const firstContent = coverPage + 1;
  const rel = page - firstContent;
  const spreadStart = firstContent + (rel % 2 === 0 ? rel : rel - 1);
  const right = spreadStart + 1 <= totalPages ? spreadStart + 1 : null;
  return { left: spreadStart, right, isCover: false };
}

export function isSameSpread(
  a: number,
  b: number,
  totalPages: number,
  singlePageView: boolean,
  coverPage = 1,
): boolean {
  if (a === b) return true;
  if (singlePageView) return false;
  const sa = getSpread(a, totalPages, false, coverPage);
  const sb = getSpread(b, totalPages, false, coverPage);
  return sa.left === sb.left && sa.right === sb.right;
}

export function getNextFlipPage(
  page: number,
  totalPages: number,
  singlePageView: boolean,
  coverPage = 1,
): number {
  if (page >= totalPages) return page;
  if (singlePageView) return page + 1;

  const spread = getSpread(page, totalPages, false, coverPage);
  if (spread.isCover) {
    const next = coverPage + 1;
    return next <= totalPages ? next : page;
  }
  if (page < coverPage) {
    return page + 1;
  }
  if (spread.left !== null && page === spread.left && spread.right !== null) {
    return spread.right;
  }
  if (spread.right !== null && page === spread.right) {
    const next = spread.right + 1;
    return next <= totalPages ? next : page;
  }
  return Math.min(page + 1, totalPages);
}

export function getPrevFlipPage(
  page: number,
  totalPages: number,
  singlePageView: boolean,
  coverPage = 1,
): number {
  if (page <= 1) return page;
  if (singlePageView) return page - 1;

  const spread = getSpread(page, totalPages, false, coverPage);
  if (spread.isCover) return coverPage;
  if (page === coverPage + 1) return coverPage;
  if (page < coverPage) return Math.max(page - 1, 1);
  if (spread.right !== null && page === spread.right && spread.left !== null) {
    return spread.left;
  }
  if (spread.left !== null && page === spread.left) {
    const prev = spread.left - 1;
    if (prev === coverPage) return coverPage;
    return prev >= coverPage + 1 ? prev : coverPage;
  }
  return Math.max(page - 1, 1);
}

/** Skip animation when the target is more than one flip-step away (thumbnail/search jumps). */
export function shouldSnapFlip(
  from: number,
  to: number,
  totalPages: number,
  singlePageView: boolean,
  coverPage = 1,
): boolean {
  if (from === to) return false;
  let pos = from;
  let steps = 0;
  const maxSteps = Math.abs(to - from) + 2;
  while (pos !== to && steps < maxSteps) {
    pos = to > from
      ? getNextFlipPage(pos, totalPages, singlePageView, coverPage)
      : getPrevFlipPage(pos, totalPages, singlePageView, coverPage);
    steps += 1;
    if (pos === to) return steps > 1;
  }
  return Math.abs(to - from) > 1;
}
