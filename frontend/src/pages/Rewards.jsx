import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Trophy,
  Award,
  History,
  ChevronLeft,
  Zap,
  Star,
  TrendingUp,
  Calendar,
} from "lucide-react";

const Rewards = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState({ transactions: [], badges: [] });
  const [summary, setSummary] = useState({
    total_points: 0,
    current_streak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const [histRes, sumRes] = await Promise.all([
          api.get("gamification/history/"),
          api
            .get("gamification/summary/")
            .catch(() => ({ data: { total_points: 0, current_streak: 0 } })),
        ]);
        setHistory(histRes.data);
        setSummary(sumRes.data);
      } catch (error) {
        console.error("Failed to fetch rewards", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-8 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
          <p className="text-neutral-400 font-medium tracking-wide">
            Loading Rewards...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-yellow-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] bg-yellow-900/10 rounded-full blur-[100px]" />
      </div>

      <nav className="relative z-10 p-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-neutral-400 hover:text-white hover:bg-white dark:bg-neutral-900/10 rounded-full transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-neutral-200">
          Your Progress
        </h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </nav>

      <main className="relative z-10 px-6 pb-12 max-w-lg mx-auto space-y-10">
        {/* HERO SECTION */}
        <div className="text-center space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
            <Trophy className="relative w-24 h-24 mx-auto text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 tracking-tighter">
              {summary.total_points}
            </h2>
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-widest">
              Total Points
            </p>
          </div>

          {/* Streak Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neutral-800 to-neutral-900 border border-neutral-700/50 rounded-full shadow-lg">
            <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="font-bold text-orange-400">
              {summary.current_streak} Day Streak
            </span>
          </div>
        </div>

        {/* BADGES SECTION */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
              <Award className="w-5 h-5 text-purple-400" /> Weekly Achievements
            </h3>
          </div>

          {history.badges.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center backdrop-blur-sm">
              <Star className="w-10 h-10 text-neutral-700 dark:text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">
                No badges earned yet.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Maintain 100% adherence this week to earn Gold!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {history.badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-all hover:-translate-y-1 shadow-lg"
                >
                  <div
                    className={`p-3 rounded-full mb-3 shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 ${
                      badge.badge_type === "gold"
                        ? "bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-yellow-500/20"
                        : badge.badge_type === "silver"
                          ? "bg-gradient-to-br from-gray-300 to-gray-500 shadow-gray-500/20"
                          : "bg-gradient-to-br from-orange-400 to-orange-700 shadow-orange-500/20"
                    }`}
                  >
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-sm capitalize text-neutral-200">
                    {badge.badge_type}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(badge.week_start_date).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HISTORY SECTION */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-blue-400" /> Recent Activity
          </h3>

          <div className="space-y-2">
            {history.transactions.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400 bg-neutral-900/50 rounded-xl border border-neutral-800">
                Start logging your intakes to see history here.
              </div>
            ) : (
              history.transactions.slice(0, 5).map((tx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 transition-colors backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400">
                      {tx.points > 0 ? (
                        <TrendingUp size={18} className="text-green-500" />
                      ) : (
                        <History size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-200 text-sm">
                        {tx.reason}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(tx.created_at).toLocaleString(undefined, {
                          weekday: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-sm ${tx.points > 0 ? "text-green-400" : "text-neutral-400"}`}
                  >
                    {tx.points > 0 ? "+" : ""}
                    {tx.points}
                  </span>
                </div>
              ))
            )}
          </div>
          {history.transactions.length > 5 && (
            <button className="w-full py-3 text-sm text-neutral-500 dark:text-neutral-400 hover:text-white transition-colors border-t border-neutral-800 mt-2">
              View All History
            </button>
          )}
        </section>
      </main>
    </div>
  );
};

export default Rewards;
