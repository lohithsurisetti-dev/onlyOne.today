'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share2, Link as LinkIcon, Check, Instagram, MessageCircle } from 'lucide-react'
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
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoading, setImageLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  
  // Determine if top tier
  const isTopTier = percentile && 
    ['elite', 'rare', 'unique', 'notable'].includes(percentile.tier)
  
  // Determine color scheme
  const getColorScheme = () => {
    if (inputType === 'day') {
      return isTopTier
        ? { bg: 'from-orange-500/10 to-amber-500/10', border: 'border-orange-400/20', text: 'text-orange-300', button: 'from-orange-500 to-amber-500 hover:shadow-orange-500/50' }
        : { bg: 'from-teal-500/10 to-emerald-500/10', border: 'border-teal-400/20', text: 'text-teal-300', button: 'from-teal-500 to-emerald-500 hover:shadow-teal-500/50' }
    } else {
      return isTopTier
        ? { bg: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-400/20', text: 'text-purple-300', button: 'from-purple-500 to-pink-500 hover:shadow-purple-500/50' }
        : { bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-400/20', text: 'text-blue-300', button: 'from-blue-500 to-cyan-500 hover:shadow-blue-500/50' }
    }
  }
  
  const colors = getColorScheme()
  
  // Generate image URL
  useEffect(() => {
    if (isOpen) {
      setImageLoading(true)
      
      const params = new URLSearchParams({
        content: content.substring(0, 100),
        scope: scope,
        inputType: inputType || 'action',
      })
      
      // Add percentile data
      if (percentile) {
        params.set('percentileText', percentile.displayText)
        params.set('percentileBadge', percentile.badge)
        params.set('percentileComparison', percentile.comparison)
        params.set('percentileTier', percentile.tier)
      } else {
        params.set('percentileText', `${score}%`)
        params.set('percentileBadge', type === 'uniqueness' ? '⭐' : '👥')
        params.set('percentileComparison', type === 'uniqueness' ? 'Unique' : 'Common')
        params.set('percentileTier', type === 'uniqueness' ? 'unique' : 'common')
      }
      
      const url = `/api/share-image?${params.toString()}`
      console.log('🖼️ Share image URL:', url)
      setImageUrl(url)
    }
  }, [isOpen, content, scope, inputType, percentile, score, type])
  
  const getHomepageUrl = () => {
    return getSiteUrl()
  }
  
  const getShareText = () => {
    const homepageUrl = getHomepageUrl()
    return `${message}\n\n"${content}"\n\n🎯 Discover your uniqueness: ${homepageUrl}`
  }
  
  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (!imageUrl) {
        alert('Image not ready yet')
        return
      }
      
      // Fetch the image from the API
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Create download link
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
      if (!imageUrl) {
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`
        window.open(url, '_blank')
        return
      }
      
      // Fetch image as blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'onlyone-share.png', { type: 'image/png' })
      
      // Try native share with image
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: getShareText(),
          files: [file],
        })
      } else {
        // Fallback: download image and open WhatsApp
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
      if (!imageUrl) return
      
      const response = await fetch(imageUrl)
      const blob = await response.blob()
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
        <div className={`relative bg-gradient-to-br from-space-dark via-space-darker to-space-darkest rounded-3xl border border-white/10 shadow-2xl overflow-hidden`}>
          {/* Ambient Glow */}
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${colors.bg.replace('/10', '/20')}`} />
          
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
              
              {/* Image Preview */}
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white">
                <div className="w-full" style={{ paddingBottom: '52.5%' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-10 h-10 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <p className="text-gray-600 text-xs">Loading preview...</p>
                        </div>
                      </div>
                    )}
                    
                    <img
                      src={imageUrl}
                      alt="Share preview"
                      className={`w-full h-full object-contain transition-opacity duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => setImageLoading(false)}
                      onError={(e) => {
                        console.error('Image load error:', e)
                        setImageLoading(false)
                      }}
                    />
                    
                    {/* View Full Size Overlay */}
                    {!imageLoading && imageUrl && (
                      <button
                        onClick={() => window.open(imageUrl, '_blank')}
                        className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/80 hover:bg-black/95 backdrop-blur-sm rounded-lg text-white text-xs font-medium transition-all flex items-center gap-1.5 border border-white/20 hover:border-white/40"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="hidden sm:inline">View Full</span>
                      </button>
                    )}
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
                <div className={`p-4 rounded-xl mb-6 border bg-gradient-to-br ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Your Ranking</p>
                      {percentile ? (
                        <>
                          <p className={`text-xl font-bold mb-0.5 ${colors.text}`}>
                            {percentile.displayText}
                          </p>
                          <p className="text-xs text-white/60">{percentile.comparison}</p>
                        </>
                      ) : (
                        <p className={`text-2xl font-bold ${colors.text}`}>
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
                    disabled={downloading || imageLoading}
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
                    disabled={sharing || imageLoading}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-white/20 group disabled:opacity-50"
                  >
                    <MessageCircle size={20} className="text-[#25D366] group-hover:text-[#20BA5A] transition-colors" />
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors hidden sm:block">WhatsApp</span>
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors sm:hidden">WA</span>
                  </button>
                  
                  {/* Instagram */}
                  <button
                    onClick={handleShareInstagram}
                    disabled={downloading || imageLoading}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-white/20 group disabled:opacity-50"
                  >
                    <Instagram size={20} className="text-pink-400 group-hover:text-pink-300 transition-colors" />
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors hidden sm:block">Instagram</span>
                    <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors sm:hidden">IG</span>
                  </button>
                  
                  {/* More */}
                  <button
                    onClick={handleNativeShare}
                    disabled={sharing || imageLoading}
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
