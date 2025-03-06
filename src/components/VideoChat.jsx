import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

const VideoChat = forwardRef((props, ref) => {
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoPlayerRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle, recording, processing, playing
  const [lastTranscriptUpdate, setLastTranscriptUpdate] = useState(Date.now());
  const [silenceDetected, setSilenceDetected] = useState(false);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // Check if the browser supports speech recognition
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error("Browser doesn't support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  // Function to start recording audio from the microphone
  const startMediaRecording = async () => {
    try {
      // Reset states
      audioChunksRef.current = [];
      setSilenceDetected(false);
      setLastTranscriptUpdate(Date.now());
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      // Use a MIME type with Opus codec if supported
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      // Handle incoming audio data
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("Audio chunk received, size:", event.data.size);
        }
      };

      // Handle recorder stopping
      recorder.onstop = async () => {
        console.log("MediaRecorder stopped");
        setStatus("processing");
        
        // If no audio chunks were recorded, restart recording immediately
        if (audioChunksRef.current.length === 0) {
          console.log("No audio chunks recorded");
          resetAndStartRecording();
          return;
        }
        
        // Combine all audio chunks into one blob
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        try {
          // Prepare the form data with the audio blob
          const formData = new FormData();
          formData.append("audio_file", blob, "utterance.wav");

          console.log("Sending audio to backend...");
          const response = await fetch("http://localhost:8000/Response/video", {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Audio upload failed: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Response received:", data);
          
          if (data.video_url) {
            setStatus("playing");
            // Set the returned video URL into the video element and play it
            if (videoPlayerRef.current) {
              videoPlayerRef.current.src = data.video_url;
              
              try {
                await videoPlayerRef.current.play();
                console.log("Video playback started");
              } catch (err) {
                console.error("Error playing video:", err);
                resetAndStartRecording();
              }
              
              // When the video finishes playing, restart recording
              videoPlayerRef.current.onended = () => {
                console.log("Video playback ended. Restarting recording.");
                resetAndStartRecording();
              };
            }
          } else {
            console.log("No video URL in response, restarting recording");
            resetAndStartRecording();
          }
        } catch (err) {
          console.error("Error sending audio to backend:", err);
          resetAndStartRecording();
        }
      };

      // Start the MediaRecorder
      recorder.start(1000); // Collect data in 1-second chunks
      setStatus("recording");
      console.log("MediaRecorder started");
      
      // Start speech recognition
      SpeechRecognition.startListening({ continuous: true });
      
    } catch (error) {
      console.error("Error starting MediaRecorder:", error);
      setStatus("idle");
    }
  };

  // Reset state and start recording again
  const resetAndStartRecording = () => {
    // Clear previous transcript
    resetTranscript();
    
    // Release previous media resources
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    // Clear any existing timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Restart recording after a short delay
    setTimeout(() => {
      startMediaRecording();
    }, 500);
  };

  // Track transcript changes to detect silence
  useEffect(() => {
    if (transcript) {
      setLastTranscriptUpdate(Date.now());
      setSilenceDetected(false);
    }
  }, [transcript]);

  // Start recording when component mounts
  useEffect(() => {
    startMediaRecording();
    
    // Cleanup function
    return () => {
      stopAllMedia();
      clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  // Detect silence using both speech recognition status and transcript updates
  useEffect(() => {
    // Only run this when we're in recording state
    if (status !== "recording") return;

    // Set up a silence detection interval
    const silenceDetectionInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastTranscriptUpdate = now - lastTranscriptUpdate;
      
      // Consider it silence if:
      // 1. We're not listening (speech recognition stopped)
      // OR 2. No transcript updates for 2 seconds (even if speech recognition is still "listening")
      if (!listening || timeSinceLastTranscriptUpdate > 2000) {
        if (!silenceDetected) {
          console.log("Silence detected at", new Date().toISOString());
          setSilenceDetected(true);
          
          // Clear any existing timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          
          // Set a timeout to stop recording after continued silence
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("Stopping recorder due to silence...");
            
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              SpeechRecognition.stopListening();
              mediaRecorderRef.current.stop();
            }
          }, 1000); // Wait 1 more second of silence before stopping
        }
      } else {
        // If we have activity, clear any pending silence timeout
        if (silenceDetected) {
          console.log("Speech activity detected, canceling silence timeout");
          setSilenceDetected(false);
          
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        }
      }
    }, 500); // Check every 500ms
    
    // Clean up the interval
    return () => clearInterval(silenceDetectionInterval);
  }, [status, listening, lastTranscriptUpdate, silenceDetected]);

  // Function to stop all media
  const stopAllMedia = () => {
    // Stop speech recognition
    SpeechRecognition.stopListening();
    
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all audio tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    // Clear any timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    setStatus("idle");
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    stopRecording: stopAllMedia,
    startRecording: startMediaRecording,
    getStatus: () => status
  }));

  return (
    <div className="video-chat-container">   
      {/* Video element for playing responses */}
      <video 
        ref={videoPlayerRef} 
        className={status === "playing" ? "visible" : "hidden"} 
        playsInline 
        controls={false}
        style={{ width: '100%', maxWidth: '480px' }}
      />
    </div>
  );
});

export default VideoChat;