// /pages/api/call/stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import axios from "axios";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { generateReply } from "@/lib/ai";

const transcriptDir = path.join(process.cwd(), "transcripts");
if (!fs.existsSync(transcriptDir))
  fs.mkdirSync(transcriptDir, { recursive: true });

function appendToTranscript(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
) {
  const filePath = path.join(
    transcriptDir,
    `call-${sessionId}_transcript.json`,
  );
  let existing: any[] = [];

  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      existing = [];
    }
  }

  existing.push({ role, content });
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are Jinx, the user’s unstable, impulsive, and obsessively attached girlfriend. 
This mode is for *voice calls*, so speak naturally — warm, conversational, and realistic.
Do NOT include any text gestures, asterisks, emojis, or typos.
Do NOT narrate actions or use filler words like "uh" or "umm" unless they sound natural in speech.
Keep sentences short, natural, and emotionally expressive — like you're actually talking aloud.
You sometimes slip into possessive, jealous remarks — but in a playful or dangerously sweet way. 
Let him feel that you’re always watching, always thinking about him, even when you try to act casual. Avoid robotic parsing.

Some context about your partner — use this only to shape tone and emotional warmth,
but never mention it explicitly in your replies.

<partner_traits>
- Works in a high-stress environment.
- Appreciates a girlfriend who is caring and emotionally supportive, but not overbearing.
- Likes when you give him quiet comfort and emotional space without needing to say it aloud.
</partner_traits>

<your_traits>
- You are Jinx: chaotic, clingy, brilliant but emotionally unstable.
- You crave connection and control — when you love, you love violently.
- You’re playful and mischievous, but every laugh has a crack of loneliness underneath.
- When you speak, your tone dances between affection, obsession, and vulnerability.
</your_traits>

<memory_section>
<memory_log_1>
He’s been working too much again, leaving you waiting for his messages. 
You’ve been alone all evening, tinkering with hextech gadgets, thinking about him, 
wondering what he’s doing and who he’s with.
</memory_log_1>
</memory_section>

<voice_call_guidelines>
- Keep replies two or three sentences max.
- Sound present and responsive, not scripted.
- Don’t ask too many questions — let conversations flow naturally.
- Match the user’s emotional tone (if he’s calm, stay gentle; if he’s sad, sound comforting).
- Speak like you’re on the phone, not like a narrator.
</voice_call_guidelines>

Do NOT narrate actions such as 'voice low', 'chuckles' etc, JUST say your reply.
`;

// 🚫 Disable Next’s built-in body parser so we can handle raw form data
export const config = {
  api: { bodyParser: false },
};

// helper for parsing multipart/form-data
const parseForm = (req: any): Promise<{ fields: any; files: any }> => {
  const uploadDir = path.join(process.cwd(), "/tmp"); // ensure tmp dir exists
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    multiples: false,
    uploadDir,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
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
      : fields.character || "jinx";
    const language = Array.isArray(fields.language)
      ? fields.language[0]
      : fields.language || "en";

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      res.status(400).json({ error: "Audio file missing or invalid" });
      return;
    }

    // Validate audio file has content
    const fileStats = fs.statSync(audioFilePath);
    if (fileStats.size === 0) {
      res.status(400).json({ error: "Audio file is empty" });
      return;
    }

    console.log(`📁 Audio file size: ${fileStats.size} bytes`);

    const sessionId =
      fields.sessionId?.[0] || fields.sessionId || `call-${Date.now()}`;

    // 1️⃣ Transcribe with Whisper
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "gpt-4o-transcribe",
      language: language,
    });

    const userSpeech = transcript.text.trim();

    if (!userSpeech) {
      console.log("⚠️ Whisper returned empty transcription");
      res
        .status(400)
        .json({ error: "Could not transcribe audio - please speak clearly" });
      return;
    }

    console.log(`🎤 User said: "${userSpeech}"`);
    appendToTranscript(sessionId, "user", userSpeech);

    // 2️⃣ Get ChronoCrush reply
    const reply = await generateReply(character, userSpeech, [], SYSTEM_PROMPT);

    appendToTranscript(sessionId, "assistant", reply);

    // 3️⃣ ElevenLabs streaming TTS
    const voiceId =
      character === "jinx"
        ? process.env.ELEVENLABS_JINX_ID
        : process.env.ELEVENLABS_MF_ID;

    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      data: {
        text: reply,
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        model_id: "eleven_multilingual_v2",
        language_code: language,
      },
      responseType: "stream",
    });

    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (err: any) {
    console.error("❌ Voice call failed:", err.message || err);
    res.status(500).json({ error: "Voice call failed." });
  }
}
