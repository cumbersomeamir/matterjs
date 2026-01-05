// Soft body blob scene
export function createScene(Matter, engine, render, options) {
    const { Bodies, Body, World, Constraint } = Matter;
    const { random, width, height } = options;

    World.clear(engine.world);

    // Walls
    const wallThickness = 50;
    const walls = [
        Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true }),
        Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true }),
        Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
        Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true })
    ];
    World.add(engine.world, walls);

    // Create soft body blob using a ring of vertices
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 150;
    const segments = 16;

    const vertices = [];
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        vertices.push({ x, y });
    }

    // Create bodies for each vertex
    const blobBodies = [];
    for (let i = 0; i < vertices.length; i++) {
        const body = Bodies.circle(vertices[i].x, vertices[i].y, 15, {
            density: 0.0005,
            frictionAir: 0.02,
            friction: 0.3
        });
        blobBodies.push(body);
    }

    World.add(engine.world, blobBodies);

    // Create constraints connecting neighboring vertices (ring)
    const constraints = [];
    for (let i = 0; i < blobBodies.length; i++) {
        const next = (i + 1) % blobBodies.length;
        const constraint = Constraint.create({
            bodyA: blobBodies[i],
            bodyB: blobBodies[next],
            length: radius * 2 * Math.sin(Math.PI / segments),
            stiffness: 0.6,
            damping: 0.01
        });
        constraints.push(constraint);
    }

    // Add cross constraints for stability (skip some to avoid over-constraining)
    for (let i = 0; i < blobBodies.length; i += 2) {
        const opposite = (i + segments / 2) % blobBodies.length;
        const constraint = Constraint.create({
            bodyA: blobBodies[i],
            bodyB: blobBodies[opposite],
            length: radius * 2,
            stiffness: 0.4,
            damping: 0.01
        });
        constraints.push(constraint);
    }

    World.add(engine.world, constraints);

    // Add a heavy object on top that will squash the blob
    const squasher = Bodies.rectangle(centerX, centerY - 300, 200, 50, {
        density: 0.002,
        frictionAir: 0.01
    });
    World.add(engine.world, squasher);

    // Add platforms for the blob to bounce on
    const platform1 = Bodies.rectangle(width / 2 - 200, height - 400, 300, 30, {
        isStatic: true,
        angle: 0.2
    });
    const platform2 = Bodies.rectangle(width / 2 + 200, height - 400, 300, 30, {
        isStatic: true,
        angle: -0.2
    });
    World.add(engine.world, [platform1, platform2]);

    // Add some obstacles
    const obstacles = [];
    for (let i = 0; i < 5; i++) {
        const x = 200 + i * 200;
        const y = height - 200;
        const obstacle = Bodies.rectangle(x, y, 40, 40, {
            isStatic: true,
            angle: Math.PI / 4
        });
        obstacles.push(obstacle);
    }
    World.add(engine.world, obstacles);

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = width;
    render.bounds.max.y = height;
}

