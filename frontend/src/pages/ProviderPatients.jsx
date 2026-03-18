import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Plus, Search, Phone, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdherenceBadge } from "../components/AdherenceBadge";

/*
  ProviderPatients.jsx

  Shows the provider's list of patients.
  - Fetches patient list from backend.
  - Displays adherence status and quick actions (call/message/view).
  - Includes a create-patient flow.
*/

const ProviderPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch list of patients assigned to this provider on mount.
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("patients/");
        setPatients(res.data);
      } catch (error) {
        console.error("Error fetching patients", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 md:p-8">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-10 bg-neutral-200 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Patients
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            Manage your patient list
          </p>
        </div>
        <button
          onClick={() => navigate("/provider/patients/new")}
          className="bg-black text-white px-4 py-2  text-sm font-medium hover:bg-neutral-800 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Patient
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900  shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Name
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Phone
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Adherence
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-neutral-50 dark:bg-neutral-950 transition"
                >
                  <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                    {patient.full_name}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {patient.phone}
                  </td>
                  <td className="px-6 py-4">
                    <AdherenceBadge score={patient.adherence_score} />
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <a
                      href={`tel:${patient.phone}`}
                      className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-green-600 transition bg-neutral-100 dark:bg-neutral-800 "
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => navigate("/provider/messages")}
                      className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-blue-600 transition bg-neutral-100 dark:bg-neutral-800 "
                      title="Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/provider/patients/${patient.id}`)
                      }
                      className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:text-white transition bg-neutral-100 dark:bg-neutral-800 "
                      title="View Profile"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    No patients found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Grid */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white dark:bg-neutral-900 p-4  shadow-sm border border-neutral-200 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                  {patient.full_name}
                </h3>
              </div>
              <AdherenceBadge score={patient.adherence_score} />
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Phone className="w-4 h-4" />
              {patient.phone}
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <a
                href={`tel:${patient.phone}`}
                className="flex-1 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950  hover:bg-neutral-100 dark:bg-neutral-800"
              >
                Call
              </a>
              <button
                onClick={() => navigate("/provider/messages")}
                className="flex-1 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950  hover:bg-neutral-100 dark:bg-neutral-800"
              >
                Message
              </button>
              <button
                onClick={() => navigate(`/provider/patients/${patient.id}`)}
                className="flex-1 py-2 text-center text-sm font-medium text-white bg-black  hover:bg-neutral-800"
              >
                View
              </button>
            </div>
          </div>
        ))}
        {patients.length === 0 && (
          <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
            No patients found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderPatients;
