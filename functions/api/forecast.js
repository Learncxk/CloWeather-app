const KEY = "4216c4a78dac4d6f9800810f352d3cf7";
export async function onRequest(ctx) {
  const {request} = ctx;
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat"), lon = url.searchParams.get("lon");
  const origin = request.headers.get("Origin")||"";
  const cors = {"Access-Control-Allow-Origin":["http://localhost:3000","https://cloweather-app.pages.dev"].includes(origin)?origin:"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
  if(!lat||!lon) return new Response(JSON.stringify({error:"请提供经纬度"}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  const r = await fetch("https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&units=metric&lang=zh_cn&appid="+KEY);
  const d = await r.json();
  return new Response(JSON.stringify(d),{headers:{...cors,"Content-Type":"application/json"}});
}