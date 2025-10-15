import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - OnlyOne Today',
  description: 'Terms and conditions for using OnlyOne Today',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-purple-300 hover:text-purple-200 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-white/40 text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">👋 Welcome!</h2>
              <p>
                By using OnlyOne Today, you agree to these terms. We keep it simple: be cool, be respectful, and have fun discovering your uniqueness!
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">✨ What You Can Do</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Share what you did today (actions you took)</li>
                <li>Explore posts from others around the world</li>
                <li>React to posts (funny, creative, must-try)</li>
                <li>Share your uniqueness with friends</li>
                <li>Use the app anonymously (no signup required!)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🚫 What You Can't Do</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Share Contact Info:</strong> No phone numbers, emails, social handles, or URLs</li>
                <li><strong>Post Inappropriate Content:</strong> No explicit, hateful, or offensive material</li>
                <li><strong>Spam:</strong> No repetitive posts or automated submissions</li>
                <li><strong>Harass Others:</strong> No bullying, threats, or harmful behavior</li>
                <li><strong>Game the System:</strong> No manipulating uniqueness scores</li>
                <li><strong>Impersonate:</strong> Don't pretend to be someone else</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🛡️ Content Moderation</h2>
              <p>
                We use a combination of automated filters and AI to keep the platform safe and fun. Posts that violate our guidelines will be removed. Repeated violations may result in temporary or permanent IP blocks.
              </p>
              <p className="mt-3 text-purple-300">
                Our moderation is designed to be <strong>helpful, not harsh</strong>. We'll guide you with friendly messages if something needs to change!
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">📊 Your Content</h2>
              <p>
                You retain ownership of what you post, but by sharing on OnlyOne Today, you grant us the right to:
              </p>
              <ul className="space-y-2 list-disc list-inside mt-2">
                <li>Display your posts in the public feed</li>
                <li>Use your posts for trending topics and statistics</li>
                <li>Include your posts in share cards (anonymously)</li>
              </ul>
              <p className="mt-3">
                <strong>Remember:</strong> All posts are anonymous by design. We never link posts to identities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">⚖️ Disclaimer</h2>
              <p>
                OnlyOne Today is provided "as is" for entertainment and self-discovery. We make no guarantees about:
              </p>
              <ul className="space-y-2 list-disc list-inside mt-2">
                <li>100% uptime or availability</li>
                <li>Accuracy of uniqueness calculations (they're estimates!)</li>
                <li>Completeness of trending data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🔄 Rate Limiting</h2>
              <p>
                To prevent abuse and ensure fair access, we implement rate limits:
              </p>
              <ul className="space-y-2 list-disc list-inside mt-2">
                <li>Post creation: Limited to prevent spam</li>
                <li>API requests: Reasonable limits per IP</li>
                <li>Reactions: Cooldown periods between reactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🔄 Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Significant changes will be communicated through the app. Continued use means you accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">✉️ Contact</h2>
              <p>
                Questions or concerns? We're here to help! Reach out through the app's feedback option.
              </p>
            </section>

            <section className="border-t border-white/10 pt-6 mt-8">
              <div className="flex gap-4 text-sm">
                <Link href="/privacy" className="text-purple-300 hover:text-purple-200">
                  Privacy Policy
                </Link>
                <span className="text-white/20">•</span>
                <Link href="/terms" className="text-purple-300 hover:text-purple-200">
                  Terms of Service
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

