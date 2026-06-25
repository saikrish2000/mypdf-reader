import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // PDF Reader specific colors
        paper: "hsl(var(--paper))",
        "paper-shadow": "hsl(var(--paper-shadow))",
        progress: "hsl(var(--progress))",
        "progress-track": "hsl(var(--progress-track))",
        toolbar: {
          DEFAULT: "hsl(var(--toolbar))",
          foreground: "hsl(var(--toolbar-foreground))",
          muted: "hsl(var(--toolbar-muted))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        "2xl": "var(--radius-2xl)",
        lg: "var(--radius-lg)",
        md: "var(--radius)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "flip-left": {
          "0%": { transform: "rotateY(0deg)", opacity: "1" },
          "50%": { transform: "rotateY(-12deg)", opacity: "0.7" },
          "100%": { transform: "rotateY(0deg)", opacity: "1" },
        },
        "flip-right": {
          "0%": { transform: "rotateY(0deg)", opacity: "1" },
          "50%": { transform: "rotateY(12deg)", opacity: "0.7" },
          "100%": { transform: "rotateY(0deg)", opacity: "1" },
        },
        "pulse-border": {
          "0%, 100%": { borderColor: "hsl(var(--accent) / 0.3)" },
          "50%": { borderColor: "hsl(var(--accent) / 0.8)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "mesh-shift": {
          "0%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
          "25%": { transform: "translate(2%, -1%) scale(1.02) rotate(0.5deg)" },
          "50%": { transform: "translate(-1%, 2%) scale(0.98) rotate(-0.5deg)" },
          "75%": { transform: "translate(1%, -2%) scale(1.01) rotate(0.3deg)" },
          "100%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "flip-left": "flip-left 0.35s ease-out",
        "flip-right": "flip-right 0.35s ease-out",
        "pulse-border": "pulse-border 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "mesh-shift": "mesh-shift 12s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
