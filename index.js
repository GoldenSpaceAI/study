// index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Resolve current dir (works with ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// 1. Serve static files directly from repo root
app.use(express.static(__dirname));

// 2. API to add points
app.post("/api/points/add", (req, res) => {
  const { points, reason, storyId, mistakes } = req.body;
  console.log("Points awarded:", { points, reason, storyId, mistakes });
  res.json({ ok: true, total: points });
});

// 3. API to check reading accuracy with OpenAI GPT-4o
app.post("/api/check", async (req, res) => {
  const { expectedLine, heardLine } = req.body;
  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a reading tutor. Compare what the child read to the expected text. Reply with the wrong words or say 'no mistakes'."
          },
          {
            role: "user",
            content: `Expected: \"${expectedLine}\". Heard: \"${heardLine}\".`
          }
        ]
      })
    });

    const data = await completion.json();
    res.json(data);
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "OpenAI call failed" });
  }
});

// 4. Fallback → always serve index.html for root or unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
