import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Brand */}
          <div className="text-center sm:text-left">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} <span className="text-white font-medium">OnlyOne.Today</span>
            </p>
          </div>
          
          {/* Center: Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-white/50 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-white/50 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <a
              href="https://github.com/lohithsurisetti-dev/onlyOne.today"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
          
          {/* Right: Tag */}
          <div className="text-center sm:text-right">
            <p className="text-white/30 text-xs">
              Made with care
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

