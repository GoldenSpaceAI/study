// index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Resolve current dir (ESM safe __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// 1. Serve static files (your HTML/CSS/JS in root)
app.use(express.static(__dirname));

// 2. Points API (for read-story scoring)
app.post("/api/points/add", (req, res) => {
  const { points, reason, storyId, mistakes } = req.body;
  console.log("Points awarded:", { points, reason, storyId, mistakes });
  res.json({ ok: true, total: points });
});

// 3. Unified AI API
app.post("/api/check", async (req, res) => {
  try {
    let messages = [];

    if (req.body.expectedLine && req.body.heardLine) {
      // --- Reading Mode ---
      const { expectedLine, heardLine } = req.body;
      messages = [
        {
          role: "system",
          content:
            "You are a reading tutor. Compare the expected text with what the child said. Count missing or wrong words and return a clear evaluation."
        },
        {
          role: "user",
          content: `Expected: \"${expectedLine}\". Heard: \"${heardLine}\".`
        }
      ];
    } else if (req.body.message) {
      // --- Chat Mode ---
      const { message } = req.body;
      messages = [
        {
          role: "system",
          content:
            "You are TalkAI, a professional, knowledgeable assistant. Always reply with long, detailed, well-structured answers in clear English."
        },
        {
          role: "user",
          content: message
        }
      ];
    } else {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Call OpenAI GPT-4o
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7
      })
    });

    const data = await completion.json();
    res.json(data);
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "OpenAI call failed" });
  }
});

// 4. Fallback → serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
