import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Plus, Search, Phone, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdherenceBadge } from "../components/AdherenceBadge";

const ProviderPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading patients...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Patients</h2>
          <p className="text-neutral-500">Manage your patient list</p>
        </div>
        <button
          onClick={() => navigate("/provider/patients/new")}
          className="bg-black text-white px-4 py-2  text-sm font-medium hover:bg-neutral-800 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Patient
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white  shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 font-medium text-neutral-500">Name</th>
                <th className="px-6 py-3 font-medium text-neutral-500">
                  Phone
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500">
                  Clinic ID
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500">
                  Adherence
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-neutral-50 transition">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {patient.full_name}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                    {patient.phone}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                    {patient.clinic_id || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <AdherenceBadge score={patient.adherence_score} />
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <a
                      href={`tel:${patient.phone}`}
                      className="p-2 text-neutral-500 hover:text-green-600 transition bg-neutral-100 "
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => navigate("/provider/messages")}
                      className="p-2 text-neutral-500 hover:text-blue-600 transition bg-neutral-100 "
                      title="Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/provider/patients/${patient.id}`)
                      }
                      className="p-2 text-neutral-500 hover:text-black transition bg-neutral-100 "
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
                    className="px-6 py-8 text-center text-neutral-500"
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
      <div className="md:hidden grid grid-cols-1 gap-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white p-4  shadow-sm border border-neutral-200 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-neutral-900">
                  {patient.full_name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {patient.clinic_id || "No ID"}
                </p>
              </div>
              <AdherenceBadge score={patient.adherence_score} />
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Phone className="w-4 h-4" />
              {patient.phone}
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <a
                href={`tel:${patient.phone}`}
                className="flex-1 py-2 text-center text-sm font-medium text-neutral-700 bg-neutral-50  hover:bg-neutral-100"
              >
                Call
              </a>
              <button
                onClick={() => navigate("/provider/messages")}
                className="flex-1 py-2 text-center text-sm font-medium text-neutral-700 bg-neutral-50  hover:bg-neutral-100"
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
          <div className="text-center text-neutral-500 py-8">
            No patients found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderPatients;
