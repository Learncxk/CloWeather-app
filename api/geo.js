// CloWeather API — 地理编码 /api/geo?q=城市名
const API_KEY = "4216c4a78dac4d6f9800810f352d3cf7";

export default async (req, res) => {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ["http://localhost:3000","https://cloweather.vercel.app","https://learncxk.github.io"].includes(origin) ? origin : "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "请提供城市名称" });
  try {
    const data = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`).then(r => r.json());
    return res.json(data);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};
