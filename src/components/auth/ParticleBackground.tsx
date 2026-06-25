import { motion } from 'framer-motion';
import { useMemo } from 'react';

const STAR_COUNT = 48;

export default function ParticleBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        x: `${(i * 17 + 7) % 100}%`,
        y: `${(i * 23 + 11) % 100}%`,
        size: i % 3 === 0 ? 2 : 1,
        delay: (i % 10) * 0.4,
        duration: 3 + (i % 5),
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.15, 0.7, 0.15] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
