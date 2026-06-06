const KEY = "4216c4a78dac4d6f9800810f352d3cf7";
export async function onRequest(ctx) {
  const {request} = ctx;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const origin = request.headers.get("Origin")||"";
  const cors = {"Access-Control-Allow-Origin":["http://localhost:3000","https://cloweather-app.pages.dev"].includes(origin)?origin:"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
  if(!q) return new Response(JSON.stringify({error:"请提供城市名称"}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  const r = await fetch("https://api.openweathermap.org/geo/1.0/direct?q="+encodeURIComponent(q)+"&limit=5&appid="+KEY);
  const d = await r.json();
  return new Response(JSON.stringify(d),{headers:{...cors,"Content-Type":"application/json"}});
}