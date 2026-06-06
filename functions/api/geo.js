export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  // CORS
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = ["http://localhost:3000", "https://cloweather-app.pages.dev", "https://learncxk.github.io"];
  const corsOrigin = allowedOrigins.includes(origin) ? origin : "*";
  const corsHeaders = { "Access-Control-Allow-Origin": corsOrigin, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (!q) return new Response(JSON.stringify({ error: "请提供城市名称" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const API_KEY = "4216c4a78dac4d6f9800810f352d3cf7";
  const resp = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`);
  const data = await resp.json();
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}