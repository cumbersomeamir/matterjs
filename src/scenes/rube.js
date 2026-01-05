// Rube Goldberg machine scene
export function createScene(Matter, engine, render, options) {
    const { Bodies, Body, World, Constraint } = Matter;
    const { random, width, height } = options;

    // Clear world
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

    // Initial ramp (top left)
    const ramp1 = Bodies.rectangle(200, 400, 300, 30, {
        isStatic: true,
        angle: -0.3
    });
    World.add(engine.world, ramp1);

    // Starting ball
    const ball = Bodies.circle(150, 300, 25, {
        density: 0.001,
        frictionAir: 0.01
    });
    World.add(engine.world, ball);

    // Second ramp (middle)
    const ramp2 = Bodies.rectangle(500, 700, 250, 30, {
        isStatic: true,
        angle: 0.25
    });
    World.add(engine.world, ramp2);

    // Dominoes
    const dominoes = [];
    for (let i = 0; i < 12; i++) {
        const x = 700 + i * 40;
        const y = 800 + random() * 20 - 10;
        const domino = Bodies.rectangle(x, y, 10, 60, {
            density: 0.0005,
            frictionAir: 0.02
        });
        dominoes.push(domino);
    }
    World.add(engine.world, dominoes);

    // Pendulum pivot point
    const pendulumPivot = { x: 800, y: 600 };
    const pendulumBob = Bodies.circle(pendulumPivot.x, pendulumPivot.y + 150, 30, {
        density: 0.002
    });
    const pendulumConstraint = Constraint.create({
        pointA: pendulumPivot,
        bodyB: pendulumBob,
        length: 150,
        stiffness: 0.8
    });
    World.add(engine.world, [pendulumBob, pendulumConstraint]);

    // Lever
    const leverPivot = { x: 900, y: 1000 };
    const lever = Bodies.rectangle(leverPivot.x, leverPivot.y, 200, 20, {
        density: 0.001,
        frictionAir: 0.05
    });
    const leverConstraint = Constraint.create({
        pointA: leverPivot,
        bodyB: lever,
        stiffness: 1
    });
    World.add(engine.world, [lever, leverConstraint]);

    // Gate (blocked by lever)
    const gate = Bodies.rectangle(600, 1200, 300, 30, {
        isStatic: true,
        angle: Math.PI / 2
    });
    World.add(engine.world, gate);

    // Final stacked blocks
    const blocks = [];
    for (let i = 0; i < 4; i++) {
        const block = Bodies.rectangle(400 + random() * 40 - 20, 1500 + i * 80, 80, 80, {
            density: 0.001
        });
        blocks.push(block);
    }
    World.add(engine.world, blocks);

    // Trigger ball for gate
    const triggerBall = Bodies.circle(850, 1050, 20, {
        density: 0.001,
        frictionAir: 0.01
    });
    World.add(engine.world, triggerBall);

    // Final target
    const target = Bodies.rectangle(400, 1700, 100, 100, {
        isStatic: true,
        render: { fillStyle: '#A46B47' }
    });
    World.add(engine.world, target);

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = width;
    render.bounds.max.y = height;
}

