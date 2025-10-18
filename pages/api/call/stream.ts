// /pages/api/call/stream.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { generateReply } from '@/lib/ai'; // adjust if your file path differs

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🚫 Disable Next’s built-in body parser so we can handle raw form data
export const config = {
  api: { bodyParser: false },
};

// helper for parsing multipart/form-data
const parseForm = (req: any): Promise<{ fields: any; files: any }> => {
  const uploadDir = path.join(process.cwd(), '/tmp'); // ensure tmp dir exists
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    multiples: false,
    uploadDir,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fields, files } = await parseForm(req);
    const fileData = (files as any).audio;
    const audioFilePath = Array.isArray(fileData)
      ? fileData[0].filepath
      : fileData.filepath;
    const character = Array.isArray(fields.character)
      ? fields.character[0]
      : fields.character || 'jinx';

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      res.status(400).json({ error: 'Audio file missing or invalid' });
      return;
    }

    // 1️⃣ Transcribe with Whisper
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
    });

    // 2️⃣ Get ChronoCrush reply
    const reply = await generateReply(character, transcript.text, []);

    // 3️⃣ ElevenLabs streaming TTS
    const voiceId =
      character === 'jinx'
        ? process.env.ELEVENLABS_JINX_ID
        : process.env.ELEVENLABS_MF_ID;

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      data: {
        text: reply,
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      },
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (err: any) {
    console.error('❌ Voice call failed:', err.message || err);
    res.status(500).json({ error: 'Voice call failed.' });
  }
}
