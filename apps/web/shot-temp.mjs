const { chromium } = await import(
  "file:///C:/dev/Na Pole Position Kart/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs"
);
const [, , alvo, tamanho, saida] = process.argv;
const [w, h] = tamanho.split("x").map(Number);
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: w, height: h } });
await pag.goto(alvo, { waitUntil: "networkidle", timeout: 60000 });
await pag.waitForTimeout(2500);
await pag.screenshot({ path: saida });
await nav.close();
