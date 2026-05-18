"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { HFLogo } from "@/components/branding/HFLogo";
import { Sparkles } from "lucide-react";

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

  return (
    <div className="relative flex flex-1 flex-col bg-[#0a1738] text-white overflow-hidden">
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
      <div className="relative z-10 flex items-center justify-between px-10 py-8">
        <HFLogo variant="light" />
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Skin Health Insights
        </div>
      </div>

      {/* Center */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] font-semibold tracking-tight max-w-5xl leading-[1.05]"
        >
          Get instant guidance on your skin concerns from our{" "}
          <span className="text-[#7BA7FF]">AI Dermatology Concierge.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-4 max-w-2xl text-lg text-white/70"
        >
          Educational, private, and connected to Henry Ford dermatologists.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl pulse-ring" />
            <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-[#003DA5]/30">
              <QRCodeSVG
                value={sessionUrl}
                size={260}
                bgColor="#ffffff"
                fgColor="#002C75"
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <motion.div
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-3 text-[#A8C3FF]"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[#A8C3FF]" />
            <span className="font-medium text-base tracking-wide">
              Scan with your phone to begin your private consultation
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-10 py-5 text-sm">
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
          <div className="text-white/60 text-xs uppercase tracking-[0.22em]">
            In partnership with Henry Ford Dermatology
          </div>
        </div>
      </div>
    </div>
  );
}
