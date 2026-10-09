import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5175';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_MP4 = path.resolve(process.cwd(), 'nikahku_promo.mp4');
const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-ide/brain/0480407c-42d8-40b6-afa3-c690889b9351';
const ARTIFACT_MP4 = path.join(ARTIFACT_DIR, 'nikahku_promo.mp4');
const AUDIO_PATH = path.resolve(process.cwd(), 'static/music/the-way-you-look-at-me.mp3');

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 20;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function recordPromo() {
  console.log('🎬 Starting Nikahku Promo Video Recorder...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      `--window-size=${WIDTH},${HEIGHT}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
    ],
    defaultViewport: {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 1.5,
    },
  });

  const page = await browser.newPage();

  // Setup ffmpeg process to receive raw image stream
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', '-',
  ];

  if (fs.existsSync(AUDIO_PATH)) {
    ffmpegArgs.push(
      '-i', AUDIO_PATH,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-crf', '22',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest'
    );
  } else {
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-crf', '22'
    );
  }

  ffmpegArgs.push(OUTPUT_MP4);

  console.log('🎥 Initializing FFmpeg encoder...');
  const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', ffmpegArgs);

  ffmpeg.stderr.on('data', (data) => {
    // console.log(`FFmpeg: ${data}`);
  });

  let frameCount = 0;
  let recording = true;

  // Frame capture loop
  async function captureFrames(durationMs) {
    const interval = 1000 / FPS;
    const targetFrames = Math.round(durationMs / interval);
    for (let i = 0; i < targetFrames && recording; i++) {
      const start = Date.now();
      try {
        const buffer = await page.screenshot({ type: 'jpeg', quality: 85 });
        if (ffmpeg.stdin.writable) {
          ffmpeg.stdin.write(buffer);
          frameCount++;
        }
      } catch (err) {
        // ignore occasional screenshot hiccups
      }
      const elapsed = Date.now() - start;
      const waitTime = Math.max(0, interval - elapsed);
      if (waitTime > 0) await sleep(waitTime);
    }
  }

  // Smooth scroll helper
  async function smoothScroll(distance, durationMs) {
    const steps = Math.round(durationMs / 50);
    const stepDist = distance / steps;
    const stepDuration = durationMs / steps;
    for (let i = 0; i < steps; i++) {
      await page.evaluate((d) => window.scrollBy(0, d), stepDist);
      const buffer = await page.screenshot({ type: 'jpeg', quality: 85 });
      if (ffmpeg.stdin.writable) {
        ffmpeg.stdin.write(buffer);
        frameCount++;
      }
      await sleep(stepDuration);
    }
  }

  console.log('📍 Scene 1: Landing Page (Hero & Branding)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await captureFrames(2500);

  console.log('📍 Scene 1b: Scrolling Landing Page Features...');
  await smoothScroll(600, 2000);
  await captureFrames(1000);
  await smoothScroll(700, 2000);
  await captureFrames(1200);

  console.log('📍 Scene 2: Dashboard Overview & Countdown...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await captureFrames(2500);
  await smoothScroll(400, 1800);
  await captureFrames(1500);

  console.log('📍 Scene 3: Anggaran & Budget Management...');
  await page.goto(`${BASE_URL}/anggaran`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await captureFrames(2500);
  await smoothScroll(450, 2000);
  await captureFrames(1800);

  console.log('📍 Scene 4: Undangan Digital Mewah Preview...');
  await page.goto(`${BASE_URL}/undangan`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await captureFrames(2500);

  // Click 'Buka Undangan' inside the preview if button exists
  try {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent && b.textContent.includes('Buka Undangan')
      );
      if (btn) btn.click();
    });
  } catch (e) {}
  await captureFrames(1500);
  await smoothScroll(500, 2200);
  await captureFrames(1500);

  console.log('📍 Scene 5: Checklist Persiapan...');
  await page.goto(`${BASE_URL}/checklist`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await captureFrames(2500);

  // Toggle one checklist item interactively
  try {
    await page.evaluate(() => {
      const chk = document.querySelector('input[type="checkbox"]');
      if (chk) chk.click();
    });
  } catch (e) {}
  await captureFrames(1500);
  await smoothScroll(400, 1800);
  await captureFrames(1200);

  console.log('📍 Scene 6: Closing Hero Shot on Dashboard...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await captureFrames(2500);

  recording = false;
  await browser.close();

  console.log(`✅ Captured ${frameCount} frames. Finalizing video encoding...`);
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  console.log(`🎉 Promo video saved successfully: ${OUTPUT_MP4}`);

  // Copy to artifacts directory
  if (fs.existsSync(OUTPUT_MP4)) {
    fs.copyFileSync(OUTPUT_MP4, ARTIFACT_MP4);
    console.log(`📦 Copied to artifact dir: ${ARTIFACT_MP4}`);

    // Create an animated WebP preview (first 8 seconds, 480px width)
    const previewWebp = path.join(ARTIFACT_DIR, 'nikahku_promo_preview.webp');
    const webpCmd = spawn('/opt/homebrew/bin/ffmpeg', [
      '-y',
      '-i', OUTPUT_MP4,
      '-t', '10',
      '-vf', 'fps=10,scale=480:-1:flags=lanczos',
      '-loop', '0',
      previewWebp
    ]);
    await new Promise((r) => webpCmd.on('close', r));
    console.log(`🖼️ WebP preview created: ${previewWebp}`);
  }
}

recordPromo().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
