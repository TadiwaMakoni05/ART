import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get("adherence/", { params });
      // Sort by date desc
      const sorted = res.data.sort(
        (a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time),
      );
      setLogs(sorted);
    } catch (error) {
      console.error("Error fetching history", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredLogs =
    filter === "all" ? logs : logs.filter((log) => log.status === filter);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white p-6 border-b border-neutral-200 sticky top-0 z-10 space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 "
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">History</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-neutral-100  p-2 text-sm outline-none flex-1"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-neutral-100  p-2 text-sm outline-none flex-1"
            />
          </div>
          <div className="flex gap-2 justify-between items-center">
            <span className="text-sm text-neutral-500 flex items-center gap-1">
              <Filter className="w-4 h-4" /> Filter Status:
            </span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-neutral-100 border-none  p-2 text-sm font-medium outline-none text-neutral-600"
            >
              <option value="all">All Logs</option>
              <option value="taken">Taken</option>
              <option value="missed">Missed</option>
              <option value="snoozed">Snoozed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="text-center text-neutral-500 py-10 animate-pulse">
            Loading history...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center text-neutral-500 py-10">
            No history found for selected range.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-neutral-800 border border-neutral-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="bg-white border-b border-neutral-100 last:border-b-0"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                log.status === "taken"
                                  ? "bg-green-100 text-green-600"
                                  : log.status === "snoozed"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-red-100 text-red-600"
                              }`}
                            >
                              {log.status === "taken" ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900 text-sm">
                                {log.medication_name || "Medication"}{" "}
                              </p>
                              <p className="text-xs text-neutral-400">
                                Scheduled:{" "}
                                {new Date(
                                  log.scheduled_time,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                              log.status === "taken"
                                ? "bg-green-50 text-green-600"
                                : log.status === "snoozed"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-red-50 text-red-600"
                            }`}
                          >
                            {log.status}
                          </span>
                          {log.actual_time && (
                            <div className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded-lg mt-2">
                              <span>Taken at:</span>
                              <span className="font-mono block">
                                {new Date(log.actual_time).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-4 shadow-sm border border-neutral-200 flex justify-between items-start"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 shrink-0 ${
                        log.status === "taken"
                          ? "bg-green-50 text-green-600"
                          : log.status === "snoozed"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {log.status === "taken" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">
                        {log.medication_name || "Medication"}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(log.scheduled_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {log.actual_time && (
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Taken:{" "}
                          {new Date(log.actual_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                        log.status === "taken"
                          ? "text-green-600 border-green-200 bg-green-50"
                          : log.status === "snoozed"
                            ? "text-blue-600 border-blue-200 bg-blue-50"
                            : "text-red-600 border-red-200 bg-red-50"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
