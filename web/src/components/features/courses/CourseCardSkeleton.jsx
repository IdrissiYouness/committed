export default function CourseCardSkeleton() {
  return (
    <div className="flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5 animate-pulse min-h-[160px]">
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex-1 space-y-3 pt-1">
          {/* Title skeleton */}
          <div className="h-6 w-3/4 rounded bg-neutral-200"></div>
          {/* Course code/subject skeleton */}
          <div className="h-4 w-1/2 rounded bg-neutral-100"></div>
        </div>
        {/* Icon skeleton */}
        <div className="h-10 w-10 shrink-0 rounded-lg bg-neutral-100"></div>
      </div>

      <div className="mt-6 flex w-full items-center justify-between border-t border-neutral-100 pt-4">
        {/* Teacher info skeleton */}
        <div className="flex items-center gap-2 w-1/2">
          <div className="h-4 w-4 shrink-0 rounded-full bg-neutral-200"></div>
          <div className="h-4 w-3/4 rounded bg-neutral-100"></div>
        </div>
        {/* View details skeleton */}
        <div className="h-4 w-20 shrink-0 rounded bg-neutral-100 ml-4"></div>
      </div>
    </div>
  );
}