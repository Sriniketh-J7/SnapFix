import { useState, useRef, useContext } from "react";
import { TechnicianContext } from "../contexts/TechnicianContext";
import { Camera, RotateCcw, CheckCircle, Loader } from "lucide-react";

export default function CameraCapture({ reportId, onResolved }) {
  const { resolveTask } = useContext(TechnicianContext);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      } catch (err) {
        setError("Camera access denied. Please allow camera permission.");
        setCameraOpen(false);
      }
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setFile(blob);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, "image/jpeg");
  };

  const handleSubmit = async () => {
    if (!file || !reportId) return;
    setUploading(true);
    setError(null);
    try {
      const result = await resolveTask(reportId, file);
      if (result?.report) {
        if (onResolved) onResolved(result.report);
      } else {
        setError("Failed to upload. Try again.");
      }
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {!cameraOpen && !preview && (
        <button
          onClick={startCamera}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl transition"
        >
          <Camera size={18} />
          Open Camera to Capture Proof
        </button>
      )}

      {cameraOpen && (
        <div className="flex flex-col items-center space-y-3">
          <video ref={videoRef} className="w-full rounded-xl" />
          <div className="flex gap-3">
            <button onClick={capturePhoto} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-5 rounded-xl">
              Capture
            </button>
            <button onClick={stopCamera} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-5 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <img src={preview} alt="Resolution preview" className="w-full rounded-xl object-cover max-h-64" />
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-5 rounded-xl transition"
            >
              {uploading ? <><Loader size={16} className="animate-spin" /> Uploading...</> : <><CheckCircle size={16} /> Mark Resolved</>}
            </button>
            <button
              onClick={() => { setPreview(null); setFile(null); startCamera(); }}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-xl"
            >
              <RotateCcw size={16} /> Retake
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
