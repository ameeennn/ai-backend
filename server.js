import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000; // Use Render's PORT environment variable

// Correct CORS configuration for your GitHub Pages sites
const allowedOrigins = ["https://voltedgebuilds.github.io", "https://ameennn.github.io"];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// Main video generation endpoint
app.post("/generate-video", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Make the request directly to the domain name
    const response = await fetch("https://api.fal.ai/v1/video/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "stability-video-diffusion"
      })
    });

    const data = await response.json();
    console.log("fal.ai Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Video generation failed", raw: data });
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

// Health check endpoint for Render
app.get("/", (req, res) => {
  res.status(200).send("AI backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
