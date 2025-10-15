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
    const shareMessage = percentile?.message || message
    return `${shareMessage}\n\n"${content}"\n\n🎯 Discover your uniqueness: ${homepageUrl}`
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
      alert('Failed to download image. Please try again.')
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
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
        window.open(url, '_blank')
        return
      }
      
      const file = new File([blob], 'onlyone-share.png', { type: 'image/png' })
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: getShareText(),
          files: [file],
        })
      } else {
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
        window.open(url, '_blank')
        
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
                      className="relative bg-white"
                      style={{ 
                        width: '1200px', 
                        height: '630px', 
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'center',
                        transition: 'transform 0.2s ease-out'
                      }}
                    >
                      {/* Gradient Background Pattern */}
                      <div className="absolute top-0 right-0 w-2/3 h-full opacity-40 pointer-events-none">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(circle at 100% 0%, ${colors.accent}99 0%, ${colors.bg} 50%, transparent 100%)`
                          }}
                        />
                      </div>
                      
                      {/* Main Content - Flex Layout */}
                      <div className="relative w-full h-full flex items-center justify-between px-16 py-12">
                        {/* Left Side - Circular Badge */}
                        <div className="flex items-center justify-center" style={{ width: '350px' }}>
                          <div
                            className={`w-[300px] h-[300px] rounded-full flex flex-col items-center justify-center shadow-2xl bg-gradient-to-br ${colors.gradientClass} relative`}
                            style={{
                              boxShadow: `0 25px 50px -12px ${colors.gradient[0]}66`
                            }}
                          >
                            {/* Badge Content */}
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-8xl mb-3 leading-none">{percentile?.badge || (type === 'uniqueness' ? '⭐' : '👥')}</div>
                              <div className="text-6xl font-black text-white leading-none mb-3">
                                {percentile?.displayText || `${score}%`}
                              </div>
                              <div className="text-lg text-white/95 font-semibold px-6 text-center leading-tight">
                                {percentile?.comparison || (type === 'uniqueness' ? 'Unique' : 'Common')}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Side - Text Content */}
                        <div className="flex-1 flex flex-col justify-center" style={{ maxWidth: '650px', paddingLeft: '40px' }}>
                          {/* Quote Text */}
                          <div 
                            className="text-6xl font-bold text-gray-900 leading-tight mb-8"
                            style={{ 
                              letterSpacing: '-1px',
                              lineHeight: '1.2'
                            }}
                          >
                            "{content.substring(0, 70)}{content.length > 70 ? '...' : ''}"
                          </div>
                          
                          {/* Metadata Row */}
                          <div className="flex items-center gap-5 mb-10">
                            <span className="text-4xl">🌍</span>
                            <span className="text-2xl font-bold text-gray-500 capitalize">{scope}</span>
                          </div>
                          
                          {/* Gradient Divider */}
                          <div
                            className="w-full h-1 rounded-full mb-8"
                            style={{
                              background: `linear-gradient(90deg, ${colors.gradient[0]} 0%, ${colors.gradient[1]} 50%, transparent 100%)`
                            }}
                          />
                          
                          {/* Branding */}
                          <div className="space-y-2">
                            <div
                              className={`text-5xl font-black bg-gradient-to-r ${colors.gradientClass} bg-clip-text text-transparent`}
                              style={{ letterSpacing: '-1px' }}
                            >
                              OnlyOne Today
                            </div>
                            <div className="text-xl text-gray-500 font-semibold">
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
