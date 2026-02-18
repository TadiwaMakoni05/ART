import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [regimen, setRegimen] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const pRes = await api.get(`patients/${id}/`);
        setPatient(pRes.data);

        const rRes = await api.get(`medications/?patient_id=${id}`);
        setRegimen(rRes.data);

        const lRes = await api.get(`adherence/?patient_id=${id}`);
        setLogs(lRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!patient) return <div>Patient not found</div>;

  // Calculate Adherence Stats
  const takenCount = logs.filter((l) => l.status === "taken").length;
  const missedCount = logs.filter((l) => l.status === "missed").length;
  const snoozedCount = logs.filter((l) => l.status === "snoozed").length; // acts as pending/skipped often
  const totalLogs = logs.length;
  const adherenceRate =
    totalLogs > 0 ? Math.round((takenCount / totalLogs) * 100) : 0;

  const chartData = [
    { name: "Taken", value: takenCount, color: "#22c55e" },
    { name: "Missed", value: missedCount, color: "#ef4444" },
    { name: "Snoozed", value: snoozedCount, color: "#eab308" },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <button
          onClick={() => navigate("/provider")}
          className="flex items-center text-neutral-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>

        <div className="bg-white  shadow-sm border border-neutral-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 break-all">
                {patient.full_name}
              </h1>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-neutral-500">
                <span>DOB: {patient.dob}</span>
                <span>Phone: {patient.phone}</span>
                <span>User: {patient.user?.username}</span>
              </div>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <p className="text-sm text-neutral-500">Overall Adherence</p>
              <p
                className={`text-3xl font-bold ${
                  adherenceRate >= 85
                    ? "text-green-600"
                    : adherenceRate >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {adherenceRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Regimen Column */}
          <div className="bg-white  shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Regimen</h2>
            <ul className="space-y-4">
              {regimen.map((med) => (
                <li key={med.id} className="p-4 bg-neutral-50 ">
                  <div className="font-medium">{med.medication_name}</div>
                  <div className="text-sm text-neutral-500">
                    {med.dosage} @ {med.scheduled_time}
                  </div>
                </li>
              ))}
              {regimen.length === 0 && (
                <p className="text-neutral-500 text-sm">No active regimen.</p>
              )}
            </ul>
          </div>

          {/* Adherence Chart Column */}
          <div className="bg-white  shadow-sm border border-neutral-200 p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4 w-full text-left">
              Adherence Breakdown
            </h2>
            {totalLogs > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-400">
                No data available
              </div>
            )}
          </div>

          {/* History List Column */}
          <div className="bg-white  shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Logs</h2>
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex justify-between items-center text-sm p-2 hover:bg-neutral-50 "
                >
                  <span>{new Date(log.created_at).toLocaleDateString()}</span>
                  <span
                    className={`px-2 py-0.5  text-xs font-medium ${
                      log.status === "taken"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.status}
                  </span>
                </li>
              ))}
              {logs.length === 0 && (
                <p className="text-neutral-500 text-sm">No logs yet.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
