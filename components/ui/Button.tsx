import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({ 
  variant = 'primary', 
  size = 'md',
  className = '',
  children,
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:scale-105 active:scale-95',
    secondary: 'border border-accent-purple text-accent-purple hover:bg-accent-purple/10',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-space-light',
  }
  
  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-5 text-base',
    lg: 'h-14 px-6 text-lg',
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

