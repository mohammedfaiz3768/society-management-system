import Link from "next/link";
import { Home, Shield, QrCode, Bell, CreditCard, Video, Smartphone, ArrowRight, Check } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white shadow-sm border-slate-100 font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-rose-600 flex items-center justify-center">
            <Home className="w-4 h-4 text-slate-900" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            UN<span className="text-rose-600 italic">IFY</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-1.5"
          >
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-widest mb-6 px-3 py-1.5 border border-emerald-200 rounded-full bg-rose-50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Society Management Platform
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-5 text-slate-900">
          One platform for every<br />
          <span className="text-rose-600 italic font-bold">society</span> operation
        </h1>

        <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
          From gate passes and visitor logs to maintenance billing, SOS alerts,
          and live CCTV - UNIFY replaces every manual process.
        </p>

        <div className="flex gap-3 justify-center flex-wrap mb-16">
          <Link
            href="/register"
            className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-sm font-medium hover:bg-rose-600 transition-colors shadow-sm flex items-center gap-2"
          >
            Register your society <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-slate-200 text-slate-700 rounded-2xl text-sm font-medium hover:bg-white transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-rose-600" /> Admin login
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { n: "23", l: "API Modules" },
            { n: "4", l: "User Roles" },
            { n: "3", l: "Platform Apps" },
            { n: "30d", l: "Free Trial" },
          ].map(({ n, l }) => (
            <div key={l} className="bg-white border border-slate-100 rounded-2xl py-5 text-center">
              <span className="block text-3xl font-bold text-rose-600 mb-1">{n}</span>
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-widest mb-2">Features</p>
          <h2 className="text-3xl font-bold text-slate-900">
            Everything your society <span className="text-rose-600 italic">needs</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            { icon: Video, title: "Live CCTV Streaming", desc: "WebRTC signaling for real-time camera feeds to admin and resident devices.", color: "bg-blue-50 text-blue-600" },
            { icon: Bell, title: "SOS Alerts with GPS", desc: "Real-time panic alerts via Socket.IO with GPS coordinates and emergency routing.", color: "bg-red-50 text-red-600" },
            { icon: CreditCard, title: "Razorpay Payments", desc: "Maintenance billing with HMAC verification, subscriptions, and webhooks.", color: "bg-green-50 text-green-600" },
            { icon: QrCode, title: "QR Gate Passes", desc: "Cryptographically secure single-use QR codes with pre-approval flow.", color: "bg-purple-50 text-purple-600" },
            { icon: Home, title: "Multi-Tenant SaaS", desc: "Complete society-level data isolation. One platform, unlimited societies.", color: "bg-orange-50 text-orange-600" },
            { icon: Smartphone, title: "Mobile App", desc: "React Native app for residents and guards with push notifications.", color: "bg-rose-50 text-rose-600" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="bg-white shadow-sm border-slate-100 border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:-tranzinc-y-0.5 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900 mb-1.5">{title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-rose-600 rounded-2xl p-10 md:p-14 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Ready to modernise your society?
          </h2>
          <p className="text-emerald-200 text-sm mb-8">Start your 30-day free trial. No credit card required.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {["Easy setup in minutes", "No credit card required", "Cancel anytime"].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-sm text-rose-100">
                <Check className="w-4 h-4 text-emerald-300" /> {t}
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3 bg-white shadow-sm border-slate-100 text-rose-600 rounded-2xl text-sm font-semibold hover:bg-rose-50 transition-colors shadow-sm"
          >
            Register your society <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 px-6 md:px-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center">
              <Home className="w-3 h-3 text-slate-900" />
            </div>
            <span className="text-xs text-slate-500">(c) 2026 UNIFY - Society Management Platform</span>
          </div>
          <span className="text-xs text-slate-500">Built by Saniya Fathima</span>
        </div>
      </footer>

    </div>
  );
}
