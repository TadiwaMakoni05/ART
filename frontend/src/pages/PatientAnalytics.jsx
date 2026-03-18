import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ChevronRight,
  BarChart2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

/*
  PatientAnalytics.jsx

  Displays adherence analytics for a patient.
  - Shows totals for taken/missed/snoozed doses.
  - Includes charts for daily trends and weekly adherence percentage.
  - Pulls data from `/patients/me/analytics/`.
*/

const PatientAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load analytics data for the current patient on mount.
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("patients/me/analytics/");
        setData(res.data);
      } catch (err) {
        console.error("Error fetching analytics", err);
        setError(err.message || "An unknown error occurred");
        if (err.response) {
          setError(
            `Error ${err.response.status}: ${JSON.stringify(err.response.data)}`,
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8 text-center animate-pulse">
        Loading Analytics...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8 text-center text-red-500">
        <p>Failed to load analytics.</p>
        <p className="text-sm font-mono mt-2">{error}</p>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8 text-center">
        No data available.
      </div>
    );

  const hasDailyData = data.daily_trend && data.daily_trend.length > 0;
  const hasWeeklyData = data.weekly_trend && data.weekly_trend.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 p-6 border-b border-neutral-200 sticky top-0 z-10 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-neutral-100 dark:bg-neutral-800 "
        >
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-neutral-900 p-3  border border-neutral-100 shadow-sm text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{data.totals.taken}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Taken
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-3  border border-neutral-100 shadow-sm text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{data.totals.missed}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Missed
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-3  border border-neutral-100 shadow-sm text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{data.totals.snoozed}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Snoozed
            </p>
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="bg-white dark:bg-neutral-900 p-5  border border-neutral-100 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-indigo-500" /> Daily Adherence
            (Last 7 Days)
          </h3>
          {hasDailyData ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily_trend}>
                  <XAxis
                    dataKey="date"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="taken"
                    stackId="a"
                    fill="#22c55e"
                    radius={[0, 0, 4, 4]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="snoozed"
                    stackId="a"
                    fill="#3b82f6"
                    barSize={20}
                  />
                  <Bar
                    dataKey="missed"
                    stackId="a"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              No daily data to display
            </p>
          )}
        </div>

        {/* Weekly Trend Chart */}
        <div className="bg-white dark:bg-neutral-900 p-5  border border-neutral-100 shadow-sm">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" /> Weekly Adherence
            %
          </h3>
          {hasWeeklyData ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weekly_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="week_start"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="adherence"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              No weekly data to display
            </p>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 p-4 flex justify-around z-20 pb-safe lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => navigate("/patient")}
          className="text-neutral-400 hover:text-indigo-600 flex flex-col items-center text-[10px] gap-1 transition"
        >
          <ChevronRight className="w-6 h-6 rotate-180" /> Home
        </button>
        <button
          onClick={() => navigate("/patient/history")}
          className="text-neutral-400 hover:text-indigo-600 flex flex-col items-center text-[10px] gap-1 transition"
        >
          <Clock className="w-6 h-6" /> History
        </button>
        <button
          onClick={() => navigate("/patient/analytics")}
          className="text-indigo-600 flex flex-col items-center text-[10px] gap-1 transition font-medium"
        >
          <BarChart2 className="w-6 h-6" /> Analytics
        </button>
      </nav>
    </div>
  );
};

export default PatientAnalytics;
