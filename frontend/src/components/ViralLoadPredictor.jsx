import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../services/api';

const ViralLoadPredictor = ({ className = '' }) => {
  const [formData, setFormData] = useState({
    adherence_rate: '',
    missed_doses: '',
    time_on_art_months: '',
    previous_viral_load: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset result if inputs change
    if (result) setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Basic validation
    for (const key in formData) {
      if (formData[key] === '') {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.post('predict-viral-load/', {
        adherence_rate: Number(formData.adherence_rate),
        missed_doses: Number(formData.missed_doses),
        time_on_art_months: Number(formData.time_on_art_months),
        previous_viral_load: Number(formData.previous_viral_load)
      });
      
      setResult(response.data.prediction);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to predict viral load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          AI Viral Load Predictor
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Adherence Rate (%)
            </label>
            <input
              type="number"
              name="adherence_rate"
              value={formData.adherence_rate}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 95"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Missed Doses (last 30 days)
            </label>
            <input
              type="number"
              name="missed_doses"
              value={formData.missed_doses}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Time on ART (months)
            </label>
            <input
              type="number"
              name="time_on_art_months"
              value={formData.time_on_art_months}
              onChange={handleChange}
              min="1"
              className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Previous Viral Load (copies/ml)
            </label>
            <input
              type="number"
              name="previous_viral_load"
              value={formData.previous_viral_load}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 200"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Predicting...
            </>
          ) : (
            'Run AI Prediction'
          )}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className={`mt-6 p-4 border rounded flex items-start space-x-3 
          ${result === 'Suppressed' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}
        >
          {result === 'Suppressed' ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0" />
          )}
          
          <div>
            <h3 className={`font-bold ${result === 'Suppressed' ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
              Prediction: {result}
            </h3>
            <p className={`text-sm mt-1 ${result === 'Suppressed' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {result === 'Suppressed' 
                ? 'Patient is likely virally suppressed.' 
                : 'High risk — intervention needed.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViralLoadPredictor;
