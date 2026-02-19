import React from "react";
import { X, AlertTriangle } from "lucide-react";

/**
 * A generic confirmation modal.
 * @param {boolean} isOpen - Whether the modal is visible.
 * @param {function} onClose - Function to close the modal (cancel).
 * @param {function} onConfirm - Function to run on confirmation.
 * @param {string} title - Modal title (e.g., "Delete User").
 * @param {string} message - Warning message.
 * @param {boolean} isDanger - If true, confirm button is red.
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white  shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {isDanger && (
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black transition"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-neutral-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100  transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white  transition shadow-md ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                : "bg-black hover:bg-neutral-800 shadow-neutral-200"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
