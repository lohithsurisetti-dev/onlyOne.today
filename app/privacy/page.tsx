import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - OnlyOne Today',
  description: 'Our commitment to your privacy and data protection',
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">🌟 Our Commitment</h2>
              <p>
                OnlyOne Today is built on the principle of <strong>anonymity and privacy</strong>. We believe your actions should be yours to share, without revealing who you are.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">📝 What We Collect</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Your Posts:</strong> The actions you share (e.g., "played cricket", "cooked dinner")</li>
                <li><strong>Location:</strong> City, state, and country (if you enable location services) - NEVER exact coordinates</li>
                <li><strong>Technical Data:</strong> IP address (for rate limiting), browser type, device type</li>
                <li><strong>Reactions:</strong> Funny, creative, must-try reactions on posts</li>
              </ul>
              
              <p className="mt-3 text-purple-300">
                ✨ <strong>What we DON'T collect:</strong> Names, emails, phone numbers, precise GPS, browsing history, or any personal identifiers!
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🔒 How We Use Your Data</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Uniqueness Calculation:</strong> Compare your action with others to show how unique you are</li>
                <li><strong>Feed Display:</strong> Show posts from your location and scope</li>
                <li><strong>Trending Topics:</strong> Display what's popular globally</li>
                <li><strong>Spam Prevention:</strong> Rate limiting and content moderation</li>
                <li><strong>Analytics:</strong> Aggregate usage stats (never individual tracking)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🚫 What We DON'T Do</h2>
              <ul className="space-y-2 list-disc list-inside text-green-300">
                <li>❌ Sell your data to third parties</li>
                <li>❌ Track you across websites</li>
                <li>❌ Use advertising cookies</li>
                <li>❌ Store precise GPS locations</li>
                <li>❌ Require accounts or sign-ups</li>
                <li>❌ Link posts to identities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">📍 Location Data</h2>
              <p>
                When you enable location services, we detect your city, state, and country using your IP address. We use this ONLY to:
              </p>
              <ul className="space-y-2 list-disc list-inside mt-2">
                <li>Calculate uniqueness within your scope (city, state, country, world)</li>
                <li>Show location-based rankings</li>
                <li>Display posts from your area</li>
              </ul>
              <p className="mt-3">
                <strong>You can disable location services anytime</strong> and still use the app with "World" scope.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🗑️ Data Retention</h2>
              <p>
                Posts are stored for display in the feed and uniqueness calculations. We may archive or delete old posts after 30 days to keep the experience fresh and focused on "today."
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🍪 Cookies</h2>
              <p>
                We use <strong>minimal</strong> cookies:
              </p>
              <ul className="space-y-2 list-disc list-inside mt-2">
                <li><strong>Session:</strong> To remember your temporary session (no login required)</li>
                <li><strong>Preferences:</strong> Remember your filter choices</li>
              </ul>
              <p className="mt-3">
                No advertising cookies. No third-party tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">👶 Children's Privacy</h2>
              <p>
                OnlyOne Today is designed for users aged 13 and older. We do not knowingly collect data from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">🌍 International Users</h2>
              <p>
                We comply with GDPR, CCPA, and other privacy regulations. Your data is processed securely in the cloud using industry-standard encryption and security practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">✉️ Contact Us</h2>
              <p>
                Questions about privacy? Reach out via the feedback option in the app or visit our About page.
              </p>
            </section>

            <section className="border-t border-white/10 pt-6 mt-8">
              <p className="text-white/60 text-xs">
                This privacy policy may be updated from time to time. We'll notify users of significant changes through the app.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

