// /components/VoiceCallButton.tsx
import { useState, useRef } from 'react';

export default function VoiceCallButton({
  character,
}: {
  character: 'jinx' | 'mf';
}) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm; codecs=opus',
    });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm; codecs=opus' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'speech.webm');
      formData.append('character', character);

      const response = await fetch('/api/call/stream', {
        method: 'POST',
        body: formData,
      });
      if (!response.body) return;

      // Play streaming audio
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
      source.start();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className={`px-4 py-2 rounded-full text-sm ${
        recording ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
      }`}
    >
      {recording ? 'Stop Talking' : '🎤 Talk to AI'}
    </button>
  );
}
