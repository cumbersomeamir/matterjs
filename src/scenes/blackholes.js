// Two black holes colliding scene
export function createScene(Matter, engine, render, options) {
    const { Bodies, Body, World } = Matter;
    const { random, width, height } = options;

    World.clear(engine.world);

    // Space background
    render.options.background = '#000033';

    // Disable default gravity - we'll simulate black hole gravity manually
    engine.world.gravity.y = 0;
    engine.world.gravity.scale = 0;

    // Two black holes
    const bh1X = width * 0.35;
    const bh1Y = height / 2;
    const bh2X = width * 0.65;
    const bh2Y = height / 2;

    const blackHole1 = Bodies.circle(bh1X, bh1Y, 80, {
        isStatic: false,
        density: 0.01,
        frictionAir: 0,
        render: { 
            fillStyle: '#000000',
            strokeStyle: '#FF00FF',
            lineWidth: 3
        }
    });

    const blackHole2 = Bodies.circle(bh2X, bh2Y, 80, {
        isStatic: false,
        density: 0.01,
        frictionAir: 0,
        render: { 
            fillStyle: '#000000',
            strokeStyle: '#00FFFF',
            lineWidth: 3
        }
    });

    // Give them initial orbital velocities
    Body.setVelocity(blackHole1, { x: 0, y: 1.5 });
    Body.setVelocity(blackHole2, { x: 0, y: -1.5 });

    World.add(engine.world, [blackHole1, blackHole2]);

    // Create particles/stars around black holes
    const particleCount = 200;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const angle = random() * Math.PI * 2;
        const distance = 100 + random() * 400;
        const side = random() < 0.5 ? 0 : 1;
        
        const centerX = side === 0 ? bh1X : bh2X;
        const centerY = side === 0 ? bh1Y : bh2Y;
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Orbital velocity
        const speed = 3 + random() * 2;
        const perpAngle = angle + Math.PI / 2;
        const vx = Math.cos(perpAngle) * speed;
        const vy = Math.sin(perpAngle) * speed;
        
        const particle = Bodies.circle(x, y, 3 + random() * 5, {
            density: 0.0001,
            frictionAir: 0,
            render: { 
                fillStyle: `hsl(${random() * 60 + 180}, 100%, ${50 + random() * 50}%)`,
                visible: true 
            }
        });
        
        Body.setVelocity(particle, { x: vx, y: vy });
        particles.push(particle);
    }

    World.add(engine.world, particles);

    // Store references for custom gravity simulation
    window.blackHole1 = blackHole1;
    window.blackHole2 = blackHole2;
    window.blackHoleParticles = particles;

    // Apply custom gravity using Events
    const { Events } = Matter;
    Events.on(engine, 'beforeUpdate', () => {
        const G = 0.08; // Gravitational constant
        
        particles.forEach(particle => {
            // Gravity from black hole 1
            const dx1 = blackHole1.position.x - particle.position.x;
            const dy1 = blackHole1.position.y - particle.position.y;
            const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            if (dist1 > 5) {
                const force1 = G * 1000 / (dist1 * dist1 + 100); // Add small offset to prevent infinite force
                Body.applyForce(particle, particle.position, {
                    x: (dx1 / dist1) * force1,
                    y: (dy1 / dist1) * force1
                });
            }

            // Gravity from black hole 2
            const dx2 = blackHole2.position.x - particle.position.x;
            const dy2 = blackHole2.position.y - particle.position.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist2 > 5) {
                const force2 = G * 1000 / (dist2 * dist2 + 100);
                Body.applyForce(particle, particle.position, {
                    x: (dx2 / dist2) * force2,
                    y: (dy2 / dist2) * force2
                });
            }
        });

        // Black holes attract each other
        const dx = blackHole2.position.x - blackHole1.position.x;
        const dy = blackHole2.position.y - blackHole1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 15) {
            const force = G * 5000 / (dist * dist + 400);
            Body.applyForce(blackHole1, blackHole1.position, {
                x: (dx / dist) * force,
                y: (dy / dist) * force
            });
            Body.applyForce(blackHole2, blackHole2.position, {
                x: -(dx / dist) * force,
                y: -(dy / dist) * force
            });
        }
    });

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.max.x = width;
    render.bounds.min.y = 0;
    render.bounds.max.y = height;
}

