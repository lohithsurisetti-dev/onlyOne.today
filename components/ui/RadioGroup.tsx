import React from 'react'

interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            relative flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
            ${value === option.value 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-space-light hover:border-space-medium bg-space-dark/50'
            }
          `}
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div className={`
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
            ${value === option.value 
              ? 'border-purple-500 bg-purple-500' 
              : 'border-space-medium'
            }
          `}>
            {value === option.value && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-text-primary font-medium">
              {option.label}
            </div>
            {option.description && (
              <div className="text-text-secondary text-sm mt-1">
                {option.description}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}
