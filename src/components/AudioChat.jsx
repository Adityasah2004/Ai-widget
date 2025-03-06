// import "regenerator-runtime/runtime";
// import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
// import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

// const AudioChat = forwardRef((props, ref) => {
//   // Refs for MediaRecorder, audio stream, audio chunks, WebSocket, and audio playback
//   const mediaRecorderRef = useRef(null);
//   const audioStreamRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const socketRef = useRef(null);
//   const audioPlayerRef = useRef(null);

//   // Use SpeechRecognition only for silence detection (transcript is not used)
//   const { listening, resetTranscript } = useSpeechRecognition();

//   // Start MediaRecorder to capture raw audio
//   const startMediaRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       audioStreamRef.current = stream;
//       const recorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = recorder;

//       // Collect audio chunks
//       recorder.ondataavailable = async (event) => {
//         if (event.data && event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       // When recording stops, combine chunks and send to backend
//       recorder.onstop = async () => {
//         console.log("MediaRecorder stopped");
//         if (audioChunksRef.current.length === 0) {
//           console.log("No audio chunks recorded");
//           return;
//         }
//         const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
//         audioChunksRef.current = []; // Reset the buffer

//         if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//           const arrayBuffer = await blob.arrayBuffer();
//           socketRef.current.send(arrayBuffer);
//           console.log("Sent audio chunk to backend, size:", arrayBuffer.byteLength);
//         } else {
//           console.error("WebSocket is not open");
//         }
//       };

//       recorder.start();
//       console.log("MediaRecorder started");
//     } catch (error) {
//       console.error("Error starting MediaRecorder:", error);
//     }
//   };

//   // Setup WebSocket connection
//   useEffect(() => {
//     const ws = new WebSocket("ws://localhost:8000/Response/ws/audio");
//     ws.binaryType = "arraybuffer";
//     ws.onopen = () => console.log("WebSocket connected");
//     ws.onmessage = (event) => {
//       if (event.data instanceof ArrayBuffer) {
//         console.log("Received audio response from server, size:", event.data.byteLength);
//         // Create a Blob from the received ArrayBuffer and generate an object URL
//         const audioBlob = new Blob([event.data], { type: "audio/wav" });
//         const audioUrl = URL.createObjectURL(audioBlob);
//         if (audioPlayerRef.current) {
//           audioPlayerRef.current.src = audioUrl;
//           audioPlayerRef.current.play().catch((err) => {
//             console.error("Error playing audio:", err);
//           });
//         }
//       } else {
//         console.log("Received message:", event.data);
//       }
//     };
//     ws.onerror = (err) => console.error("WebSocket error:", err);
//     ws.onclose = () => console.log("WebSocket closed");
//     socketRef.current = ws;

//     return () => {
//       if (ws.readyState === WebSocket.OPEN) ws.close();
//     };
//   }, []);

//   // Start recording and speech recognition on mount
//   useEffect(() => {
//     startMediaRecording();
//     // Use continuous: false so that silence triggers stop automatically
//     SpeechRecognition.startListening({ continuous: false });
//     return () => {
//       if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//         mediaRecorderRef.current.stop();
//       }
//       if (audioStreamRef.current) {
//         audioStreamRef.current.getTracks().forEach((track) => track.stop());
//       }
//       SpeechRecognition.stopListening();
//     };
//   }, []);

//   // When silence is detected (listening becomes false), stop MediaRecorder and then restart
//   useEffect(() => {
//     if (!listening) {
//       console.log("Silence detected. Stopping MediaRecorder to send audio.");
//       if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//         mediaRecorderRef.current.stop();
//       }
//       resetTranscript();
//       // Wait 500ms before restarting recording
//       setTimeout(() => {
//         startMediaRecording();
//         SpeechRecognition.startListening({ continuous: false });
//       }, 500);
//     }
//   }, [listening, resetTranscript]);

//   // Expose stopRecording method to parent components
//   useImperativeHandle(ref, () => ({
//     stopRecording: () => {
//       if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//         mediaRecorderRef.current.stop();
//       }
//       if (audioStreamRef.current) {
//         audioStreamRef.current.getTracks().forEach((track) => track.stop());
//       }
//       SpeechRecognition.stopListening();
//       if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//         socketRef.current.close();
//       }
//     },
//   }));

//   return (
//     <div>
//       <p>Listening: {listening ? "Yes" : "No"}</p>
//       {/* Audio element to play backend audio */}
//       <audio ref={audioPlayerRef} controls style={{ width: "100%" }} />
//     </div>
//   );
// });

// export default AudioChat;

import "regenerator-runtime/runtime";
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

const AudioChat = forwardRef((props, ref) => {
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const socketRef = useRef(null);
  const audioPlayerRef = useRef(null);


  const { listening, resetTranscript } = useSpeechRecognition();


  const startMediaRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log("MediaRecorder stopped");
        if (audioChunksRef.current.length === 0) {
          console.log("No audio chunks recorded");
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const arrayBuffer = await blob.arrayBuffer();
          socketRef.current.send(arrayBuffer);
          console.log("Sent audio chunk to backend, size:", arrayBuffer.byteLength);
        } else {
          console.error("WebSocket is not open");
        }
      };

      recorder.start();
      console.log("MediaRecorder started");
    } catch (error) {
      console.error("Error starting MediaRecorder:", error);
    }
  };


  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/Response/ws/audio");
    ws.binaryType = "arraybuffer";
    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        console.log("Received audio response from server, size:", event.data.byteLength);
       
        const audioBlob = new Blob([event.data], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.play().catch((err) => {
            console.error("Error playing audio:", err);
          });
          audioPlayerRef.current.onended = () => {
            console.log("Audio playback ended. Restarting recording.");
            startMediaRecording();
            SpeechRecognition.startListening({ continuous: false });
          };
        }
      } else {
        console.log("Received message:", event.data);
      }
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");
    socketRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  useEffect(() => {
    startMediaRecording();
    SpeechRecognition.startListening({ continuous: false });
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      SpeechRecognition.stopListening();
    };
  }, []);


  useEffect(() => {
    if (!listening) {
      console.log("Silence detected. Stopping MediaRecorder to send audio.");
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      resetTranscript();
      
    }
  }, [listening, resetTranscript]);


  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      SpeechRecognition.stopListening();
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    },
  }));

  return (
    <div>
      <p>Listening: {listening ? "Yes" : "No"}</p>
      {/* Audio element to play backend audio */}
      <audio ref={audioPlayerRef} className="hidden" />
    </div>
  );
});

export default AudioChat;
