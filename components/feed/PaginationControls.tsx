'use client'

import React from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  
  // Trending refresh
  showTrendingRefresh?: boolean
  onTrendingRefresh?: () => void
  trendingLoading?: boolean
}

// ============================================================================
// PAGINATION CONTROLS COMPONENT
// ============================================================================

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  showTrendingRefresh = false,
  onTrendingRefresh,
  trendingLoading = false,
}: PaginationControlsProps) {
  // Don't show if no pagination needed and no trending refresh
  if (totalPages <= 1 && !showTrendingRefresh) {
    return null
  }
  
  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1))
  }
  
  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 bg-space-dark/95 backdrop-blur-xl rounded-full border border-white/30 shadow-2xl">
      {/* Pagination controls (only show if needed) */}
      {totalPages > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous page"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-xs text-white/70 px-2">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next page"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Refresh button for trending */}
      {showTrendingRefresh && onTrendingRefresh && (
        <>
          {totalPages > 1 && <div className="w-px h-4 bg-white/20" />}
          <button
            onClick={onTrendingRefresh}
            disabled={trendingLoading}
            className="p-1.5 rounded-full hover:bg-orange-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Refresh trending data"
          >
            <svg 
              className={`w-4 h-4 text-white ${trendingLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

