import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Trophy,
  Award,
  History,
  Info,
  ChevronLeft,
  Zap,
  Calendar,
  Home,
  MessageSquare,
  BookOpen,
} from "lucide-react";

const Rewards = () => {
  const navigate = useNavigate();
  // const { user } = useAuth(); // Unused for now
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
      <div className="min-h-screen bg-neutral-900 text-white p-8 text-center animate-pulse">
        Loading Rewards...
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-24">
      <nav className="border-b border-neutral-800 px-4 py-4 flex items-center sticky top-0 z-10 bg-neutral-900/80 backdrop-blur">
        <button onClick={() => navigate(-1)} className="mr-4 text-neutral-400">
          <ChevronLeft />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Rewards & Progress</h1>
      </nav>

      <main className="p-4 max-w-lg mx-auto space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-800 p-5  ring-1 ring-white/5 text-center">
            <div className="flex justify-center mb-2">
              <Award className="text-purple-400 w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold">{summary.total_points}</h3>
            <p className="text-sm text-neutral-400">Total Points</p>
          </div>
          <div className="bg-neutral-800 p-5  ring-1 ring-white/5 text-center">
            <div className="flex justify-center mb-2">
              <Zap className="text-yellow-400 w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold">{summary.current_streak}</h3>
            <p className="text-sm text-neutral-400">Day Streak</p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Weekly Badges
          </h2>

          {history.badges.length === 0 ? (
            <div className="p-6 text-center bg-neutral-800 ">
              <p className="text-neutral-400">
                No badges earned yet. Keep taking your meds on time!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {history.badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-800 p-3  text-center ring-1 ring-white/5"
                >
                  <div
                    className={`w-10 h-10 mx-auto  flex items-center justify-center mb-2 
                                        ${
                                          badge.badge_type === "gold"
                                            ? "bg-yellow-500/20 text-yellow-500"
                                            : badge.badge_type === "silver"
                                              ? "bg-gray-300/20 text-gray-300"
                                              : "bg-orange-700/20 text-orange-600"
                                        }`}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  <p className="font-bold capitalize text-sm">
                    {badge.badge_type}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {new Date(badge.week_start_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" /> Points History
          </h2>
          <div className="bg-neutral-800  overflow-hidden ring-1 ring-white/5">
            {history.transactions.length === 0 && (
              <div className="p-6 text-center text-neutral-500">
                No activity yet.
              </div>
            )}
            {history.transactions.map((tx, idx) => (
              <div
                key={idx}
                className="p-4 border-b border-neutral-700 last:border-0 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{tx.reason}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="font-bold text-green-400">+{tx.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-neutral-800/50 p-6  ring-1 ring-white/5">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Info className="w-5 h-5" /> How Rewards Work
          </h3>
          <ul className="space-y-3 text-sm text-neutral-300">
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">+10</span> for taking
              doses on time (±15 mins)
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-400 font-bold">+6</span> for taking
              doses late
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">+4</span> for snoozed
              doses
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-bold">Streak</span> grows
              daily if 100% compliant
            </li>
            <li className="flex gap-2">
              Earn{" "}
              <span className="text-yellow-500 font-bold">
                Gold/Silver/Bronze
              </span>{" "}
              badges weekly!
            </li>
          </ul>
        </div>
      </main>

      {/* Bottom Navigation */}
      {/* Copied from PatientHome to maintain navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-4 flex justify-around z-20 pb-safe">
        <button
          onClick={() => navigate("/patient")}
          className="text-neutral-500 hover:text-white flex flex-col items-center text-[10px] gap-1 transition"
        >
          <Home className="w-6 h-6" /> Home
        </button>
        <button
          onClick={() => navigate("/patient/rewards")}
          className="text-white flex flex-col items-center text-[10px] gap-1 transition"
        >
          <Trophy className="w-6 h-6" /> Rewards
        </button>
        <button
          onClick={() => navigate("/messages")}
          className="text-neutral-500 hover:text-white flex flex-col items-center text-[10px] gap-1 transition"
        >
          <MessageSquare className="w-6 h-6" /> Chat
        </button>
        <button
          onClick={() => navigate("/patient/learn")}
          className="text-neutral-500 hover:text-white flex flex-col items-center text-[10px] gap-1 transition"
        >
          <BookOpen className="w-6 h-6" /> Learn
        </button>
      </nav>
    </div>
  );
};

export default Rewards;
