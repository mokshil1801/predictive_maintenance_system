"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface KineticWarpTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function KineticWarpText({ text, className, delay = 0 }: KineticWarpTextProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={cn("relative overflow-hidden inline-block group", className)}>
      <span className="sr-only">{text}</span>
      <div 
        className="flex"
        aria-hidden="true"
      >
        {text.split("").map((char, i) => (
          <span
            key={i}
            className={cn(
              "inline-block transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0",
              isMounted ? "opacity-100 translate-y-0 translate-x-0 rotate-0 scale-100" : "translate-y-full translate-x-4 rotate-12 scale-150 blur-md",
              "hover:text-primary hover:scale-110 hover:-translate-y-1 hover:blur-none transition-all duration-300",
              char === " " ? "w-2 md:w-4" : ""
            )}
            style={{ 
              transitionDelay: isMounted ? `${i * 30}ms` : "0ms",
              transformOrigin: "bottom left"
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>
      
      {/* Warp Layer */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "bg-gradient-to-r from-transparent via-primary/20 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
        )}
      />
    </div>
  );
}
