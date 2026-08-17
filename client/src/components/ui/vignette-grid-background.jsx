import React from "react";
import { cn } from "../../lib/utils";

export function GridVignetteBackground({
  className,
  size = 45, // Increased size to make the grid boxes larger (less lines)
  x = 50,
  y = 50,
  horizontalVignetteSize = 75, 
  verticalVignetteSize = 50, // Restricts height to 50% so it NEVER touches the Navbar or Footer
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
        // Uses the auto-changing CSS variables from index.css
        backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
        // Fades out into complete transparency before hitting the top/bottom edges
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