declare module 'page-flip/dist/js/page-flip.module.js' {
  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, unknown>);
    loadFromImages(images: string[]): void;
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    updateFromImages(images: string[]): void;
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    destroy(): void;
    flipNext(corner?: string): void;
    flipPrev(corner?: string): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    on(event: 'flip', callback: (sender: PageFlip, page: number) => void): void;
    on(event: 'changeState', callback: (sender: PageFlip, state: string) => void): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
  }
}
