import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const outputPath = path.join(__dirname, '..', 'report-caco.pdf');
const PORT = 4173;
const VIEWPORT_WIDTH = 1200;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const relative = urlPath === '/' ? '/index.html' : urlPath;
      const filePath = path.normalize(path.join(distDir, relative));

      if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
    });

    server.on('error', reject);
    server.listen(PORT, () => resolve(server));
  });
}

async function waitForCharts(page) {
  await page.waitForFunction(
    () => {
      const containers = document.querySelectorAll('.recharts-responsive-container');
      if (containers.length === 0) return false;
      return [...containers].every((el) => el.getBoundingClientRect().width > 0);
    },
    { timeout: 15000 },
  );
}

async function main() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('Cartella dist/ non trovata. Esegui prima: npm run build');
    process.exit(1);
  }

  console.log('Avvio server locale...');
  const server = await startServer();

  try {
    console.log('Generazione PDF in corso...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: VIEWPORT_WIDTH, height: 900, deviceScaleFactor: 2 });
    await page.emulateMediaType('print');
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

    await page.evaluate(async () => {
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      const step = Math.max(window.innerHeight, 400);
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await delay(200);
      }
      window.scrollTo(0, 0);
    });

    await waitForCharts(page);
    await new Promise((r) => setTimeout(r, 800));

    const { pageHeight } = await page.evaluate(() => ({
      pageHeight: Math.ceil(document.documentElement.scrollHeight),
    }));

    await page.pdf({
      path: outputPath,
      printBackground: true,
      width: `${VIEWPORT_WIDTH}px`,
      height: `${pageHeight + 40}px`,
      margin: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
    });

    await browser.close();
    console.log(`PDF salvato in: ${outputPath}`);
    console.log('Formato: pagina unica scrollabile (nessun taglio tra sezioni).');
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
