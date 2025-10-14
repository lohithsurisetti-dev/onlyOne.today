'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getMyPosts } from '@/lib/utils/my-posts'

export default function MyPostsCard() {
  const [postCount, setPostCount] = useState(0)

  useEffect(() => {
    // Just count posts from localStorage (no stats calculation)
    const posts = getMyPosts()
    setPostCount(posts.length)
  }, [])

  // Refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      const posts = getMyPosts()
      setPostCount(posts.length)
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (postCount === 0) {
    return null // Don't show if no posts
  }

  return (
    <Link
      href="/my-posts"
      className="block bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-purple-400/20 hover:border-purple-400/40 transition-all hover:scale-[1.02] p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-sm font-bold text-white">Your Posts</h3>
          <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
            {postCount}
          </span>
        </div>
        
        <svg 
          className="w-4 h-4 text-white/40"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      <p className="text-white/40 text-xs mt-2">
        View your post history →
      </p>
    </Link>
  )
}

