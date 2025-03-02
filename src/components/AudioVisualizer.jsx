import { useEffect, useRef } from "react";

const AudioVisualizer = () => {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyzerRef = useRef(null);
    const dataArrayRef = useRef(null);

    useEffect(() => {
        let stream;
        const startAudio = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                const audioContext = audioContextRef.current;
                const source = audioContext.createMediaStreamSource(stream);

                analyzerRef.current = audioContext.createAnalyser();
                const analyzer = analyzerRef.current;
                analyzer.fftSize = 256;

                const bufferLength = analyzer.frequencyBinCount;
                dataArrayRef.current = new Uint8Array(bufferLength);

                source.connect(analyzer);
                visualize();
                // setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone: ", err);
            }
        };

        const visualize = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const analyzer = analyzerRef.current;

            const draw = () => {
                requestAnimationFrame(draw);
                analyzer.getByteFrequencyData(dataArrayRef.current);

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "transparent";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const barWidth = (canvas.width / dataArrayRef.current.length) * 1;
                let barHeight;
                let x = 0;

                for (let i = 0; i < dataArrayRef.current.length; i++) {
                    barHeight = dataArrayRef.current[i] / 2;
                    ctx.fillStyle = "lime";
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            };

            draw();
        };

        startAudio();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            <canvas ref={canvasRef} width={600} height={200} className="bg-transparent rounded-lg" />
        </div>
    );
};

export default AudioVisualizer;
