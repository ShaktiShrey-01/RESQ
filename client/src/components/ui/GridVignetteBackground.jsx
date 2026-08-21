import React from "react";
import { cn } from "../../lib/utils";

export function GridVignetteBackground({
  className,
  size = 64, // Grid square size
  x = 50,
  y = 50,
  horizontalVignetteSize = 100,
  verticalVignetteSize = 100,
  intensity = 70, // Keeps the smooth fade-out at the screen edges
  ...props
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 -z-10 pointer-events-none overflow-hidden",
        // Pure White in light mode, Pure Black in dark mode
        "bg-white dark:bg-black transition-colors duration-300",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0",
          // 🟢 FIXED: Increased opacity from 0.03 to 0.08 (8%) for brighter, crisper lines
          "bg-[image:linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)]",
          "dark:bg-[image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
        )}
        style={{
          backgroundSize: `${size}px ${size}px`,
          // The vignette mask that fades the lines out smoothly at the borders
          maskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${
            100 - intensity
          }%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${
            100 - intensity
          }%, transparent 100%)`,
        }}
      />
    </div>
  );
}