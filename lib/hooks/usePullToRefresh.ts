'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number // Pull distance needed to trigger refresh (default: 80px)
  resistance?: number // How much to slow down the pull (default: 2.5)
  enabled?: boolean // Enable/disable the feature (default: true)
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canPull, setCanPull] = useState(false)
  
  const touchStartY = useRef(0)
  const scrollableRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return
    
    // Only allow pull-to-refresh when scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
      setCanPull(true)
    } else {
      setCanPull(false)
    }
  }, [enabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing || !canPull) return
    
    const touchY = e.touches[0].clientY
    const pullDelta = touchY - touchStartY.current
    
    // Only allow pulling down (positive delta) when at top
    if (pullDelta > 0) {
      // Apply resistance to make it feel natural
      const resistedPull = pullDelta / resistance
      setPullDistance(Math.min(resistedPull, threshold * 1.5))
      
      // Prevent default scroll if pulling
      if (resistedPull > 10) {
        e.preventDefault()
      }
    }
  }, [enabled, isRefreshing, canPull, threshold, resistance])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing || !canPull) {
      setPullDistance(0)
      setCanPull(false)
      return
    }
    
    // If pulled beyond threshold, trigger refresh
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        // Small delay for visual feedback
        setTimeout(() => {
          setIsRefreshing(false)
          setPullDistance(0)
          setCanPull(false)
        }, 300)
      }
    } else {
      // Snap back
      setPullDistance(0)
      setCanPull(false)
    }
  }, [enabled, isRefreshing, canPull, pullDistance, threshold, onRefresh])

  useEffect(() => {
    if (!enabled) return

    const element = scrollableRef.current || document.body
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Calculate progress percentage for visual feedback
  const progress = Math.min((pullDistance / threshold) * 100, 100)
  const isOverThreshold = pullDistance >= threshold

  return {
    pullDistance,
    isRefreshing,
    progress,
    isOverThreshold,
    scrollableRef,
  }
}

