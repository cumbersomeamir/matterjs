import { chromium } from 'playwright';
import { execa } from 'execa';
import { writeFileSync, mkdirSync, rmSync, existsSync, createReadStream } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import ffmpegStatic from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const SCENES = ['bigbang', 'dna', 'evolution', 'blackholes', 'neuralnetwork'];
const FPS = 30;
const DURATION_SECONDS = 8;
const TOTAL_FRAMES = FPS * DURATION_SECONDS;
const DT = 1000 / 60; // 60Hz physics step

// Simple HTTP server for serving files
function createHTTPServer(rootDir, port = 0) {
    return new Promise((resolve) => {
        const server = createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${port}`);
            let filePath = join(rootDir, url.pathname);
            
            // Security: prevent directory traversal
            if (!filePath.startsWith(rootDir)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }
            
            // Default to index if directory
            if (filePath.endsWith('/')) {
                filePath = join(filePath, 'index.html');
            }
            
            const ext = extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.css': 'text/css'
            };
            
            const contentType = contentTypes[ext] || 'application/octet-stream';
            
            try {
                if (!existsSync(filePath)) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                
                const stream = createReadStream(filePath);
                res.writeHead(200, { 'Content-Type': contentType });
                stream.pipe(res);
            } catch (error) {
                res.writeHead(500);
                res.end('Server error');
            }
        });
        
        server.listen(port, () => {
            const address = server.address();
            resolve({ server, port: address.port });
        });
    });
}

async function renderScene(sceneName, httpServer) {
    console.log(`\n🎬 Rendering scene: ${sceneName}`);
    
    const framesDir = join(rootDir, 'outputs', 'frames', sceneName);
    const outputDir = join(rootDir, 'outputs');
    
    // Clean previous frames
    if (existsSync(framesDir)) {
        rmSync(framesDir, { recursive: true, force: true });
    }
    mkdirSync(framesDir, { recursive: true });
    
    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1080, height: 1920 }
    });
    const page = await context.newPage();
    
    try {
        // Load player.html with scene parameter via HTTP
        const playerUrl = `http://localhost:${httpServer.port}/src/player.html?scene=${sceneName}&seed=12345`;
        
        // Set headless mode before loading
        await page.addInitScript(() => {
            window.headlessMode = true;
        });
        
        await page.goto(playerUrl, { waitUntil: 'networkidle' });
        
        // Wait for scene to load
        await page.waitForFunction(() => window.sceneReady === true, { timeout: 10000 });
        
        // Stop any running render loops
        await page.evaluate(() => {
            if (window.matterRender && window.matterRender.runner) {
                window.Matter.Render.stop(window.matterRender);
            }
        });
        
        const canvas = await page.locator('#canvas');
        
        // Render frames
        const frameTime = 1000 / FPS; // milliseconds per frame
        const stepsPerFrame = Math.ceil(frameTime / DT);
        
        for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
            // Step physics multiple times per frame for accuracy
            for (let i = 0; i < stepsPerFrame; i++) {
                await page.evaluate((dt) => {
                    window.Matter.Engine.update(window.matterEngine, dt);
                }, DT);
            }
            
            // Render the frame
            await page.evaluate(() => {
                window.Matter.Render.world(window.matterRender);
            });
            
            // Capture screenshot
            const framePath = join(framesDir, `frame_${String(frame + 1).padStart(4, '0')}.png`);
            await canvas.screenshot({ path: framePath });
            
            if ((frame + 1) % 30 === 0) {
                console.log(`  Frame ${frame + 1}/${TOTAL_FRAMES}`);
            }
        }
        
        await browser.close();
        
        // Encode to MP4
        console.log(`  Encoding MP4...`);
        const mp4Path = join(outputDir, `${sceneName}.mp4`);
        const ffmpegPath = ffmpegStatic || 'ffmpeg';
        
        try {
            await execa(ffmpegPath, [
                '-y',
                '-r', String(FPS),
                '-i', join(framesDir, 'frame_%04d.png'),
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-crf', '23',
                mp4Path
            ], { cwd: rootDir });
            console.log(`  ✓ MP4 created: ${mp4Path}`);
        } catch (error) {
            console.warn(`  ⚠ MP4 encoding failed, trying GIF...`);
            // Fallback to GIF
            const gifPath = join(outputDir, `${sceneName}.gif`);
            try {
                await execa(ffmpegPath, [
                    '-y',
                    '-r', String(FPS),
                    '-i', join(framesDir, 'frame_%04d.png'),
                    '-vf', 'fps=30,scale=1080:-1:flags=lanczos',
                    gifPath
                ], { cwd: rootDir });
                console.log(`  ✓ GIF created: ${gifPath}`);
            } catch (gifError) {
                console.error(`  ✗ Failed to create video: ${gifError.message}`);
                throw gifError;
            }
        }
        
        return { success: true, sceneName };
    } catch (error) {
        await browser.close();
        console.error(`  ✗ Error rendering ${sceneName}: ${error.message}`);
        return { success: false, sceneName, error: error.message };
    }
}

async function createHTMLPreview(sceneName) {
    const htmlPath = join(rootDir, 'outputs', `${sceneName}.html`);
    const playerPath = join(rootDir, 'src', 'player.html');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sceneName} - Matter.js Preview</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        iframe {
            border: none;
            width: 540px;
            height: 960px;
            max-width: 100%;
            max-height: 100vh;
        }
    </style>
</head>
<body>
    <iframe src="../src/player.html?scene=${sceneName}&seed=12345"></iframe>
</body>
</html>`;
    
    writeFileSync(htmlPath, htmlContent);
    console.log(`  ✓ HTML preview created: ${htmlPath}`);
}

async function main() {
    console.log('🚀 Starting Matter.js render pipeline...\n');
    const startTime = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    // Start HTTP server
    console.log('🌐 Starting HTTP server...');
    const httpServer = await createHTTPServer(rootDir);
    console.log(`✓ Server running on port ${httpServer.port}\n`);
    
    const results = [];
    
    try {
        for (const scene of SCENES) {
            const sceneStart = Date.now();
            const result = await renderScene(scene, httpServer);
            await createHTMLPreview(scene);
            const sceneTime = ((Date.now() - sceneStart) / 1000).toFixed(1);
            results.push({ ...result, time: sceneTime });
            
            // Check timeout
            if (Date.now() - startTime > timeout) {
                console.error('\n⏱ Timeout reached!');
                break;
            }
        }
    } finally {
        // Close HTTP server
        httpServer.server.close();
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Render Summary');
    console.log('='.repeat(50));
    
    let successCount = 0;
    for (const result of results) {
        const status = result.success ? '✓' : '✗';
        console.log(`${status} ${result.sceneName.padEnd(15)} ${result.time}s`);
        if (result.success) successCount++;
    }
    
    console.log(`\nTotal time: ${totalTime}s`);
    console.log(`Success: ${successCount}/${results.length}`);
    
    if (successCount < results.length) {
        console.log('\n⚠ Some scenes failed. Check errors above.');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

