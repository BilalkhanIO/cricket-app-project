"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
  TEAM_APPROVED:     "👕",
  LEAGUE_REGISTRATION: "🏆",
  MATCH_REMINDER:    "⏰",
};

const typeColor: Record<string, string> = {
  MATCH_COMPLETED: "bg-yellow-100 text-yellow-700",
  MATCH_STARTED:   "bg-blue-100 text-blue-700",
  WICKET_ALERT:    "bg-red-100 text-red-700",
  RESULT_DECLARED: "bg-emerald-100 text-emerald-700",
  ANNOUNCEMENT:    "bg-purple-100 text-purple-700",
  MATCH_REMINDER:  "bg-orange-100 text-orange-700",
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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-10">
            <div className="text-5xl mb-3">🔔</div>
            <h2 className="text-xl font-bold text-[#1B3A5C] mb-2">Sign in to view notifications</h2>
            <Link href="/login" className="text-[#769FCD] hover:underline font-medium">Login →</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F7FBFC]">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-[#1B3A5C] text-white py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#769FCD] rounded-xl flex items-center justify-center text-xl">🔔</div>
                <div>
                  <h1 className="text-2xl font-bold">Notifications</h1>
                  <p className="text-[#B9D7EA] text-sm mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-sm text-[#B9D7EA] hover:text-white border border-[#2D5484] hover:border-[#769FCD] px-4 py-2 rounded-lg transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-[#769FCD] text-white shadow-sm"
                    : "bg-white border border-[#B9D7EA] text-[#4A7098] hover:border-[#769FCD]"
                }`}
              >
                {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#D6E6F2] p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-[#D6E6F2] rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#D6E6F2] rounded w-1/2" />
                      <div className="h-3 bg-[#D6E6F2] rounded w-3/4" />
                      <div className="h-2 bg-[#D6E6F2] rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#B9D7EA]">
              <div className="text-5xl mb-3">🔔</div>
              <h3 className="text-lg font-semibold text-[#1B3A5C] mb-1">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h3>
              <p className="text-[#4A7098] text-sm">
                {filter === "unread" ? "You're all caught up!" : "Notifications will appear here as activity happens."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                    !notif.isRead
                      ? "border-[#769FCD] border-l-4"
                      : "border-[#D6E6F2]"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${typeColor[notif.type] || "bg-[#D6E6F2] text-[#4A7098]"}`}>
                      {typeIcon[notif.type] || "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${!notif.isRead ? "text-[#1B3A5C]" : "text-[#4A7098]"}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-[#B9D7EA] flex-shrink-0">{formatTime(notif.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[#4A7098] mt-0.5 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor[notif.type] || "bg-[#D6E6F2] text-[#4A7098]"}`}>
                          {notif.type.replace(/_/g, " ")}
                        </span>
                        {notif.matchId && (
                          <Link
                            href={`/matches/${notif.matchId}`}
                            className="text-xs text-[#769FCD] hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View match →
                          </Link>
                        )}
                        {!notif.isRead && (
                          <span className="ml-auto text-[10px] text-[#769FCD] font-semibold">• New</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
