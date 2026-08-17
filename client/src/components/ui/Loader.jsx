import React from 'react';
import { cn } from '../../lib/utils';

export default function Loader({ fullScreen = false, small = false, text = "Loading" }) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <svg
        // When small, it shrinks to fit inside a button perfectly
        className={cn(
          "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]", 
          small ? "h-6 w-12" : "h-12 w-24"
        )}
        viewBox="0 0 100 50"
        fill="none"
        stroke="currentColor"
        strokeWidth={small ? "6" : "4"}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M 0 25 L 20 25 L 30 10 L 45 45 L 60 25 L 100 25"
          className="animate-[heartbeat-line_1.5s_linear_infinite]"
          style={{ strokeDasharray: '150', strokeDashoffset: '150' }}
        />
      </svg>

      {/* Hide text if it's inside a button */}
      {!small && (
        <span className="text-emerald-500 font-black tracking-widest uppercase text-sm mt-2 animate-[heartbeat-text_1.5s_ease-in-out_infinite]">
          {text}...
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--global-bg)]/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}