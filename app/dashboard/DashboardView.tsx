"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import {
  Activity,
  ClipboardCheck,
  Clock,
  TrendingUp,
  LogOut,
  Sparkles,
  Radio,
} from "lucide-react";
import { HFHeader } from "@/components/branding/HFHeader";
import { Button } from "@/components/ui/button";
import { UrgencyChip } from "@/components/shared/UrgencyBadge";
import { Badge } from "@/components/ui/badge";
import {
  STAT_CARDS,
  CONCERN_BREAKDOWN,
  URGENCY_BREAKDOWN,
  HOURLY_TRAFFIC,
} from "@/lib/mockData/dashboardStats";
import {
  initialFeed,
  generateLeads,
  randomFeedItem,
} from "@/lib/mockData/fakeLeads";
import { logoutAction } from "./actions";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const [feed, setFeed] = useState(initialFeed);
  const [active, setActive] = useState(STAT_CARDS.activeSessions);
  const [totalConsults, setTotalConsults] = useState(STAT_CARDS.totalConsultations);
  const leads = useMemo(() => generateLeads(18), []);

  // Live feed updates
  useEffect(() => {
    let cancelled = false;
    let id: number;
    const tick = () => {
      if (cancelled) return;
      setTotalConsults((c) => {
        const item = randomFeedItem(c + 1);
        setFeed((prev) => [item, ...prev].slice(0, 18));
        return c + 1;
      });
      id = window.setTimeout(tick, 4500 + Math.random() * 6500);
    };
    id = window.setTimeout(tick, 3500);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  // Active sessions ebb and flow
  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((a) => {
        const delta = Math.round((Math.random() - 0.5) * 3);
        return Math.max(2, Math.min(15, a + delta));
      });
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-1 flex-col bg-[#F5F7FA]">
      <HFHeader
        rightSlot={
          <>
            <Badge className="bg-[#10B981]/15 text-[#065F46] hover:bg-[#10B981]/15 border-0 gap-1.5">
              <Radio className="h-3 w-3 animate-pulse" />
              Live · Event Day
            </Badge>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </>
        }
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total consultations today"
            value={totalConsults.toLocaleString()}
            sub="+18% vs last event"
            tint="#003DA5"
          />
          <StatCard
            icon={Sparkles}
            label="Active sessions"
            value={
              <span className="inline-flex items-center gap-2">
                <span className="tabular-nums">{active}</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
              </span>
            }
            sub="Right now"
            tint="#10B981"
          />
          <StatCard
            icon={Clock}
            label="Avg session duration"
            value={STAT_CARDS.avgDuration}
            sub="Stable"
            tint="#F59E0B"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Leads captured"
            value={STAT_CARDS.leadsCaptured.toString()}
            sub="62% booked appointment"
            tint="#5B8DEF"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Live feed */}
          <section className="lg:col-span-2 rounded-2xl border border-border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#EEF2FB] text-[#003DA5] flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Live activity feed</div>
                  <div className="text-[11px] text-muted-foreground">
                    Updates as patients move through the flow
                  </div>
                </div>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto chat-scroll">
              <AnimatePresence initial={false}>
                {feed.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-b border-border last:border-0"
                  >
                    <div className="px-5 py-2.5 flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#003DA5] shrink-0" />
                      <div className="text-sm text-foreground/85 leading-snug">
                        {item.text}
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {timeAgo(item.at)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Charts column */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Concerns breakdown" subtitle="Top reasons patients are here">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CONCERN_BREAKDOWN}
                      dataKey="value"
                      innerRadius={42}
                      outerRadius={78}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {CONCERN_BREAKDOWN.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #E5E9F0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                {CONCERN_BREAKDOWN.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ background: d.color }}
                    />
                    <span className="text-foreground/75">{d.name}</span>
                    <span className="ml-auto tabular-nums text-foreground/60">
                      {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Urgency distribution" subtitle="Triage outcomes today">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={URGENCY_BREAKDOWN}
                    layout="vertical"
                    margin={{ left: 8, right: 30, top: 10, bottom: 4 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={60}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar dataKey="value" radius={6}>
                      {URGENCY_BREAKDOWN.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(v) => `${v ?? 0}%`}
                        style={{ fontSize: 11, fill: "#1F2937" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Hourly traffic"
              subtitle="Consultations per hour"
              className="md:col-span-2"
            >
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={HOURLY_TRAFFIC}
                    margin={{ left: -10, right: 10, top: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="traf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#003DA5" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#003DA5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #E5E9F0",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="consultations"
                      stroke="#003DA5"
                      strokeWidth={2}
                      fill="url(#traf)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Leads table */}
        <section className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#EEF2FB] text-[#003DA5] flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Recent leads</div>
                <div className="text-[11px] text-muted-foreground">
                  Ready for follow-up by care coordinators
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F7FA] text-foreground/60 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Name</th>
                  <th className="px-5 py-2.5 text-left font-medium">Age</th>
                  <th className="px-5 py-2.5 text-left font-medium">Concern</th>
                  <th className="px-5 py-2.5 text-left font-medium">Urgency</th>
                  <th className="px-5 py-2.5 text-left font-medium">Booked</th>
                  <th className="px-5 py-2.5 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr
                    key={i}
                    className="border-t border-border hover:bg-[#F5F7FA]/50"
                  >
                    <td className="px-5 py-2.5 font-medium text-foreground">
                      {l.firstName}
                    </td>
                    <td className="px-5 py-2.5 text-foreground/75">
                      {l.ageRange}
                    </td>
                    <td className="px-5 py-2.5 text-foreground/75">
                      {l.concern}
                    </td>
                    <td className="px-5 py-2.5">
                      <UrgencyChip level={l.urgency} />
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          l.booked
                            ? "bg-[#10B981]/15 text-[#065F46]"
                            : "bg-[#94A3B8]/15 text-[#475569]",
                        )}
                      >
                        {l.booked ? "Booked" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-muted-foreground tabular-nums">
                      {l.minutesAgo}m ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub: string;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center"
          style={{ background: tint + "15", color: tint }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-heading text-3xl font-semibold text-[#002C75] tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-white p-5", className)}>
      <div className="mb-3">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
