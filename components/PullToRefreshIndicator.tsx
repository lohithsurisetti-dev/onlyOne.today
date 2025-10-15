'use client'

import React from 'react'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  progress: number
  isOverThreshold: boolean
}

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  isOverThreshold,
}: PullToRefreshIndicatorProps) {
  // Don't show if not pulling
  if (pullDistance === 0 && !isRefreshing) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance * 0.5, 50)}px)`,
        transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
        opacity: Math.min(pullDistance / 60, 1),
      }}
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
        <div className="flex items-center gap-2">
          {/* Spinner Icon */}
          {isRefreshing ? (
            <svg className="w-4 h-4 text-white/80 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg 
              className="w-4 h-4 text-white/60 transition-all duration-200"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                transform: `rotate(${progress * 3.6}deg)`,
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          
          {/* Minimal text */}
          {isRefreshing && (
            <span className="text-white/80 text-xs font-medium">Refreshing...</span>
          )}
        </div>
      </div>
    </div>
  )
}

