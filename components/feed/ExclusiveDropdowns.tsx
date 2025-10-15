'use client'

import React, { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface DropdownOption {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export interface ExclusiveDropdownsProps {
  options: DropdownOption[]
}

// ============================================================================
// EXCLUSIVE DROPDOWNS COMPONENT
// Only one can be open at a time, shared expansion area
// ============================================================================

export default function ExclusiveDropdowns({ options }: ExclusiveDropdownsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const toggleDropdown = (id: string) => {
    setActiveId(activeId === id ? null : id)
  }
  
  const activeOption = options.find(opt => opt.id === activeId)
  
  return (
    <div className="space-y-2">
      {/* Headers Row */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleDropdown(option.id)}
            className={`p-3 rounded-xl backdrop-blur-sm border transition-all flex items-center justify-between ${
              activeId === option.id
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`${activeId === option.id ? 'text-purple-300' : 'text-white/60'}`}>
                {option.icon}
              </div>
              <span className={`text-sm font-medium ${activeId === option.id ? 'text-white' : 'text-white/70'}`}>
                {option.title}
              </span>
            </div>
            
            <svg 
              className={`w-4 h-4 text-white/60 transition-transform ${activeId === option.id ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ))}
      </div>
      
      {/* Shared Expansion Area */}
      {activeId && activeOption && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {activeOption.content}
        </div>
      )}
    </div>
  )
}

