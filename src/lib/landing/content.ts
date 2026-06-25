export const heroContent = {
  badge: 'AI-powered study workspace',
  headline: 'Read smarter.',
  headlineAccent: 'Understand faster.',
  subhead:
    'Upload any PDF. Summarize, chat, highlight, flashcards, and listen — without leaving the document.',
  primaryCta: 'Get started free',
  secondaryCta: 'See it in action',
};

export const uploadContent = {
  eyebrow: 'Upload',
  title: 'Start in seconds',
  description: 'Drop a PDF to open your AI study workspace instantly.',
  supportedTypes: 'PDF · up to 50MB',
  recentLabel: 'From your library',
  recentDescription: 'Same bookshelf as /library — pick up where you left off.',
  viewLibrary: 'View all in library',
  emptyLibraryTitle: 'No books on your shelf yet',
  emptyLibraryHint: 'Upload a PDF above or visit your library to add study material.',
};

export const demoContent = {
  eyebrow: 'Live preview',
  title: 'Your AI workspace, built in',
  description: 'Read, ask questions, and study — all in one focused interface.',
  libraryCta: 'Open library',
  uploadCta: 'Upload a PDF',
  demoHint: 'Interactive preview — tap or hover tabs to explore each panel.',
};

export const footerContent = {
  tagline: 'Progress saved locally in your browser.',
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Upload', href: '#upload' },
        { label: 'Demo', href: '#demo' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Library', href: '/library' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'How it works', href: '#how-it-works' },
        { label: 'AI tools', href: '#ai-tools' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { label: 'Sign in', href: '/auth' },
        { label: 'Library', href: '/library' },
      ],
    },
  ],
};

export const navLinks = [
  { label: 'Upload', href: '#upload' },
  { label: 'Demo', href: '#demo' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
] as const;

export const featuresContent = {
  eyebrow: 'Features',
  title: 'Everything you need to study in one place',
  description: 'A focused reader with AI tools built in — not bolted on.',
};

export const aiToolsContent = {
  eyebrow: 'AI tools',
  title: 'Study smarter with AI',
  description: 'Live tools work today when you sign in. More study modes on the way.',
};

export const howItWorksContent = {
  eyebrow: 'How it works',
  title: 'From upload to understanding in minutes',
  steps: [
    { title: 'Upload', description: 'Drop a PDF or pick one from your library.' },
    { title: 'Read', description: 'Scroll or flip through pages with thumbnails and bookmarks.' },
    { title: 'Ask AI', description: 'Summarize and chat about any page while you read.' },
    { title: 'Study', description: 'Generate flashcards and quizzes, or export highlights as notes.' },
  ],
};

export const pricingContent = {
  eyebrow: 'Pricing',
  title: 'Simple, transparent plans',
  description: 'Start free. Upgrade when you need more.',
  tiers: [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Local library, reading modes, and limited AI when signed in.',
      cta: 'Get started',
      ctaHref: '#upload',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$12',
      period: '/month',
      description: 'Unlimited AI, cloud sync for highlights and bookmarks.',
      cta: 'Start Pro trial',
      ctaHref: '/auth',
      highlighted: true,
    },
    {
      name: 'Team',
      price: 'Custom',
      period: '',
      description: 'Shared libraries and admin controls for study groups.',
      cta: 'Contact us',
      ctaHref: '/auth',
      highlighted: false,
    },
  ],
};

export const testimonialsContent = {
  eyebrow: 'Testimonials',
  title: 'Loved by students',
  items: [
    {
      quote: 'Finally a PDF reader that feels like Notion AI met Apple Books. Summaries save me hours before exams.',
      name: 'Priya S.',
      role: 'Medical student',
    },
    {
      quote: 'The flip-book mode and read-aloud combo is perfect for long textbook chapters.',
      name: 'Marcus T.',
      role: 'Graduate researcher',
    },
    {
      quote: 'I highlight on my laptop and pick up exactly where I left off. Local-first is a huge plus.',
      name: 'Elena R.',
      role: 'Law student',
    },
  ],
};
