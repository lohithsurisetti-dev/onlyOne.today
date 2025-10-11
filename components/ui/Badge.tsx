import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'purple' | 'blue' | 'pink' | 'gray'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'purple',
  size = 'md',
  className = '' 
}: BadgeProps) {
  const variants = {
    purple: 'bg-accent-purple/20 text-accent-purple',
    blue: 'bg-accent-blue/20 text-accent-blue',
    pink: 'bg-accent-pink/20 text-accent-pink',
    gray: 'bg-space-light text-text-secondary',
  }
  
  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-xs',
  }
  
  return (
    <div className={`
      inline-flex items-center justify-center
      rounded-full font-medium
      ${variants[variant]} 
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </div>
  )
}

