'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Shield, QrCode, Bell, CreditCard, Video, Smartphone, ArrowRight, Check, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-slate-800 overflow-hidden relative selection:bg-rose-500/20">

      {/* Ambient Background Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[50%] h-[50%] bg-rose-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-peach-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Floating Pristine Nav */}
      <nav className="fixed top-6 left-6 right-6 md:left-10 md:right-10 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center shadow-[0_4px_15px_rgba(244,63,94,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            UN<span className="text-rose-500">IFY</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden md:block px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 text-sm font-bold bg-white text-slate-900 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all flex items-center gap-1.5 group"
          >
            Get Started <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-40 pb-20">
        
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 md:px-10 text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 text-[11px] font-bold text-rose-600 uppercase tracking-[0.2em] mb-8 px-4 py-2 border border-rose-100 rounded-full bg-white shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Society Management Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-8 text-slate-900"
          >
            Next-generation software for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400">modern societies.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            From gate passes and visitor logs to maintenance billing, SOS alerts,
            and live CCTV. Completely frictionless operations.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-rose-600 text-white rounded-2xl text-[15px] font-bold hover:bg-rose-700 hover:shadow-[0_12px_30px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              Register your society <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[15px] font-bold hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5 text-slate-400" /> Admin Access
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { n: "23", l: "API Modules" },
              { n: "4", l: "User Roles" },
              { n: "3", l: "Platform Apps" },
              { n: "30", l: "Day Trial" },
            ].map(({ n, l }) => (
              <div key={l} className="bg-white border border-white rounded-[2rem] py-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                <span className="block text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{n}</span>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{l}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 md:px-10 pb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Powerful functionality, <span className="text-rose-500">beautifully built.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Video, title: "Live CCTV Streaming", desc: "WebRTC signaling for real-time camera feeds to admin and resident devices.", color: "bg-emerald-50 text-emerald-600" },
              { icon: Bell, title: "Emergency SOS", desc: "Real-time panic alerts via Socket.IO with GPS coordinates and instant push notifications.", color: "bg-rose-50 text-rose-600" },
              { icon: CreditCard, title: "Automated Billing", desc: "Maintenance billing with HMAC verification, subscriptions, and webhooks.", color: "bg-blue-50 text-blue-600" },
              { icon: QrCode, title: "QR Gate Passes", desc: "Cryptographically secure single-use QR codes with pre-approval flow.", color: "bg-purple-50 text-purple-600" },
              { icon: Home, title: "Multi-Tenant isolation", desc: "Complete society-level data isolation. One platform, unlimited societies.", color: "bg-orange-50 text-orange-600" },
              { icon: Smartphone, title: "Native Mobile Apps", desc: "React Native app for residents and guards with push notifications.", color: "bg-slate-50 text-slate-600" },
            ].map(({ icon: Icon, title, desc, color }, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                key={title}
                className="group bg-white border border-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className={`w-14 h-14 rounded-[18px] ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-lg font-bold text-slate-900 mb-2">{title}</p>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Call To Action */}
        <section className="max-w-5xl mx-auto px-6 md:px-10 pb-20">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Ambient Backgrounds for CTA */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Modernize operations today.
              </h2>
              <p className="text-lg font-medium text-slate-400 mb-10 max-w-xl mx-auto">Start your 30-day free trial and experience the future of building management.</p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                {["Setup in 5 minutes", "No credit card needed", "Cancel anytime"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm font-bold text-slate-300">
                    <Check className="w-5 h-5 text-rose-400" /> {t}
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-[1.2rem] text-base font-bold hover:bg-rose-50 hover:text-rose-600 transition-all shadow-[0_12px_24px_rgba(0,0,0,0.1)] group hover:scale-[1.02]"
              >
                Register free trial <ArrowRight className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 pb-8 pt-10 px-6 md:px-10 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-rose-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[13px] font-bold text-slate-400">© 2026 UNIFY - Premium Society Software</span>
          </div>
          <span className="text-[13px] font-bold text-slate-400">By Saniya Fathima</span>
        </div>
      </footer>

    </div>
  );
}
