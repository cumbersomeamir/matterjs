// The Big Bang scene - particles expanding from a central point
export function createScene(Matter, engine, render, options) {
    const { Bodies, Body, World } = Matter;
    const { random, width, height } = options;

    World.clear(engine.world);

    // Dark background for space
    render.options.background = '#000011';

    // Walls (invisible, far away to contain particles)
    const wallThickness = 100;
    const walls = [
        Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true, render: { visible: false } })
    ];
    World.add(engine.world, walls);

    // Central point (the singularity)
    const centerX = width / 2;
    const centerY = height / 2;
    const singularity = Bodies.circle(centerX, centerY, 30, {
        isStatic: true,
        render: { fillStyle: '#FFFF00', visible: true }
    });
    World.add(engine.world, singularity);

    // Create particles expanding outward
    const particleCount = 150;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 50 + random() * 30;
        const radius = 4 + random() * 8;
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Initial velocity outward
        const speed = 2 + random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        const particle = Bodies.circle(x, y, radius, {
            density: 0.0001,
            frictionAir: 0.02,
            render: { 
                fillStyle: `hsl(${random() * 60 + 200}, 80%, ${50 + random() * 30}%)`,
                visible: true 
            }
        });
        
        Body.setVelocity(particle, { x: vx, y: vy });
        particles.push(particle);
    }

    World.add(engine.world, particles);

    // Add gravity to simulate matter attraction (weak)
    engine.world.gravity.y = 0.3;
    engine.world.gravity.scale = 0.0001;

    // Periodic explosions - add more particles at intervals
    window.bigBangParticles = particles;
    window.bigBangCenter = { x: centerX, y: centerY };
    window.bigBangRandom = random;
    window.bigBangEngine = engine;
    window.bigBangMatter = Matter;

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.max.x = width;
    render.bounds.min.y = 0;
    render.bounds.max.y = height;
}

