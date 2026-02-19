import React, { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  Copy,
  ArrowRight,
} from "lucide-react";

const CreatePatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    dob: "",
  });
  const [regimen, setRegimen] = useState([
    { medication_name: "TDF/3TC/EFV", dosage: "1 tab", time: "08:00" },
  ]);
  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);

  // Input handlers
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegimenChange = (index, field, value) => {
    const newRegimen = [...regimen];
    newRegimen[index][field] = value;
    setRegimen(newRegimen);
  };

  const addMedication = () =>
    setRegimen([...regimen, { medication_name: "", dosage: "", time: "" }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("patients/", { ...formData, regimen });
      setCreatedPatient(res.data);
      toast.success("Patient account created successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error creating patient");
    } finally {
      setLoading(false);
    }
  };

  // After creation screen
  if (createdPatient) {
    const { credentials } = createdPatient;
    const { username, password } = credentials;
    const phone = formData.phone;

    const messageBody = `Hello ${formData.full_name},\n\nWelcome to ART Companion.\n\nYour login details:\nUsername: ${username}\nPassword: ${password}\n\nPlease download the app and log in.`;
    const whatsappLink = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      "",
    )}?text=${encodeURIComponent(messageBody)}`;
    const mailtoSmS = `sms:${phone}?body=${encodeURIComponent(messageBody)}`;
    const telLink = `tel:${phone}`;

    const copyAll = () =>
      navigator.clipboard.writeText(
        `Username: ${username}\nPassword: ${password}`,
      );

    return (
      <div className="min-h-screen bg-neutral-50 p-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white  shadow-lg border border-neutral-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100  flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Patient Account Created!</h2>
          <p className="text-neutral-600">
            Share credentials securely with the patient.
          </p>

          {/* Credentials Box */}
          <div className="bg-neutral-50 p-6  border border-neutral-200 text-left space-y-3">
            {["Username", "Password"].map((field) => {
              const value = field === "Username" ? username : password;
              return (
                <div
                  key={field}
                  className={field === "Password" ? "border-t pt-3" : ""}
                >
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    {field}
                  </span>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xl font-mono font-medium truncate">
                      {value}
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(value)}
                      className="text-neutral-400 hover:text-neutral-600 p-1"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={copyAll}
              className="mt-2 text-sm font-medium text-black hover:underline"
            >
              Copy All
            </button>
          </div>

          {/* Share via Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Share via:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={telLink}
                className="flex flex-col items-center gap-2 p-4  bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <Phone className="w-6 h-6" />
                <span className="text-xs font-medium">Call</span>
              </a>
              <a
                href={mailtoSmS}
                className="flex flex-col items-center gap-2 p-4  bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
              >
                <Mail className="w-6 h-6" />
                <span className="text-xs font-medium">SMS</span>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4  bg-green-50 text-green-700 hover:bg-green-100 transition"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs font-medium">WhatsApp</span>
              </a>
            </div>
          </div>

          <button
            onClick={() => navigate("/provider")}
            className="w-full py-3 bg-black text-white  font-bold hover:bg-neutral-800 transition flex items-center justify-center gap-2"
          >
            Done <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Patient creation form
  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white  shadow-sm border border-neutral-200 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Register New Patient</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Full Name
                </label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Phone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  DOB
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-neutral-500 italic">
                  Username will be auto-generated from Full Name (e.g. john.doe)
                </p>
              </div>
            </div>
          </div>

          {/* Regimen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Initial Regimen
            </h3>
            {regimen.map((med, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-2 mb-2 md:items-end"
              >
                <div className="flex-1">
                  <label className="text-xs text-neutral-500">Medication</label>
                  <input
                    value={med.medication_name}
                    onChange={(e) =>
                      handleRegimenChange(
                        index,
                        "medication_name",
                        e.target.value,
                      )
                    }
                    className="w-full p-2 border "
                    required
                  />
                </div>
                <div className="w-full md:w-24 grid grid-cols-2 md:grid-cols-1 gap-2">
                  <div>
                    <label className="text-xs text-neutral-500 md:hidden">
                      Dosage
                    </label>
                    <input
                      value={med.dosage}
                      placeholder="Dosage"
                      onChange={(e) =>
                        handleRegimenChange(index, "dosage", e.target.value)
                      }
                      className="w-full p-2 border "
                      required
                    />
                  </div>
                </div>
                <div className="w-full md:w-24 grid grid-cols-2 md:grid-cols-1 gap-2">
                  <div>
                    <label className="text-xs text-neutral-500 md:hidden">
                      Time
                    </label>
                    <input
                      type="time"
                      value={med.time}
                      onChange={(e) =>
                        handleRegimenChange(index, "time", e.target.value)
                      }
                      className="w-full p-2 border "
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMedication}
              className="text-sm font-medium text-black hover:underline"
            >
              + Add Medication
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/provider")}
              className="flex-1 py-3 text-neutral-600 hover:text-black font-medium border border-neutral-300 "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-black text-white  font-semibold hover:bg-neutral-800 transition shadow-lg shadow-black/20"
            >
              {loading ? "Creating..." : "Create Patient Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePatient;
