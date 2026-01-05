// Evolution of humans scene - progression through stages
export function createScene(Matter, engine, render, options) {
    const { Bodies, Body, World } = Matter;
    const { random, width, height } = options;

    World.clear(engine.world);

    // Background
    render.options.background = '#2d5016';

    // Ground
    const ground = Bodies.rectangle(width / 2, height - 50, width, 100, {
        isStatic: true,
        render: { fillStyle: '#8B4513' }
    });
    World.add(engine.world, ground);

    // Create evolutionary stages from left to right
    const stages = [
        { name: 'Ape', color: '#8B4513', size: 60 },
        { name: 'Hominid', color: '#CD853F', size: 55 },
        { name: 'Early Human', color: '#D2B48C', size: 50 },
        { name: 'Modern Human', color: '#F4A460', size: 45 }
    ];

    const stageSpacing = width / (stages.length + 1);
    const groundY = height - 150;
    const figures = [];

    stages.forEach((stage, index) => {
        const x = stageSpacing * (index + 1);
        
        // Body (main circle)
        const body = Bodies.circle(x, groundY - stage.size, stage.size * 0.6, {
            isStatic: true,
            density: 0.002,
            frictionAir: 0.1,
            render: { fillStyle: stage.color }
        });
        figures.push(body);

        // Head
        const head = Bodies.circle(x, groundY - stage.size - stage.size * 0.4, stage.size * 0.3, {
            isStatic: true,
            density: 0.001,
            frictionAir: 0.1,
            render: { fillStyle: stage.color }
        });
        figures.push(head);

        // Arms (for later stages)
        if (index >= 1) {
            const arm1 = Bodies.rectangle(x - stage.size * 0.4, groundY - stage.size * 0.7, stage.size * 0.3, stage.size * 0.8, {
                isStatic: true,
                density: 0.001,
                frictionAir: 0.1,
                angle: 0.3,
                render: { fillStyle: stage.color }
            });
            const arm2 = Bodies.rectangle(x + stage.size * 0.4, groundY - stage.size * 0.7, stage.size * 0.3, stage.size * 0.8, {
                isStatic: true,
                density: 0.001,
                frictionAir: 0.1,
                angle: -0.3,
                render: { fillStyle: stage.color }
            });
            figures.push(arm1, arm2);
        }

        // Legs
        const leg1 = Bodies.rectangle(x - stage.size * 0.2, groundY - stage.size * 0.3, stage.size * 0.25, stage.size * 0.9, {
            isStatic: true,
            density: 0.001,
            frictionAir: 0.1,
            render: { fillStyle: stage.color }
        });
        const leg2 = Bodies.rectangle(x + stage.size * 0.2, groundY - stage.size * 0.3, stage.size * 0.25, stage.size * 0.9, {
            isStatic: true,
            density: 0.001,
            frictionAir: 0.1,
            render: { fillStyle: stage.color }
        });
        figures.push(leg1, leg2);
    });

    World.add(engine.world, figures);

    // Add timeline arrow
    const arrowStart = Bodies.rectangle(100, height - 100, width - 250, 10, {
        isStatic: true,
        angle: 0,
        render: { fillStyle: '#FFD700', visible: true }
    });
    const arrowHead = Bodies.rectangle(width - 100, height - 100, 30, 30, {
        isStatic: true,
        angle: Math.PI / 4,
        render: { fillStyle: '#FFD700', visible: true }
    });
    World.add(engine.world, [arrowStart, arrowHead]);

    // Add floating particles/dust to show progression
    const particles = [];
    for (let i = 0; i < 50; i++) {
        const x = 50 + random() * (width - 100);
        const y = 100 + random() * (height - 300);
        const particle = Bodies.circle(x, y, 2 + random() * 3, {
            density: 0.0001,
            frictionAir: 0.1,
            render: { fillStyle: '#FFD700', visible: true }
        });
        Body.setVelocity(particle, { x: (random() - 0.5) * 2, y: (random() - 0.5) * 2 });
        particles.push(particle);
    }
    World.add(engine.world, particles);

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.max.x = width;
    render.bounds.min.y = 0;
    render.bounds.max.y = height;
}
