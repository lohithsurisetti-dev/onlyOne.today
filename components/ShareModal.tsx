'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Share2, Link as LinkIcon, Check, Instagram, MessageCircle } from 'lucide-react'
import { toJpeg } from 'html-to-image'
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
  isGhost?: boolean
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
  isGhost = false,
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
      
      // Add ghost flag
      if (isGhost) {
        params.set('isGhost', 'true')
      }
      
      setImageUrl(`/api/share-preview?${params.toString()}`)
    }
  }, [isOpen, content, score, type, message, rank, vibe, isGhost])
  
  const handleDownload = async () => {
    setDownloading(true)
    try {
      // Use the iframe to capture the content
      if (iframeRef.current?.contentWindow) {
        const iframe = iframeRef.current
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        
        if (iframeDoc) {
          // Wait a bit for iframe to fully load
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Get the card element from iframe
          const cardElement = iframeDoc.querySelector('.card') as HTMLElement
          
          if (cardElement) {
            try {
              const dataUrl = await toJpeg(cardElement, {
                width: 1200,
                height: 630,
                pixelRatio: 2,
                quality: 0.95,
                backgroundColor: '#0a0a1a'
              })
              
              // Create download link
              const link = document.createElement('a')
              link.download = `onlyone-${Date.now()}.jpg`
              link.href = dataUrl
              link.click()
            } catch (err) {
              console.error('Screenshot failed:', err)
              // Fallback: open in new window for manual download
              window.open(imageUrl, '_blank', 'width=1200,height=630')
            }
          } else {
            // Fallback: open in new window
            window.open(imageUrl, '_blank', 'width=1200,height=630')
          }
        } else {
          // Fallback: open in new window
          window.open(imageUrl, '_blank', 'width=1200,height=630')
        }
      } else {
        // Fallback: open in new window
        window.open(imageUrl, '_blank', 'width=1200,height=630')
      }
    } catch (error) {
      console.error('Download failed:', error)
      // Final fallback
      window.open(imageUrl, '_blank', 'width=1200,height=630')
    }
    setDownloading(false)
  }
  
  const getHomepageUrl = () => {
    // Use the actual deployed domain
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return 'https://onlyone.today'
  }
  
  const getShareText = () => {
    const homepageUrl = getHomepageUrl()
    return `${message}\n\n"${content}"\n\n🎯 Discover your uniqueness: ${homepageUrl}`
  }
  
  const handleCopyLink = () => {
    const shareText = getShareText()
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleShareWhatsApp = async () => {
    try {
      // Generate and download the image first
      const shareCardRef = document.getElementById('share-card-preview')
      if (!shareCardRef) return
      
      // Convert to blob
      const blob = await toJpeg(shareCardRef, {
        quality: 0.95,
        pixelRatio: 2,
      }).then(dataUrl => fetch(dataUrl)).then(res => res.blob())
      
      const file = new File([blob], 'onlyone-share.jpg', { type: 'image/jpeg' })
      const shareText = getShareText()
      
      // Try native share API (works on mobile!)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: shareText,
          files: [file],
        })
      } else {
        // Fallback: Download image and copy text
        await handleDownload()
        await navigator.clipboard.writeText(shareText)
        alert('📸 Image downloaded & text copied!\n\nNow:\n1. Open WhatsApp\n2. Paste the text\n3. Attach the downloaded image\n4. Send! ✨')
      }
    } catch (error) {
      console.error('Share failed:', error)
      // Fallback: just share text
      const shareText = getShareText()
      const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(url, '_blank')
    }
  }
  
  const handleShareInstagram = async () => {
    // Download the image first (Instagram doesn't support direct web sharing)
    await handleDownload()
    
    // Show helpful message
    alert('📸 Image downloaded! Now:\n\n1. Open Instagram app\n2. Create a new Story or Post\n3. Select the downloaded image\n4. Share! ✨')
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110"
        >
          <X size={20} className="text-white" />
        </button>
        
        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Your Moment
            </h2>
            <p className="text-sm text-white/60">
              Download as JPG or share with your friends
            </p>
          </div>
          
          {/* Preview */}
          <div className="relative mb-5 rounded-2xl overflow-hidden border border-white/20 bg-black/50 shadow-2xl">
            <div className="relative w-full" style={{ paddingBottom: '52.5%', height: 0 }}>
              <div className="absolute inset-0 flex items-center justify-center">
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
            {/* View Full Size Button - Always Visible */}
            <div className="absolute bottom-3 right-3">
              <button
                onClick={() => window.open(imageUrl, '_blank', 'width=1200,height=630')}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Full Size
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`py-3 rounded-xl font-semibold text-sm transition-all shadow-lg hover:scale-105 ${
                downloading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                type === 'uniqueness'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-purple-500/50'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-blue-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              <div className="flex items-center justify-center gap-2">
                {downloading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download JPG
                  </>
                )}
              </div>
            </button>
            
            <button
              onClick={handleCopyLink}
              className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all hover:scale-105"
            >
              <div className="flex items-center justify-center gap-2">
                {copied ? (
                  <>
                    <Check size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon size={18} />
                    Copy Link
                  </>
                )}
              </div>
            </button>
          </div>
          
          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-white/50 bg-gradient-to-br from-white/10 to-white/5 rounded-full py-1">
                Share to social
              </span>
            </div>
          </div>
          
          {/* Social Share Buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366]/90 hover:bg-[#25D366] text-white rounded-xl transition-all hover:scale-105 text-sm font-medium shadow-lg"
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
            
            <button
              onClick={handleShareInstagram}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-xl transition-all hover:scale-105 text-sm font-medium shadow-lg"
            >
              <Instagram size={16} />
              Instagram
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
              className="flex items-center justify-center gap-1.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all hover:scale-105 text-sm font-medium"
            >
              <Share2 size={16} />
              More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

