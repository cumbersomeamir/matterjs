// Seeded RNG (mulberry32)
function seededRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 1);
        return ((t ^ t >>> 15) >>> 0) / 4294967296;
    };
}

// Get scene name and seed from URL params
const urlParams = new URLSearchParams(window.location.search);
const sceneName = urlParams.get('scene') || 'rube';
const seed = parseInt(urlParams.get('seed') || '12345', 10);
const random = seededRandom(seed);

// Canvas setup
const canvas = document.getElementById('canvas');
const width = 1080;
const height = 1920;
canvas.width = width;
canvas.height = height;

// Matter.js modules
const { Engine, Render, Runner, Bodies, Body, World, Constraint, Mouse, MouseConstraint, Events } = Matter;

// Create engine
const engine = Engine.create();
engine.world.gravity.y = 1;
engine.world.gravity.scale = 0.001;

// Create renderer
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#0a0a0a',
        showAngleIndicator: false,
        showVelocity: false,
        pixelRatio: 1
    }
});

// Set render styles
render.options.render = {
    fillStyle: '#E6DED2',
    strokeStyle: '#C2B8A3',
    lineWidth: 2
};

// Load scene module and initialize
(async function() {
    let createSceneFn;
    try {
        const sceneModule = await import(`./scenes/${sceneName}.js`);
        createSceneFn = sceneModule.createScene;
    } catch (e) {
        console.error(`Failed to load scene: ${sceneName}`, e);
        createSceneFn = null;
    }

    // Create scene
    if (createSceneFn) {
        createSceneFn({ Engine, Render, Bodies, Body, World, Constraint, Mouse, MouseConstraint, Events }, engine, render, { random, width, height });
    }

    // Expose control to window for render script
    window.matterEngine = engine;
    window.matterRender = render;
    window.matterCanvas = canvas;
    window.Matter = Matter;
    window.sceneReady = true;
    
    // Only start render loop if not in headless mode
    // For headless rendering, render.js will control updates manually
    if (!window.headlessMode) {
        Render.run(render);
    }
})();

