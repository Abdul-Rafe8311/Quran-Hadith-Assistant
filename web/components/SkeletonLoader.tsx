export default function SkeletonLoader() {
  return (
    <div className="px-4 py-2 flex justify-start fade-in">
      <div className="bg-white rounded-2xl rounded-tl-sm max-w-lg w-full shadow-sm border border-[#c9a84c]/10 overflow-hidden">
        <div className="h-0.5 shimmer" />
        <div className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full shimmer" />
            <div className="h-3 shimmer rounded w-28" />
          </div>
          <div className="h-3 shimmer rounded w-3/4" />
          <div className="h-3 shimmer rounded w-full" />
          <div className="h-3 shimmer rounded w-5/6" />
          <div className="h-3 shimmer rounded w-2/3" />
          <div className="h-10 shimmer rounded-xl w-full mt-3" />
        </div>
      </div>
    </div>
  );
}
