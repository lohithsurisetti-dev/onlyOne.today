import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Brand */}
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} <span className="text-white font-medium">OnlyOne.Today</span>
          </p>
          
          {/* Links */}
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
          </div>
        </div>
      </div>
    </footer>
  )
}

