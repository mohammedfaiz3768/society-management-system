import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-xl font-serif tracking-tight">
          UN<em className="italic text-blue-600 not-italic">IFY</em>
        </span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-600 uppercase tracking-widest mb-8 px-3 py-1.5 border border-blue-200 rounded-full bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Society Management Platform
        </div>

        <h1 className="font-serif text-5xl md:text-6xl font-normal leading-tight tracking-tight mb-6 text-zinc-900 dark:text-zinc-50">
          One platform for every<br />
          <em className="italic text-blue-600">society</em> operation
        </h1>

        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-10 font-light leading-relaxed">
          From gate passes and visitor logs to maintenance billing, SOS alerts,
          and live CCTV — UNIFY replaces every manual process.
        </p>

        <div className="flex gap-3 justify-center flex-wrap mb-16">
          <Link href="/register" className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Register your society →
          </Link>
          <Link href="/login" className="px-6 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            Admin login
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden max-w-2xl mx-auto">
          {[
            { n: "23", l: "API Modules" },
            { n: "4", l: "User Roles" },
            { n: "3", l: "Platform Apps" },
            { n: "30d", l: "Free Trial" },
          ].map(({ n, l }) => (
            <div key={l} className="bg-zinc-50 dark:bg-zinc-900 py-5 text-center">
              <span className="block font-serif text-3xl text-blue-600">{n}</span>
              <span className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mt-1">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-8 pb-20">
        <p className="text-center text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">Features</p>
        <h2 className="font-serif text-3xl font-normal text-center mb-10 text-zinc-900 dark:text-zinc-50">
          Everything your society <em className="italic">needs</em>
        </h2>

        <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden mb-16">
          {[
            { icon: "📡", title: "Live CCTV Streaming", desc: "WebRTC signaling for real-time camera feeds to admin and resident devices." },
            { icon: "🔴", title: "SOS Alerts with GPS", desc: "Real-time panic alerts via Socket.IO with GPS coordinates and emergency routing." },
            { icon: "💳", title: "Razorpay Payments", desc: "Maintenance billing with HMAC verification, subscriptions, and webhooks." },
            { icon: "🔐", title: "QR Gate Passes", desc: "Cryptographically secure single-use QR codes with pre-approval flow." },
            { icon: "🏢", title: "Multi-Tenant SaaS", desc: "Complete society-level data isolation. One platform, unlimited societies." },
            { icon: "📱", title: "Mobile App", desc: "React Native app for residents and guards with push notifications." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-zinc-950 p-6">
              <span className="text-xl mb-3 block">{icon}</span>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">{title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-12 text-center">
          <h2 className="font-serif text-3xl font-normal mb-3 text-zinc-900 dark:text-zinc-50">
            Ready to modernise your society?
          </h2>
          <p className="text-zinc-500 text-sm mb-6">Start your 30-day free trial. No credit card required.</p>
          <Link href="/register" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Register your society →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-6 px-8 flex justify-between items-center max-w-4xl mx-auto">
        <span className="text-xs text-zinc-400">© 2026 UNIFY — Society Management Platform</span>
        <span className="text-xs text-zinc-400">Built by Saniya Fathima</span>
      </footer>

    </div>
  );
}