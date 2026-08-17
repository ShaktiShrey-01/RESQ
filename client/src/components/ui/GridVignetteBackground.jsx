import React from "react";
import { cn } from "../../lib/utils";

export function GridVignetteBackground({
  className,
  size = 45, 
  x = 50,
  y = 50,
  horizontalVignetteSize = 120, // 👈 Expanded to touch the edges!
  verticalVignetteSize = 120,   // 👈 Expanded to touch the edges!
  intensity = 30,
  ...props
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 transition-opacity duration-500",
        className
      )}
      style={{
        backgroundSize: `${size}px ${size}px`,
        backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
        maskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${
          100 - intensity
        }%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${
          100 - intensity
        }%, transparent 100%)`,
      }}
      {...props}
    />
  );
}