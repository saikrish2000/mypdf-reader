import React, { useEffect, useState, useCallback } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

const DIGIT_HEIGHT = 40;
const PADDING = 10;
const HEIGHT = DIGIT_HEIGHT + PADDING;

interface CounterProps extends React.HTMLAttributes<HTMLDivElement> {
  start?: number;
  end: number;
  duration?: number;
  fontSize?: number;
}

function Digit({ place, value }: { place: number; value: number }) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height: HEIGHT }} className="relative w-[1ch] tabular-nums">
      {Array.from({ length: 10 }, (_, i) => (
        <NumberDisplay key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

function NumberDisplay({ mv, number }: { mv: MotionValue; number: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * HEIGHT;
    if (offset > 5) {
      memo -= 10 * HEIGHT;
    }
    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}

const Counter: React.FC<CounterProps> = ({
  start = 0,
  end,
  duration = end,
  className,
  fontSize = 30,
  ...rest
}) => {
  const [value, setValue] = useState(start);

  const getDuration = useCallback(() => {
    const diff = end - start;
    return diff > 0 ? (duration / diff) * 1000 : 1000;
  }, [start, end, duration]);

  useEffect(() => {
    if (value >= end) return;
    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev < end) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, getDuration());

    return () => clearInterval(interval);
  }, [value, end, getDuration]);

  return (
    <div
      style={{ fontSize }}
      {...rest}
      className={cn(
        "flex overflow-hidden rounded px-2 leading-none text-primary font-bold",
        className
      )}
    >
      {value >= 100000 && <Digit place={100000} value={value} />}
      {value >= 10000 && <Digit place={10000} value={value} />}
      {value >= 1000 && <Digit place={1000} value={value} />}
      {value >= 100 && <Digit place={100} value={value} />}
      {value >= 10 && <Digit place={10} value={value} />}
      <Digit place={1} value={value} />
    </div>
  );
};

export { Counter };
