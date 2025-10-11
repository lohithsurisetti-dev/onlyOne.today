'use client'

import React, { useState } from 'react'
import Button from './ui/Button'
import TextArea from './ui/TextArea'
import { RadioGroup } from './ui/RadioGroup'
import { Select } from './ui/Select'
import Card from './ui/Card'

interface EnhancedInputProps {
  onSubmit: (data: {
    content: string
    inputType: 'action' | 'day'
    scope: 'city' | 'state' | 'country' | 'world'
    location?: string
  }) => void
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({ onSubmit }) => {
  const [inputType, setInputType] = useState<'action' | 'day'>('action')
  const [scope, setScope] = useState<'city' | 'state' | 'country' | 'world'>('world')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inputTypeOptions = [
    {
      value: 'action',
      label: 'Single Action',
      description: 'Share one specific thing you did today'
    },
    {
      value: 'day',
      label: 'Daily Routine',
      description: 'Share your entire day or routine'
    }
  ]

  const scopeOptions = [
    {
      value: 'world',
      label: 'Worldwide',
      icon: '🌍',
      description: 'Compare with everyone globally'
    },
    {
      value: 'country',
      label: 'Your Country',
      icon: '🏳️',
      description: 'Compare within your country'
    },
    {
      value: 'state',
      label: 'Your State/Region',
      icon: '🏛️',
      description: 'Compare within your state or region'
    },
    {
      value: 'city',
      label: 'Your City',
      icon: '🏙️',
      description: 'Compare within your city'
    }
  ]

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        content: content.trim(),
        inputType,
        scope,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPlaceholder = () => {
    if (inputType === 'action') {
      return 'What did you do today? (e.g., "played cricket", "baked banana bread", "didn\'t check social media")'
    } else {
      return 'Describe your day or routine... (e.g., "woke up at 6am, had coffee, worked from home, went for a walk, cooked dinner, read a book")'
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-text-primary">
          What did you do differently today?
        </h1>
        <p className="text-text-secondary">
          Share your moment and discover your uniqueness
        </p>
      </div>

      <Card className="p-6 space-y-4">
        {/* Content Input - Main Focus */}
        <div>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholder()}
            rows={inputType === 'action' ? 3 : 4}
            className="w-full"
          />
        </div>

        {/* Compact Options Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Input Type - Compact */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Type
            </label>
            <Select
              options={[
                { value: 'action', label: 'Single Action', icon: '⚡' },
                { value: 'day', label: 'Daily Routine', icon: '📅' }
              ]}
              value={inputType}
              onChange={(value) => setInputType(value as 'action' | 'day')}
              className="text-sm"
            />
          </div>

          {/* Scope - Compact */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Compare with
            </label>
            <Select
              options={scopeOptions}
              value={scope}
              onChange={(value) => setScope(value as any)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Submit Button - Clean */}
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          variant="primary"
          className="w-full py-3"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </div>
          ) : (
            'Discover'
          )}
        </Button>
      </Card>

      {/* Compact Info */}
      <div className="text-center">
        <p className="text-text-muted text-sm">
          ✨ Uniqueness • 🤝 Commonality • 🌍 Anonymous
        </p>
      </div>
    </div>
  )
}

export { EnhancedInput }
