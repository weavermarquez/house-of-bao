import { useEffect, useRef } from "react";
import {
  Bodies,
  Body,
  Composite,
  Constraint,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
  Vector,
  World,
} from "matter-js";

type ContainerType = "round" | "square" | "triangle";

type ContainerSpec = {
  id: string;
  type: ContainerType;
  parentId: string | null;
  initialPosition: { x: number; y: number };
  size: number;
};

type ShapePoint = {
  direction: Vector;
  scale: number;
};

type ContainerInstance = {
  id: string;
  type: ContainerType;
  center: Body;
  particles: Body[];
  constraints: Constraint[];
  restPoints: ShapePoint[];
  averageRadius: number;
  baseRadius: number;
  currentRadius: number;
  targetRadius: number;
  parentId: string | null;
};

const SANDBOX_WIDTH = 720;
const SANDBOX_HEIGHT = 520;
const WORLD_PADDING = 60;

const ROOT_ID = "container-root";

// Pre-seeded containment hierarchy for the sandbox sketch.
const CONTAINER_SPECS: ContainerSpec[] = [
  {
    id: ROOT_ID,
    type: "round",
    parentId: null,
    size: 180,
    initialPosition: { x: SANDBOX_WIDTH / 2, y: SANDBOX_HEIGHT / 2 },
  },
  {
    id: "nest-square",
    type: "square",
    parentId: ROOT_ID,
    size: 78,
    initialPosition: { x: SANDBOX_WIDTH / 2 - 80, y: SANDBOX_HEIGHT / 2 - 10 },
  },
  {
    id: "nest-round",
    type: "round",
    parentId: ROOT_ID,
    size: 72,
    initialPosition: { x: SANDBOX_WIDTH / 2 + 70, y: SANDBOX_HEIGHT / 2 - 30 },
  },
  {
    id: "nest-triangle",
    type: "triangle",
    parentId: ROOT_ID,
    size: 70,
    initialPosition: { x: SANDBOX_WIDTH / 2 + 30, y: SANDBOX_HEIGHT / 2 + 90 },
  },
  {
    id: "unit-a",
    type: "round",
    parentId: "nest-square",
    size: 38,
    initialPosition: { x: SANDBOX_WIDTH / 2 - 118, y: SANDBOX_HEIGHT / 2 - 36 },
  },
  {
    id: "unit-b",
    type: "triangle",
    parentId: "nest-square",
    size: 32,
    initialPosition: { x: SANDBOX_WIDTH / 2 - 52, y: SANDBOX_HEIGHT / 2 + 6 },
  },
  {
    id: "unit-c",
    type: "square",
    parentId: "nest-round",
    size: 34,
    initialPosition: { x: SANDBOX_WIDTH / 2 + 52, y: SANDBOX_HEIGHT / 2 - 66 },
  },
  {
    id: "unit-d",
    type: "round",
    parentId: "nest-round",
    size: 30,
    initialPosition: { x: SANDBOX_WIDTH / 2 + 104, y: SANDBOX_HEIGHT / 2 - 4 },
  },
  {
    id: "unit-e",
    type: "square",
    parentId: "nest-triangle",
    size: 30,
    initialPosition: { x: SANDBOX_WIDTH / 2 - 10, y: SANDBOX_HEIGHT / 2 + 122 },
  },
  {
    id: "unit-f",
    type: "round",
    parentId: ROOT_ID,
    size: 46,
    initialPosition: { x: SANDBOX_WIDTH / 2 - 122, y: SANDBOX_HEIGHT / 2 + 112 },
  },
];

const PARENT_REPEL_STRENGTH = 0.00032;
const SIBLING_REPEL_STRENGTH = 0.0016;
const SIBLING_ATTRACT_STRENGTH = 0.00028;
const CENTERING_STRENGTH = 0.00022;
const RADIUS_SMOOTH = 0.12;
const RADIUS_PADDING = 24;

const randomOffset = (seed: number) => Math.sin(seed * 127.1) * 0.5 + 0.5;

const createRoundPoints = (radius: number): ShapePoint[] => {
  const segments = 18;
  const points: ShapePoint[] = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const jitter =
      0.78 + randomOffset(index * 1.91 + radius * 0.03) * 0.42 +
      Math.sin(index * 2.1) * 0.08;
    const direction = Vector.normalise({
      x: Math.cos(angle),
      y: Math.sin(angle),
    });
    points.push({ direction, scale: jitter });
  }
  return points;
};

const createSquarePoints = (radius: number): ShapePoint[] => {
  const points: ShapePoint[] = [];
  const stepsPerSide = 5;
  const half = radius;
  for (let side = 0; side < 4; side += 1) {
    for (let step = 0; step < stepsPerSide; step += 1) {
      const t = step / (stepsPerSide - 1);
      let x = 0;
      let y = 0;
      switch (side) {
        case 0:
          x = -half + t * half * 2;
          y = -half;
          break;
        case 1:
          x = half;
          y = -half + t * half * 2;
          break;
        case 2:
          x = half - t * half * 2;
          y = half;
          break;
        default:
          x = -half;
          y = half - t * half * 2;
          break;
      }
      const edgeNormal =
        side % 2 === 0
          ? { x: 0, y: side === 0 ? -1 : 1 }
          : { x: side === 1 ? 1 : -1, y: 0 };
      const bias =
        (randomOffset(side * 13 + step * 3.7) - 0.5) * (radius * 0.12);
      const px = x + edgeNormal.x * bias;
      const py = y + edgeNormal.y * bias;
      const direction = Vector.normalise({ x: px, y: py });
      const length = Math.hypot(px, py) || radius;
      points.push({ direction, scale: length / radius });
    }
  }
  return points;
};

const createTrianglePoints = (radius: number): ShapePoint[] => {
  const points: ShapePoint[] = [];
  const sides = 3;
  const teethPerSide = 6;
  for (let side = 0; side < sides; side += 1) {
    const baseAngle = (Math.PI * 2 * side) / sides - Math.PI / 2;
    for (let tooth = 0; tooth < teethPerSide; tooth += 1) {
      const angle =
        baseAngle + (Math.PI * 2) / sides / (teethPerSide - 1) * tooth;
      const saw =
        ((tooth % 2 === 0 ? 1 : -1) * radius * 0.18) +
        (randomOffset(side * 11 + tooth * 5.13) - 0.5) * radius * 0.12;
      const distance = radius + saw;
      const direction = Vector.normalise({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
      points.push({ direction, scale: distance / radius });
    }
  }
  return points;
};

const createShapePoints = (type: ContainerType, radius: number) => {
  switch (type) {
    case "square":
      return createSquarePoints(radius);
    case "triangle":
      return createTrianglePoints(radius);
    default:
      return createRoundPoints(radius);
  }
};

const pointLength = (point: ShapePoint, base: number) => point.scale * base;

const createContainer = (
  engine: Engine,
  spec: ContainerSpec,
  group: number,
): ContainerInstance => {
  const restPoints = createShapePoints(spec.type, spec.size);
  const averageRadius =
    (restPoints.reduce((total, point) => total + point.scale, 0) /
      restPoints.length) *
    spec.size;

  const center = Bodies.circle(
    spec.initialPosition.x,
    spec.initialPosition.y,
    Math.max(18, spec.size * 0.18),
    {
      label: `${spec.id}-core`,
      mass: 6,
      frictionAir: 0.08,
      collisionFilter: { group },
    },
  );

  const particles: Body[] = [];
  const constraints: Constraint[] = [];

  restPoints.forEach((point, index) => {
    const distance = pointLength(point, spec.size);
    const particle = Bodies.circle(
      spec.initialPosition.x + point.direction.x * distance,
      spec.initialPosition.y + point.direction.y * distance,
      12,
      {
        label: `${spec.id}-edge-${index}`,
        mass: 0.4,
        frictionAir: 0.14,
        collisionFilter: { group },
      },
    );
    particles.push(particle);
  });

  particles.forEach((particle, index) => {
    const next = particles[(index + 1) % particles.length];
    constraints.push(
      Constraint.create({
        bodyA: particle,
        bodyB: next,
        length: Vector.magnitude(Vector.sub(particle.position, next.position)),
        stiffness: 0.18,
        damping: 0.08,
        render: { visible: false },
      }),
    );
  });

  particles.forEach((particle, index) => {
    constraints.push(
      Constraint.create({
        bodyA: particle,
        bodyB: center,
        length: pointLength(restPoints[index], spec.size),
        stiffness: 0.4,
        damping: 0.12,
        render: { visible: false },
      }),
    );
    const wrap = particles[(index + 2) % particles.length];
    constraints.push(
      Constraint.create({
        bodyA: particle,
        bodyB: wrap,
        length: Vector.magnitude(Vector.sub(particle.position, wrap.position)),
        stiffness: 0.12,
        damping: 0.08,
        render: { visible: false },
      }),
    );
  });

  const composite = Composite.create({ label: spec.id });
  Composite.add(composite, [center, ...particles, ...constraints]);
  World.add(engine.world, composite);

  return {
    id: spec.id,
    type: spec.type,
    center,
    particles,
    constraints,
    restPoints,
    averageRadius,
    baseRadius: spec.size,
    currentRadius: averageRadius,
    targetRadius: averageRadius,
    parentId: spec.parentId,
  };
};

const computeEffectiveRadius = (container: ContainerInstance) =>
  container.currentRadius + RADIUS_PADDING;

const updateContainerRadius = (container: ContainerInstance) => {
  container.currentRadius +=
    (container.targetRadius - container.currentRadius) * RADIUS_SMOOTH;
};

const applyRadialSprings = (container: ContainerInstance) => {
  const centerPosition = container.center.position;
  container.particles.forEach((particle, index) => {
    const rest = container.restPoints[index];
    const desiredDistance = rest.scale * container.currentRadius;
    const desired = {
      x: centerPosition.x + rest.direction.x * desiredDistance,
      y: centerPosition.y + rest.direction.y * desiredDistance,
    };
    const delta = Vector.sub(desired, particle.position);
    const force = Vector.mult(delta, 0.0004);
    Body.applyForce(particle, particle.position, force);
    Body.applyForce(container.center, centerPosition, Vector.mult(force, -0.08));
  });
};

// Approximate inverse-square repulsion and centering between parents and children.
const applyParentChildForces = (
  instances: Map<string, ContainerInstance>,
  relations: Map<string, string[]>,
) => {
  relations.forEach((childIds, parentId) => {
    const parent = instances.get(parentId);
    if (!parent) return;
    const parentCenter = parent.center.position;
    let requiredRadius = parent.baseRadius;

    childIds.forEach((childId) => {
      const child = instances.get(childId);
      if (!child) return;
      const vector = Vector.sub(child.center.position, parentCenter);
      const distance = Vector.magnitude(vector);
      const childRadius = computeEffectiveRadius(child);
      requiredRadius = Math.max(requiredRadius, distance + childRadius);

      parent.particles.forEach((particle) => {
        const away = Vector.sub(particle.position, child.center.position);
        const d2 = Math.max(Vector.magnitudeSquared(away), 16);
        const repel = Vector.mult(
          Vector.normalise(away),
          PARENT_REPEL_STRENGTH / d2,
        );
        Body.applyForce(particle, particle.position, repel);
        Body.applyForce(
          child.center,
          child.center.position,
          Vector.mult(repel, -0.4),
        );
      });

      if (distance > 0.0001) {
        const direction = Vector.mult(vector, 1 / distance);
        const desiredDistance =
          parent.currentRadius - child.currentRadius - 36;
        const displacement = distance - desiredDistance;
        const centeringForce = Vector.mult(
          direction,
          displacement * CENTERING_STRENGTH,
        );
        Body.applyForce(child.center, child.center.position, centeringForce);
        Body.applyForce(
          parent.center,
          parent.center.position,
          Vector.mult(centeringForce, -0.25),
        );
      }
    });

    parent.targetRadius = Math.max(requiredRadius, parent.baseRadius);
  });
};

// Blend of repulsion and linear attraction to keep siblings bundled without collapsing.
const applySiblingForces = (
  instances: Map<string, ContainerInstance>,
  relations: Map<string, string[]>,
) => {
  relations.forEach((childIds) => {
    for (let index = 0; index < childIds.length; index += 1) {
      const first = instances.get(childIds[index]);
      if (!first) continue;
      for (let j = index + 1; j < childIds.length; j += 1) {
        const second = instances.get(childIds[j]);
        if (!second) continue;
        const delta = Vector.sub(
          second.center.position,
          first.center.position,
        );
        const distance = Math.max(Vector.magnitude(delta), 0.001);
        const direction = Vector.mult(delta, 1 / distance);
        const restSpacing =
          computeEffectiveRadius(first) + computeEffectiveRadius(second);
        const attraction =
          (distance - restSpacing) * SIBLING_ATTRACT_STRENGTH;
        const repulsion = SIBLING_REPEL_STRENGTH / (distance * distance);
        const magnitude = attraction - repulsion;
        const force = Vector.mult(direction, magnitude);
        Body.applyForce(first.center, first.center.position, force);
        Body.applyForce(second.center, second.center.position, Vector.mult(force, -1));
      }
    }
  });
};

const buildRelations = (specs: ContainerSpec[]) => {
  const relations = new Map<string, string[]>();
  specs.forEach((spec) => {
    if (spec.parentId) {
      const entry = relations.get(spec.parentId) ?? [];
      entry.push(spec.id);
      relations.set(spec.parentId, entry);
    }
  });
  return relations;
};

export function ContainerSandbox() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const engine = Engine.create({ gravity: { x: 0, y: 0 } });
    const render = Render.create({
      element: containerRef.current,
      engine,
      options: {
        width: SANDBOX_WIDTH,
        height: SANDBOX_HEIGHT,
        wireframes: false,
        background: "rgba(15, 23, 42, 0.08)",
        pixelRatio: window.devicePixelRatio ?? 1,
      },
    });

    render.canvas.style.width = "100%";
    render.canvas.style.height = "100%";
    render.canvas.style.borderRadius = "18px";
    render.canvas.style.border = "1px solid rgba(148, 163, 184, 0.35)";
    render.canvas.style.boxShadow = "inset 0 0 0 1px rgba(255, 255, 255, 0.35)";

    const runner = Runner.create();
    const walls = [
      Bodies.rectangle(
        SANDBOX_WIDTH / 2,
        -WORLD_PADDING / 2,
        SANDBOX_WIDTH,
        WORLD_PADDING,
        { isStatic: true, render: { visible: false } },
      ),
      Bodies.rectangle(
        SANDBOX_WIDTH / 2,
        SANDBOX_HEIGHT + WORLD_PADDING / 2,
        SANDBOX_WIDTH,
        WORLD_PADDING,
        { isStatic: true, render: { visible: false } },
      ),
      Bodies.rectangle(
        -WORLD_PADDING / 2,
        SANDBOX_HEIGHT / 2,
        WORLD_PADDING,
        SANDBOX_HEIGHT,
        { isStatic: true, render: { visible: false } },
      ),
      Bodies.rectangle(
        SANDBOX_WIDTH + WORLD_PADDING / 2,
        SANDBOX_HEIGHT / 2,
        WORLD_PADDING,
        SANDBOX_HEIGHT,
        { isStatic: true, render: { visible: false } },
      ),
    ];
    World.add(engine.world, walls);

    const relations = buildRelations(CONTAINER_SPECS);
    const instances = new Map<string, ContainerInstance>();
    CONTAINER_SPECS.forEach((spec) => {
      const group = Body.nextGroup(true);
      const instance = createContainer(engine, spec, group);
      instances.set(spec.id, instance);
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.18,
        damping: 0.15,
      },
    });
    mouseConstraint.mouse.pixelRatio = window.devicePixelRatio ?? 1;
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    Events.on(engine, "beforeUpdate", () => {
      applyParentChildForces(instances, relations);
      applySiblingForces(instances, relations);
      instances.forEach((container) => {
        updateContainerRadius(container);
        applyRadialSprings(container);
      });
    });

    Render.run(render);
    Runner.run(runner, engine);

    return () => {
      Runner.stop(runner);
      Render.stop(render);
      render.textures = {};
      render.canvas.remove();
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  return <div className="bounding-sandbox-canvas" ref={containerRef} />;
}
