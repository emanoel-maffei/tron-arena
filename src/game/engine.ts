export type Direction = "up" | "down" | "left" | "right";

export interface Player {
  x: number;
  y: number;
  direction: Direction;
  trail: { x: number; y: number }[];
  alive: boolean;
  color: string;
  glowColor: string;
}

export interface GameState {
  players: [Player, Player];
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  gameOver: boolean;
  winner: number | null;
  scores: [number, number];
  running: boolean;
  speed: number;
}

const CELL_SIZE = 8;

export function createInitialState(canvasWidth: number, canvasHeight: number): GameState {
  const gridWidth = Math.floor(canvasWidth / CELL_SIZE);
  const gridHeight = Math.floor(canvasHeight / CELL_SIZE);

  return {
    players: [
      {
        x: Math.floor(gridWidth * 0.25),
        y: Math.floor(gridHeight / 2),
        direction: "right",
        trail: [],
        alive: true,
        color: "#00e5ff",
        glowColor: "rgba(0, 229, 255, 0.6)",
      },
      {
        x: Math.floor(gridWidth * 0.75),
        y: Math.floor(gridHeight / 2),
        direction: "left",
        trail: [],
        alive: true,
        color: "#ff6d00",
        glowColor: "rgba(255, 109, 0, 0.6)",
      },
    ],
    gridWidth,
    gridHeight,
    cellSize: CELL_SIZE,
    gameOver: false,
    winner: null,
    scores: [0, 0],
    running: false,
    speed: 60,
  };
}

export function isOpposite(current: Direction, next: Direction): boolean {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
}

export function tick(state: GameState): GameState {
  if (state.gameOver || !state.running) return state;

  const newState = { ...state, players: [{ ...state.players[0] }, { ...state.players[1] }] as [Player, Player] };

  // Add current positions to trails
  for (const player of newState.players) {
    if (!player.alive) continue;
    player.trail = [...player.trail, { x: player.x, y: player.y }];

    // Move
    switch (player.direction) {
      case "up": player.y -= 1; break;
      case "down": player.y += 1; break;
      case "left": player.x -= 1; break;
      case "right": player.x += 1; break;
    }
  }

  // Check collisions
  const allTrails = new Set<string>();
  for (const player of newState.players) {
    for (const t of player.trail) {
      allTrails.add(`${t.x},${t.y}`);
    }
  }

  for (let i = 0; i < 2; i++) {
    const p = newState.players[i];
    if (!p.alive) continue;

    // Wall collision
    if (p.x < 0 || p.x >= state.gridWidth || p.y < 0 || p.y >= state.gridHeight) {
      p.alive = false;
      continue;
    }

    // Trail collision
    if (allTrails.has(`${p.x},${p.y}`)) {
      p.alive = false;
    }
  }

  // Head-on collision
  if (newState.players[0].alive && newState.players[1].alive &&
      newState.players[0].x === newState.players[1].x && newState.players[0].y === newState.players[1].y) {
    newState.players[0].alive = false;
    newState.players[1].alive = false;
  }

  // Check game over
  const alive0 = newState.players[0].alive;
  const alive1 = newState.players[1].alive;

  if (!alive0 || !alive1) {
    newState.gameOver = true;
    if (alive0 && !alive1) {
      newState.winner = 0;
      newState.scores = [state.scores[0] + 1, state.scores[1]];
    } else if (!alive0 && alive1) {
      newState.winner = 1;
      newState.scores = [state.scores[0], state.scores[1] + 1];
    } else {
      newState.winner = null; // draw
    }
  }

  return newState;
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const { gridWidth, gridHeight, cellSize } = state;
  const w = gridWidth * cellSize;
  const h = gridHeight * cellSize;

  // Background
  ctx.fillStyle = "#060a12";
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = "rgba(0, 229, 255, 0.06)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= gridWidth; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, h);
    ctx.stroke();
  }
  for (let y = 0; y <= gridHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(w, y * cellSize);
    ctx.stroke();
  }

  // Border glow
  ctx.strokeStyle = "rgba(0, 229, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, w, h);

  // Draw trails and players
  for (const player of state.players) {
    // Trail with glow
    ctx.shadowColor = player.glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = player.color;

    for (const t of player.trail) {
      ctx.fillRect(t.x * cellSize, t.y * cellSize, cellSize, cellSize);
    }

    // Player head (brighter)
    if (player.alive) {
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
    }
  }

  ctx.shadowBlur = 0;
}
