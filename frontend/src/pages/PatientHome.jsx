import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import { saveOfflineLog } from "../services/offline";
import {
  Check,
  X,
  Bell,
  Award,
  Calendar,
  MessageSquare,
  BookOpen,
  Home,
  Clock,
  Zap,
  Trophy,
  BarChart2,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState({
    total_points: 0,
    current_streak: 0,
    latest_badge: null,
  });
  const [showAnimation, setShowAnimation] = useState(false);

  // Motivation
  const [quotes, setQuotes] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const fetchData = async () => {
    try {
      const [medRes, logRes, gameRes, quoteRes] = await Promise.all([
        api.get("medications/"),
        api.get("adherence/"),
        api
          .get("gamification/summary/")
          .catch(() => ({ data: { total_points: 0, current_streak: 0 } })),
        api.get("learn/home-quotes/").catch(() => ({ data: [] })),
      ]);

      setMedications(medRes.data);
      setLogs(logRes.data);
      setGamification(gameRes.data);
      setQuotes(quoteRes.data);
    } catch (error) {
      console.error("Error fetching patient data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Rotate quotes every 30 seconds
  useEffect(() => {
    if (quotes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [quotes]);

  const handleLog = async (med, status, existingLog) => {
    try {
      let res;
      // If we have a scheduled log, we update it
      if (existingLog && existingLog.id) {
        res = await api.patch(`adherence/${existingLog.id}/`, {
          status: status,
          actual_time: new Date().toISOString(),
        });
        // Update local state by replacing the log
        setLogs(logs.map((l) => (l.id === existingLog.id ? res.data : l)));
      } else {
        // Create new log (fallback)
        // Construct scheduled time for today based on med time
        const now = new Date();
        const [hours, minutes] = med.scheduled_time.split(":");
        const scheduledTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
        ).toISOString();

        res = await api.post("adherence/", {
          medication: med.id,
          status: status,
          scheduled_time: scheduledTime,
          actual_time: new Date().toISOString(),
        });
        setLogs([...logs, res.data]);
      }

      // Refresh gamification data to show updated points/streak
      if (status === "taken") {
        const gameRes = await api.get("gamification/summary/");
        setGamification(gameRes.data);
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 2000);
      }
    } catch (error) {
      console.error("Error logging dose", error);
      // Save offline logic could be complex with PATCH vs POST, simplified for now
      // ... (omitted for brevity, or keep existing alert)
      alert("Failed to save dose. Please try again.");
    }
  };

  if (loading)
    return <div className="p-8 text-center animate-pulse">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-24">
      <nav className="border-b border-neutral-800 px-4 py-4 flex justify-between items-center sticky top-0 z-10 bg-neutral-900/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-white" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            ART Companion
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Logout
          </button>
          <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">
              {(user?.full_name || user?.username)?.[0].toUpperCase()}
            </span>
          </div>
        </div>
      </nav>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Gamification Header Widget */}
        <div className="bg-gradient-to-br from-indigo-900 to-neutral-900 rounded-2xl p-6 ring-1 ring-white/10 relative overflow-hidden">
          {showAnimation && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
                <p className="text-2xl font-bold text-yellow-400 mt-2">
                  + Points!
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-indigo-300 text-sm font-medium mb-1">
                Current Streak
              </p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-white flex items-center gap-2">
                  {gamification.current_streak}{" "}
                  <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </h2>
                <span className="text-sm text-neutral-400">days</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-300 text-sm font-medium mb-1">
                Total Points
              </p>
              <div className="text-2xl font-bold text-white flex items-center justify-end gap-2">
                {gamification.total_points}{" "}
                <Award className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-indigo-300 mb-2">
              <span>Weekly Progress</span>
              <span>
                {gamification.current_streak > 0 ? "On Fire!" : "Keep going!"}
              </span>
            </div>
            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
              {/* Mock progress based on streak or logs, ideally calculated from weekly adherence */}
              <div
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(gamification.current_streak * 10, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Motivation Widget */}
        <div className="bg-neutral-800 rounded-2xl p-6 ring-1 ring-white/10 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
          {quotes.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-right duration-700 key={currentQuoteIndex}">
              <p className="text-xl font-light italic text-neutral-300 mb-4">
                "{quotes[currentQuoteIndex].text}"
              </p>
              <div className="flex justify-between items-center text-xs text-neutral-500 uppercase tracking-wider">
                <span>{quotes[currentQuoteIndex].author || "Unknown"}</span>
                <span
                  className={`px-2 py-1 rounded-full bg-white/5 ${
                    quotes[currentQuoteIndex].category === "spiritual"
                      ? "text-blue-400"
                      : quotes[currentQuoteIndex].category === "mental"
                        ? "text-purple-400"
                        : "text-green-400"
                  }`}
                >
                  {quotes[currentQuoteIndex].category}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-neutral-500">
              <p>Loading inspiration...</p>
            </div>
          )}
          {/* Simple progress bar for timer */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
            <div
              key={currentQuoteIndex}
              className="h-full bg-white/30 animate-[progress_30s_linear]"
              style={{ animationDuration: "30s" }}
            ></div>
          </div>
        </div>

        {/* Reminders - Compact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-800 p-4 rounded-xl ring-1 ring-white/5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Refill
              </span>
            </div>
            <p className="text-lg font-bold">In 5 Days</p>
          </div>
          <div className="bg-neutral-800 p-4 rounded-xl ring-1 ring-white/5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-2 text-purple-400">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Clinic
              </span>
            </div>
            <p className="text-lg font-bold">Oct 24</p>
          </div>
        </div>

        {/* Medications List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Upcoming Doses
          </h3>

          {medications.map((med) => {
            // Find today's log for this medication
            const todayLog = logs.find(
              (l) =>
                l.medication === med.id &&
                new Date(l.scheduled_time).toDateString() ===
                  new Date().toDateString(),
            );

            const isTaken = todayLog?.status === "taken";
            const isMissed = todayLog?.status === "missed";
            const isScheduled = !todayLog || todayLog?.status === "scheduled";

            return (
              <div
                key={med.id}
                className="bg-neutral-800 rounded-xl p-5 ring-1 ring-white/5 flex justify-between items-center shadow-lg shadow-black/20"
              >
                <div>
                  <h4 className="font-semibold text-lg">
                    {med.medication_name}
                  </h4>
                  <p className="text-neutral-400 text-sm">
                    {med.dosage} • {med.scheduled_time}
                  </p>
                </div>

                {isTaken ? (
                  <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm font-medium">
                    <Check className="w-4 h-4" /> Taken
                  </div>
                ) : isMissed ? (
                  <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1 rounded-full text-sm font-medium">
                    <X className="w-4 h-4" /> Missed
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLog(med, "taken", todayLog)}
                      className="bg-white text-black p-2 rounded-full hover:bg-neutral-200 transition"
                      title="Mark as Taken"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleLog(med, "missed", todayLog)}
                      className="bg-neutral-800 text-neutral-400 p-2 rounded-full ring-1 ring-neutral-700 hover:bg-neutral-700 transition"
                      title="Mark as Missed"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {medications.length === 0 && (
            <p className="text-neutral-500 text-center py-8">
              No medications scheduled.
            </p>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-4 flex justify-around z-20 pb-safe">
        <button
          onClick={() => navigate("/patient")}
          className="text-white flex flex-col items-center text-[10px] gap-1 transition"
        >
          <Home className="w-6 h-6" /> Home
        </button>
        <button
          onClick={() => navigate("/patient/rewards")}
          className="text-neutral-500 hover:text-white flex flex-col items-center text-[10px] gap-1 transition"
        >
          <Trophy className="w-6 h-6" /> Rewards
        </button>
        <button
          onClick={() => navigate("/patient/analytics")}
          className="text-neutral-500 hover:text-white flex flex-col items-center text-[10px] gap-1 transition"
        >
          <BarChart2 className="w-6 h-6" /> Analytics
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

export default PatientHome;
