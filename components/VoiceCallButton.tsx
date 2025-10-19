import React, { useState, useRef } from 'react';
import { PhoneOff, Mic, MicOff, PhoneCall } from 'lucide-react';

export default function VoiceCallButton({
  character,
}: {
  character: 'jinx' | 'mf';
}) {
  const inCallRef = useRef(false);
  const sessionIdRef = useRef(`call-${Date.now()}`);

  const [inCall, setInCall] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);

  const startCall = async () => {
    setInCall(true);
    inCallRef.current = true;
    await playTone('start');

    await startRecording();
  };

  const endCall = async () => {
    inCallRef.current = false;
    stopRecording();
    cleanupAudioContext();

    // 🛑 stop any ongoing playback
    if (playbackCtxRef.current) {
      try {
        playbackCtxRef.current.close();
      } catch {}
      playbackCtxRef.current = null;
    }

    // 🔕 play hang-up tone before closing overlay
    await playTone('end');
    setTimeout(() => setInCall(false), 300);
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
      formData.append('sessionId', sessionIdRef.current);

      const response = await fetch('/api/call/stream', {
        method: 'POST',
        body: formData,
      });
      if (!response.body) return;

      // ⚡ Progressive streaming playback
      const mediaSource = new MediaSource();
      const audio = new Audio();
      audio.src = URL.createObjectURL(mediaSource);
      audio.play();

      mediaSource.addEventListener('sourceopen', async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        const reader = response.body!.getReader();

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            mediaSource.endOfStream();
            break;
          }
          if (value && !sourceBuffer.updating) {
            await new Promise((resolve) => {
              sourceBuffer.addEventListener('updateend', resolve, {
                once: true,
              });
              sourceBuffer.appendBuffer(value);
            });
          }
        }
      });

      // re-arm mic after playback
      // audio.onended = () => {
      //   if (inCall) {
      //     setRecording(true);
      //     startRecording();
      //   }
      // };
      audio.onended = async () => {
        if (inCallRef.current) {
          // Immediately flip to "Listening..." visually
          setRecording(true);

          // Wait a small beat to avoid mic conflict with the player
          await new Promise((r) => setTimeout(r, 200));

          // Restart mic
          startRecording();
        }
      };
    };

    setRecording(true);
    mediaRecorderRef.current = recorder;
    recorder.start();
    setupAudioContext(stream, recorder);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording')
      mediaRecorderRef.current.stop();
    cleanupAudioContext();
    setRecording(false);
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

  const playTone = async (type: 'start' | 'end') => {
    const audio = new Audio();

    if (type === 'start') {
      audio.src = '/sounds/call_start.mp3'; // ringing or connecting sound
    } else {
      audio.src = '/sounds/call_end.mp3'; // hang-up sound
    }

    try {
      await audio.play();
    } catch (err) {
      console.warn('Autoplay blocked, waiting for user interaction', err);
    }

    return new Promise<void>((resolve) => {
      audio.addEventListener('ended', () => resolve(), { once: true });
    });
  };

  // const playTone = async (type: 'start' | 'end') => {
  //   const ctx = new (window.AudioContext ||
  //     (window as any).webkitAudioContext)();
  //   const gain = ctx.createGain();
  //   gain.connect(ctx.destination);

  //   const makeOsc = (
  //     freq: number,
  //     start: number,
  //     duration: number,
  //     type = 'sine',
  //   ) => {
  //     const osc = ctx.createOscillator();
  //     osc.type = type as OscillatorType;
  //     osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  //     osc.connect(gain);
  //     osc.start(ctx.currentTime + start);
  //     osc.stop(ctx.currentTime + start + duration);
  //     return osc;
  //   };

  //   gain.gain.setValueAtTime(0.25, ctx.currentTime);

  //   if (type === 'start') {
  //     // “connecting” tone — two quick ascending pulses
  //     makeOsc(440, 0, 0.2, 'triangle');
  //     makeOsc(660, 0.25, 0.25, 'triangle');
  //     gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  //   } else {
  //     // “hang-up” tone — short descending dual-tone
  //     makeOsc(750, 0, 0.15, 'sawtooth');
  //     makeOsc(500, 0.15, 0.25, 'sawtooth');
  //     gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45);
  //   }

  //   setTimeout(() => ctx.close(), 600);
  // };

  const avatar =
    character === 'jinx'
      ? 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/jinxLogo.jpg'
      : 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/Sarah_Fortune.jpg';

  return (
    <>
      {!inCall && (
        <div className="absolute bottom-20 right-6 z-30">
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
            {character === 'jinx' ? 'Jinx' : 'Chloe'}
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
