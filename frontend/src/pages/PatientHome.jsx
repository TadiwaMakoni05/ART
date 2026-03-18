import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
// import { saveOfflineLog } from "../services/offline";
import toast from "react-hot-toast";
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
import ConfirmModal from "../components/ConfirmModal";
import AIChatHelper from "../components/AIChatHelper";

/*
  PatientHome.jsx

  Main dashboard for patients. Responsibilities:
  - Fetch patient-centric data (medications, adherence logs, gamification summary,
    motivational quotes, prescriptions, viral load results).
  - Handle push notification subscription and local reminder polling.
  - Provide a UI for marking doses as taken/missed with confirmation.
  - Display gamification points/streaks and motivational quotes.
  - Show summary of upcoming doses, prescription status, and lab results.
*/

const PatientHome = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [viralLoads, setViralLoads] = useState([]);
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

  // Confirm Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMed, setModalMed] = useState(null);
  const [modalTodayLog, setModalTodayLog] = useState(null);

  // Audio for reminders
  const audioRef = useRef(
    new Audio("/universfield-clean-mobile-tone-454836.mp3"),
  );
  const [lastNotifiedTime, setLastNotifiedTime] = useState(null);

  const [loggingMedId, setLoggingMedId] = useState(null);

  // Fetch all required patient dashboard data in parallel.
  // This includes medications, adherence logs, gamification summary, motivational quotes, prescriptions, and viral load results.
  // Data is re-fetched when the component mounts and after certain actions (e.g., logging a dose).
  const fetchData = async () => {
    try {
      const [medRes, logRes, gameRes, quoteRes, prescRes, vlRes] =
        await Promise.all([
          api.get("medications/"),
          api.get("adherence/"),
          api
            .get("gamification/summary/")
            .catch(() => ({ data: { total_points: 0, current_streak: 0 } })),
          api.get("learn/home-quotes/").catch(() => ({ data: [] })),
          api.get("prescriptions/").catch(() => ({ data: [] })),
          api.get("viral-loads/").catch(() => ({ data: [] })),
        ]);

      setMedications(medRes.data);
      setLogs(logRes.data);
      setGamification(gameRes.data);
      setQuotes(quoteRes.data);
      setPrescriptions(prescRes.data);
      setViralLoads(vlRes.data);
    } catch (error) {
      console.error("Error fetching patient data", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert VAPID key
  // Convert a base64 VAPID key to a Uint8Array. This is required by the browser PushManager API.
  // Source: MDN Web Docs (Web Push API).
  const urlB64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Register the user for web push notifications via the service worker.
  // The backend stores the subscription so it can send reminders/alerts later.
  const subscribeUserToPush = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          return; // Already subscribed on this browser
        }

        const vapidPublicKey =
          "BDtGgGjvMh_UfenhoQfpWbE3X0MxrvBRVzBkkNwcFkIJx7zDOP4P_onVV8kYYI2Wd2otuzZQN8Gi4y-n6ORLaRM";
        const convertedVapidKey = urlB64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        // Send subscription details to the backend so it can trigger push notifications.
        const subData = JSON.parse(JSON.stringify(subscription));
        await api.post("push/subscribe/", {
          endpoint: subData.endpoint,
          p256dh: subData.keys.p256dh,
          auth: subData.keys.auth,
        });
        console.log("Push subscription saved.");
      } catch (e) {
        console.error("Push subscription failed", e);
      }
    }
  };

  useEffect(() => {
    fetchData();

    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            subscribeUserToPush();
          }
        });
      } else if (Notification.permission === "granted") {
        subscribeUserToPush();
      }
    }
  }, []);

  // Poll for reminders every 10 seconds.
  // This keeps the UI responsive and triggers notifications when it is time to take medication.
  // It also auto-marks doses as missed if the window passes without user interaction.
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHM = now.toTimeString().slice(0, 5); // "HH:MM"

      medications.forEach((med) => {
        const [hours, minutes] = med.scheduled_time.split(":");
        const medTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          parseInt(hours),
          parseInt(minutes),
        );

        const diffMs = now - medTime;
        const diffMinutes = diffMs / (1000 * 60);

        const todayLog = logs.find(
          (l) =>
            l.medication === med.id &&
            new Date(l.scheduled_time).toDateString() === now.toDateString(),
        );

        // Auto mark as missed if past due by more than 60 minutes (1 hour grace period)
        if (diffMinutes > 60) {
          if (!todayLog || todayLog.status === "scheduled") {
            handleLog(med, "missed", todayLog, true);
          }
        } else if (diffMinutes >= 0 && diffMinutes < 1) {
          // It's exactly the minute of the medication
          // Avoid double notification in the same minute
          if (lastNotifiedTime === currentHM) return;

          if (!todayLog || todayLog.status === "scheduled") {
            // Play sound
            audioRef.current
              .play()
              .catch((e) =>
                console.log("Audio play failed (interaction needed):", e),
              );

            // Show Toast Alert
            toast.custom(
              (t) => (
                <div className="bg-white p-4 shadow-lg shadow-black/20 ring-1 ring-neutral-200 border-l-4 border-l-blue-500 rounded flex flex-col gap-2 min-w-[300px]">
                  <div className="flex items-center gap-2 text-blue-600 font-bold">
                    <Bell className="w-5 h-5 animate-bounce" /> Time for your
                    medication!
                  </div>
                  <p className="text-sm font-medium text-neutral-800">
                    {med.medication_name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {med.dosage} scheduled for {med.scheduled_time}
                  </p>
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-3 py-1.5 bg-neutral-100 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        openConfirmModal(med, todayLog);
                      }}
                      className="px-3 py-1.5 bg-black text-white text-sm font-medium hover:bg-neutral-800 transition shadow-sm"
                    >
                      Mark Taken
                    </button>
                  </div>
                </div>
              ),
              { duration: 30000, id: `med-toast-${med.id}-${currentHM}` },
            );

            // Show Browser Alert
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Time to take your meds!", {
                body: `It's time for ${med.medication_name} (${med.dosage})`,
              });
            }

            setLastNotifiedTime(currentHM);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [medications, logs, lastNotifiedTime]);

  // Rotate motivational quotes every 30 seconds to keep content fresh.
  useEffect(() => {
    if (quotes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [quotes]);

  // Handle marking a dose as taken or missed.
  // - Updates an existing adherence log if it exists.
  // - Creates a new log as a fallback (important for online/offline reconciliation).
  // - Refreshes gamification summary and prescription pill counts when a dose is taken.
  // - Shows a UI animation when points are awarded.
  const handleLog = async (med, status, existingLog, isAuto = false) => {
    if (loggingMedId === med.id) return;
    setLoggingMedId(med.id);

    try {
      let res;
      // If we have a scheduled log, update it
      if (existingLog && existingLog.id) {
        res = await api.patch(`adherence/${existingLog.id}/`, {
          status: status,
          actual_time: new Date().toISOString(),
        });
        // Update local state by replacing the updated log
        setLogs((prevLogs) =>
          prevLogs.map((l) => (l.id === existingLog.id ? res.data : l)),
        );
      } else {
        // Create new log (fallback)
        // Construct scheduled time for today based on medicine schedule
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
        setLogs((prevLogs) => [...prevLogs, res.data]);
      }

      // If the user marked a dose as taken, refresh gamification and prescription data.
      if (status === "taken") {
        const gameRes = await api.get("gamification/summary/");
        setGamification(gameRes.data);

        // Refresh prescriptions to update pill count and refill reminders.
        const prescRes = await api.get("prescriptions/");
        setPrescriptions(prescRes.data);

        // Trigger a small XP animation for positive feedback.
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 2000);
      }

      if (!isAuto) toast.success(`Dose marked as ${status}`);
    } catch (error) {
      console.error("Error logging dose", error);
      if (!isAuto) {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error, { duration: 5000 });
        } else {
          toast.error("Failed to save dose. Please try again.");
        }
      }
    } finally {
      if (!isAuto) setLoggingMedId(null);
      // Reset logging state even for auto updates.
      setLoggingMedId(null);
    }
  };

  // Open modal to confirm that the patient actually took the dose.
  // This reduces accidental logging and encourages conscious adherence.
  const openConfirmModal = (med, todayLog) => {
    setModalMed(med);
    setModalTodayLog(todayLog);
    setModalOpen(true);
  };

  // Handler when the patient confirms they took the dose.
  const handleConfirmTaken = () => {
    if (modalMed) {
      handleLog(modalMed, "taken", modalTodayLog);
    }
    setModalOpen(false);
    setModalMed(null);
    setModalTodayLog(null);
  };

  // Close the confirmation modal without recording a dose.
  const handleCancelTaken = () => {
    setModalOpen(false);
    setModalMed(null);
    setModalTodayLog(null);
  };

  // Show a skeleton loader while we fetch patient dashboard data.
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-neutral-200 animate-pulse rounded w-1/3"></div>
          <div className="h-4 bg-neutral-200 animate-pulse rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-48 bg-neutral-200 animate-pulse rounded w-full"></div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-24 bg-neutral-200 animate-pulse rounded w-full"></div>
            <div className="h-64 bg-neutral-200 animate-pulse rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Greeting and basic navigation context */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Patient Dashboard
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Welcome back, {user?.full_name || user?.username}
        </p>
      </header>
      {/* Main dashboard content: 3-column responsive layout */}
      <main className="p-4 w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Motivation */}
          <div className="space-y-6 lg:col-span-1">
            {/* Gamification Header Widget */}
            <div className="bg-gradient-to-br bg-white dark:bg-neutral-950 p-6 ring-1 ring-black dark:ring-neutral-800 relative overflow-hidden shadow-sm">
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
                  <p className="text-black dark:text-neutral-400 text-sm font-medium mb-1">
                    Current Streak
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-black dark:text-white flex items-center gap-2">
                      {gamification.current_streak}{" "}
                      <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </h2>
                    <span className="text-sm text-black dark:text-neutral-400">
                      days
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-black dark:text-neutral-400 text-sm font-medium mb-1">
                    Total Points
                  </p>
                  <div className="text-2xl font-bold text-black dark:text-white flex items-center justify-end gap-2">
                    {gamification.total_points}{" "}
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-black dark:text-neutral-400 mb-2">
                  <span className="text-black dark:text-neutral-400">
                    Weekly Progress
                  </span>
                  <span>
                    {gamification.current_streak > 0
                      ? "On Fire!"
                      : "Keep going!"}
                  </span>
                </div>
                <div className="h-3 bg-neutral-800 dark:bg-neutral-800 overflow-hidden rounded">
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
            <div className="bg-white dark:bg-neutral-950 p-6 ring-1 ring-white/10 dark:ring-neutral-800 relative overflow-hidden min-h-[160px] flex flex-col justify-center shadow-sm">
              {quotes.length > 0 ? (
                <div className="animate-in fade-in slide-in-from-right duration-700 key={currentQuoteIndex}">
                  <p className="text-xl font-light italic text-black dark:text-neutral-50 mb-4">
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
                <div className="bg-white dark:bg-neutral-950 p-4 ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-blue-500 dark:text-blue-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Details
                    </span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">
                    {prescriptions[0].current_pills} Pills Left
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {/* Naive refill calculation if not in backend yet */}
                    {prescriptions[0].total_pills > 0
                      ? `${Math.round((prescriptions[0].current_pills / prescriptions[0].total_pills) * 100)}% remaining`
                      : "0%"}
                  </p>
                </div>

                {/* Review Date */}
                <div className="bg-white dark:bg-neutral-950 p-4 ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-purple-500 dark:text-purple-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Review
                    </span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">
                    {(() => {
                      // Prefer the latest viral load review date if it exists
                      const upcomingVl = viralLoads.find(
                        (vl) => vl.review_date,
                      );
                      const checkupDate =
                        upcomingVl?.review_date ||
                        prescriptions[0]?.review_date_only ||
                        prescriptions[0]?.review_date;
                      return checkupDate
                        ? new Date(checkupDate).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })
                        : "Not set";
                    })()}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Next Check-up
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-950 p-4 ring-1 ring-neutral-200 dark:ring-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm shadow-sm">
                No active prescriptions
              </div>
            )}

            {/* Medications List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-neutral-900 dark:text-white">
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
                      className="bg-white dark:bg-neutral-950 p-5 ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-semibold text-lg text-neutral-900 dark:text-white">
                          {med.medication_name}
                        </h4>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                          {med.dosage} • {med.scheduled_time}
                        </p>
                      </div>

                      {isTaken ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10 px-3 py-1 text-sm font-medium rounded-md">
                          <Check className="w-4 h-4" /> Taken
                        </div>
                      ) : isMissed ? (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1  text-sm font-medium">
                          <X className="w-4 h-4" /> Missed
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openConfirmModal(med, todayLog)}
                            disabled={loggingMedId === med.id}
                            className={`bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition rounded-md ${loggingMedId === med.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            title="Mark as Taken"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleLog(med, "missed", todayLog)}
                            disabled={loggingMedId === med.id}
                            className={`bg-white text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400 p-2 ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition rounded-md ${loggingMedId === med.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            title="Mark as Missed"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {medications.length === 0 && (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                  No medications scheduled.
                </p>
              )}
            </div>

            {/* Viral Load & Reviews (Read-Only) */}
            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-neutral-900 dark:text-white">
                <Calendar className="w-4 h-4" /> Lab Results & Reviews
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {viralLoads.map((vl) => (
                  <div
                    key={vl.id}
                    className="bg-white dark:bg-neutral-950 p-5 ring-1 ring-neutral-200 dark:ring-neutral-800 flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-1 mb-2">
                          Viral Load Test:{" "}
                          {new Date(vl.test_date).toLocaleDateString()}
                        </h4>
                        <div className="flex gap-4 text-sm mt-1">
                          <div className="flex flex-col">
                            <span className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                              Result
                            </span>
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">
                              {vl.viral_load_value} copies/mL
                            </span>
                          </div>
                          {vl.review && vl.review.interpretation && (
                            <div className="flex flex-col">
                              <span className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                                Status
                              </span>
                              <span
                                className={`font-medium ${
                                  vl.review.interpretation.includes(
                                    "CONSISTENT_AND_CONTROLLED",
                                  )
                                    ? "text-green-600"
                                    : vl.review.status === "undetectable"
                                      ? "text-green-600"
                                      : "text-orange-600"
                                }`}
                              >
                                {vl.review.interpretation.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded">
                          {vl.review_date
                            ? `Next Review: ${new Date(vl.review_date).toLocaleDateString()}`
                            : "Review Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {viralLoads.length === 0 && (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-8 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-md">
                  No recent lab results available.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}

      {/* Floating AI chat helper for quick questions and support */}
      <AIChatHelper />

      {/* Confirmation dialog for marking doses (taken/missed) */}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={handleCancelTaken}
        onConfirm={handleConfirmTaken}
        title="Confirm Dose"
        message="Please confirm: did you physically take your pill now?"
        confirmText="Yes, I took it"
        cancelText="Not yet"
        type="info"
      />
    </div>
  );
};

export default PatientHome;
