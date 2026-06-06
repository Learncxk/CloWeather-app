/**
 * CloWeather 本地开发服务器
 * 替代 Cloudflare Worker，在本地跑代理 + 静态文件服务
 *
 * 用法：
 *   1. node server.js
 *   2. 浏览器打开 http://localhost:3000
 *
 * 部署到线上时用 worker.js + 任意静态托管
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// ===== 配置 =====
const PORT = 3000;
const API_KEY = process.env.OWM_API_KEY || "4216c4a78dac4d6f9800810f352d3cf7"; // 优先从环境变量读
const API_BASE = "https://api.openweathermap.org";

// ===== MIME 类型 =====
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ===== 请求 OpenWeatherMap API =====
async function fetchOWM(pathname, searchParams) {
  const qs = searchParams.toString();
  const url = `${API_BASE}${pathname}?${qs}&appid=${API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    let msg = `OpenWeatherMap 请求失败 (${resp.status})`;
    try { const e = await resp.json(); if (e.message) msg = e.message; } catch (_) {}
    throw new Error(msg);
  }
  return resp.json();
}

// ===== 路由 =====
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // CORS 头
  const origin = req.headers["origin"] || "";
  const allowOrigin = origin || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  // OPTIONS 预检
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  // 检查 API Key
  if (!API_KEY) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      error: "请先设置 API Key",
      setup: [
        "1. 打开 https://openweathermap.org → 注册 → 获取 API Key",
        "2. 运行: export OWM_API_KEY=你的Key  (Windows: set OWM_API_KEY=你的Key)",
        "3. 或者直接编辑 server.js 第 12 行填入 Key",
      ],
    }));
  }

  try {
    if (pathname === "/api/geo") {
      const q = searchParams.get("q");
      if (!q) throw new Error("请提供城市名称");
      const data = await fetchOWM("/geo/1.0/direct", new URLSearchParams({ q, limit: "5" }));
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      return res.end(JSON.stringify(data));
    }

    if (pathname === "/api/weather") {
      const lat = searchParams.get("lat");
      const lon = searchParams.get("lon");
      if (!lat || !lon) throw new Error("请提供经纬度参数 lat 和 lon");
      const data = await fetchOWM("/data/2.5/weather", new URLSearchParams({ lat, lon, units: "metric", lang: "zh_cn" }));
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      return res.end(JSON.stringify(data));
    }

    if (pathname === "/api/forecast") {
      const lat = searchParams.get("lat");
      const lon = searchParams.get("lon");
      if (!lat || !lon) throw new Error("请提供经纬度参数 lat 和 lon");
      const data = await fetchOWM("/data/2.5/forecast", new URLSearchParams({ lat, lon, units: "metric", lang: "zh_cn" }));
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      return res.end(JSON.stringify(data));
    }

    if (pathname === "/health") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", mode: "local", apiKey: API_KEY ? "已配置 ✓" : "未配置 ✗" }));
    }

    // 静态文件：返回 index.html
    const filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);
    const ext = path.extname(filePath);
    const mime = MIME[ext] || "application/octet-stream";

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { ...corsHeaders, "Content-Type": mime });
      return res.end(content);
    }

    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "未找到" }));
  } catch (err) {
    res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ===== 启动 =====
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║         CloWeather 本地服务器              ║
  ╠═══════════════════════════════════════════╣
  ║                                           ║
  ║  打开: http://localhost:${PORT}              ║`);
  if (API_KEY) {
    console.log(`  ║  API Key: ✅ 已配置                      ║`);
  } else {
    console.log(`  ║  ⚠️  API Key: 未配置                      ║`);
    console.log(`  ║  请设置环境变量 OWM_API_KEY 后重启          ║`);
    console.log(`  ║  或编辑 server.js 第 12 行填入              ║`);
  }
  console.log(`  ║                                           ║`);
  console.log(`  ║  部署到线上时:                              ║`);
  console.log(`  ║  1. worker.js → Cloudflare Workers         ║`);
  console.log(`  ║  2. index.html → Cloudflare Pages          ║`);
  console.log(`  ╚═══════════════════════════════════════════╝`);
});
