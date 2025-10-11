'use client'

import { useEffect, useRef } from 'react'

interface StarsBackgroundProps {
  count?: number
}

export default function StarsBackground({ count = 100 }: StarsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    
    // Clear existing stars
    container.innerHTML = ''
    
    // Generate stars
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      
      // Random size (1-3px)
      const size = Math.random() * 2 + 1
      star.style.width = `${size}px`
      star.style.height = `${size}px`
      
      // Random position
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      
      // Random opacity
      star.style.opacity = `${Math.random()}`
      
      // Random animation delay
      star.style.animationDelay = `${Math.random() * -50}s`
      
      container.appendChild(star)
    }
  }, [count])
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    />
  )
}

