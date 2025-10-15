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
        transform: `translateY(${Math.min(pullDistance, 100)}px)`,
        transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
      }}
    >
      <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-md rounded-full px-6 py-3 shadow-2xl border border-white/20">
        <div className="flex items-center gap-3">
          {/* Icon */}
          {isRefreshing ? (
            <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg 
              className="w-5 h-5 text-white transition-transform duration-200"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                transform: isOverThreshold ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          
          {/* Text */}
          <span className="text-white font-bold text-sm">
            {isRefreshing 
              ? 'Refreshing...' 
              : isOverThreshold 
              ? 'Release to refresh' 
              : 'Pull to refresh'}
          </span>
          
          {/* Progress indicator (circular) */}
          {!isRefreshing && (
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 transform -rotate-90">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-white/30"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="text-white transition-all duration-100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">{Math.round(progress)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

