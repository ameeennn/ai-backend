import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors({
  origin: ["https://voltedgebuilds.github.io"],
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

app.post("/generate-video", async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await fetch("https://api.fal.ai/v1/video/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "stability-video-diffusion" // Adjust model as per fal.io's available models
      })
    });

    const data = await response.json();
    console.log("fal.io Response:", data);

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Video generation failed" });
    }

    if (data.video && data.video.url) {
      res.json({ videoUrl: data.video.url });
    } else {
      res.status(500).json({ error: "No video URL returned", raw: data });
    }
  } catch (error) {
    console.error("Video generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(10000, () => {
  console.log("Server is running on port 10000");
});
