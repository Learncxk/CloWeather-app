/**
 * CloWeather 设置向导
 * 一键配置 API Key + 启动服务器
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`
╔═══════════════════════════════════════════╗
║        CloWeather ☁️  设置向导              ║
╠═══════════════════════════════════════════╝
║
║  你需要一个 OpenWeatherMap API Key（免费）
║
║  步骤：
║    1. 打开 https://openweathermap.org
║    2. 点右上角 "Sign In" → "Create an Account"
║    3. 注册后去 https://home.openweathermap.org/api_keys
║    4. 复制你的 API Key（一串字母和数字）
║
║  （已经注册过？直接去第 4 步复制 Key）
║
╚═══════════════════════════════════════════
`);

rl.question("👉 粘贴你的 API Key 然后回车: ", (key) => {
  key = key.trim();
  if (!key) {
    console.log("\n❌ Key 不能为空，请重试\n");
    rl.close();
    return;
  }

  // 写入 .env
  fs.writeFileSync(".env", `OWM_API_KEY=${key}\n`, "utf-8");
  console.log(`\n✅ API Key 已保存到 .env`);

  // 也写入 server.js 第 12 行的占位
  let serverJs = fs.readFileSync("server.js", "utf-8");
  serverJs = serverJs.replace(
    `const API_KEY = process.env.OWM_API_KEY || "";`,
    `const API_KEY = process.env.OWM_API_KEY || "${key}";`
  );
  fs.writeFileSync("server.js", serverJs, "utf-8");

  console.log(`✅ server.js 已配置`);

  console.log(`
╔═══════════════════════════════════════════╗
║  🎉 配置完成！                               ║
╠═══════════════════════════════════════════╣
║                                            ║
║  运行以下命令启动:                          ║
║                                            ║
║     npm start                              ║
║                                            ║
║  或者:                                     ║
║                                            ║
║     node server.js                         ║
║                                            ║
║  然后打开浏览器访问:                         ║
║     http://localhost:3000                   ║
║                                            ║
╚═══════════════════════════════════════════╝
  `);

  rl.close();
});
