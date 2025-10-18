import { useState, useRef } from 'react';
import { PhoneOff, Mic, MicOff, PhoneCall } from 'lucide-react';

export default function VoiceCallButton({
  character,
}: {
  character: 'jinx' | 'mf';
}) {
  const [inCall, setInCall] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const startCall = async () => {
    setInCall(true);
    await startRecording();
  };

  const endCall = () => {
    stopRecording();
    cleanupAudioContext();

    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch {}
      playbackSourceRef.current = null;
    }

    if (playbackCtxRef.current) {
      try {
        playbackCtxRef.current.close();
      } catch {}
      playbackCtxRef.current = null;
    }

    setInCall(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm; codecs=opus',
    });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      cleanupAudioContext();
      setRecording(false);

      const audioBlob = new Blob(chunks, { type: 'audio/webm; codecs=opus' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'speech.webm');
      formData.append('character', character);

      const response = await fetch('/api/call/stream', {
        method: 'POST',
        body: formData,
      });
      if (!response.body) return;

      const audioCtx = new AudioContext();
      const reader = response.body.getReader();
      const streamBuffer: Uint8Array[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) streamBuffer.push(value);
      }

      const blob = new Blob(streamBuffer, { type: 'audio/mpeg' });
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      playbackCtxRef.current = audioCtx;
      playbackSourceRef.current = source;
      source.start();

      source.onended = () => {
        if (inCall) startRecording();
      };
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setupAudioContext(stream, recorder);
  };

  const setupAudioContext = (stream: MediaStream, recorder: MediaRecorder) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const checkSilence = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      const silenceThreshold = 10;
      if (avg < silenceThreshold) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            if (recorder.state === 'recording') recorder.stop();
          }, 1500);
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
      if (recorder.state === 'recording') requestAnimationFrame(checkSilence);
    };

    requestAnimationFrame(checkSilence);
  };

  const cleanupAudioContext = () => {
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    silenceTimerRef.current = null;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording')
      mediaRecorderRef.current.stop();
    cleanupAudioContext();
    setRecording(false);
  };

  const avatar =
    character === 'jinx'
      ? 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/jinxLogo.jpg'
      : 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/Sarah_Fortune.jpg';

  return (
    <>
      {!inCall && (
        <div className="absolute bottom-20 right-6">
          <button
            onClick={startCall}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <PhoneCall className="w-4 h-4" /> Voice Call
          </button>
        </div>
      )}

      {inCall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-white z-50">
          <img
            src={avatar}
            className="w-24 h-24 rounded-full shadow-lg mb-4"
            alt={character}
          />
          <h2 className="text-xl font-semibold mb-1">
            {character === 'jinx' ? 'Jinx' : 'Miss Fortune'}
          </h2>
          <p className="text-gray-300 text-sm mb-8">
            {recording ? 'Listening...' : 'Thinking...'}
          </p>

          <div className="flex gap-8">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`p-6 rounded-full transition ${
                recording
                  ? 'bg-red-600 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {recording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={endCall}
              className="p-6 rounded-full bg-gray-800 hover:bg-gray-900 transition"
            >
              <PhoneOff className="w-6 h-6 text-red-400" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
