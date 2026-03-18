import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import { Users, Activity, Bell, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/*
  ProviderDashboard.jsx

  Dashboard for healthcare providers.
  - Shows overall patient counts, adherence rates, missed dose alerts.
  - Displays charts for adherence distribution and weekly log activity.
  - Fetches data from the provider dashboard API endpoint.
*/

const StatCard = ({ title, value, warning, icon }) => (
  <div
    className={`p-6 bg-white dark:bg-neutral-900  shadow-sm border ${warning ? "border-red-200 bg-red-50/20" : "border-neutral-200"}`}
  >
    <div className="flex justify-between items-start">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {title}
      </p>
      {icon}
    </div>
    <p
      className={`text-3xl font-bold mt-2 ${warning ? "text-red-600" : "text-neutral-900 dark:text-neutral-100"}`}
    >
      {value}
    </p>
  </div>
);

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch provider dashboard statistics on mount.
  // Includes patient counts, adherence rates, and alert summaries.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get("providers/me/dashboard/");
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">Loading dashboard...</div>
    );

  // Real Data for Charts
  const adherenceData = [
    {
      name: "Adherent",
      value: stats?.adherence_percentage || 0,
      color: "#22c55e",
    },
    {
      name: "Non-Adherent",
      value: 100 - (stats?.adherence_percentage || 0),
      color: "#ef4444",
    },
  ];

  const weeklyActivity = stats?.daily_trend || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Dashboard Overview
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Welcome back, {user?.username}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients}
          icon={
            <Users className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          }
        />
        <StatCard
          title="Avg Adherence"
          value={`${stats?.adherence_percentage}%`}
          icon={
            <Activity className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          }
        />
        <StatCard
          title="Missed Doses (7d)"
          value={stats?.missed_doses}
          warning={stats?.missed_doses > 0}
          icon={
            <Calendar className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          }
        />
        <StatCard
          title="Active Alerts"
          value={stats?.alerts}
          warning={stats?.alerts > 0}
          icon={
            <Bell className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Adherence Chart */}
        <div className="bg-white dark:bg-neutral-900 p-6  shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">Adherence Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={adherenceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {adherenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text hack */}
            <div className="text-center mt-[-150px] pointer-events-none">
              <span className="text-3xl font-bold">
                {stats?.adherence_percentage}%
              </span>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Adherence
              </p>
            </div>
            <div className="mt-[100px]"></div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-neutral-900 p-6  shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">Weekly Log Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f5f5f5" }} />
                <Bar dataKey="taken" fill="#171717" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
