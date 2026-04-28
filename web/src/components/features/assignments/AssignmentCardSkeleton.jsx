import React from 'react';

export default function AssignmentCardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5 animate-pulse">
      <div className="flex-1 space-y-3">
        {/* Course name skeleton */}
        <div className="h-3 w-24 rounded bg-neutral-100"></div>
        {/* Title skeleton */}
        <div className="h-5 w-64 rounded bg-neutral-200"></div>
        
        {/* Meta info skeleton (due date, points) */}
        <div className="flex items-center gap-4 mt-2">
          <div className="h-4 w-32 rounded bg-neutral-100"></div>
          <div className="h-4 w-16 rounded bg-neutral-100"></div>
        </div>
      </div>
      
      {/* Status badge and button skeleton */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 mt-4 sm:mt-0">
        <div className="h-6 w-20 rounded bg-neutral-100"></div>
        <div className="h-9 w-24 rounded-lg bg-neutral-200"></div>
      </div>
    </div>
  );
}