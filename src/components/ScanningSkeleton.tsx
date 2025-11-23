const ScanningSkeleton = () => {
  return (
    <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
      {/* Hero Title Skeleton */}
      <div className="space-y-4">
        <div className="h-16 bg-muted/20 rounded-lg w-3/4 mx-auto shimmer" />
        <div className="h-6 bg-muted/20 rounded w-2/3 mx-auto shimmer" />
      </div>

      {/* Progress Box Skeleton */}
      <div className="bg-card/50 border border-border rounded-xl p-8 backdrop-blur-sm space-y-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-muted/20 shimmer" />
              </div>
              <div className="h-5 bg-muted/20 rounded flex-1 shimmer" />
            </div>
          ))}
        </div>

        {/* Loading Bar Skeleton */}
        <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary/40 to-accent/40 rounded-full shimmer" />
        </div>
      </div>

      {/* Note Skeleton */}
      <div className="h-4 bg-muted/20 rounded w-48 mx-auto shimmer" />
    </div>
  );
};

export default ScanningSkeleton;
