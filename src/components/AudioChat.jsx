import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

const AudioChat = forwardRef((props, ref) => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const audioPlayerRef = useRef(null);
  const wsRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isProcessingRef = useRef(false);
  const reconnectAttemptRef = useRef(0);

  // WebSocket setup
  useEffect(() => {
    const connectWebSocket = () => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket('wss://widget-113024725109.us-central1.run.app/Response/ws/audio');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptRef.current = 0;
        initializeMicrophone();
      };

      ws.onmessage = async (event) => {
        try {
          if (event.data instanceof Blob) {
            // Handle audio response
            const audioBlob = new Blob([event.data], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (audioPlayerRef.current) {
              isProcessingRef.current = true;
              
              audioPlayerRef.current.src = audioUrl;
              await audioPlayerRef.current.play().catch(error => {
                console.error('Error playing audio:', error);
                isProcessingRef.current = false;
                restartRecording();
              });
              
              audioPlayerRef.current.onended = () => {
                isProcessingRef.current = false;
                restartRecording();
              };
            }
          } else {
            // Handle text or error responses
            try {
              const response = JSON.parse(event.data);
              
              if (response.error) {
                console.error('Server Error:', response.error);
                isProcessingRef.current = false;
                restartRecording();
              } else if (response.text) {
                const decodedText = atob(response.text);
                console.log('Decoded text:', decodedText);
              }
            } catch (e) {
              console.error('Error parsing response:', e);
              isProcessingRef.current = false;
              restartRecording();
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          isProcessingRef.current = false;
          restartRecording();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        attemptReconnect();
        isProcessingRef.current = false;
        
        // Attempt reconnection
        if (reconnectAttemptRef.current < 3) {
          setTimeout(() => {
            reconnectAttemptRef.current++;
            connectWebSocket();
          }, 1000 * Math.pow(2, reconnectAttemptRef.current));
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        isProcessingRef.current = false;
        
        // Attempt reconnection
        if (reconnectAttemptRef.current < 3) {
          setTimeout(() => {
            reconnectAttemptRef.current++;
            connectWebSocket();
          }, 1000 * Math.pow(2, reconnectAttemptRef.current));
        }
      };
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize microphone and start continuous recording
  const initializeMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      setAudioStream(stream);

      const recorder = new MediaRecorder(stream, { 
        mimeType: "audio/wav",
        audioBitsPerSecond: 16000
      });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 && 
          !isProcessingRef.current
        ) {
          audioChunksRef.current.push(event.data);
          
          // Send chunks when they accumulate
          if (audioChunksRef.current.length >= 4) {
            sendAudioChunks();
          }
        }
      };

      recorder.onstop = () => {
        restartRecording();
      };
      
      recorder.start(1000); // Collect chunks every second
      setMediaRecorder(recorder);
    } catch (error) {
      console.error("Error setting up microphone:", error);
    }
  };

  // Restart recording after interruption
  const restartRecording = () => {
    // Stop existing recorder if any
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch (error) {
        console.error('Error stopping recorder:', error);
      }
    }

    // Restart recording after a short delay
    setTimeout(() => {
      if (audioStream) {
        try {
          const recorder = new MediaRecorder(audioStream, { 
            mimeType: "audio/wav",
            audioBitsPerSecond: 16000
          });
          
          audioChunksRef.current = [];
          
          recorder.ondataavailable = (event) => {
            if (
              event.data.size > 0 && 
              !isProcessingRef.current
            ) {
              audioChunksRef.current.push(event.data);
              
              // Send chunks when they accumulate
              if (audioChunksRef.current.length >= 4) {
                sendAudioChunks();
              }
            }
          };

          recorder.onstop = () => {
            restartRecording();
          };
          
          recorder.start(1000);
          setMediaRecorder(recorder);
        } catch (error) {
          console.error('Error creating new recorder:', error);
          // Attempt to reinitialize microphone
          initializeMicrophone();
        }
      }
    }, 100);
  };

  // Send accumulated audio chunks
  const sendAudioChunks = async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      if (
        wsRef.current && 
        wsRef.current.readyState === WebSocket.OPEN && 
        !isProcessingRef.current
      ) {
        wsRef.current.send(await audioBlob.arrayBuffer());
      }
      
      // Clear chunks after sending
      audioChunksRef.current = [];
    } catch (error) {
      console.error('Error sending audio chunks:', error);
      // Reset processing state if sending fails
      isProcessingRef.current = false;
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    }
  }));

  return (
    <div className="flex-1">
      <audio ref={audioPlayerRef} className="hidden" />
    </div>
  );
});

AudioChat.displayName = 'AudioChat';

export default AudioChat;