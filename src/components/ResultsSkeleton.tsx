const ResultsSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section Skeleton */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="h-16 bg-muted/20 rounded-lg w-3/4 mx-auto shimmer" />
        <div className="h-6 bg-muted/20 rounded w-1/2 mx-auto shimmer" />
      </div>

      {/* Issues Card Skeleton */}
      <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-muted/20 rounded shimmer" />
          <div className="h-8 bg-muted/20 rounded w-48 shimmer" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-codeBg border border-border rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-muted/20 rounded shimmer flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="h-5 bg-muted/20 rounded w-40 shimmer" />
                    <div className="h-6 bg-muted/20 rounded w-20 shimmer" />
                    <div className="h-6 bg-muted/20 rounded w-16 shimmer" />
                  </div>
                  <div className="h-4 bg-muted/20 rounded w-full shimmer" />
                  <div className="h-4 bg-muted/20 rounded w-3/4 shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions Skeleton */}
      <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-muted/20 rounded shimmer" />
          <div className="h-8 bg-muted/20 rounded w-48 shimmer" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-muted/20 rounded shimmer flex-shrink-0 mt-0.5" />
              <div className="h-5 bg-muted/20 rounded flex-1 shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Diff Viewer Skeleton */}
      <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm">
        <div className="h-8 bg-muted/20 rounded w-48 mb-6 shimmer" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-muted/20 rounded w-40 mb-4 shimmer" />
              <div className="bg-codeBg border border-border rounded-lg p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-5 bg-muted/20 rounded shimmer" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="flex justify-center pt-4">
        <div className="h-14 bg-muted/20 rounded-lg w-64 shimmer" />
      </div>
    </div>
  );
};

export default ResultsSkeleton;
