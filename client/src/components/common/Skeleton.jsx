import React from 'react';

export default function Skeleton({ className = "h-4 w-full" }) {
  return (
    <div 
      className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function HistoryItemSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}
