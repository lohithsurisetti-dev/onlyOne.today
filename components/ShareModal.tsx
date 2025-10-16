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
  const [previewScale, setPreviewScale] = useState(0.2)
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
  
  // Dynamic font sizing based on content length and type
  const getDynamicFontSize = (content: string, inputType?: string) => {
    const length = content.length
    const isDaySummary = inputType === 'day'
    
    // Day summaries are typically much longer, so different thresholds
    if (isDaySummary) {
      if (length <= 50) return '2.2rem'      // Very short day summary
      if (length <= 100) return '1.8rem'     // Short day summary  
      if (length <= 150) return '1.6rem'     // Medium day summary
      if (length <= 200) return '1.4rem'     // Long day summary
      return '1.2rem'                        // Very long day summary
    } else {
      // Regular actions - typically shorter
      if (length <= 30) return '2.8rem'      // Very short action
      if (length <= 60) return '2.4rem'      // Short action
      if (length <= 100) return '2rem'       // Medium action
      if (length <= 150) return '1.6rem'     // Long action
      return '1.4rem'                        // Very long action
    }
  }

  const getDynamicLineHeight = (content: string, inputType?: string) => {
    const length = content.length
    const isDaySummary = inputType === 'day'
    
    // Longer content needs more line spacing
    if (isDaySummary) {
      if (length <= 100) return '1.2'
      if (length <= 200) return '1.3'
      return '1.4'
    } else {
      if (length <= 60) return '1.1'
      if (length <= 100) return '1.2'
      return '1.3'
    }
  }
  
  // Calculate preview scale - responsive for mobile and desktop
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    
    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight
      
      // Base canvas dimensions (1200x630)
      const canvasWidth = 1200
      const canvasHeight = 630
      
      // Calculate scale to fit both width and height
      const scaleX = (containerWidth - 16) / canvasWidth
      const scaleY = (containerHeight - 16) / canvasHeight
      const scale = Math.min(scaleX, scaleY, 0.6) // Cap at 60% for readability
      
      // Ensure minimum scale for mobile - much smaller on mobile
      const minScale = window.innerWidth < 768 ? 0.08 : 0.25
      const maxScale = window.innerWidth < 768 ? 0.2 : 0.6
      setPreviewScale(Math.max(Math.min(scale, maxScale), minScale))
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
      console.log('🖼️ Starting download...')
      
      if (!cardRef.current) {
        console.error('❌ cardRef.current is null')
        alert('Card element not found. Please try refreshing the page.')
        return
      }
      
      console.log('📏 Element found:', cardRef.current)
      console.log('📐 Element dimensions:', {
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        scrollWidth: cardRef.current.scrollWidth,
        scrollHeight: cardRef.current.scrollHeight
      })
      
      // Check if element is visible
      const computedStyle = window.getComputedStyle(cardRef.current)
      console.log('🎨 Element styles:', {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        position: computedStyle.position,
        transform: computedStyle.transform
      })
      
      // Wait for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 200))
      
      console.log('📸 Attempting toPng capture...')
      
      // Try with high-quality options and fonts
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3, // 3x resolution for crisp quality
        backgroundColor: '#ffffff',
        skipFonts: false, // Try to include fonts for exact match
        skipAutoScale: true,
        fontEmbedCSS: 'data:font/woff2;base64,' // Embed font CSS for better font handling
      })
      
      console.log('✅ Capture successful! Data URL length:', dataUrl.length)
      
      // Download the captured image
      const link = document.createElement('a')
      link.download = `onlyone-${Date.now()}.png`
      link.href = dataUrl
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('✅ Download completed!')
      
    } catch (error) {
      console.error('❌ Download failed with error:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Try with even simpler options
      try {
        console.log('🔄 Trying with minimal options...')
        if (!cardRef.current) throw new Error('Card element not found')
        const dataUrl = await toPng(cardRef.current, {
          quality: 1.0,
          pixelRatio: 2, // 2x resolution for fallback
          skipFonts: false, // Try fonts in fallback too
          skipAutoScale: true,
          fontEmbedCSS: 'data:font/woff2;base64,'
        })
        
        const link = document.createElement('a')
        link.download = `onlyone-${Date.now()}.png`
        link.href = dataUrl
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('✅ Minimal capture successful!')
        
      } catch (minimalError) {
        console.error('❌ Even minimal capture failed:', minimalError)
        alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try using the "Copy Link" button instead.`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 p-2 sm:p-4">
      <div className="relative w-full max-w-4xl mx-auto px-2 py-2 sm:py-4 max-h-[95vh] overflow-y-auto">
        <div className="relative bg-gradient-to-br from-space-dark via-space-darker to-space-darkest rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Ambient Glow */}
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${colors.modalBg.replace('/10', '/20')}`} />
          
        {/* Close Button */}
        <button
          onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 transition-all hover:scale-110 group backdrop-blur-sm"
        >
            <X size={18} className="text-white group-hover:text-white transition-colors" />
        </button>
          
          {/* Content Grid */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-6">
            {/* Left Side - Preview */}
            <div className="flex flex-col">
              <h3 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Preview
              </h3>
              
              {/* Share Card Preview - Direct Image */}
              <div ref={containerRef} className="flex-1 relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                {/* Direct Canvas - No container, no scaling */}
                <div
                  ref={cardRef}
                  className="w-full h-full"
                  style={{
                    aspectRatio: '1200/630',
                    background: `linear-gradient(135deg, ${colors.gradient[0]} 0%, ${colors.gradient[1]} 100%)`,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6">
                    <div className="text-white">
                      <h1 className="text-3xl font-bold mb-1">OnlyOne Today</h1>
                      <p className="text-white/90 text-sm">Share what makes you unique</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
                        <p className="text-white text-xl font-bold">{percentile?.displayText || `${score}%`}</p>
                        <p className="text-white/80 text-xs mt-1">{percentile?.comparison || '1 of 23'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Main Content - Centered */}
                  <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-12 py-6 sm:py-8">
                    {/* Quote Card with Glass Effect */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl max-w-4xl border border-white/50">
                      <p 
                        className="font-bold text-gray-900 italic leading-relaxed text-center"
                    style={{ 
                          fontSize: getDynamicFontSize(content, inputType),
                          letterSpacing: '-0.02em',
                          lineHeight: getDynamicLineHeight(content, inputType)
                        }}
                      >
                        "{(() => {
                          const isDaySummary = inputType === 'day'
                          const maxLength = isDaySummary ? 180 : 120
                          const truncateLength = content.length > 100 ? maxLength : 100
                          return content.substring(0, truncateLength) + (content.length > truncateLength ? '...' : '')
                        })()}"
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <p className="font-semibold text-gray-700 capitalize text-sm">{scope} Level</p>
                          <p className="text-gray-500 text-xs">Global Comparison</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-700 text-sm">{vibe || 'Adventurer'}</p>
                          <p className="text-gray-500 text-xs">Personality</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border-t border-white/20">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Your Uniqueness</p>
                        <p className="text-white text-xl font-bold">{percentile?.displayText || `${score}%`}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Community Size</p>
                        <p className="text-white text-xl font-bold">{percentile?.comparison || '1 of 23'}</p>
                      </div>
                    </div>
                    
                    <div className="text-right text-white/90">
                      <p className="text-base font-semibold">Join the community</p>
                      <p className="text-xs text-white/70">onlyonetoday.com</p>
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
