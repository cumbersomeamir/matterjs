// Neural Network scene - nodes connected by synapses, activation propagation
export function createScene(Matter, engine, render, options) {
    const { Bodies, Body, World, Constraint } = Matter;
    const { random, width, height } = options;

    World.clear(engine.world);

    // Background
    render.options.background = '#0a0a1a';

    // Walls (invisible, far)
    const wallThickness = 100;
    const walls = [
        Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true, render: { visible: false } }),
        Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true, render: { visible: false } })
    ];
    World.add(engine.world, walls);

    // Create neural network layers
    const layers = [8, 12, 10, 6]; // Input, Hidden1, Hidden2, Output
    const layerSpacing = width / (layers.length + 1);
    const nodes = [];
    const connections = [];
    const nodeRadius = 15;

    // Create nodes for each layer
    layers.forEach((nodeCount, layerIndex) => {
        const layerNodes = [];
        const layerX = layerSpacing * (layerIndex + 1);
        const verticalSpacing = height / (nodeCount + 1);

        for (let i = 0; i < nodeCount; i++) {
            const y = verticalSpacing * (i + 1);
            const node = Bodies.circle(layerX, y, nodeRadius, {
                density: 0.0005,
                frictionAir: 0.05,
                render: { 
                    fillStyle: '#4A90E2',
                    visible: true
                }
            });
            layerNodes.push(node);
            nodes.push(node);
        }

        World.add(engine.world, layerNodes);
    });

    // Create connections between layers
    let layerStart = 0;
    layers.forEach((nodeCount, layerIndex) => {
        if (layerIndex === layers.length - 1) return; // Skip last layer

        const nextLayerStart = layerStart + nodeCount;
        const nextNodeCount = layers[layerIndex + 1];

        // Connect each node in current layer to nodes in next layer
        for (let i = 0; i < nodeCount; i++) {
            const fromNode = nodes[layerStart + i];
            
            // Connect to multiple nodes in next layer (not all, for visual clarity)
            const connectionsPerNode = Math.ceil(nextNodeCount / 2);
            for (let j = 0; j < connectionsPerNode; j++) {
                const targetIndex = Math.floor((j / connectionsPerNode) * nextNodeCount);
                const toNode = nodes[nextLayerStart + targetIndex];
                
                const connection = Constraint.create({
                    bodyA: fromNode,
                    bodyB: toNode,
                    length: layerSpacing * 0.8,
                    stiffness: 0.1,
                    render: {
                        visible: true,
                        strokeStyle: '#00FF00',
                        lineWidth: 1,
                        opacity: 0.3
                    }
                });
                connections.push(connection);
            }
        }

        layerStart += nodeCount;
    });

    World.add(engine.world, connections);

    // Add input signals (pulses from input layer)
    const inputNodes = nodes.slice(0, layers[0]);
    window.neuralNetworkNodes = nodes;
    window.neuralNetworkConnections = connections;
    window.neuralNetworkLayers = layers;
    window.neuralNetworkLayerStart = 0;

    // Periodic activation pulses
    setInterval(() => {
        // Activate random input nodes
        const randomInput = inputNodes[Math.floor(random() * inputNodes.length)];
        if (randomInput) {
            randomInput.render.fillStyle = '#FFD700';
            setTimeout(() => {
                if (randomInput.render) {
                    randomInput.render.fillStyle = '#4A90E2';
                }
            }, 200);
            
            // Add small impulse
            Body.applyForce(randomInput, randomInput.position, {
                x: (random() - 0.5) * 0.01,
                y: (random() - 0.5) * 0.01
            });
        }
    }, 500);

    // Make output layer nodes larger
    const outputLayerStart = nodes.length - layers[layers.length - 1];
    for (let i = outputLayerStart; i < nodes.length; i++) {
        Body.scale(nodes[i], 1.3, 1.3);
        nodes[i].render.fillStyle = '#FF6347';
    }

    // Set camera view
    render.options.hasBounds = true;
    render.bounds.min.x = 0;
    render.bounds.max.x = width;
    render.bounds.min.y = 0;
    render.bounds.max.y = height;
}

