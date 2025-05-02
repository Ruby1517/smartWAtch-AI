import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "environment" // use "user" for front camera
};

const CameraCapture = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8000/analyze-frame", // FastAPI endpoint
        { image: imageSrc },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="rounded-lg shadow-md"
      />
      <button
        onClick={capture}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Capture & Analyze
      </button>

      {loading && <p>Analyzing...</p>}
      {capturedImage && (
        <img src={capturedImage} alt="Captured" className="mt-4 max-w-xs" />
      )}
      {result && (
        <pre className="bg-gray-100 p-2 rounded max-w-md overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default CameraCapture;
