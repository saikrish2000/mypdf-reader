import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const FlowButton: React.FC<FlowButtonProps> = ({ text = "Modern Button", className, ...props }) => {
  return (
    <button
      className={`group relative flex items-center justify-center gap-1 overflow-hidden rounded-full border border-foreground/20 bg-transparent px-8 py-3 text-sm font-semibold text-foreground cursor-pointer transition-all duration-700 ease-out hover:border-transparent hover:text-white hover:rounded-xl active:scale-[0.95] ${className || ''}`}
      {...props}
    >
      <ArrowRight
        className="absolute w-4 h-4 stroke-foreground fill-none z-10 transition-all duration-700 ease-out group-hover:left-4 group-hover:stroke-white"
        style={{ left: '-25%' }}
      />
      <span className="relative z-10 -translate-x-3 group-hover:translate-x-3 transition-all duration-700 ease-out">
        {text}
      </span>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all duration-700 ease-in" />
      <ArrowRight
        className="absolute w-4 h-4 stroke-foreground fill-none z-10 transition-all duration-700 ease-out group-hover:right-[-25%] group-hover:stroke-white"
        style={{ right: '1rem' }}
      />
    </button>
  );
};

export { FlowButton };
