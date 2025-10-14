import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-space-dark/80 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <p className="text-white/60 text-sm">
              <span className="font-bold text-white">OnlyOne.Today</span> • Discover your uniqueness
            </p>
            <p className="text-white/40 text-xs mt-1">
              Anonymous, fun, and instant. No signup required!
            </p>
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-white/60 hover:text-purple-300 transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-white/60 hover:text-purple-300 transition-colors"
            >
              Terms
            </Link>
            <a
              href="https://github.com/lohithsurisetti-dev/onlyOne.today"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center mt-4 pt-4 border-t border-white/5">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} OnlyOne.Today. Made with ✨ for curious minds.
          </p>
        </div>
      </div>
    </footer>
  )
}

