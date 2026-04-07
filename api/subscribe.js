import { put, list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }

    // Load existing subscribers
    let subscribers = [];
    try {
      const { blobs } = await list({ prefix: "subscribers" });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url);
        subscribers = await response.json();
      }
    } catch {}

    // Check for duplicates
    if (subscribers.includes(email.toLowerCase())) {
      return res.status(200).json({ message: "Already subscribed" });
    }

    subscribers.push(email.toLowerCase());

    await put("subscribers.json", JSON.stringify(subscribers), {
      access: "public",
      addRandomSuffix: false,
    });

    return res.status(200).json({ message: "Subscribed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
