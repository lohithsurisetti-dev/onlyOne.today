import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'glow' | 'glow-blue'
  className?: string
}

export default function Card({ 
  children, 
  variant = 'default',
  className = '' 
}: CardProps) {
  const variants = {
    default: 'bg-card-dark shadow-lg',
    glow: 'bg-card-dark shadow-glow',
    'glow-blue': 'bg-card-dark shadow-glow-blue',
  }
  
  return (
    <div className={`
      rounded-xl p-8 sm:p-12 
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </div>
  )
}

