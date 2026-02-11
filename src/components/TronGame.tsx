import { useEffect, useRef, useCallback, useState } from "react";
import { createInitialState, tick, drawGame, isOpposite, GameState, Direction } from "@/game/engine";

const TronGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const frameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const inputQueueRef = useRef<{ player: number; dir: Direction }[]>([]);
  const [uiState, setUiState] = useState<{ gameOver: boolean; winner: number | null; scores: [number, number]; running: boolean }>({
    gameOver: false,
    winner: null,
    scores: [0, 0],
    running: false,
  });

  const getCanvasSize = useCallback(() => {
    const w = Math.floor(window.innerWidth * 0.95);
    const h = Math.floor(window.innerHeight * 0.8);
    return { width: w - (w % 8), height: h - (h % 8) };
  }, []);

  const resetGame = useCallback((keepScores = false) => {
    const { width, height } = getCanvasSize();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
    const newState = createInitialState(width, height);
    if (keepScores && stateRef.current) {
      newState.scores = stateRef.current.scores;
    }
    newState.running = true;
    stateRef.current = newState;
    inputQueueRef.current = [];
    setUiState({ gameOver: false, winner: null, scores: newState.scores, running: true });
  }, [getCanvasSize]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    const state = stateRef.current;
    if (!state) return;

    // Restart on space
    if (e.code === "Space") {
      if (state.gameOver) {
        resetGame(true);
      } else if (!state.running) {
        stateRef.current = { ...state, running: true };
        setUiState(prev => ({ ...prev, running: true }));
      }
      e.preventDefault();
      return;
    }

    // Player 1: WASD
    const p1Map: Record<string, Direction> = { KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right" };
    // Player 2: Arrows
    const p2Map: Record<string, Direction> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

    if (p1Map[e.code]) {
      e.preventDefault();
      const dir = p1Map[e.code];
      if (!isOpposite(state.players[0].direction, dir)) {
        inputQueueRef.current.push({ player: 0, dir });
      }
    }
    if (p2Map[e.code]) {
      e.preventDefault();
      const dir = p2Map[e.code];
      if (!isOpposite(state.players[1].direction, dir)) {
        inputQueueRef.current.push({ player: 1, dir });
      }
    }
  }, [resetGame]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    const { width, height } = getCanvasSize();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
    stateRef.current = createInitialState(width, height);
    setUiState({ gameOver: false, winner: null, scores: [0, 0], running: false });

    const gameLoop = (timestamp: number) => {
      const state = stateRef.current;
      if (!state) { frameRef.current = requestAnimationFrame(gameLoop); return; }

      const interval = 1000 / state.speed;
      if (timestamp - lastTickRef.current >= interval) {
        lastTickRef.current = timestamp;

        // Process inputs
        for (const input of inputQueueRef.current) {
          const p = state.players[input.player];
          if (!isOpposite(p.direction, input.dir)) {
            p.direction = input.dir;
          }
        }
        inputQueueRef.current = [];

        const newState = tick(state);
        stateRef.current = newState;

        if (newState.gameOver !== state.gameOver || newState.winner !== state.winner) {
          setUiState({ gameOver: newState.gameOver, winner: newState.winner, scores: newState.scores, running: newState.running });
        }
      }

      // Draw
      const ctx = canvas?.getContext("2d");
      if (ctx && stateRef.current) {
        drawGame(ctx, stateRef.current);
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [getCanvasSize]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-4xl px-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-glow box-glow-cyan" />
          <span className="font-display text-lg tracking-widest text-foreground">
            P1 <span className="glow-cyan">{uiState.scores[0]}</span>
          </span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-black tracking-[0.3em] glow-cyan uppercase">
          Light Cycles
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg tracking-widest text-secondary">
            <span className="glow-orange">{uiState.scores[1]}</span> P2
          </span>
          <div className="w-3 h-3 rounded-full bg-orange-glow box-glow-orange" />
        </div>
      </div>

      {/* Game canvas */}
      <div className="relative">
        <canvas ref={canvasRef} className="border border-border rounded-sm" />

        {/* Overlay */}
        {(!uiState.running || uiState.gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-sm">
            {uiState.gameOver ? (
              <>
                <p className={`font-display text-4xl md:text-5xl font-black tracking-widest mb-4 ${uiState.winner === 0 ? 'glow-cyan' : uiState.winner === 1 ? 'glow-orange' : 'text-foreground'}`}>
                  {uiState.winner === null ? "EMPATE!" : `JOGADOR ${uiState.winner + 1} VENCEU!`}
                </p>
                <p className="font-body text-xl text-muted-foreground animate-pulse-glow">
                  Pressione ESPAÇO para jogar novamente
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-5xl md:text-6xl font-black tracking-[0.4em] glow-cyan mb-6">
                  TRON
                </p>
                <div className="flex flex-col gap-2 mb-8 text-center">
                  <p className="font-body text-lg text-muted-foreground">
                    <span className="text-foreground font-semibold">Jogador 1:</span> W A S D
                  </p>
                  <p className="font-body text-lg text-muted-foreground">
                    <span className="text-secondary font-semibold">Jogador 2:</span> ← ↑ ↓ →
                  </p>
                </div>
                <p className="font-body text-xl text-muted-foreground animate-pulse-glow">
                  Pressione ESPAÇO para começar
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls hint */}
      <p className="font-body text-sm text-muted-foreground tracking-wider">
        Não cruze os rastros. Não bata nas paredes. Sobreviva.
      </p>
    </div>
  );
};

export default TronGame;
