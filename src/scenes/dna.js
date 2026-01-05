// DNA Replication scene - double helix strands separating and duplicating
export function createScene(Matter, engine, render, options) {
    const { Bodies, Body, World, Constraint } = Matter;
    const { random, width, height } = options;

    World.clear(engine.world);

    // Background
    render.options.background = '#1a1a2e';

    // Walls
    const wallThickness = 50;
    const walls = [
        Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true, render: { visible: false } })
    ];
    World.add(engine.world, walls);

    // DNA parameters
    const centerX = width / 2;
    const helixHeight = height * 0.7;
    const helixStartY = height * 0.15;
    const segments = 20;
    const segmentSpacing = helixHeight / segments;
    const helixRadius = 150;
    const basePairSpacing = 30;

    // Create left and right strands
    const leftStrand = [];
    const rightStrand = [];
    const basePairs = [];

    for (let i = 0; i < segments; i++) {
        const y = helixStartY + i * segmentSpacing;
        const angle = (i / segments) * Math.PI * 8; // Multiple rotations
        
        // Left strand
        const leftX = centerX - Math.cos(angle) * helixRadius;
        const leftY = y + Math.sin(angle) * helixRadius * 0.3;
        const leftNode = Bodies.circle(leftX, leftY, 12, {
            density: 0.001,
            frictionAir: 0.1,
            render: { fillStyle: '#4169E1' }
        });
        leftStrand.push(leftNode);

        // Right strand
        const rightX = centerX + Math.cos(angle) * helixRadius;
        const rightY = y - Math.sin(angle) * helixRadius * 0.3;
        const rightNode = Bodies.circle(rightX, rightY, 12, {
            density: 0.001,
            frictionAir: 0.1,
            render: { fillStyle: '#FF6347' }
        });
        rightStrand.push(rightNode);

        // Base pair (constraint between strands)
        const basePair = Constraint.create({
            bodyA: leftNode,
            bodyB: rightNode,
            length: helixRadius * 2,
            stiffness: 0.7,
            render: { 
                visible: true,
                strokeStyle: '#00FF00',
                lineWidth: 3
            }
        });
        basePairs.push(basePair);
    }

    // Add constraints along each strand
    const leftConstraints = [];
    const rightConstraints = [];

    for (let i = 0; i < segments - 1; i++) {
        const leftConstraint = Constraint.create({
            bodyA: leftStrand[i],
            bodyB: leftStrand[i + 1],
            length: segmentSpacing * 0.8,
            stiffness: 0.8,
            render: { visible: true, strokeStyle: '#4169E1' }
        });
        leftConstraints.push(leftConstraint);

        const rightConstraint = Constraint.create({
            bodyA: rightStrand[i],
            bodyB: rightStrand[i + 1],
            length: segmentSpacing * 0.8,
            stiffness: 0.8,
            render: { visible: true, strokeStyle: '#FF6347' }
        });
        rightConstraints.push(rightConstraint);
    }

    World.add(engine.world, [...leftStrand, ...rightStrand]);
    World.add(engine.world, [...basePairs, ...leftConstraints, ...rightConstraints]);

    // Add force to separate strands (simulating replication)
    // Apply horizontal forces to pull strands apart
    setTimeout(() => {
        leftStrand.forEach((node, i) => {
            Body.applyForce(node, node.position, { x: -0.02, y: 0 });
        });
        rightStrand.forEach((node, i) => {
            Body.applyForce(node, node.position, { x: 0.02, y: 0 });
        });
    }, 1000);

    // Store references for animation
    window.dnaBasePairs = basePairs;
    window.dnaLeftStrand = leftStrand;
    window.dnaRightStrand = rightStrand;

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.max.x = width;
    render.bounds.min.y = 0;
    render.bounds.max.y = height;
}

