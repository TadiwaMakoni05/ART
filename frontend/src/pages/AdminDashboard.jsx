import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Users, Stethoscope, Activity, Clock } from "lucide-react";
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

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-neutral-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("admin/dashboard/");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch admin dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return <div className="p-8 text-center">Loading dashboard...</div>;

  const adherenceData = [
    { name: "Adherent", value: stats?.system_adherence || 0, color: "#22c55e" },
    {
      name: "Non-Adherent",
      value: 100 - (stats?.system_adherence || 0),
      color: "#ef4444",
    },
  ];

  // Mock data for user growth if backend isn't ready with specific historical data
  // Using recent_activity length as a simplistic proxy or just static data for now as per requirements
  const userGrowthData = [
    { name: "Jan", patients: 10, providers: 2 },
    { name: "Feb", patients: 15, providers: 3 },
    { name: "Mar", patients: 20, providers: 3 },
    { name: "Apr", patients: 35, providers: 5 },
    { name: "May", patients: 45, providers: 6 },
    {
      name: "Jun",
      patients: stats?.total_patients || 50,
      providers: stats?.total_providers || 7,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">System Overview</h1>
        <p className="text-neutral-500">Welcome back, Administrator.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients}
          icon={<Users size={24} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Total Providers"
          value={stats?.total_providers}
          icon={<Stethoscope size={24} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Avg Adherence"
          value={`${stats?.system_adherence}%`}
          icon={<Activity size={24} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Recent Actions"
          value={stats?.recent_activity?.length || 0}
          icon={<Clock size={24} className="text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adherence Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold mb-4">System Adherence</h3>
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
            <div className="text-center mt-[-100px]">
              <span className="text-3xl font-bold">
                {stats?.system_adherence}%
              </span>
              <p className="text-sm text-neutral-500">Average</p>
            </div>
            {/* Push content down after absolute centering hack */}
            <div className="mt-[100px]"></div>
          </div>
        </div>

        {/* User Growth Chart (Mocked for now) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold mb-4">User Growth Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f5f5f5" }} />
                <Bar
                  dataKey="patients"
                  name="Patients"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="providers"
                  name="Providers"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-bold">Recent Activity</h3>
        </div>
        <div className="divide-y divide-neutral-100">
          {stats?.recent_activity?.map((log, index) => (
            <div
              key={index}
              className="p-4 flex items-center justify-between hover:bg-neutral-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <p className="font-medium text-neutral-900">{log.action}</p>
                <span className="text-neutral-500 text-sm">({log.target})</span>
              </div>
              <span className="text-sm text-neutral-400">
                {new Date(log.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
          {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
            <div className="p-8 text-center text-neutral-500">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
