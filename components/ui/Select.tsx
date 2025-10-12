import React, { useState, useRef, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
  icon?: string | React.ReactNode
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 text-sm
          ${isOpen 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-space-light hover:border-space-medium bg-space-dark/50'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          {selectedOption?.icon && (
            typeof selectedOption.icon === 'string' ? (
              <span className="text-lg">{selectedOption.icon}</span>
            ) : (
              <span className="flex items-center">{selectedOption.icon}</span>
            )
          )}
          <span className={selectedOption ? 'text-text-primary' : 'text-text-secondary'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-space-dark border border-space-light rounded-lg shadow-2xl overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`
                w-full flex items-center space-x-2 p-3 text-left transition-colors duration-200 text-sm
                ${value === option.value 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'hover:bg-space-light/50 text-text-primary'
                }
              `}
            >
              {option.icon && (
                typeof option.icon === 'string' ? (
                  <span className="text-lg">{option.icon}</span>
                ) : (
                  <span className="flex items-center">{option.icon}</span>
                )
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
