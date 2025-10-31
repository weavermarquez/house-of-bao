import React, { useLayoutEffect, useRef } from 'react';
import Matter from 'matter-js';

const PhysicsSandbox: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;

    const engine = Matter.Engine.create();
    const world = engine.world;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#f0f0f0',
        showVelocity: false,
        showAngleIndicator: false,
      },
    });

    // Add gravity
    world.gravity.y = 0.1;

    // Add boundaries
    const boundaries = [
      Matter.Bodies.rectangle(400, 0, 800, 20, { isStatic: true }),
      Matter.Bodies.rectangle(400, 600, 800, 20, { isStatic: true }),
      Matter.Bodies.rectangle(0, 300, 20, 600, { isStatic: true }),
      Matter.Bodies.rectangle(800, 300, 20, 600, { isStatic: true }),
    ];
    Matter.World.add(world, boundaries);

    // Create round soft body (circular arrangement)
    const roundBodies: Matter.Body[] = [];
    const roundConstraints: Matter.Constraint[] = [];
    const centerX = 150, centerY = 150;
    const radius = 50;
    const numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      roundBodies.push(Matter.Bodies.circle(x, y, 10, { render: { fillStyle: '#fde68a' } }));
    }
    // Connect each to next and skip one for organic feel
    for (let i = 0; i < numParticles; i++) {
      const next = (i + 1) % numParticles;
      roundConstraints.push(Matter.Constraint.create({
        bodyA: roundBodies[i],
        bodyB: roundBodies[next],
        stiffness: 0.01,
      }));
      const skip = (i + 2) % numParticles;
      roundConstraints.push(Matter.Constraint.create({
        bodyA: roundBodies[i],
        bodyB: roundBodies[skip],
        stiffness: 0.005,
      }));
    }
    const roundBody = Matter.Composite.create({ bodies: roundBodies, constraints: roundConstraints });

    // Square: 4x4 grid, higher stiffness for sharp shape
    const squareBody = Matter.Composites.softBody(400, 150, 4, 4, 0, 0, false, 15, {
      render: { fillStyle: '#bfdbfe' },
    }, {});
    squareBody.constraints.forEach((constraint: any) => {
      constraint.stiffness = 0.1;
    });

    // Triangle: triangular arrangement
    const triangleBodies: Matter.Body[] = [];
    const triangleConstraints: Matter.Constraint[] = [];
    const triCenterX = 650, triCenterY = 150;
    const triRows = 4;
    let bodyIndex = 0;
    for (let row = 0; row < triRows; row++) {
      const numInRow = row + 1;
      for (let col = 0; col < numInRow; col++) {
        const x = triCenterX + (col - row / 2) * 25;
        const y = triCenterY + row * 25;
        triangleBodies.push(Matter.Bodies.circle(x, y, 12, { render: { fillStyle: '#e9d5ff' } }));
        bodyIndex++;
      }
    }
    // Connect in triangular pattern
    bodyIndex = 0;
    for (let row = 0; row < triRows; row++) {
      const numInRow = row + 1;
      for (let col = 0; col < numInRow; col++) {
        const current = bodyIndex + col;
        // Connect to right
        if (col < numInRow - 1) {
          triangleConstraints.push(Matter.Constraint.create({
            bodyA: triangleBodies[current],
            bodyB: triangleBodies[current + 1],
            stiffness: 0.03,
          }));
        }
        // Connect to below left
        if (row < triRows - 1) {
          const belowLeft = bodyIndex + numInRow + col;
          if (belowLeft < triangleBodies.length) {
            triangleConstraints.push(Matter.Constraint.create({
              bodyA: triangleBodies[current],
              bodyB: triangleBodies[belowLeft],
              stiffness: 0.03,
            }));
          }
          // Connect to below right
          const belowRight = bodyIndex + numInRow + col + 1;
          if (belowRight < triangleBodies.length) {
            triangleConstraints.push(Matter.Constraint.create({
              bodyA: triangleBodies[current],
              bodyB: triangleBodies[belowRight],
              stiffness: 0.03,
            }));
          }
        }
      }
      bodyIndex += numInRow;
    }
    const triangleBody = Matter.Composite.create({ bodies: triangleBodies, constraints: triangleConstraints });

    // Add bodies to world
    Matter.World.add(world, [roundBody, squareBody, triangleBody]);

    // Add mouse control
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: true },
      },
    });
    Matter.World.add(world, mouseConstraint);

    // Enable touch events
    render.canvas.addEventListener('touchstart', (e: TouchEvent) => e.preventDefault());
    render.canvas.addEventListener('touchmove', (e: TouchEvent) => e.preventDefault());

    // Run the engine and renderer
    Matter.Engine.run(engine);
    Matter.Render.run(render);

    // Cleanup
    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default PhysicsSandbox;
