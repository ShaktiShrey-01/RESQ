import { useId } from "react";
import { cn } from "../../lib/utils";
import { useSelector } from "react-redux";

export function DotPattern({
  width = 14,   
  height = 14,  
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1.5,     
  className,
  ...props
}) {
  const id = useId();
  const theme = useSelector((state) => state.theme.theme);

  const dotColor = theme === 'dark' ? 'white' : 'black';
  
  // CHANGED: Increased brightness/sharpness heavily for both modes
  const dotOpacity = theme === 'dark' ? '0.85' : '0.85'; 

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle 
            id="pattern-circle" 
            cx={cx} 
            cy={cy} 
            r={cr} 
            fill={dotColor} 
            opacity={dotOpacity} 
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}