import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Edit, Plus, Trash, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
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
  const [viralLoads, setViralLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
    dob: "",
  });

  // Add/Edit Medication State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState(null);
  const [medFormData, setMedFormData] = useState({
    medication_name: "",
    total_pills: 30,
    dosage: "1 pill",
    time: "08:00",
  });

  useEffect(() => {
    if (patient) {
      setEditFormData({
        full_name: patient.full_name,
        phone: patient.phone,
        dob: patient.dob,
      });
    }
  }, [patient]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`patients/${id}/`, editFormData);
      setPatient(res.data);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile", error);
      toast.error("Failed to update profile");
    }
  };

  const openAddMedModal = () => {
    setEditingMedId(null);
    setMedFormData({
      medication_name: "",
      total_pills: 30,
      dosage: "1 pill",
      time: "08:00",
    });
    setIsMedModalOpen(true);
  };

  const openEditMedModal = (med) => {
    setEditingMedId(med.id);
    // Find prescription if needed, but for simplicity we rely on what's in 'med' or defaults
    // Note: 'total_pills' is technically on prescription, not medication schedule directly in some views
    // If we want to edit total pills, we might need to fetch prescription details or assume default/current
    // For now, let's just allow editing schedule details + name
    setMedFormData({
      medication_name: med.medication_name,
      total_pills: 30, // Placeholder as we don't have this in 'med' list view easily without join
      dosage: med.dosage,
      time: med.scheduled_time,
    });
    setIsMedModalOpen(true);
  };

  const handleSaveMedication = async (e) => {
    e.preventDefault();
    try {
      if (editingMedId) {
        // Edit Mode
        await api.patch(`medications/${editingMedId}/`, {
          medication_name: medFormData.medication_name,
          dosage: medFormData.dosage,
          scheduled_time: medFormData.time,
        });

        // Optionally update prescription name too if changed?
        // This requires knowing prescription ID. MedSchedule has it.
        // For MVP, just updating schedule.
        toast.success("Medication updated");
      } else {
        // Add Mode
        // 1. Create Prescription
        const prescRes = await api.post("prescriptions/", {
          patient: id,
          medication_name: medFormData.medication_name,
          total_pills: medFormData.total_pills,
          current_pills: medFormData.total_pills,
          status: "active",
        });

        // 2. Create Schedule
        await api.post("medications/", {
          patient: id,
          prescription: prescRes.data.id,
          medication_name: medFormData.medication_name,
          dosage: medFormData.dosage,
          scheduled_time: medFormData.time,
        });
        toast.success("Medication added");
      }

      // Refresh Regimen
      const rRes = await api.get(`medications/?patient_id=${id}`);
      setRegimen(rRes.data);
      setIsMedModalOpen(false);
    } catch (error) {
      console.error("Error saving medication", error);
      toast.error("Failed to save medication");
    }
  };

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [medToDelete, setMedToDelete] = useState(null);

  // Viral Load CRUD State
  const [isVlModalOpen, setIsVlModalOpen] = useState(false);
  const [editingVlId, setEditingVlId] = useState(null);
  const [vlFormData, setVlFormData] = useState({
    test_date: "",
    viral_load_value: "",
    review_date: "",
  });
  const [isDeleteVlModalOpen, setIsDeleteVlModalOpen] = useState(false);
  const [vlToDelete, setVlToDelete] = useState(null);

  const openAddVlModal = () => {
    setEditingVlId(null);
    setVlFormData({
      test_date: new Date().toISOString().split("T")[0],
      viral_load_value: "",
      review_date: "",
    });
    setIsVlModalOpen(true);
  };

  const openEditVlModal = (vl) => {
    setEditingVlId(vl.id);
    setVlFormData({
      test_date: vl.test_date,
      viral_load_value: vl.viral_load_value,
      review_date: vl.review_date || "",
    });
    setIsVlModalOpen(true);
  };

  const handleSaveVl = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient: id,
        test_date: vlFormData.test_date,
        viral_load_value: parseInt(vlFormData.viral_load_value),
        review_date: vlFormData.review_date || null,
      };

      if (editingVlId) {
        await api.patch(`viral-loads/${editingVlId}/`, payload);
        toast.success("Viral load updated");
      } else {
        await api.post("viral-loads/", payload);
        toast.success("Viral load added");
      }

      const vRes = await api.get(`viral-loads/?patient=${id}`);
      setViralLoads(vRes.data);
      setIsVlModalOpen(false);
    } catch (error) {
      console.error("Error saving viral load", error);
      toast.error(error.response?.data?.error || "Failed to save viral load");
    }
  };

  const confirmDeleteVl = (vlId) => {
    setVlToDelete(vlId);
    setIsDeleteVlModalOpen(true);
  };

  const handleDeleteVl = async () => {
    if (!vlToDelete) return;
    try {
      await api.delete(`viral-loads/${vlToDelete}/`);
      const vRes = await api.get(`viral-loads/?patient=${id}`);
      setViralLoads(vRes.data);
      toast.success("Viral load removed");
      setIsDeleteVlModalOpen(false);
    } catch (error) {
      console.error("Error deleting viral load", error);
      toast.error("Failed to delete viral load");
    }
  };

  const confirmDeleteMedication = (medId) => {
    setMedToDelete(medId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteMedication = async () => {
    if (!medToDelete) return;
    try {
      await api.delete(`medications/${medToDelete}/`);
      // Refresh Regimen
      const rRes = await api.get(`medications/?patient_id=${id}`);
      setRegimen(rRes.data);
      toast.success("Medication removed");
      setIsDeleteModalOpen(false); // Close modal after successful deletion
    } catch (error) {
      console.error("Error deleting medication", error);
      toast.error("Failed to delete medication");
    }
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const pRes = await api.get(`patients/${id}/`);
        setPatient(pRes.data);

        const rRes = await api.get(`medications/?patient_id=${id}`);
        setRegimen(rRes.data);

        const lRes = await api.get(`adherence/?patient_id=${id}`);
        setLogs(lRes.data);

        const vRes = await api.get(`viral-loads/?patient=${id}`);
        setViralLoads(vRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-32"></div>
          <div className="bg-white shadow-sm border border-neutral-200 p-8 flex flex-col gap-4">
            <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white shadow-sm border border-neutral-200 p-6 h-64"></div>
            <div className="bg-white shadow-sm border border-neutral-200 p-6 h-64"></div>
            <div className="bg-white shadow-sm border border-neutral-200 p-6 h-64"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!patient)
    return (
      <div className="p-8 text-center text-neutral-500">Patient not found</div>
    );

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

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteMedication}
          title="Delete Medication"
          message="Are you sure you want to remove this medication from the regimen? This cannot be undone."
          isDanger={true}
        />

        <div className="bg-white  shadow-sm border border-neutral-200 p-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold break-all">
                  {patient.full_name}
                </h1>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-neutral-400 hover:text-black transition"
                  title="Edit Profile"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
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
          </header>
        </div>

        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Patient Profile</h3>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="text-neutral-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        full_name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-neutral-300 px-3 py-2 "
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-neutral-300 px-3 py-2 "
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editFormData.dob}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, dob: e.target.value })
                    }
                    className="mt-1 block w-full border border-neutral-300 px-3 py-2 "
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Regimen Column */}
          <div className="bg-white  shadow-sm border border-neutral-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Regimen</h2>
              <button
                onClick={openAddMedModal}
                className="text-xs bg-black text-white px-2 py-1 flex items-center gap-1 hover:bg-neutral-800"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <ul className="space-y-4">
              {regimen.map((med) => (
                <li
                  key={med.id}
                  className="p-4 bg-neutral-50  flex justify-between items-start group"
                >
                  <div>
                    <div className="font-medium">{med.medication_name}</div>
                    <div className="text-sm text-neutral-500">
                      {med.dosage} @ {med.scheduled_time}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditMedModal(med)}
                      className="text-neutral-400 hover:text-black opacity-0 group-hover:opacity-100 transition"
                      title="Edit Medication"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDeleteMedication(med.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
              {regimen.length === 0 && (
                <p className="text-neutral-500 text-sm">No active regimen.</p>
              )}
            </ul>
          </div>

          {/* Add/Edit Medication Modal */}
          {isMedModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                    {editingMedId ? "Edit Medication" : "Add Medication"}
                  </h3>
                  <button
                    onClick={() => setIsMedModalOpen(false)}
                    className="text-neutral-400 hover:text-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSaveMedication} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      value={medFormData.medication_name}
                      onChange={(e) =>
                        setMedFormData({
                          ...medFormData,
                          medication_name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-neutral-300 px-3 py-2 "
                      placeholder="e.g. Dolutegravir"
                      required
                    />
                  </div>

                  {/* Only show Total Pills for new medications to avoid confusion, or assume read-only for edit */}
                  {!editingMedId && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Total Pills
                        </label>
                        <input
                          type="number"
                          value={medFormData.total_pills}
                          onChange={(e) =>
                            setMedFormData({
                              ...medFormData,
                              total_pills: parseInt(e.target.value),
                            })
                          }
                          className="mt-1 block w-full border border-neutral-300 px-3 py-2 "
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={medFormData.dosage}
                        onChange={(e) =>
                          setMedFormData({
                            ...medFormData,
                            dosage: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-neutral-300 px-3 py-2 "
                        placeholder="e.g. 1 pill"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700">
                        Scheduled Time
                      </label>
                      <input
                        type="time"
                        value={medFormData.time}
                        onChange={(e) =>
                          setMedFormData({
                            ...medFormData,
                            time: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-neutral-300 px-3 py-2 "
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsMedModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 flex items-center gap-2"
                    >
                      {editingMedId ? (
                        <Save className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {editingMedId ? "Save Changes" : "Add Medication"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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

          {/* Viral Load & Reviews Column */}
          <div className="bg-white shadow-sm border border-neutral-200 p-6 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Viral Load & Reviews</h2>
              <button
                onClick={openAddVlModal}
                className="text-xs bg-black text-white px-3 py-1.5 flex items-center gap-1 hover:bg-neutral-800"
              >
                <Plus className="w-3 h-3" /> Add Result
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-neutral-500">
                <thead className="text-xs text-neutral-700 uppercase bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3">Test Date</th>
                    <th className="px-4 py-3">Viral Load</th>
                    <th className="px-4 py-3">Review Date</th>
                    <th className="px-4 py-3">Entered By</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {viralLoads.map((vl) => (
                    <tr key={vl.id} className="border-b">
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {vl.test_date}
                      </td>
                      <td className="px-4 py-3">{vl.viral_load_value}</td>
                      <td className="px-4 py-3">
                        {vl.review_date || "Not set"}
                      </td>
                      <td className="px-4 py-3">User #{vl.entered_by}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditVlModal(vl)}
                            className="text-neutral-400 hover:text-black transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteVl(vl.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {viralLoads.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-neutral-500"
                      >
                        No viral load records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Viral Load Modal */}
      {isVlModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingVlId
                  ? "Edit Viral Load Record"
                  : "Add Viral Load Record"}
              </h3>
              <button
                onClick={() => setIsVlModalOpen(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVl} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Test Date
                </label>
                <input
                  type="date"
                  value={vlFormData.test_date}
                  onChange={(e) =>
                    setVlFormData({ ...vlFormData, test_date: e.target.value })
                  }
                  className="mt-1 block w-full border border-neutral-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Viral Load Value
                </label>
                <input
                  type="number"
                  value={vlFormData.viral_load_value}
                  onChange={(e) =>
                    setVlFormData({
                      ...vlFormData,
                      viral_load_value: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-neutral-300 px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Review Date (Optional)
                </label>
                <input
                  type="date"
                  value={vlFormData.review_date}
                  onChange={(e) =>
                    setVlFormData({
                      ...vlFormData,
                      review_date: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsVlModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 flex items-center gap-2"
                >
                  {editingVlId ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingVlId ? "Save Changes" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Viral Load Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteVlModalOpen}
        onClose={() => setIsDeleteVlModalOpen(false)}
        onConfirm={handleDeleteVl}
        title="Delete Viral Load Record"
        message="Are you sure you want to delete this viral load record? This action cannot be undone."
        isDanger={true}
      />
    </div>
  );
};

export default PatientDetail;
