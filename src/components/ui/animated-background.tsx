import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className }) => {
  const blur1Ref = useRef<HTMLDivElement>(null);
  const blur2Ref = useRef<HTMLDivElement>(null);
  const blur3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blurElements = [blur1Ref.current, blur2Ref.current, blur3Ref.current].filter(Boolean) as HTMLDivElement[];
    const rafIds = new Set<number>();
    const timeoutIds = new Set<ReturnType<typeof setTimeout>>();

    const randomX = (direction = 1) => (Math.random() * 800 - 400) * direction;
    const randomY = (direction = 1) => (Math.random() * 400 - 200) * direction;
    const randomTime = () => Math.random() * 6 + 6;
    const randomTime2 = () => Math.random() * 1 + 5;
    const randomAngle = (direction = 1) => (Math.random() * 180 - 30) * direction;

    blurElements.forEach((blur) => {
      if (blur) {
        blur.style.transform = `translate(${randomX(-1)}px, ${randomX(1)}px) rotate(${randomAngle(-1)}deg)`;
      }
    });

    const getTranslateValues = (transform: string) => {
      const match = transform.match(/translate\((.*?),(.*?)\)/);
      return {
        x: match ? match[1] : '0px',
        y: match ? match[2] : '0px',
      };
    };

    const getRotateValue = (transform: string) => {
      const match = transform.match(/rotate\((.*?)deg\)/);
      return match ? match[1] : '0';
    };

    const rotate = (target: HTMLElement, direction: number) => {
      const duration = randomTime2() * 1000;
      const angle = randomAngle(direction);
      const startTime = performance.now();
      const startAngle = parseFloat(getRotateValue(target.style.transform));

      const animateRotation = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easing = -(Math.cos(Math.PI * progress) - 1) / 2;
        const currentAngle = startAngle + (angle - startAngle) * easing;
        const { x, y } = getTranslateValues(target.style.transform);
        target.style.transform = `translate(${x}, ${y}) rotate(${currentAngle}deg)`;

        if (progress < 1) {
          const id = requestAnimationFrame(animateRotation);
          rafIds.add(id);
        } else {
          const t = setTimeout(() => rotate(target, direction * -1), 0);
          timeoutIds.add(t);
        }
      };

      const id = requestAnimationFrame(animateRotation);
      rafIds.add(id);
    };

    const moveX = (target: HTMLElement, direction: number) => {
      const duration = randomTime() * 1000;
      const targetX = randomX(direction);
      const startTime = performance.now();
      const startX = parseFloat(getTranslateValues(target.style.transform).x);
      const currentY = getTranslateValues(target.style.transform).y;

      const animateX = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easing = -(Math.cos(Math.PI * progress) - 1) / 2;
        const currentX = startX + (targetX - startX) * easing;
        const rotation = getRotateValue(target.style.transform);
        target.style.transform = `translate(${currentX}px, ${currentY}) rotate(${rotation}deg)`;

        if (progress < 1) {
          const id = requestAnimationFrame(animateX);
          rafIds.add(id);
        } else {
          const t = setTimeout(() => moveX(target, direction * -1), 0);
          timeoutIds.add(t);
        }
      };

      const id = requestAnimationFrame(animateX);
      rafIds.add(id);
    };

    const moveY = (target: HTMLElement, direction: number) => {
      const duration = randomTime() * 1000;
      const targetY = randomY(direction);
      const startTime = performance.now();
      const currentX = getTranslateValues(target.style.transform).x;
      const startY = parseFloat(getTranslateValues(target.style.transform).y);

      const animateY = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easing = -(Math.cos(Math.PI * progress) - 1) / 2;
        const currentY = startY + (targetY - startY) * easing;
        const rotation = getRotateValue(target.style.transform);
        target.style.transform = `translate(${currentX}, ${currentY}px) rotate(${rotation}deg)`;

        if (progress < 1) {
          const id = requestAnimationFrame(animateY);
          rafIds.add(id);
        } else {
          const t = setTimeout(() => moveY(target, direction * -1), 0);
          timeoutIds.add(t);
        }
      };

      const id = requestAnimationFrame(animateY);
      rafIds.add(id);
    };

    blurElements.forEach((blur) => {
      if (blur) {
        moveX(blur, 1);
        moveY(blur, -1);
        rotate(blur, 1);
      }
    });

    return () => {
      rafIds.forEach(id => cancelAnimationFrame(id));
      rafIds.clear();
      timeoutIds.forEach(t => clearTimeout(t));
      timeoutIds.clear();
    };
  }, []);

  return (
    <div className={className}>
      <div
        ref={blur1Ref}
        className="absolute w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] opacity-60"
      />
      <div
        ref={blur2Ref}
        className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] opacity-40"
      />
      <div
        ref={blur3Ref}
        className="absolute w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[90px] opacity-50"
      />
    </div>
  );
};

export { AnimatedBackground };
