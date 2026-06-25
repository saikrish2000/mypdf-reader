import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InkReveal } from '@/components/ui/ink-reveal';

type Effect = 'mesh' | 'particles' | 'glow' | 'ink';
const EFFECTS: Effect[] = ['mesh', 'particles', 'glow', 'ink'];
const CYCLE_MS = 30000;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; alpha: number;
}

function useMousePosition() {
  const pos = useRef({ x: -1000, y: -1000 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return pos;
}

/* ─── Mesh Gradient ─────────────────────────────── */
function MeshGradient({ active }: { active: boolean }) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
      style={{ opacity: active ? 0.5 : 0 }}
    >
      <div
        className="absolute inset-0 animate-mesh-shift"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, hsl(var(--accent) / 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 70%, hsl(267 75% 60% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 40% 80%, hsl(var(--primary) / 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 70% 40% at 70% 20%, hsl(var(--accent) / 0.05) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
}

/* ─── Floating Particles ────────────────────────── */
function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const dimsRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    if (!active) { cancelAnimationFrame(rafRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    dimsRef.current = { w: rect.width, h: rect.height };
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    particlesRef.current = [];
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.25 - 0.05,
        r: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.25 + 0.05,
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      const ps = particlesRef.current;
      const { w, h } = dimsRef.current;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(var(--accent) / ${p.alpha})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity: active ? 0.4 : 0 }}
    />
  );
}

/* ─── Cursor Ambient Glow ───────────────────────── */
function CursorGlow({ active }: { active: boolean }) {
  const posRef = useMousePosition();
  const [pos, setPos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setPos({ ...posRef.current });
    }, 50);
    return () => clearInterval(interval);
  }, [active, posRef]);

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity: active ? 0.6 : 0 }}
    >
      <div
        className="absolute w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          background: `radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

/* ─── Multiple Ink Layers ───────────────────────── */
function InkLayers({ active }: { active: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity: active ? 0.35 : 0 }}
    >
      <InkReveal passive maskColor={[30, 31, 38]} brushSize={180} lifetime={700} stampStep={14} style={{ zIndex: 0 }} />
      <InkReveal passive maskColor={[30, 31, 38]} brushSize={260} lifetime={1000} stampStep={20} style={{ zIndex: 0 }} />
    </div>
  );
}

/* ─── Label ──────────────────────────────────────── */
const EFFECT_LABELS: Record<Effect, { label: string; icon: string }> = {
  mesh: { label: 'Ambient Flow', icon: '◈' },
  particles: { label: 'Drift', icon: '✦' },
  glow: { label: 'Aura', icon: '⊙' },
  ink: { label: 'Ink', icon: '◇' },
};

/* ─── Main Component ─────────────────────────────── */
const ReaderBackground: React.FC = () => {
  const [index, setIndex] = useState(0);
  const active = EFFECTS[index];

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % EFFECTS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const next = useCallback(() => setIndex(i => (i + 1) % EFFECTS.length), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      <MeshGradient active={active === 'mesh'} />
      <ParticleCanvas active={active === 'particles'} />
      <CursorGlow active={active === 'glow'} />
      <InkLayers active={active === 'ink'} />

      {/* Shuffle button + label */}
      <button
        onClick={next}
        className="absolute bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/40 backdrop-blur-sm border border-border/30 text-xs text-muted-foreground/60 hover:text-foreground/80 hover:border-accent/30 transition-all cursor-pointer pointer-events-auto"
        title="Cycle background effect"
      >
        <span>{EFFECT_LABELS[active].icon}</span>
        <span>{EFFECT_LABELS[active].label}</span>
      </button>
    </div>
  );
};

export default ReaderBackground;
