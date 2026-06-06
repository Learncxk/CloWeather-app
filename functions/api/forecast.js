export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = ["http://localhost:3000", "https://cloweather-app.pages.dev", "https://learncxk.github.io"];
  const corsOrigin = allowedOrigins.includes(origin) ? origin : "*";
  const corsHeaders = { "Access-Control-Allow-Origin": corsOrigin, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (!lat || !lon) return new Response(JSON.stringify({ error: "请提供经纬度" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const API_KEY = "4216c4a78dac4d6f9800810f352d3cf7";
  const resp = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn&appid=${API_KEY}`);
  const data = await resp.json();
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}