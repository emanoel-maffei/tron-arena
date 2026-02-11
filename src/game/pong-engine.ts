export interface PongState {
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  paddles: [Paddle, Paddle];
  scores: [number, number];
  canvasWidth: number;
  canvasHeight: number;
  running: boolean;
  gameOver: boolean;
  winner: number | null;
  winScore: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
  color: string;
  glowColor: string;
}

const PADDLE_SPEED = 7;
const BALL_SPEED = 5;
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_R = 8;
const WIN_SCORE = 7;

export function createPongState(w: number, h: number): PongState {
  return {
    ball: { x: w / 2, y: h / 2, vx: BALL_SPEED, vy: BALL_SPEED * 0.6, radius: BALL_R },
    paddles: [
      { x: 30, y: h / 2 - PADDLE_H / 2, width: PADDLE_W, height: PADDLE_H, dy: 0, color: "#00e5ff", glowColor: "rgba(0,229,255,0.6)" },
      { x: w - 30 - PADDLE_W, y: h / 2 - PADDLE_H / 2, width: PADDLE_W, height: PADDLE_H, dy: 0, color: "#ff6d00", glowColor: "rgba(255,109,0,0.6)" },
    ],
    scores: [0, 0],
    canvasWidth: w,
    canvasHeight: h,
    running: false,
    gameOver: false,
    winner: null,
    winScore: WIN_SCORE,
  };
}

export function tickPong(state: PongState): PongState {
  if (!state.running || state.gameOver) return state;

  const s = { ...state, ball: { ...state.ball }, paddles: [{ ...state.paddles[0] }, { ...state.paddles[1] }] as [Paddle, Paddle], scores: [...state.scores] as [number, number] };
  const { ball, paddles, canvasWidth: w, canvasHeight: h } = s;

  // Move paddles
  for (const p of paddles) {
    p.y += p.dy * PADDLE_SPEED;
    p.y = Math.max(0, Math.min(h - p.height, p.y));
  }

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top/bottom bounce
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= h) {
    ball.vy *= -1;
    ball.y = ball.y - ball.radius <= 0 ? ball.radius : h - ball.radius;
  }

  // Paddle collision
  for (let i = 0; i < 2; i++) {
    const p = paddles[i];
    if (
      ball.x - ball.radius <= p.x + p.width &&
      ball.x + ball.radius >= p.x &&
      ball.y >= p.y &&
      ball.y <= p.y + p.height
    ) {
      ball.vx = Math.abs(ball.vx) * (i === 0 ? 1 : -1);
      // Add spin based on where it hit the paddle
      const hitPos = (ball.y - p.y) / p.height - 0.5;
      ball.vy = hitPos * BALL_SPEED * 1.5;
      // Speed up slightly
      ball.vx *= 1.03;
      ball.x = i === 0 ? p.x + p.width + ball.radius : p.x - ball.radius;
    }
  }

  // Score
  if (ball.x < 0) {
    s.scores[1]++;
    resetBall(ball, w, h, 1);
  } else if (ball.x > w) {
    s.scores[0]++;
    resetBall(ball, w, h, -1);
  }

  // Win check
  for (let i = 0; i < 2; i++) {
    if (s.scores[i] >= s.winScore) {
      s.gameOver = true;
      s.winner = i;
      s.running = false;
    }
  }

  return s;
}

function resetBall(ball: PongState["ball"], w: number, h: number, dirX: number) {
  ball.x = w / 2;
  ball.y = h / 2;
  ball.vx = BALL_SPEED * dirX;
  ball.vy = (Math.random() - 0.5) * BALL_SPEED;
}

export function drawPong(ctx: CanvasRenderingContext2D, state: PongState) {
  const { canvasWidth: w, canvasHeight: h, ball, paddles } = state;

  // Background
  ctx.fillStyle = "#060a12";
  ctx.fillRect(0, 0, w, h);

  // Center line
  ctx.setLineDash([8, 12]);
  ctx.strokeStyle = "rgba(0,229,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Border
  ctx.strokeStyle = "rgba(0,229,255,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, w, h);

  // Paddles
  for (const p of paddles) {
    ctx.shadowColor = p.glowColor;
    ctx.shadowBlur = 15;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }

  // Ball
  ctx.shadowColor = "rgba(255,255,255,0.8)";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Scores
  ctx.font = "bold 48px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = paddles[0].color;
  ctx.shadowColor = paddles[0].glowColor;
  ctx.shadowBlur = 10;
  ctx.fillText(String(state.scores[0]), w / 4, 60);
  ctx.fillStyle = paddles[1].color;
  ctx.shadowColor = paddles[1].glowColor;
  ctx.fillText(String(state.scores[1]), (3 * w) / 4, 60);
  ctx.shadowBlur = 0;
}
