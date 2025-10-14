/**
 * Skeleton loader for post cards
 * Shows animated placeholder while posts are loading
 */

export default function PostCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 animate-pulse">
      {/* Header - Score/Count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Type badge skeleton */}
          <div className="h-5 w-16 bg-white/10 rounded-full"></div>
          {/* Score skeleton */}
          <div className="h-5 w-12 bg-white/10 rounded"></div>
        </div>
        {/* Count skeleton */}
        <div className="h-5 w-20 bg-white/10 rounded"></div>
      </div>

      {/* Content skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-4/5"></div>
        <div className="h-4 bg-white/10 rounded w-3/5"></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {/* Scope + Location */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-white/10 rounded"></div>
          <div className="h-4 w-24 bg-white/10 rounded"></div>
        </div>
        {/* Time */}
        <div className="h-4 w-16 bg-white/10 rounded"></div>
      </div>
    </div>
  )
}

/**
 * Skeleton for Trending Info Card
 */
export function TrendingInfoSkeleton() {
  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 bg-white/20 rounded"></div>
        <div className="h-6 w-40 bg-white/20 rounded"></div>
      </div>

      {/* Trending items */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-white/15 rounded w-full"></div>
            <div className="h-3 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

