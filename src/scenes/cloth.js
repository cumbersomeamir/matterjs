// Cloth simulation scene
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

    // Cloth parameters
    const clothWidth = 600;
    const clothHeight = 800;
    const cols = 20;
    const rows = 30;
    const spacing = clothWidth / cols;

    // Create cloth grid
    const cloth = [];
    const constraints = [];

    for (let row = 0; row < rows; row++) {
        cloth[row] = [];
        for (let col = 0; col < cols; col++) {
            const x = (width - clothWidth) / 2 + col * spacing;
            const y = 200 + row * spacing;
            const point = Bodies.circle(x, y, 8, {
                density: 0.0003,
                frictionAir: 0.05
            });
            cloth[row][col] = point;

            // Pin top row
            if (row === 0) {
                Body.setStatic(point, true);
            }
        }
    }

    // Add all points
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            World.add(engine.world, cloth[row][col]);
        }
    }

    // Create constraints (horizontal, vertical, and diagonal)
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Right neighbor
            if (col < cols - 1) {
                const constraint = Constraint.create({
                    bodyA: cloth[row][col],
                    bodyB: cloth[row][col + 1],
                    length: spacing,
                    stiffness: 0.9,
                    render: { visible: true }
                });
                constraints.push(constraint);
            }
            // Bottom neighbor
            if (row < rows - 1) {
                const constraint = Constraint.create({
                    bodyA: cloth[row][col],
                    bodyB: cloth[row + 1][col],
                    length: spacing,
                    stiffness: 0.9,
                    render: { visible: true }
                });
                constraints.push(constraint);
            }
            // Diagonal right-bottom
            if (row < rows - 1 && col < cols - 1) {
                const constraint = Constraint.create({
                    bodyA: cloth[row][col],
                    bodyB: cloth[row + 1][col + 1],
                    length: spacing * Math.sqrt(2),
                    stiffness: 0.7,
                    render: { visible: true }
                });
                constraints.push(constraint);
            }
            // Diagonal left-bottom
            if (row < rows - 1 && col > 0) {
                const constraint = Constraint.create({
                    bodyA: cloth[row][col],
                    bodyB: cloth[row + 1][col - 1],
                    length: spacing * Math.sqrt(2),
                    stiffness: 0.7,
                    render: { visible: true }
                });
                constraints.push(constraint);
            }
        }
    }

    World.add(engine.world, constraints);

    // Add a ball that drops on the cloth
    const ball = Bodies.circle(width / 2, 100, 60, {
        density: 0.002,
        frictionAir: 0.01
    });
    World.add(engine.world, ball);

    // Store constraints for tear simulation
    window.clothConstraints = constraints;
    window.clothPoints = cloth;

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = width;
    render.bounds.max.y = height;
}

