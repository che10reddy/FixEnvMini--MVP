const SnapshotSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section Skeleton */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="h-16 bg-muted/20 rounded-lg w-3/4 mx-auto shimmer" />
        <div className="h-6 bg-muted/20 rounded w-2/3 mx-auto shimmer" />
      </div>

      {/* Snapshot Card Skeleton */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden backdrop-blur-sm">
        {/* Header Bar Skeleton */}
        <div className="bg-muted/30 border-b border-border px-6 py-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-muted/20 rounded shimmer" />
          <div className="h-5 bg-muted/20 rounded w-32 shimmer" />
        </div>

        {/* JSON Preview Skeleton */}
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className={`h-4 bg-muted/20 rounded shimmer ${
                i === 1 || i === 10 ? "w-8" : i % 3 === 0 ? "w-3/4 ml-8" : "w-2/3 ml-8"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Buttons Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <div className="h-14 bg-muted/20 rounded-lg w-64 shimmer" />
        <div className="h-14 bg-muted/20 rounded-lg w-64 shimmer" />
      </div>

      {/* Notes Skeleton */}
      <div className="h-4 bg-muted/20 rounded w-96 mx-auto shimmer" />
    </div>
  );
};

export default SnapshotSkeleton;
