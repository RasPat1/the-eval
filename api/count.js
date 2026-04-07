import { list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  let count = 0;
  try {
    const { blobs } = await list({ prefix: "subscribers" });
    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      const subscribers = await response.json();
      count = subscribers.length;
    }
  } catch {}

  return res.status(200).json({ count });
}
