/**
 * CloWeather — Cloudflare Pages _worker.js
 * 单文件处理所有请求：静态资源 + API 代理
 */

// ===== 配置 =====
const API_KEY = "4216c4a78dac4d6f9800810f352d3cf7";
const API_BASE = "https://api.openweathermap.org";
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://cloweather-app.pages.dev",
  "https://learncxk.github.io",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

// ===== API 处理 =====

async function handleGeo(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  if (!q) return new Response(JSON.stringify({ error: "请提供城市名称" }), { status: 400, headers: { "Content-Type": "application/json" } });
  const resp = await fetch(`${API_BASE}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`);
  const data = await resp.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

async function handleWeather(request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  if (!lat || !lon) return new Response(JSON.stringify({ error: "请提供经纬度" }), { status: 400, headers: { "Content-Type": "application/json" } });
  const resp = await fetch(`${API_BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn&appid=${API_KEY}`);
  const data = await resp.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

async function handleForecast(request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  if (!lat || !lon) return new Response(JSON.stringify({ error: "请提供经纬度" }), { status: 400, headers: { "Content-Type": "application/json" } });
  const resp = await fetch(`${API_BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn&appid=${API_KEY}`);
  const data = await resp.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

function handleHealth() {
  return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
}

// ===== 入口 =====

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);
    const path = url.pathname;

    // 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // API 路由
    try {
      let response;
      if (path === "/api/geo" || path === "/api/geo/") { response = await handleGeo(request); }
      else if (path === "/api/weather" || path === "/api/weather/") { response = await handleWeather(request); }
      else if (path === "/api/forecast" || path === "/api/forecast/") { response = await handleForecast(request); }
      else if (path === "/health" || path === "/api/health") { response = handleHealth(); }
      else if (!path.startsWith("/api")) { return env.ASSETS.fetch(request); }
      else { return new Response(JSON.stringify({ error: "未知路由" }), { status: 404, headers: { ...headers, "Content-Type": "application/json" } }); }

      // 给 API 响应加上 CORS 头
      const body = await response.text();
      return new Response(body, {
        status: response.status,
        headers: { ...headers, ...Object.fromEntries(response.headers) },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
  },
};
