'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================================
// TYPES
// ============================================================================

export interface MobileAnalyticsDropdownProps {
  type: 'my-posts' | 'global-pulse' | 'top-performers' | 'trending-info'
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
}

// ============================================================================
// MOBILE ANALYTICS DROPDOWN COMPONENT
// ============================================================================

export default function MobileAnalyticsDropdown({
  type,
  title,
  icon,
  children,
  defaultExpanded = false,
}: MobileAnalyticsDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="text-purple-300">
            {icon}
          </div>
          <span className="text-white font-medium text-sm">{title}</span>
        </div>
        
        <svg 
          className={`w-4 h-4 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  )
}

