import { motion } from 'framer-motion';

export default function FloatingGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-violet-600/30 blur-[120px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/3 top-0 h-[360px] w-[360px] rounded-full bg-blue-600/25 blur-[100px]"
        animate={{ x: [0, -25, 0], y: [0, 25, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 h-[300px] w-[500px] rounded-full bg-indigo-700/20 blur-[90px]"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#070B1F]/80 to-[#0B1028]" />
    </div>
  );
}
