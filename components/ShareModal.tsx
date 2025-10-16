'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Share2, Link as LinkIcon, Check, Instagram, MessageCircle } from 'lucide-react'
import { toPng } from 'html-to-image'
import { getSiteUrl } from '@/lib/config/site'

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
  isOwnPost?: boolean // If true, use "you" language. If false, use promotional language
  locationCity?: string
  locationState?: string
  locationCountry?: string
  percentile?: {
    percentile: number
    tier: string
    displayText: string
    badge: string
    comparison: string
    message: string
  }
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
  isOwnPost = true,
  locationCity,
  locationState,
  locationCountry,
  percentile,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [previewScale, setPreviewScale] = useState(0.28)
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Determine if top tier
  const isTopTier = percentile && 
    ['elite', 'rare', 'unique', 'notable'].includes(percentile.tier)
  
  // Determine color scheme
  const getColorScheme = () => {
    if (inputType === 'day') {
      return isTopTier
        ? { gradient: ['#fb923c', '#fbbf24'], gradientClass: 'from-orange-500 to-amber-500', text: '#ea580c', bg: '#fff7ed', accent: '#fed7aa', modalBg: 'from-orange-500/10 to-amber-500/10', modalBorder: 'border-orange-400/20', modalText: 'text-orange-300', button: 'from-orange-500 to-amber-500 hover:shadow-orange-500/50' }
        : { gradient: ['#14b8a6', '#10b981'], gradientClass: 'from-teal-500 to-emerald-500', text: '#0f766e', bg: '#f0fdfa', accent: '#99f6e4', modalBg: 'from-teal-500/10 to-emerald-500/10', modalBorder: 'border-teal-400/20', modalText: 'text-teal-300', button: 'from-teal-500 to-emerald-500 hover:shadow-teal-500/50' }
    } else {
      return isTopTier
        ? { gradient: ['#a855f7', '#ec4899'], gradientClass: 'from-purple-500 to-pink-500', text: '#9333ea', bg: '#faf5ff', accent: '#e9d5ff', modalBg: 'from-purple-500/10 to-pink-500/10', modalBorder: 'border-purple-400/20', modalText: 'text-purple-300', button: 'from-purple-500 to-pink-500 hover:shadow-purple-500/50' }
        : { gradient: ['#3b82f6', '#06b6d4'], gradientClass: 'from-blue-500 to-cyan-500', text: '#2563eb', bg: '#eff6ff', accent: '#bfdbfe', modalBg: 'from-blue-500/10 to-cyan-500/10', modalBorder: 'border-blue-400/20', modalText: 'text-blue-300', button: 'from-blue-500 to-cyan-500 hover:shadow-blue-500/50' }
    }
  }
  
  const colors = getColorScheme()
  
  // Calculate preview scale
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    
    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const scale = Math.min((containerWidth - 16) / 1200, 0.5)
      setPreviewScale(scale)
    }
    
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [isOpen])
  
  const getHomepageUrl = () => {
    return getSiteUrl()
  }
  
  const getShareText = () => {
    const homepageUrl = getHomepageUrl()
    
    // Different messaging for own posts vs. feed posts
    if (!isOwnPost) {
      // Sharing from feed - promotional language
      const scopeText = scope === 'world' 
        ? 'globally' 
        : scope === 'country'
        ? `in ${locationCountry}`
        : scope === 'state'
        ? `in ${locationState}`
        : `in ${locationCity}`
      
      const tierText = percentile?.tier === 'elite' 
        ? 'Only one person did this'
        : percentile?.tier === 'rare' 
        ? 'Super rare action'
        : percentile?.tier === 'unique'
        ? 'Unique moment'
        : 'Interesting action'
      
      return `${tierText} ${scopeText} on OnlyOne Today! 🎯\n\n"${content}"\n\n✨ What did YOU do today? Share at: ${homepageUrl}`
    }
    
    // Own post - use personal language
    const shareMessage = percentile?.message || message
    
    // Format scope for display with actual location values
    const scopeText = scope === 'world' 
      ? 'globally' 
      : scope === 'country'
      ? `in ${locationCountry || 'your country'}`
      : scope === 'state'
      ? `in ${locationState || 'your state'}`
      : `in ${locationCity || 'your city'}`
    
    // Add scope context to the message
    const fullMessage = `${shareMessage} ${scopeText}!`
    
    return `${fullMessage}\n\n"${content}"\n\n🎯 Discover your uniqueness: ${homepageUrl}`
  }
  
  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        width: 1200,
        height: 630,
        cacheBust: true,
      })
      
      const response = await fetch(dataUrl)
      return await response.blob()
    } catch (error) {
      console.error('Failed to generate image:', error)
      return null
    }
  }
  
  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (!cardRef.current) {
        console.error('❌ cardRef.current is null')
        alert('Card element not found. Please try refreshing the page.')
        return
      }
      
      console.log('🖼️ Starting image capture...')
      console.log('📏 Card element:', cardRef.current)
      console.log('📐 Card dimensions:', cardRef.current.offsetWidth, 'x', cardRef.current.offsetHeight)
      
      // Check if element is visible and has content
      const computedStyle = window.getComputedStyle(cardRef.current)
      console.log('🎨 Element styles:', {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        position: computedStyle.position
      })
      
      // Wait a bit for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 100))
      
      try {
        // High-quality capture with optimized settings
        console.log('📸 Attempting toPng capture...')
        const dataUrl = await toPng(cardRef.current, {
          quality: 1.0,
          pixelRatio: 2, // Higher resolution for better quality
          backgroundColor: '#ffffff',
          skipFonts: false, // Include fonts for better quality
          skipAutoScale: false, // Allow scaling for quality
          width: 1200, // Explicit dimensions to avoid white space
          height: 630,
          style: {
            transform: 'scale(1)', // Reset any transforms
            transformOrigin: 'top left'
          }
        })
        
        console.log('✅ toPng capture successful, dataUrl length:', dataUrl.length)
        
        // Create download link
        const link = document.createElement('a')
        link.download = `onlyone-${Date.now()}.png`
        link.href = dataUrl
        link.style.display = 'none'
        
        // Trigger download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('✅ High-quality download completed!')
        return // Exit successfully
        
      } catch (toPngError) {
        console.error('❌ toPng failed:', toPngError)
        throw toPngError // Re-throw to trigger fallback
      }
    } catch (error) {
      console.error('❌ Download failed with error:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Try a simpler fallback
      try {
        console.log('🔄 Trying fallback method...')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas context not available')
        
        canvas.width = 1200
        canvas.height = 630
        
        // Fill with white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 1200, 630)
        
        // Add text
        ctx.fillStyle = '#333333'
        ctx.font = '48px Arial'
        ctx.fillText('Share Image Preview', 100, 100)
        ctx.fillText(content.substring(0, 50), 100, 200)
        
        const fallbackDataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `onlyone-fallback-${Date.now()}.png`
        link.href = fallbackDataUrl
        link.click()
        
        console.log('✅ Fallback download completed!')
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        alert('Download failed. Please try using the "Copy Link" button instead.')
      }
    } finally {
      setDownloading(false)
    }
  }
  
  const handleCopyLink = () => {
    const shareText = getShareText()
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleShareWhatsApp = async () => {
    setSharing(true)
    try {
      if (!cardRef.current) {
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
        window.open(url, '_blank')
        return
      }
      
      console.log('📱 Starting WhatsApp share...')
      
      // Capture the DOM element directly as PNG
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200,
        height: 630,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      })
      
      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      const file = new File([blob], 'onlyone-share.png', { type: 'image/png' })
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: getShareText(),
          files: [file],
        })
        console.log('✅ WhatsApp share completed!')
      } else {
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
        window.open(url, '_blank')
        
        const imageUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'onlyone-share.png'
        link.href = imageUrl
        link.click()
        URL.revokeObjectURL(imageUrl)
        console.log('✅ Fallback: WhatsApp opened, image downloaded')
      }
    } catch (error) {
      console.error('❌ WhatsApp share failed:', error)
      // Final fallback: just open WhatsApp with text
      const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
    window.open(url, '_blank')
    } finally {
      setSharing(false)
    }
  }
  
  const handleShareInstagram = async () => {
    await handleDownload()
    alert('📸 Image downloaded!\n\n1. Open Instagram app\n2. Create a Story or Post\n3. Select the downloaded image\n4. Share! ✨')
  }
  
  const handleNativeShare = async () => {
    setSharing(true)
    try {
      const blob = await generateImage()
      if (!blob) return
      
      const file = new File([blob], 'onlyone-share.png', { type: 'image/png' })
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'OnlyOne Today',
          text: getShareText(),
          files: [file],
        })
      } else if (navigator.share) {
        await navigator.share({
          title: 'OnlyOne Today',
          text: getShareText(),
          url: window.location.href,
        })
      }
    } catch (error) {
      console.error('Native share failed:', error)
    } finally {
      setSharing(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="relative bg-gradient-to-br from-space-dark via-space-darker to-space-darkest rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Ambient Glow */}
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${colors.modalBg.replace('/10', '/20')}`} />
          
        {/* Close Button */}
        <button
          onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-110 group"
        >
            <X size={20} className="text-white/70 group-hover:text-white transition-colors" />
        </button>
          
          {/* Content Grid */}
          <div className="relative grid lg:grid-cols-2 gap-6 p-6 sm:p-8">
            {/* Left Side - Preview */}
            <div className="flex flex-col">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Preview
              </h3>
              
              {/* Share Card Preview - Direct DOM */}
              <div ref={containerRef} className="flex-1 relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white">
                <div className="w-full" style={{ paddingBottom: '52.5%' }}>
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    {/* Card at 1200x630, scaled down for preview */}
                    <div
                      ref={cardRef}
                      className="relative"
                      style={{ 
                        width: '1200px', 
                        height: '630px', 
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'center',
                        transition: 'transform 0.2s ease-out',
                        background: 'white',
                        borderRadius: '0px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Minimalist Design - Inspired by successful social cards */}
                      
                      {/* Top Section - Branding */}
                      <div 
                        className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6"
                        style={{ 
                          background: `linear-gradient(90deg, ${colors.gradient[0]} 0%, ${colors.gradient[1]} 100%)`,
                          height: '120px'
                        }}
                      >
                        <div className="text-white">
                          <h1 className="text-3xl font-bold mb-1">OnlyOne Today</h1>
                          <p className="text-white/80 text-sm">Discover your uniqueness</p>
                        </div>
                        <div className="text-white text-right">
                          <p className="text-lg font-semibold">{percentile?.displayText || `${score}%`}</p>
                          <p className="text-white/80 text-xs">{percentile?.comparison || '1 of 23'}</p>
                        </div>
                      </div>
                      
                      {/* Main Content Area */}
                      <div 
                        className="absolute left-0 right-0 flex flex-col justify-center items-center px-12"
                        style={{ 
                          top: '120px',
                          bottom: '100px'
                        }}
                      >
                        {/* Quote */}
                        <div className="text-center max-w-4xl">
                          <p 
                            className="font-bold text-gray-900 italic leading-relaxed"
                            style={{ 
                              fontSize: content.length > 100 ? '1.8rem' : content.length > 60 ? '2rem' : '2.2rem',
                              letterSpacing: '-0.02em',
                              lineHeight: '1.2'
                            }}
                          >
                            "{content.substring(0, content.length > 100 ? 120 : 100)}{content.length > (content.length > 100 ? 120 : 100) ? '...' : ''}"
                          </p>
                        </div>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-6 mt-8 text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🌍</span>
                            <span className="font-medium capitalize">{scope}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏷️</span>
                            <span className="font-medium">{vibe || 'Free Spirit'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Section - Stats */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-6"
                        style={{ 
                          background: '#f8f9fa',
                          height: '100px',
                          borderTop: '1px solid #e9ecef'
                        }}
                      >
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-gray-600 text-xs uppercase tracking-wider mb-1">Ranking</p>
                            <p 
                              className="font-bold"
                              style={{ 
                                color: colors.text,
                                fontSize: '1.5rem'
                              }}
                            >
                              {percentile?.displayText || `${score}%`}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 text-xs uppercase tracking-wider mb-1">People</p>
                            <p 
                              className="font-bold"
                              style={{ 
                                color: colors.text,
                                fontSize: '1.5rem'
                              }}
                            >
                              {percentile?.comparison || '1 of 23'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right text-gray-500">
                          <p className="text-sm font-medium">onlyonetoday.com</p>
                          <p className="text-xs">{new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex flex-col justify-between">
              {/* Header */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Share Your Moment
                </h2>
                <p className="text-white/60 text-sm sm:text-base mb-6">
                  Download or share directly with friends
                </p>
                
                {/* Quick Stats */}
                <div className={`p-4 rounded-xl mb-6 border bg-gradient-to-br ${colors.modalBg} ${colors.modalBorder}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Your Ranking</p>
                      {percentile ? (
                        <>
                          <p className={`text-xl font-bold mb-0.5 ${colors.modalText}`}>
                            {percentile.displayText}
                          </p>
                          <p className="text-xs text-white/60">{percentile.comparison}</p>
                        </>
                      ) : (
                        <p className={`text-2xl font-bold ${colors.modalText}`}>
                          {score}% {type === 'uniqueness' ? 'Unique' : 'Common'}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Scope</p>
                      <p className="text-lg font-semibold text-white capitalize">{scope}</p>
                </div>
              </div>
            </div>
          </div>
          
              {/* Actions */}
              <div className="space-y-4">
                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Download Button */}
                  <button
              onClick={handleDownload}
              disabled={downloading}
                    className={`py-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border bg-gradient-to-r ${colors.button} text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {downloading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="hidden sm:inline">Creating...</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span className="hidden sm:inline">Download PNG</span>
                          <span className="sm:hidden">Download</span>
                        </>
                      )}
                    </div>
                  </button>
                  
                  {/* Copy Link Button */}
                  <button
              onClick={handleCopyLink}
                    className="py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                    <div className="flex items-center justify-center gap-2">
              {copied ? (
                <>
                          <Check size={18} className="text-green-400" />
                          <span className="hidden sm:inline text-green-400">Copied!</span>
                          <span className="sm:hidden text-green-400">✓</span>
                </>
              ) : (
                <>
                          <LinkIcon size={18} />
                          <span className="hidden sm:inline">Copy Link</span>
                          <span className="sm:hidden">Copy</span>
                </>
              )}
                    </div>
                  </button>
                </div>
                
                {/* Divider */}
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs text-white/40 bg-space-darker rounded-full py-1">
                      Share to social media
                    </span>
                  </div>
          </div>
          
          {/* Social Share Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {/* WhatsApp */}
              <button
                    onClick={handleShareWhatsApp}
                    disabled={sharing}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-white/20 group disabled:opacity-50"
              >
                    <MessageCircle size={20} className="text-[#25D366] group-hover:text-[#20BA5A] transition-colors" />
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors hidden sm:block">WhatsApp</span>
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors sm:hidden">WA</span>
              </button>
              
                  {/* Instagram */}
              <button
                    onClick={handleShareInstagram}
                    disabled={downloading}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-white/20 group disabled:opacity-50"
              >
                    <Instagram size={20} className="text-pink-400 group-hover:text-pink-300 transition-colors" />
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors hidden sm:block">Instagram</span>
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors sm:hidden">IG</span>
              </button>
              
                  {/* More */}
              <button
                    onClick={handleNativeShare}
                    disabled={sharing}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50"
                  >
                    <Share2 size={20} className="text-white/60 group-hover:text-white transition-colors" />
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">More</span>
              </button>
                </div>
                
                {/* Footer Tip */}
                <p className="text-center text-white/40 text-xs mt-4">
                  💡 High quality image ready to share
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
