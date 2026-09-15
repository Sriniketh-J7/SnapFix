import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import {
  Camera, MapPin, Loader, ArrowRight,
  CheckCircle, AlertTriangle, ChevronDown, RefreshCw
} from "lucide-react";
import { ImageClassify } from "../lib/ImageClassify";

const ISSUE_TYPES = [
  "water leakage", "broken water pipe", "street light not working",
  "broken traffic signal", "power outage", "road damage", "damaged footpath",
  "garbage not collected", "blocked drain", "stray animals", "animal attack",
];

export const UserNewReport = () => {
  const { setNewReport } = useContext(UserContext);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [step, setStep] = useState("capture"); // capture | classifying | form
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [classifyError, setClassifyError] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);

  // ── Location detection ── completely independent, can be called any time
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocError(null);
    setLocation(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode with Nominatim (no API key needed)
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "Accept-Language": "en" } }
        )
          .then((r) => r.json())
          .then((data) => {
            setLocation({
              latitude,
              longitude,
              address: data?.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            });
          })
          .catch(() => {
            // Nominatim failed - still save coords
            setLocation({
              latitude,
              longitude,
              address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            });
          })
          .finally(() => setLocating(false));
      },
      (err) => {
        const msgs = {
          1: "Location access denied. Please allow location in browser settings.",
          2: "Location unavailable. Check your GPS or network.",
          3: "Location request timed out. Try again.",
        };
        setLocError(msgs[err.code] || "Could not get location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Image capture + AI classify ──
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setStep("classifying");
    setClassifyError(null);

    // Start location detection in parallel - don't await, runs independently
    detectLocation();

    try {
      const result = await ImageClassify(file);
      const matched = ISSUE_TYPES.find(
        (t) => t === result?.toLowerCase().trim()
      );
      setTitle(matched || "road damage");
    } catch (err) {
      setClassifyError(err.message || "Classification failed.");
      setTitle("road damage");
    } finally {
      setStep("form");
    }
  };

  const handleNext = () => {
    if (!title || !imageFile || !location) return;
    setNewReport({ title, description, imageUrl: imageFile, location });
    navigate("/form2");
  };

  // ── Step 1: Camera only ──
  if (step === "capture") {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-sm w-full space-y-6 text-center">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">New Report</p>
            <h1 className="text-2xl font-black text-gray-900">Capture the Issue</h1>
            <p className="text-sm text-gray-400 mt-1">
              Take or upload a photo — AI will classify it instantly
            </p>
          </div>
          <label className="flex flex-col items-center justify-center w-full h-60 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition bg-white shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
              <Camera className="text-blue-500" size={32} />
            </div>
            <p className="text-base font-bold text-gray-800">Tap to capture / upload</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP · Max 10 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              capture="environment"
            />
          </label>
        </div>
      </div>
    );
  }

  // ── Step 2: Classifying spinner ──
  if (step === "classifying") {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center space-y-5">
          {preview && (
            <img
              src={preview}
              alt="Captured"
              className="w-40 h-40 object-cover rounded-xl mx-auto shadow"
            />
          )}
          <div className="flex items-center justify-center gap-3">
            <Loader className="animate-spin text-blue-500 shrink-0" size={22} />
            <p className="text-gray-700 font-semibold text-sm">AI is classifying your image…</p>
          </div>
          <p className="text-xs text-gray-400">Detecting location in the background</p>
        </div>
      </div>
    );
  }

  // ── Step 3: Review form ──
  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-28 font-sans">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Step 2</p>
          <h1 className="text-2xl font-black text-gray-900">Confirm Details</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Review AI result, add comments, then submit
          </p>
        </div>

        {/* Image preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Captured"
              className="w-full h-52 object-cover rounded-2xl shadow-sm"
            />
            <label className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-700 px-3 py-1.5 rounded-xl shadow cursor-pointer hover:bg-white transition flex items-center gap-1.5">
              <RefreshCw size={12} /> Retake
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} capture="environment" />
            </label>
          </div>
        )}

        {/* AI classification banner */}
        {classifyError ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
            <AlertTriangle size={15} className="shrink-0" />
            Classification unavailable — select issue type below
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
            <CheckCircle size={15} className="shrink-0" />
            AI classified as: <span className="font-bold capitalize ml-1">{title}</span>
          </div>
        )}

        {/* Issue type - editable */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Issue Type <span className="normal-case font-normal text-gray-400">(edit if wrong)</span>
          </label>
          <div className="relative">
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 appearance-none bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Additional Comments <span className="normal-case font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the issue in more detail…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
          />
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Location
            </label>
            {!locating && (
              <button
                onClick={detectLocation}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw size={11} /> Retry
              </button>
            )}
          </div>

          {locating && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl">
              <Loader size={14} className="animate-spin shrink-0 text-blue-400" />
              Detecting your location…
            </div>
          )}

          {!locating && location && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={15} />
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-0.5">Location captured</p>
                <p className="text-xs text-gray-500 leading-relaxed">{location.address}</p>
              </div>
            </div>
          )}

          {!locating && !location && (
            <div className="space-y-2">
              {locError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {locError}
                </p>
              )}
              <button
                onClick={detectLocation}
                className="flex items-center gap-2 w-full py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition text-sm text-gray-500 font-medium justify-center"
              >
                <MapPin size={15} className="text-blue-400" />
                Detect My Location
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleNext}
          disabled={!title || !imageFile || !location || locating}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:shadow-none"
        >
          Review & Submit <ArrowRight size={18} />
        </button>

        {(!location || locating) && (
          <p className="text-center text-xs text-gray-400">
            {locating ? "Waiting for location…" : "Location required to continue"}
          </p>
        )}
      </div>
    </div>
  );
};
