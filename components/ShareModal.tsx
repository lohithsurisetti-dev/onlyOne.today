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
  percentile?: {
    percentile: number
    tier: string
    displayText: string
    badge: string
    comparison: string
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
  percentile,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [previewScale, setPreviewScale] = useState(0.28)
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const isUnique = type === 'uniqueness'
  
  // Determine color scheme based on percentile tier and input type
  const getColorScheme = () => {
    const isTopTier = percentile && 
      (percentile.tier === 'elite' || percentile.tier === 'rare' || percentile.tier === 'unique')
    
    if (inputType === 'day') {
      // Day summaries: Orange/Amber for top, Teal/Emerald for common
      return {
        gradient: isTopTier 
          ? 'from-orange-600 via-amber-600 to-yellow-500'
          : 'from-teal-600 via-emerald-600 to-green-500',
        glow: isTopTier ? 'bg-orange-400' : 'bg-teal-400',
        ambientGlow: isTopTier
          ? 'from-orange-500/20 via-amber-500/20 to-transparent'
          : 'from-teal-500/20 via-emerald-500/20 to-transparent',
        text: isTopTier ? 'text-orange-300' : 'text-teal-300',
        border: isTopTier ? 'border-orange-400/20' : 'border-teal-400/20',
        bgCard: isTopTier 
          ? 'from-orange-500/10 to-amber-500/10'
          : 'from-teal-500/10 to-emerald-500/10',
      }
    } else {
      // Actions: Purple/Pink for top, Blue/Cyan for common
      return {
        gradient: isTopTier
          ? 'from-purple-600 via-purple-500 to-pink-600'
          : 'from-blue-600 via-blue-500 to-cyan-600',
        glow: isTopTier ? 'bg-purple-400' : 'bg-blue-400',
        ambientGlow: isTopTier
          ? 'from-purple-500/20 via-pink-500/20 to-transparent'
          : 'from-blue-500/20 via-cyan-500/20 to-transparent',
        text: isTopTier ? 'text-purple-300' : 'text-blue-300',
        border: isTopTier ? 'border-purple-400/20' : 'border-blue-400/20',
        bgCard: isTopTier
          ? 'from-purple-500/10 to-pink-500/10'
          : 'from-blue-500/10 to-cyan-500/10',
      }
    }
  }
  
  const colorScheme = getColorScheme()
  
  // Debug: Log percentile data
  useEffect(() => {
    if (isOpen && percentile) {
      console.log('📊 ShareModal percentile data:', percentile)
    } else if (isOpen && !percentile) {
      console.log('⚠️ ShareModal: No percentile data, falling back to score:', score)
    }
  }, [isOpen, percentile, score])
  
  // Calculate preview scale based on container width
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    
    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const scale = Math.min((containerWidth - 16) / 1200, 0.5) // Max 0.5 scale
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
    return `${message}\n\n"${content}"\n\n🎯 Discover your uniqueness: ${homepageUrl}`
  }
  
  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        width: 1200,
        height: 630,
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
      const blob = await generateImage()
      if (!blob) {
        alert('Failed to generate image')
        return
      }
      
      const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.download = `onlyone-${Date.now()}.png`
      link.href = url
                  link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download image')
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
      const blob = await generateImage()
      if (!blob) {
        // Fallback to text only
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
        window.open(url, '_blank')
        return
      }
      
      const file = new File([blob], 'onlyone-share.png', { type: 'image/png' })
      
      // Try native share with image
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: getShareText(),
          files: [file],
        })
      } else {
        // Fallback: download image and open WhatsApp with text
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
    window.open(url, '_blank')
        
        // Also download the image
        const imageUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'onlyone-share.png'
        link.href = imageUrl
        link.click()
        URL.revokeObjectURL(imageUrl)
      }
    } catch (error) {
      console.error('Share failed:', error)
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
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${colorScheme.ambientGlow}`} />
          
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
              
              {/* Share Card Preview */}
              <div ref={containerRef} className="flex-1 relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-gradient-to-br from-black/50 to-black/30">
                {/* Aspect ratio container */}
                <div className="w-full" style={{ paddingBottom: '52.5%' }}>
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    {/* Card at full 1200x630 size, scaled down */}
                    <div
                      ref={cardRef}
                      className="flex flex-col items-center justify-center bg-gradient-to-br from-space-dark via-space-darker to-space-darkest"
                    style={{ 
                      width: '1200px',
                      height: '630px',
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'center',
                        transition: 'transform 0.2s ease-out'
                      }}
                    >
                  {/* Premium Landscape Card */}
                  <div className="relative w-full h-full flex items-center justify-between px-20 py-16">
                    {/* Left Side - Ranking Badge */}
                    <div className="flex flex-col items-center">
                      <div className={`w-[320px] h-[320px] rounded-full flex flex-col items-center justify-center shadow-2xl bg-gradient-to-br ${colorScheme.gradient} relative overflow-hidden`}>
                        {/* Glow effect */}
                        <div className={`absolute inset-0 opacity-40 blur-3xl ${colorScheme.glow}`}></div>
                        
                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center">
                          {percentile ? (
                            <>
                              <div className="text-7xl mb-3">{percentile.badge}</div>
                              <div className="text-6xl font-black text-white leading-none mb-2">
                                {percentile.displayText}
                              </div>
                              <div className="text-xl text-white/90 font-medium text-center px-4">
                                {percentile.comparison}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-8xl font-black text-white mb-3">
                                {score}%
                              </div>
                              <div className="text-3xl font-bold text-white/95 uppercase tracking-wider">
                                {isUnique ? 'UNIQUE' : 'COMMON'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side - Content */}
                    <div className="flex-1 flex flex-col justify-center ml-16 max-w-[680px]">
                      {/* Content Text */}
                      <div className="text-5xl font-bold text-white leading-tight mb-8">
                        "{content.substring(0, 80)}{content.length > 80 ? '...' : ''}"
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-6 text-2xl text-white/70 mb-8">
                        <span className="text-3xl">{vibe || '✨'}</span>
                        <span>•</span>
                        <span className="capitalize font-medium">{scope}</span>
                      </div>
                      
                      {/* Branding */}
                      <div className="border-t border-white/20 pt-6">
                        <div className="text-3xl font-bold text-white mb-1">
                          OnlyOne Today
                        </div>
                        <div className="text-lg text-white/50">
                          Discover your uniqueness
                        </div>
                      </div>
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
                <div className={`p-4 rounded-xl mb-6 border bg-gradient-to-br ${colorScheme.bgCard} ${colorScheme.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Your Ranking</p>
                      {percentile ? (
                        <>
                          <p className={`text-xl font-bold mb-0.5 ${colorScheme.text}`}>
                            {percentile.displayText}
                          </p>
                          <p className="text-xs text-white/60">{percentile.comparison}</p>
                        </>
                      ) : (
                        <p className={`text-2xl font-bold ${colorScheme.text}`}>
                          {score}% {isUnique ? 'Unique' : 'Common'}
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
                    className={`py-4 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border bg-gradient-to-r ${colorScheme.gradient} ${colorScheme.border} text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
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
                  💡 Tip: Direct image sharing on mobile devices
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
