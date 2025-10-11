import React, { useState } from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number
  showCounter?: boolean
}

export default function TextArea({ 
  maxLength = 200,
  showCounter = true,
  className = '',
  ...props 
}: TextAreaProps) {
  const [count, setCount] = useState(0)
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCount(e.target.value.length)
    props.onChange?.(e)
  }
  
  return (
    <div className="relative flex flex-col w-full">
      <textarea
        className={`
          w-full min-h-32 p-4 
          bg-space-mid/80 backdrop-blur-sm 
          border-2 border-space-light rounded-xl 
          text-text-primary placeholder:text-text-muted
          resize-none overflow-hidden
          focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20
          hover:border-space-medium
          transition-all duration-200
          ${className}
        `}
        maxLength={maxLength}
        onChange={handleChange}
        {...props}
      />
      {showCounter && (
        <span className="absolute bottom-3 right-4 text-xs text-text-muted">
          {count} / {maxLength}
        </span>
      )}
    </div>
  )
}

