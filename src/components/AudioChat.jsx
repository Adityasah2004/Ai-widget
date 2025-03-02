import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

const AudioChat = forwardRef((props, ref) => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioPlayerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const isProcessingResponseRef = useRef(false);

  // Start recording automatically when component mounts
  useEffect(() => {
    startRecording();
    
    // Cleanup when component unmounts
    return () => {
      if (mediaRecorder) {
        stopRecording();
      }
    };
  }, []);

  // Expose methods to parent component
useImperativeHandle(ref, () => ({
  stopRecording: () => {
    if (mediaRecorder) {
      stopRecording();
    }
    
    // Stop any audio playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = ''; // Clear the source
      isPlayingRef.current = false;
      isProcessingResponseRef.current = false;
    }
  }
}));

  // Handle audio playback completion
  useEffect(() => {
    const audioElement = audioPlayerRef.current;
    
    if (audioElement) {
      const handleEnded = () => {
        isPlayingRef.current = false;
        // Resume recording after playback is complete
        if (isPaused && !isProcessingResponseRef.current) {
          resumeRecording();
        }
      };
      
      audioElement.addEventListener('ended', handleEnded);
      
      return () => {
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [isPaused]);

  // Start recording: get mic access, create MediaRecorder, send chunks periodically
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      recorder.ondataavailable = handleDataAvailable;
      recorder.onstop = () => {
        console.log("MediaRecorder stopped");
      };
      
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
      };
      
      // Start recording
      recorder.start(1000); // request a chunk every 1 second
      
      setAudioStream(stream);
      setMediaRecorder(recorder);
      setIsActive(true);
      console.log("Recording started automatically...");
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // This fires each time MediaRecorder has a chunk of audio
  const handleDataAvailable = async (e) => {
    if (e.data && e.data.size > 0 && !isPlayingRef.current && !isProcessingResponseRef.current) {
      try {
        isProcessingResponseRef.current = true;
        
        // Pause recording while we process and play the response
        pauseRecording();
        
        // Prepare form data
        const formData = new FormData();
        formData.append("audio_file", e.data, "chunk.wav");

        // Send chunk to the backend
        const response = await fetch(
          "https://widget-113024725109.us-central1.run.app/Response/audio",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Audio chunk upload failed: ${response.status}`);
        }

        // Check for audio response - handle different possible response formats
        let audioUrl = response.headers.get("X-Audio-URL");
        
        if (!audioUrl) {
          try {
            // Try to get response as blob
            const blob = await response.blob();
            if (blob.size > 0) {
              audioUrl = URL.createObjectURL(blob);
            }
          } catch (blobError) {
            console.error("Error processing response as blob:", blobError);
            
            // Try as JSON
            try {
              const jsonResponse = await response.json();
              if (jsonResponse && jsonResponse.audioUrl) {
                audioUrl = jsonResponse.audioUrl;
              }
            } catch (jsonError) {
              console.error("Error processing response as JSON:", jsonError);
            }
          }
        }

        if (audioUrl) {
          // Play the returned audio automatically
          playAudioFromUrl(audioUrl);
        } else {
          // No audio to play, resume recording
          isProcessingResponseRef.current = false;
          resumeRecording();
        }
      } catch (err) {
        console.error("Error sending audio chunk:", err);
        isProcessingResponseRef.current = false;
        resumeRecording();
      }
    }
  };

  // Pause recording temporarily
  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setIsPaused(true);
      console.log("Recording paused...");
    }
  };

  // Resume recording after pause
  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setIsPaused(false);
      console.log("Recording resumed...");
    }
  };

  // Stop recording: stop MediaRecorder and mic stream
  const stopRecording = () => {
    if (mediaRecorder) {
      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      mediaRecorder.ondataavailable = null;
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
    
    setMediaRecorder(null);
    setAudioStream(null);
    setIsActive(false);
    setIsPaused(false);
    console.log("Recording stopped completely...");
  };

  // Utility: Play audio by setting the <audio> element's src
  const playAudioFromUrl = (url) => {
    if (audioPlayerRef.current) {
      isPlayingRef.current = true;
      
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.onplay = () => {
        console.log("Audio playback started");
      };
      
      audioPlayerRef.current.onended = () => {
        console.log("Audio playback ended");
        isPlayingRef.current = false;
        isProcessingResponseRef.current = false;
        
        // Create a small delay before resuming recording to avoid feedback
        setTimeout(() => {
          if (isPaused) {
            resumeRecording();
          }
        }, 300);
      };
      
      audioPlayerRef.current.onerror = (err) => {
        console.error("Audio playback error:", err);
        isPlayingRef.current = false;
        isProcessingResponseRef.current = false;
        
        // Resume recording even if playback fails
        if (isPaused) {
          resumeRecording();
        }
      };
      
      audioPlayerRef.current.play().catch((err) => {
        console.error("Failed to play audio:", err);
        isPlayingRef.current = false;
        isProcessingResponseRef.current = false;
        
        // Resume recording even if playback fails
        if (isPaused) {
          resumeRecording();
        }
      });
    }
  };

  return (
    <div className="flex-1">
      {/* Hidden audio element for playback - no visible controls */}
      <audio ref={audioPlayerRef} className="hidden" />
      
      {/* Rest of the UI from DynamicIsland.jsx will handle the visible state/UI */}
    </div>
  );
});

export default AudioChat;