// Location Picker Component
// For users to detect and select their delivery location
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserLocationAndAddress } from '../utils/geolocation';

const LocationPicker = ({ onLocationSelect, buttonText = "Use My Current Location", className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleGetLocation = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const locationData = await getUserLocationAndAddress();
      
      // Call the parent callback with location data
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-primary-200"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Detecting Location...</span>
          </>
        ) : success ? (
          <>
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-green-600">Location Detected!</span>
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{buttonText}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
          >
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default LocationPicker;
