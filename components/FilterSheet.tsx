'use client'

import React, { useEffect } from 'react'

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function FilterSheet({ isOpen, onClose, children }: FilterSheetProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />
      
      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[201] bg-space-dark/98 backdrop-blur-xl rounded-t-3xl border-t border-white/20 shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '85vh',
        }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-white/30 rounded-full" />
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto px-6 pb-8 max-h-[75vh]">
          {children}
        </div>
      </div>
    </>
  )
}

