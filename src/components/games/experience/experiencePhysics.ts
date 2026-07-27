import {
  Body,
  Bodies,
  Composite,
  Constraint,
  Engine,
  World
} from 'matter-js';
import type {
  ExperienceInputState,
  ExperienceObstacle,
  ExperienceVector,
  ExperienceWorld,
  PhysicsTuning
} from '../../../types';

const FIXED_STEP_MS = 1000 / 60;
const EMPTY_INPUT: ExperienceInputState = { up: false, down: false, left: false, right: false };

export interface ExperiencePhysicsSnapshot {
  position: ExperienceVector;
  velocity: ExperienceVector;
  speed: number;
  tick: number;
  obstaclePositions: Record<string, ExperienceVector>;
  carriedPosition?: ExperienceVector;
}

function createBoundaryBodies(world: ExperienceWorld) {
  const thickness = 48;
  const options = { isStatic: true, restitution: 0.05, friction: 0.2, label: 'world-boundary' };
  return [
    Bodies.rectangle(world.width / 2, -thickness / 2, world.width + thickness * 2, thickness, options),
    Bodies.rectangle(world.width / 2, world.height + thickness / 2, world.width + thickness * 2, thickness, options),
    Bodies.rectangle(-thickness / 2, world.height / 2, thickness, world.height + thickness * 2, options),
    Bodies.rectangle(world.width + thickness / 2, world.height / 2, thickness, world.height + thickness * 2, options)
  ];
}

function createObstacleBody(obstacle: ExperienceObstacle): Body {
  return Bodies.rectangle(
    obstacle.position.x,
    obstacle.position.y,
    obstacle.width,
    obstacle.height,
    {
      isStatic: true,
      restitution: obstacle.kind === 'bumper' ? 0.45 : 0.05,
      friction: 0.15,
      chamfer: obstacle.kind === 'bumper' ? { radius: Math.min(obstacle.width, obstacle.height) / 2 } : { radius: 10 },
      label: `obstacle:${obstacle.id}`
    }
  );
}

export class ExperiencePhysicsController {
  private readonly engine = Engine.create({ gravity: { x: 0, y: 0 } });
  private readonly player: Body;
  private readonly obstacles = new Map<string, { definition: ExperienceObstacle; body: Body; origin: ExperienceVector }>();
  private heldBody: Body | null = null;
  private heldConstraint: Constraint | null = null;
  private accumulator = 0;
  private elapsed = 0;
  private tick = 0;

  constructor(
    worldDefinition: ExperienceWorld,
    start: ExperienceVector,
    private readonly tuning: PhysicsTuning
  ) {
    this.player = Bodies.circle(start.x, start.y, tuning.playerRadius, {
      label: 'experience-player',
      restitution: 0.08,
      friction: 0.01,
      frictionAir: 0,
      inertia: Infinity
    });
    const bodies = [this.player, ...createBoundaryBodies(worldDefinition)];
    for (const definition of worldDefinition.obstacles) {
      const body = createObstacleBody(definition);
      this.obstacles.set(definition.id, { definition, body, origin: { ...definition.position } });
      bodies.push(body);
    }
    World.add(this.engine.world, bodies);
  }

  step(input: ExperienceInputState = EMPTY_INPUT, deltaMs = FIXED_STEP_MS): ExperiencePhysicsSnapshot {
    this.accumulator += Math.min(100, Math.max(0, deltaMs));
    while (this.accumulator >= FIXED_STEP_MS) {
      this.fixedStep(input);
      this.accumulator -= FIXED_STEP_MS;
    }
    return this.snapshot();
  }

  private fixedStep(input: ExperienceInputState) {
    this.elapsed += FIXED_STEP_MS;
    this.tick += 1;
    const x = Number(input.right) - Number(input.left);
    const y = Number(input.down) - Number(input.up);
    const magnitude = Math.hypot(x, y);
    const current = this.player.velocity;
    if (magnitude > 0) {
      const targetScale = (this.tuning.maxSpeed / 60) / magnitude;
      const target = { x: x * targetScale, y: y * targetScale };
      Body.setVelocity(this.player, {
        x: current.x + (target.x - current.x) * this.tuning.acceleration,
        y: current.y + (target.y - current.y) * this.tuning.acceleration
      });
    } else {
      Body.setVelocity(this.player, {
        x: current.x * this.tuning.braking,
        y: current.y * this.tuning.braking
      });
    }

    for (const { definition, body, origin } of this.obstacles.values()) {
      if (!definition.axis || !definition.travel || !definition.speed) continue;
      const offset = Math.sin(this.elapsed * definition.speed) * definition.travel;
      Body.setPosition(body, {
        x: origin.x + (definition.axis === 'x' ? offset : 0),
        y: origin.y + (definition.axis === 'y' ? offset : 0)
      });
    }
    Engine.update(this.engine, FIXED_STEP_MS);
  }

  attachCarriedBody(radius = 18) {
    this.releaseCarriedBody();
    this.heldBody = Bodies.circle(this.player.position.x, this.player.position.y - this.tuning.playerRadius, radius, {
      isSensor: true,
      frictionAir: 0.08,
      label: 'carried-item'
    });
    this.heldConstraint = Constraint.create({
      bodyA: this.player,
      bodyB: this.heldBody,
      pointA: { x: 0, y: -this.tuning.playerRadius * 0.72 },
      length: this.tuning.playerRadius * 0.85,
      stiffness: 0.82,
      damping: 0.2
    });
    World.add(this.engine.world, [this.heldBody, this.heldConstraint]);
  }

  releaseCarriedBody() {
    if (this.heldConstraint) Composite.remove(this.engine.world, this.heldConstraint);
    if (this.heldBody) Composite.remove(this.engine.world, this.heldBody);
    this.heldConstraint = null;
    this.heldBody = null;
  }

  stopMotion() {
    Body.setVelocity(this.player, { x: 0, y: 0 });
    Body.setAngularVelocity(this.player, 0);
    if (this.heldBody) {
      Body.setVelocity(this.heldBody, { x: 0, y: 0 });
      Body.setAngularVelocity(this.heldBody, 0);
    }
  }

  snapshot(): ExperiencePhysicsSnapshot {
    const obstaclePositions: Record<string, ExperienceVector> = {};
    for (const [id, { body }] of this.obstacles) {
      obstaclePositions[id] = { x: body.position.x, y: body.position.y };
    }
    return {
      position: { x: this.player.position.x, y: this.player.position.y },
      velocity: { x: this.player.velocity.x * 60, y: this.player.velocity.y * 60 },
      speed: this.player.speed * 60,
      tick: this.tick,
      obstaclePositions,
      carriedPosition: this.heldBody
        ? { x: this.heldBody.position.x, y: this.heldBody.position.y }
        : undefined
    };
  }

  destroy() {
    this.releaseCarriedBody();
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }
}

export { FIXED_STEP_MS };
