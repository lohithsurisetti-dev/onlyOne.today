'use client'

import React, { useEffect, useState } from 'react'

interface CircularProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  showValue?: boolean
  gradient?: boolean
  className?: string
}

export default function CircularProgress({ 
  value, 
  size = 200,
  strokeWidth = 12,
  showValue = true,
  gradient = true,
  className = ''
}: CircularProgressProps) {
  const [offset, setOffset] = useState(0)
  const center = size / 2
  const radius = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  
  useEffect(() => {
    const progressOffset = ((100 - value) / 100) * circumference
    setOffset(progressOffset)
  }, [value, circumference])
  
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        {gradient && (
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        )}
        
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={gradient ? "url(#progressGradient)" : "#8b5cf6"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-ring__circle"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-bold text-white">{value}</span>
        </div>
      )}
    </div>
  )
}

