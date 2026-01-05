// Chain and wrecking ball scene
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

    // Ceiling anchor point
    const anchorPoint = { x: width / 2, y: 100 };
    const anchor = Bodies.circle(anchorPoint.x, anchorPoint.y, 10, {
        isStatic: true
    });
    World.add(engine.world, anchor);

    // Create chain segments
    const chainLength = 20;
    const segmentRadius = 12;
    const segmentSpacing = 50;
    const chain = [];

    for (let i = 0; i < chainLength; i++) {
        const x = anchorPoint.x;
        const y = anchorPoint.y + (i + 1) * segmentSpacing;
        const segment = Bodies.circle(x, y, segmentRadius, {
            density: 0.001,
            frictionAir: 0.05
        });
        chain.push(segment);
    }

    World.add(engine.world, chain);

    // Connect chain segments with constraints
    const chainConstraints = [];
    
    // First segment connected to anchor
    const firstConstraint = Constraint.create({
        pointA: anchorPoint,
        bodyB: chain[0],
        length: segmentSpacing,
        stiffness: 0.9,
        damping: 0.01
    });
    chainConstraints.push(firstConstraint);

    // Connect remaining segments
    for (let i = 0; i < chain.length - 1; i++) {
        const constraint = Constraint.create({
            bodyA: chain[i],
            bodyB: chain[i + 1],
            length: segmentSpacing,
            stiffness: 0.9,
            damping: 0.01
        });
        chainConstraints.push(constraint);
    }

    World.add(engine.world, chainConstraints);

    // Heavy wrecking ball at the end
    const ball = Bodies.circle(
        anchorPoint.x,
        anchorPoint.y + chainLength * segmentSpacing + 100,
        80,
        {
            density: 0.005,
            frictionAir: 0.01
        }
    );
    
    // Connect ball to last chain segment
    const ballConstraint = Constraint.create({
        bodyA: chain[chain.length - 1],
        bodyB: ball,
        length: segmentSpacing,
        stiffness: 0.9
    });

    World.add(engine.world, [ball, ballConstraint]);

    // Initial push to start the swing
    Body.setVelocity(ball, { x: 5, y: 0 });

    // Stacked blocks to destroy
    const blocks = [];
    const blockWidth = 60;
    const blockHeight = 60;
    const stackHeight = 8;
    const stackX = width / 2 + 400;
    const stackY = height - 300;

    for (let col = 0; col < 3; col++) {
        for (let row = 0; row < stackHeight; row++) {
            const x = stackX + col * blockWidth;
            const y = stackY - row * blockHeight;
            const block = Bodies.rectangle(x, y, blockWidth - 2, blockHeight - 2, {
                density: 0.001,
                friction: 0.5,
                render: { fillStyle: '#A46B47' }
            });
            blocks.push(block);
        }
    }
    World.add(engine.world, blocks);

    // Ground platform
    const ground = Bodies.rectangle(width / 2, height - 100, width, 50, {
        isStatic: true
    });
    World.add(engine.world, ground);

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = width;
    render.bounds.max.y = height;
}

