import React, { useRef, useEffect, useState } from 'react';

const VideoFeed = ({ onAlert }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingChunks, setRecordingChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const stopTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

  // Start webcam
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Setup recorder
          const recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});
          mediaRecorderRef.current = recorder;


          recorder.ondataavailable = (e) => {
            if (e.data.size > 0)  recordedChunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `detection_${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            recordedChunksRef.current = [];
          };

        }
      })
      .catch(err => console.error("Error accessing webcam:", err));
  }, []);

  // Frame processing + detection
  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
  
      fetch('http://localhost:8000/process_frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      })
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data.detections)) return;
            
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
            data.detections.forEach(det => {
              const [x1, y1, x2, y2] = det.bbox;
              ctx.strokeStyle = 'red';
              ctx.lineWidth = 2;
              ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
              ctx.fillStyle = 'red';
              ctx.font = '16px Arial';
              ctx.fillText(`${det.label} (${(det.confidence * 100).toFixed(1)}%)`, x1, y1 - 5);
            });
  
            setDetections(prev => [...prev, ...data.detections]);
  
            const personDetected = data.detections.some(det => det.label === 'person');
  
            if (personDetected) {
                const audio = new Audio('/sound/alert.mp3');
                audio.play();
                                  
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
                mediaRecorderRef.current.start();
                setIsRecording(true);
                console.log("Auto-recording started");
              }
  
              if (stopTimeoutRef.current) {
                clearTimeout(stopTimeoutRef.current);
                stopTimeoutRef.current = null;
              }
            } else {
              if (isRecording && !stopTimeoutRef.current) {
                stopTimeoutRef.current = setTimeout(() => {
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                    console.log("Auto-recording stopped after 10s of no detection");
                  }
                  stopTimeoutRef.current = null;
                }, 10000);
              }
            }
  
            if (onAlert) onAlert(data.detections);
        //   } else {
        //     console.error("Unexpected response format:", data);
        //   }
        })
        .catch(err => console.error("Failed to send frame:", err));
    }, 3000); // 3-second interval
  
    // ✅ Proper cleanup goes HERE
    return () => {
      clearInterval(interval);
      
    };
  }, [mediaRecorder, isRecording, onAlert]);
  

//   const handleManualDownload = () => {
//     if (recordedChunksRef.current.length) {
//       const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
//       const url = URL.createObjectURL(blob);
  
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `manual_recording_${Date.now()}.webm`;
//       a.click();
  
//       URL.revokeObjectURL(url);
//       recordedChunksRef.current = [];
//     }
//   };
  

  return (
    <div style={{ position: 'relative', width: 640, height: 480 }}>
      <h2>Live Video Feed</h2>
      <video ref={videoRef} autoPlay playsInline width="640" height="480" />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <h3>Latest Detections:</h3>
      <ul>
        {detections.slice(-5).map((det, index) => (
          <li key={index}>
            🚨 {det.label} ({(det.confidence * 100).toFixed(1)}%) - {det.bbox?.join(', ')}
          </li>
        ))}
      </ul>

      {/* <button onClick={handleManualDownload}>Download Last Recording</button> */}
    </div>
  );
};

export default VideoFeed;

