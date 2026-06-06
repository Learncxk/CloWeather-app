// CloWeather API — 实时天气 /api/weather?lat=xx&lon=xx
const API_KEY = "4216c4a78dac4d6f9800810f352d3cf7";

export default async (req, res) => {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ["http://localhost:3000","https://cloweather.vercel.app","https://learncxk.github.io"].includes(origin) ? origin : "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "请提供经纬度参数 lat 和 lon" });
  try {
    const data = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn&appid=${API_KEY}`).then(r => r.json());
    return res.json(data);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};
