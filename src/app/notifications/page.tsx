"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  matchId?: string;
}

const typeIcon: Record<string, string> = {
  MATCH_COMPLETED:   "🏆",
  MATCH_STARTED:     "🏏",
  WICKET_ALERT:      "🔴",
  RESULT_DECLARED:   "✅",
  TOSS_UPDATE:       "🪙",
  ANNOUNCEMENT:      "📢",
  FIXTURE_PUBLISHED: "📅",
  INNINGS_BREAK:     "☕",
  SCHEDULE_UPDATED:  "🗓️",
  TEAM_ANNOUNCEMENT: "👥",
  MATCH_REMINDER:    "⏰",
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!session) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const visible = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!session) {
    return (
      <PublicShell mainClassName="overflow-hidden">
        <div className="flex min-h-[60vh] items-center justify-center bg-[#00142b] text-[#d4e3ff]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9bb2d1]">Sign in required</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              View your notifications
            </h2>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-block bg-[#4ae183] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#00142b] transition hover:bg-white"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell mainClassName="overflow-hidden">
      <div className="bg-[#00142b] text-[#d4e3ff]">
        {/* Header */}
        <section className="relative overflow-hidden px-4 pb-8 pt-10 sm:px-6 lg:pb-10 lg:pt-12">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,54,86,0.95),transparent_52%),linear-gradient(180deg,rgba(0,20,43,0.22),#00142b_76%)]" />

          <div className="relative mx-auto max-w-screen-xl">
            <div className="inline-flex items-center gap-2 bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d4e3ff]">
              Inbox
            </div>
            <div className="mt-6 flex items-end justify-between gap-6">
              <div>
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  Notifications
                  <span className="block text-[#4ae183]">{unreadCount > 0 ? `${unreadCount} unread` : "all clear"}</span>
                </h1>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="shrink-0 border border-white/10 bg-[#001c3a] px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-[#d4e3ff] transition hover:border-[#4ae183] hover:text-[#4ae183]"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          {/* Filter tabs */}
          <div className="mb-6 flex gap-2">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-black uppercase tracking-[0.14em] transition ${
                  filter === f
                    ? "bg-[#4ae183] text-[#00142b]"
                    : "border border-white/10 bg-[#001c3a] text-[#9bb2d1] hover:border-[#4ae183] hover:text-[#4ae183]"
                }`}
              >
                {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border border-white/10 bg-[#001c3a] p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-[#1b3656]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 bg-[#1b3656]" />
                      <div className="h-3 w-3/4 bg-[#1b3656]" />
                      <div className="h-2 w-1/4 bg-[#1b3656]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="border border-white/10 bg-[#001c3a] p-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4ae183]">
                {filter === "unread" ? "All caught up" : "No notifications"}
              </p>
              <p className="mt-3 font-[var(--font-display)] text-2xl font-black uppercase text-white">
                {filter === "unread" ? "No unread notifications" : "Nothing here yet"}
              </p>
              <p className="mt-2 text-sm text-[#9bb2d1]">
                {filter === "unread" ? "You're all caught up!" : "Notifications will appear here as activity happens."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`border bg-[#001c3a] transition cursor-pointer hover:bg-[#0b2747] ${
                    !notif.isRead
                      ? "border-l-4 border-[#4ae183]"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#1b3656] text-xl">
                      {typeIcon[notif.type] || "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold ${!notif.isRead ? "text-white" : "text-[#9bb2d1]"}`}>
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-[#9bb2d1]">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[#9bb2d1] line-clamp-2">{notif.message}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="bg-[#1b3656] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e3ff]">
                          {notif.type.replace(/_/g, " ")}
                        </span>
                        {notif.matchId && (
                          <Link
                            href={`/matches/${notif.matchId}`}
                            className="text-xs font-bold text-[#4ae183] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View match →
                          </Link>
                        )}
                        {!notif.isRead && (
                          <span className="ml-auto text-[10px] font-black uppercase tracking-[0.16em] text-[#4ae183]">New</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
