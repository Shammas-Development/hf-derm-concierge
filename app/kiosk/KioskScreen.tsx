"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { HFLogo } from "@/components/branding/HFLogo";
import { Sparkles, Smartphone, ArrowRight } from "lucide-react";

export function KioskScreen({ sessionUrl }: { sessionUrl: string }) {
  const [count, setCount] = useState(1247);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      // Increment by 1 most of the time, occasionally 2
      setCount((c) => c + (Math.random() < 0.15 ? 2 : 1));
      const next = 8000 + Math.random() * 17000; // 8–25s
      window.setTimeout(tick, next);
    };
    const id = window.setTimeout(tick, 8000 + Math.random() * 6000);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  // Phone-relative path (so the link works regardless of host).
  const sessionPath = sessionUrl.replace(/^https?:\/\/[^/]+/, "") || sessionUrl;

  return (
    <div className="relative flex flex-1 flex-col bg-[#0a1738] text-white overflow-hidden">
      {/* ============================================
          Phone-sized fallback (shown only below sm)
          ============================================ */}
      <div className="sm:hidden relative flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="absolute inset-0 -z-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-[#003DA5]/40 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-[#1E40AF]/35 blur-[120px]" />
        </div>
        <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white/5 border border-white/10 backdrop-blur p-7 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Smartphone className="h-6 w-6 text-[#7BA7FF]" />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-semibold">
            You're already on your phone
          </h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            The kiosk page is designed for the booth display. Skip the QR and
            jump straight into your private consultation.
          </p>
          <Link
            href={sessionPath}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-[#003DA5] font-medium px-4 py-3 hover:bg-white/90 transition"
          >
            Start my consultation
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="mt-3 inline-block text-xs text-white/55 hover:text-white/80"
          >
            ← back home
          </Link>
        </div>
      </div>

      {/* ============================================
          Kiosk view (shown at sm and up)
          ============================================ */}
      <div className="hidden sm:flex flex-1 flex-col">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-40 -left-40 h-[60rem] w-[60rem] rounded-full bg-[#003DA5]/40 blur-[120px] drift-slow" />
          <div className="absolute -bottom-60 -right-40 h-[50rem] w-[50rem] rounded-full bg-[#1E40AF]/35 blur-[140px] drift-slower" />
          <div className="absolute top-1/3 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#5B8DEF]/15 blur-[100px]" />
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-6 md:px-10 lg:px-16 py-6 md:py-8 lg:py-10">
          <HFLogo variant="light" />
          <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Skin Health Insights
          </div>
        </div>

        {/* Center — typography and QR scale fluidly all the way to 4K */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 md:px-10 pb-16 md:pb-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-heading text-[clamp(2rem,4.5vw,7rem)] font-semibold tracking-tight max-w-[min(90vw,1600px)] leading-[1.04]"
          >
            Get instant guidance on your skin concerns from our{" "}
            <span className="text-[#7BA7FF]">AI Dermatology Concierge.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-4 lg:mt-6 max-w-[min(80vw,900px)] text-[clamp(1rem,1.4vw,1.75rem)] text-white/70"
          >
            Educational, private, and connected to board-certified dermatologists.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            className="mt-10 md:mt-12 lg:mt-16 flex flex-col items-center gap-5 md:gap-6 lg:gap-10"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl pulse-ring" />
              <div className="rounded-3xl bg-white p-4 md:p-5 lg:p-7 shadow-2xl shadow-[#003DA5]/30">
                <div
                  className="aspect-square"
                  style={{ width: "clamp(220px, 28vw, 560px)" }}
                >
                  <QRCodeSVG
                    value={sessionUrl}
                    size={560}
                    bgColor="#ffffff"
                    fgColor="#002C75"
                    level="M"
                    includeMargin={false}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            </div>

            <motion.div
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-3 text-[#A8C3FF]"
            >
              <span className="inline-block h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-[#A8C3FF]" />
              <span className="font-medium text-[clamp(0.875rem,1.1vw,1.5rem)] tracking-wide">
                Scan with your phone to begin your private consultation
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 px-6 md:px-10 lg:px-16 py-4 md:py-5 lg:py-7 text-[clamp(0.8rem,1vw,1.25rem)]">
            <div className="flex items-center gap-3 text-white/75">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span>
                <span className="font-semibold text-white tabular-nums">
                  {count.toLocaleString()}
                </span>{" "}
                consultations today
              </span>
            </div>
            <div className="hidden md:block text-white/60 text-[clamp(0.7rem,0.7vw,1rem)] uppercase tracking-[0.22em]">
              Skin Health Concierge · Demo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
