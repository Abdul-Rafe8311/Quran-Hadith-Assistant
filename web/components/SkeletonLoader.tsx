export default function SkeletonLoader() {
  return (
    <div className="px-4 py-2">
      <div className="bg-white rounded-2xl rounded-tl-sm p-4 max-w-lg shadow-sm animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}
