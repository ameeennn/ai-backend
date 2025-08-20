import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import dns from "dns/promises"; // Use promises-based DNS module

dotenv.config();
const app = express();

// Set custom DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// DNS cache to avoid repeated lookups
const dnsCache = new Map();

app.use(cors({
  origin: ["https://ameeennn.github.io", "https://voltedgebuilds.github.io"],
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false
}));
app.use(express.json());

// Test DNS resolution endpoint
app.get("/test-dns", async (req, res) => {
  try {
    const address = await dns.lookup("api.fal.ai");
    res.json({ message: "DNS resolution successful", address: address.address, family: address.family });
  } catch (err) {
    res.status(500).json({ error: "DNS resolution failed", details: err.message });
  }
});

// Test connectivity to fal.ai
app.get("/test-connectivity", async (req, res) => {
  try {
    const response = await fetch("https://api.fal.ai");
    res.json({ status: response.status, ok: response.ok });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-video", async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Check DNS cache
    let falIp = dnsCache.get("api.fal.ai");
    if (!falIp) {
      const { address } = await dns.lookup("api.fal.ai");
      falIp = address;
      dnsCache.set("api.fal.ai", falIp);
    }

    const response = await fetch(`https://${falIp}/v1/video/generation`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
        "Host": "api.fal.ai" // Required for correct routing
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "stability-video-diffusion" // Adjust as per fal.ai documentation
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

app.listen(10000, () => {
  console.log("Server is running on port 10000");
});
