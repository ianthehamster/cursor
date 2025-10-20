import React, { useState, useRef, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, PhoneCall } from 'lucide-react';
import { createPortal } from 'react-dom';

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

  // 🔓 unlock AudioContext on first user gesture (mobile fix)
  const unlockAudio = async () => {
    try {
      const UnlockCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new UnlockCtx();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
      await ctx.close();
      console.log('🔓 AudioContext unlocked for mobile');
    } catch (e) {
      console.warn('Audio unlock skipped:', e);
    }
  };

  const startCall = async () => {
    await unlockAudio();
    await playTone('start');
    setInCall(true);
    inCallRef.current = true;
    await startRecording();
  };

  const endCall = async () => {
    inCallRef.current = false;
    stopRecording();
    cleanupAudioContext();

    if (playbackCtxRef.current) {
      try {
        playbackCtxRef.current.close();
      } catch {}
      playbackCtxRef.current = null;
    }

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
      if (response.status === 204 || !response.body) {
        console.log('Call ended too soon — skipping reply.');
        return;
      }
      // ⚡ Progressive streaming playback (desktop + mobile)
      const mediaSource = new MediaSource();
      const audio = new Audio();
      audio.src = URL.createObjectURL(mediaSource);

      // helper: try to play when data is available
      const safePlay = async () => {
        try {
          await audio.play();
        } catch (err) {
          console.warn('Initial play blocked:', err);
          document.addEventListener(
            'touchend',
            async () => {
              try {
                await audio.play();
              } catch (e) {
                console.error('Retry failed:', e);
              }
            },
            { once: true },
          );
        }
      };

      mediaSource.addEventListener('sourceopen', async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        const reader = response.body!.getReader();
        let firstChunk = true;

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            mediaSource.endOfStream();
            break;
          }
          if (value && !sourceBuffer.updating) {
            await new Promise<void>((resolve) => {
              const handleUpdate = () => resolve();
              sourceBuffer.addEventListener('updateend', handleUpdate, {
                once: true,
              });
              sourceBuffer.appendBuffer(value);
            });
            // play only after first data appended
            if (firstChunk) {
              firstChunk = false;
              await safePlay();
            }
          }
        }
      });

      // // ⚡ Progressive streaming playback with retry (mobile-safe)
      // const mediaSource = new MediaSource();
      // const audio = new Audio();
      // audio.src = URL.createObjectURL(mediaSource);

      // const tryPlay = async () => {
      //   try {
      //     await audio.play();
      //   } catch (err) {
      //     console.warn('Playback blocked, retrying on user interaction', err);
      //     document.addEventListener(
      //       'touchend',
      //       async () => {
      //         try {
      //           await audio.play();
      //         } catch (err2) {
      //           console.error('Retry failed:', err2);
      //         }
      //       },
      //       { once: true },
      //     );
      //   }
      // };

      // await tryPlay();

      // mediaSource.addEventListener('sourceopen', async () => {
      //   const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      //   const reader = response.body!.getReader();

      //   while (true) {
      //     const { value, done } = await reader.read();
      //     if (done) {
      //       mediaSource.endOfStream();
      //       break;
      //     }
      //     if (value && !sourceBuffer.updating) {
      //       await new Promise((resolve) => {
      //         sourceBuffer.addEventListener('updateend', resolve, {
      //           once: true,
      //         });
      //         sourceBuffer.appendBuffer(value);
      //       });
      //     }
      //   }
      // });

      // when ElevenLabs finishes speaking
      audio.onended = async () => {
        if (inCallRef.current) {
          setRecording(true);
          await new Promise((r) => setTimeout(r, 200));
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
    audio.src =
      type === 'start' ? '/sounds/call_start.mp3' : '/sounds/call_end.mp3';
    try {
      await audio.play();
    } catch (err) {
      console.warn('Autoplay blocked, waiting for user interaction', err);
    }
    return new Promise<void>((resolve) => {
      audio.addEventListener('ended', () => resolve(), { once: true });
    });
  };

  const avatar =
    character === 'jinx'
      ? 'https://pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev/images/jinx-cursor.jpg'
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

      {inCall &&
        typeof window !== 'undefined' &&
        createPortal(
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
          </div>,
          document.body,
        )}
    </>
  );
}
