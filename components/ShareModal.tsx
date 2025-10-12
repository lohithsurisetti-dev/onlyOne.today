'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Share2, Twitter, Facebook, Link as LinkIcon, Check } from 'lucide-react'
import { toPng } from 'html-to-image'
import Button from './ui/Button'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  score: number
  type: 'uniqueness' | 'commonality'
  message: string
  rank: string
  scope?: string
  inputType?: string
  vibe?: string
}

export default function ShareModal({
  isOpen,
  onClose,
  content,
  score,
  type,
  message,
  rank,
  scope = 'world',
  inputType = 'action',
  vibe,
}: ShareModalProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  useEffect(() => {
    if (isOpen) {
      // Generate the share card URL
      const params = new URLSearchParams({
        content: content.substring(0, 100), // Allow longer content
        score: score.toString(),
        type,
        message: message, // Full message
        scope: scope,
        inputType: inputType,
      })
      
      // Add vibe if provided
      if (vibe) {
        params.set('vibe', vibe)
      }
      
      setImageUrl(`/api/share-preview?${params.toString()}`)
    }
  }, [isOpen, content, score, type, message, rank, vibe])
  
  const handleDownload = async () => {
    setDownloading(true)
    try {
      // Open the share card in a new window for download
      const newWindow = window.open(imageUrl, '_blank', 'width=1200,height=630')
      
      if (newWindow) {
        // Wait for the window to load
        setTimeout(() => {
          try {
            const doc = newWindow.document
            const element = doc.querySelector('.social-card') as HTMLElement
            
            if (element) {
              toPng(element, {
                width: 1200,
                height: 630,
                pixelRatio: 2,
              })
                .then((dataUrl) => {
                  const link = document.createElement('a')
                  link.download = `onlyone-${Date.now()}.png`
                  link.href = dataUrl
                  link.click()
                  newWindow.close()
                })
                .catch((err) => {
                  console.error('Download failed:', err)
                  // Fallback: keep window open for manual screenshot
                })
            }
          } catch (err) {
            console.error('Cross-origin error:', err)
            // Window stays open for manual screenshot
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
    setDownloading(false)
  }
  
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${imageUrl}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleShareTwitter = () => {
    const text = `I'm ${rank} most unique today! ${content} #OnlyOneToday`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank')
  }
  
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank')
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-card-dark rounded-2xl shadow-glow overflow-hidden animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-space-light/50 hover:bg-space-light transition-colors"
        >
          <X size={24} className="text-text-secondary" />
        </button>
        
        {/* Content */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Share Your Moment
          </h2>
          <p className="text-text-secondary mb-6">
            Download or share this beautifully crafted card
          </p>
          
          {/* Preview */}
          <div className="relative mb-6 rounded-xl overflow-hidden border border-space-light bg-black">
            <div className="relative w-full" style={{ paddingBottom: '52.5%', height: 0 }}>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div 
                  className="relative"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '600px',
                    maxHeight: '315px'
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    src={imageUrl}
                    title="Share card preview"
                    style={{ 
                      width: '1200px',
                      height: '630px',
                      border: 'none',
                      transform: 'scale(0.5)',
                      transformOrigin: 'center center',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-315px',
                      marginLeft: '-600px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={20} />
              {downloading ? 'Downloading...' : 'Download Image'}
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon size={20} />
                  Copy Link
                </>
              )}
            </Button>
          </div>
          
          {/* Social Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm text-text-muted text-center">Share to social media</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-6 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors font-medium"
              >
                <Twitter size={20} />
                Twitter
              </button>
              
              <button
                onClick={handleShareFacebook}
                className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg transition-colors font-medium"
              >
                <Facebook size={20} />
                Facebook
              </button>
              
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'OnlyOne.today',
                      text: content,
                      url: window.location.href,
                    })
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-lg transition-colors font-medium"
              >
                <Share2 size={20} />
                More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

