import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Study Rewards API is running 🚀");
});

// Endpoint for points (called from your HTML)
app.post("/api/points/add", (req, res) => {
  // In production: save to Supabase, database, etc.
  // For now just echo
  const { points, reason, storyId, mistakes } = req.body;
  console.log("Points awarded:", req.body);
  res.json({ ok: true, total: points });
});

// Example: check spoken word with GPT-4o
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
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a reading tutor. Compare what the child read to the expected text. Report if words are missing or wrong." },
          { role: "user", content: `Expected: \"${expectedLine}\". Heard: \"${heardLine}\". Tell me only the wrong words or 'no mistakes'.` }
        ]
      })
    });
    const data = await completion.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI call failed" });
  }
});

// Render will use PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
