import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
// import { saveOfflineLog } from "../services/offline";
import {
  Check,
  X,
  Bell,
  Award,
  Calendar,
  Clock,
  Zap,
  Trophy,
} from "lucide-react";

const PatientHome = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
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

  // Audio for reminders
  const audioRef = useRef(
    new Audio("/frontend/public/universfield-clean-mobile-tone-454836.mp3"),
  );
  const [lastNotifiedTime, setLastNotifiedTime] = useState(null);

  const fetchData = async () => {
    try {
      const [medRes, logRes, gameRes, quoteRes, prescRes] = await Promise.all([
        api.get("medications/"),
        api.get("adherence/"),
        api
          .get("gamification/summary/")
          .catch(() => ({ data: { total_points: 0, current_streak: 0 } })),
        api.get("learn/home-quotes/").catch(() => ({ data: [] })),
        api.get("prescriptions/").catch(() => ({ data: [] })),
      ]);

      setMedications(medRes.data);
      setLogs(logRes.data);
      setGamification(gameRes.data);
      setQuotes(quoteRes.data);
      setPrescriptions(prescRes.data);
    } catch (error) {
      console.error("Error fetching patient data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll for reminders every 10 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHM = now.toTimeString().slice(0, 5); // "HH:MM"

      // Avoid double notification in the same minute
      if (lastNotifiedTime === currentHM) return;

      medications.forEach((med) => {
        const medHM = med.scheduled_time.slice(0, 5);
        if (medHM === currentHM) {
          // Check if already taken today
          const todayLog = logs.find(
            (l) =>
              l.medication === med.id &&
              new Date(l.scheduled_time).toDateString() === now.toDateString(),
          );

          if (!todayLog || todayLog.status === "scheduled") {
            // Play sound
            audioRef.current
              .play()
              .catch((e) =>
                console.log("Audio play failed (interaction needed):", e),
              );

            // Show Alert (Browser Notification or Toast)
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Time to take your meds!", {
                body: `It's time for ${med.medication_name}`,
              });
            } else if (
              "Notification" in window &&
              Notification.permission !== "denied"
            ) {
              Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                  new Notification("Time to take your meds!", {
                    body: `It's time for ${med.medication_name}`,
                  });
                }
              });
            } else {
              // Fallback to alert if notifications not supported/granted, but alerts block thread
              // alert(`Time to take your medication: ${med.medication_name}`);
            }

            setLastNotifiedTime(currentHM);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [medications, logs, lastNotifiedTime]);

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

        // Refresh prescriptions to update pill count
        const prescRes = await api.get("prescriptions/");
        setPrescriptions(prescRes.data);

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
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          Patient Dashboard
        </h1>
        <p className="text-neutral-500">
          Welcome back, {user?.full_name || user?.username}
        </p>
      </header>
      <main className="p-4 w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Motivation */}
          <div className="space-y-6 lg:col-span-1">
            {/* Gamification Header Widget */}
            <div className="bg-gradient-to-br bg-white   p-6 ring-1 ring-black relative overflow-hidden">
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
                  <p className="text-black text-sm font-medium mb-1">
                    Current Streak
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-black flex items-center gap-2">
                      {gamification.current_streak}{" "}
                      <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </h2>
                    <span className="text-sm text-black">days</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-black text-sm font-medium mb-1">
                    Total Points
                  </p>
                  <div className="text-2xl font-bold text-black flex items-center justify-end gap-2">
                    {gamification.total_points}{" "}
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-black mb-2">
                  <span className="text-black">Weekly Progress</span>
                  <span>
                    {gamification.current_streak > 0
                      ? "On Fire!"
                      : "Keep going!"}
                  </span>
                </div>
                <div className="h-3 bg-neutral-800  overflow-hidden">
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
            <div className="bg-white p-6 ring-1 ring-white/10 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
              {quotes.length > 0 ? (
                <div className="animate-in fade-in slide-in-from-right duration-700 key={currentQuoteIndex}">
                  <p className="text-xl font-light italic text-black mb-4">
                    "{quotes[currentQuoteIndex].text}"
                  </p>
                  <div className="flex justify-between items-center text-xs text-neutral-500 uppercase tracking-wider">
                    <span>{quotes[currentQuoteIndex].author || "Unknown"}</span>
                    <span
                      className={`px-2 py-1  bg-white/5 ${
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
          </div>

          {/* Center/Right Column: Meds & Prescription Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Reminders - Dynamic */}
            {prescriptions.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Pill Count / Refill */}
                <div className="bg-white p-4  ring-1 ring-white/5 shadow-lg shadow-black/20">
                  <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Details
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {prescriptions[0].current_pills} Pills Left
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {/* Naive refill calculation if not in backend yet */}
                    {prescriptions[0].total_pills > 0
                      ? `${Math.round((prescriptions[0].current_pills / prescriptions[0].total_pills) * 100)}% remaining`
                      : "0%"}
                  </p>
                </div>

                {/* Review Date */}
                <div className="bg-white p-4  ring-1 ring-white/5 shadow-lg shadow-black/20">
                  <div className="flex items-center gap-2 mb-2 text-purple-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Review
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {prescriptions[0].review_date
                      ? new Date(
                          prescriptions[0].review_date,
                        ).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      : "Not set"}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">Next Check-up</p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4  ring-1 ring-white/5 shadow-lg shadow-black/20 text-neutral-500 text-sm">
                No active prescriptions
              </div>
            )}

            {/* Medications List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4" /> Upcoming Doses
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  return (
                    <div
                      key={med.id}
                      className="bg-white  p-5 ring-1 ring-white/5 flex justify-between items-center shadow-lg shadow-black/20"
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
                        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1  text-sm font-medium">
                          <Check className="w-4 h-4" /> Taken
                        </div>
                      ) : isMissed ? (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1  text-sm font-medium">
                          <X className="w-4 h-4" /> Missed
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLog(med, "taken", todayLog)}
                            className="bg-white text-black p-2  hover:bg-neutral-200 transition"
                            title="Mark as Taken"
                          >
                            <Check className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => handleLog(med, "missed", todayLog)}
                            className="bg-white text-neutral-400 p-2  ring-1 ring-neutral-700 hover:bg-neutral-700 transition"
                            title="Mark as Missed"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {medications.length === 0 && (
                <p className="text-neutral-500 text-center py-8">
                  No medications scheduled.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
    </div>
  );
};

export default PatientHome;
