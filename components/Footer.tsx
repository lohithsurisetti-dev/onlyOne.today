import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative mt-auto">
      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
      
      <div className="bg-gradient-to-b from-space-dark/50 to-space-darker/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Column */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">OnlyOne.Today</h3>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-2">
                Discover what makes you unique.
              </p>
              <p className="text-white/40 text-xs">
                Anonymous • Fun • Instant
              </p>
            </div>
            
            {/* Links Column */}
            <div className="text-center">
              <h4 className="text-white/80 font-semibold text-sm mb-3">Legal</h4>
              <div className="flex flex-col gap-2">
                <Link 
                  href="/privacy" 
                  className="text-white/60 hover:text-purple-300 transition-colors text-sm inline-flex items-center justify-center gap-1.5 group"
                >
                  <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className="text-white/60 hover:text-purple-300 transition-colors text-sm inline-flex items-center justify-center gap-1.5 group"
                >
                  <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Terms of Service
                </Link>
              </div>
            </div>
            
            {/* Community Column */}
            <div className="text-center md:text-right">
              <h4 className="text-white/80 font-semibold text-sm mb-3">Connect</h4>
              <div className="flex items-center justify-center md:justify-end gap-3">
                <a
                  href="https://github.com/lohithsurisetti-dev/onlyOne.today"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/5 hover:bg-purple-500/20 rounded-lg border border-white/10 hover:border-purple-400/30 transition-all group"
                  title="View on GitHub"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-purple-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/intent/tweet?text=Just%20discovered%20how%20unique%20I%20am!%20%F0%9F%8C%9F&url=https://onlyone-today.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/5 hover:bg-purple-500/20 rounded-lg border border-white/10 hover:border-purple-400/30 transition-all group"
                  title="Share on Twitter"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-purple-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
              <p className="text-white/40 text-xs mt-3">
                Share your uniqueness
              </p>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-white/40 text-xs">
                © {new Date().getFullYear()} OnlyOne.Today • Made with{' '}
                <span className="text-purple-400">✨</span> for curious minds
              </p>
              
              {/* Features badge */}
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-full border border-white/5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>No signup</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-full border border-white/5">
                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Anonymous</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-full border border-white/5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Free forever</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

