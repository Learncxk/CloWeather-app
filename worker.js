/**
 * CloWeather — Cloudflare Worker 代理层
 * 隐藏 OpenWeatherMap API Key，提供三个接口给前端
 *
 * 【部署步骤（5分钟）】
 * 1. 注册 openweathermap.org → 免费获取 API Key
 * 2. 将 worker.js 部署到 Cloudflare Workers（填入 API Key），记下 Worker 域名
 * 3. 在 index.html 中将 WORKER_BASE_URL 改为你的 Worker 域名
 * 4. 将 index.html 部署到 Vercel/Netlify/Cloudflare Pages（拖拽上传即可）
 * 5. 完成！用户打开即用，零配置
 */

// ===== 配置 =====
const API_KEY = "4216c4a78dac4d6f9800810f352d3cf7"; // ← OpenWeatherMap API Key
const API_BASE = "https://api.openweathermap.org";

// 允许跨域的前端域名
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "https://cloweather.pages.dev",
  "https://cloweather.vercel.app",
  "https://cloweather.netlify.app",
  "https://learncxk.github.io",
];

/**
 * 构造 CORS 响应头
 */
function corsHeaders(origin) {
  // 如果请求来源在允许列表中则回应该来源，否则用通配符兜底
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * 请求 OpenWeatherMap API 并返回 JSON
 */
async function fetchFromOWM(path) {
  const url = `${API_BASE}${path}&appid=${API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    let errorMsg = `OpenWeatherMap 请求失败 (${resp.status})`;
    try {
      const errBody = await resp.json();
      if (errBody.message) errorMsg = errBody.message;
    } catch (_) { /* 忽略解析失败 */ }
    throw new Error(errorMsg);
  }
  return resp.json();
}

// ===== 路由处理 =====

/**
 * GET /api/geo?q=城市名
 * 地理编码：城市名 → 经纬度
 */
async function handleGeo(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  if (!q || q.trim() === "") {
    return new Response(JSON.stringify({ error: "请提供城市名称" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const data = await fetchFromOWM(`/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5`);
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/weather?lat=xx&lon=xx
 * 实时天气（metric + 中文）
 */
async function handleWeather(request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "请提供经纬度参数 lat 和 lon" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const data = await fetchFromOWM(`/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn`);
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/forecast?lat=xx&lon=xx
 * 天气预报（metric + 中文）
 */
async function handleForecast(request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "请提供经纬度参数 lat 和 lon" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const data = await fetchFromOWM(`/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=zh_cn`);
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /health
 * 健康检查
 */
function handleHealth() {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ===== 入口 =====

addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";
  const headers = corsHeaders(origin);
  const path = url.pathname;

  // 处理 OPTIONS 预检请求
  if (request.method === "OPTIONS") {
    return event.respondWith(new Response(null, { status: 204, headers }));
  }

  event.respondWith(
    (async () => {
      try {
        let data;
        switch (path) {
          case "/health":
            return handleHealth();
          case "/api/geo":
            data = await handleGeo(request);
            break;
          case "/api/weather":
            data = await handleWeather(request);
            break;
          case "/api/forecast":
            data = await handleForecast(request);
            break;
          default:
            return new Response(JSON.stringify({ error: "未知路由" }), {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            });
        }

        // 给响应加上 CORS 头
        const body = await data.text();
        return new Response(body, {
          status: data.status,
          headers: { ...headers, ...Object.fromEntries(data.headers) },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    })()
  );
});
