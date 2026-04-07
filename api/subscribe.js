import { put, list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const { email, playtest, ref } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const normalizedEmail = email.toLowerCase();

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
    if (subscribers.find((s) => s.email === normalizedEmail)) {
      return res.status(200).json({ message: "Already subscribed" });
    }

    subscribers.push({
      email: normalizedEmail,
      playtest: !!playtest,
      ref: ref || "direct",
      ts: new Date().toISOString(),
    });

    await put("subscribers.json", JSON.stringify(subscribers), {
      access: "public",
      addRandomSuffix: false,
    });

    // Send to ConvertKit if configured
    if (process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_FORM_ID) {
      const tags = [ref || "direct"];
      if (playtest) tags.push("playtest");

      try {
        await fetch(
          `https://api.convertkit.com/v3/forms/${process.env.CONVERTKIT_FORM_ID}/subscribe`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: process.env.CONVERTKIT_API_KEY,
              email: normalizedEmail,
              tags,
            }),
          }
        );
      } catch {}
    }

    return res.status(200).json({ message: "Subscribed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
