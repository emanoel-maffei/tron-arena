export type Direction = "up" | "down" | "left" | "right";

export interface Player {
  x: number;
  y: number;
  direction: Direction;
  trail: { x: number; y: number }[];
  alive: boolean;
  color: string;
  glowColor: string;
  team: number; // 0 or 1
}

export interface GameState {
  players: Player[];
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  gameOver: boolean;
  winnerTeam: number | null;
  teamScores: [number, number];
  running: boolean;
  speed: number;
}

const CELL_SIZE = 8;

export function createInitialState(canvasWidth: number, canvasHeight: number): GameState {
  const gridWidth = Math.floor(canvasWidth / CELL_SIZE);
  const gridHeight = Math.floor(canvasHeight / CELL_SIZE);

  return {
    players: [
      // Team 0 (Cyan)
      {
        x: Math.floor(gridWidth * 0.2),
        y: Math.floor(gridHeight * 0.35),
        direction: "right",
        trail: [],
        alive: true,
        color: "#00e5ff",
        glowColor: "rgba(0, 229, 255, 0.6)",
        team: 0,
      },
      {
        x: Math.floor(gridWidth * 0.2),
        y: Math.floor(gridHeight * 0.65),
        direction: "right",
        trail: [],
        alive: true,
        color: "#00e5a0",
        glowColor: "rgba(0, 229, 160, 0.6)",
        team: 0,
      },
      // Team 1 (Orange)
      {
        x: Math.floor(gridWidth * 0.8),
        y: Math.floor(gridHeight * 0.35),
        direction: "left",
        trail: [],
        alive: true,
        color: "#ff6d00",
        glowColor: "rgba(255, 109, 0, 0.6)",
        team: 1,
      },
      {
        x: Math.floor(gridWidth * 0.8),
        y: Math.floor(gridHeight * 0.65),
        direction: "left",
        trail: [],
        alive: true,
        color: "#ff2d6d",
        glowColor: "rgba(255, 45, 109, 0.6)",
        team: 1,
      },
    ],
    gridWidth,
    gridHeight,
    cellSize: CELL_SIZE,
    gameOver: false,
    winnerTeam: null,
    teamScores: [0, 0],
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

  const newState: GameState = {
    ...state,
    players: state.players.map(p => ({ ...p, trail: [...p.trail] })),
    teamScores: [...state.teamScores] as [number, number],
  };

  // Add current positions to trails and move
  for (const player of newState.players) {
    if (!player.alive) continue;
    player.trail.push({ x: player.x, y: player.y });

    switch (player.direction) {
      case "up": player.y -= 1; break;
      case "down": player.y += 1; break;
      case "left": player.x -= 1; break;
      case "right": player.x += 1; break;
    }
  }

  // Build collision set from all trails
  const allTrails = new Set<string>();
  for (const player of newState.players) {
    for (const t of player.trail) {
      allTrails.add(`${t.x},${t.y}`);
    }
  }

  // Check collisions for each alive player
  for (const p of newState.players) {
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

  // Head-on collisions between alive players
  const alivePlayers = newState.players.filter(p => p.alive);
  for (let i = 0; i < alivePlayers.length; i++) {
    for (let j = i + 1; j < alivePlayers.length; j++) {
      if (alivePlayers[i].x === alivePlayers[j].x && alivePlayers[i].y === alivePlayers[j].y) {
        alivePlayers[i].alive = false;
        alivePlayers[j].alive = false;
      }
    }
  }

  // Check if round is over: only one team (or zero) has alive players
  const team0Alive = newState.players.some(p => p.team === 0 && p.alive);
  const team1Alive = newState.players.some(p => p.team === 1 && p.alive);

  if (!team0Alive || !team1Alive) {
    newState.gameOver = true;
    if (team0Alive && !team1Alive) {
      newState.winnerTeam = 0;
      newState.teamScores[0]++;
    } else if (!team0Alive && team1Alive) {
      newState.winnerTeam = 1;
      newState.teamScores[1]++;
    } else {
      newState.winnerTeam = null; // draw
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
    ctx.shadowColor = player.glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = player.alive ? player.color : `${player.color}44`;

    for (const t of player.trail) {
      ctx.fillRect(t.x * cellSize, t.y * cellSize, cellSize, cellSize);
    }

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
