import React from 'react';

/**
 * Minimal, subtle ambient background decoration for authentication pages.
 * Free of excess abstraction, wireframe ribbons, or visual clutter.
 */
export default function AuthBackgroundDecor() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Soft ambient light blooms */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/10 dark:bg-brand-400/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-400/15 blur-3xl" />

      {/* Subtle precision dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05] dark:opacity-[0.10]" />
    </div>
  );
}
