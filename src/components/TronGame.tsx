import { useEffect, useRef, useCallback, useState } from "react";
import { createInitialState, tick, drawGame, isOpposite, GameState, Direction } from "@/game/engine";

const TronGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const frameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const inputQueueRef = useRef<{ player: number; dir: Direction }[]>([]);
  const [uiState, setUiState] = useState<{
    gameOver: boolean;
    winnerTeam: number | null;
    teamScores: [number, number];
    running: boolean;
  }>({
    gameOver: false,
    winnerTeam: null,
    teamScores: [0, 0],
    running: false,
  });

  const getCanvasSize = useCallback(() => {
    const w = Math.floor(window.innerWidth * 0.95);
    const h = Math.floor(window.innerHeight * 0.75);
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
      newState.teamScores = stateRef.current.teamScores;
    }
    newState.running = true;
    stateRef.current = newState;
    inputQueueRef.current = [];
    setUiState({ gameOver: false, winnerTeam: null, teamScores: newState.teamScores, running: true });
  }, [getCanvasSize]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    const state = stateRef.current;
    if (!state) return;

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

    // Player 0 (Team 0): WASD
    const p0Map: Record<string, Direction> = { KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right" };
    // Player 1 (Team 0): IJKL
    const p1Map: Record<string, Direction> = { KeyI: "up", KeyK: "down", KeyJ: "left", KeyL: "right" };
    // Player 2 (Team 1): Arrows
    const p2Map: Record<string, Direction> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    // Player 3 (Team 1): Numpad 8456
    const p3Map: Record<string, Direction> = { Numpad8: "up", Numpad5: "down", Numpad4: "left", Numpad6: "right" };

    const maps = [p0Map, p1Map, p2Map, p3Map];
    for (let i = 0; i < maps.length; i++) {
      if (maps[i][e.code]) {
        e.preventDefault();
        const dir = maps[i][e.code];
        if (state.players[i] && state.players[i].alive && !isOpposite(state.players[i].direction, dir)) {
          inputQueueRef.current.push({ player: i, dir });
        }
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
    setUiState({ gameOver: false, winnerTeam: null, teamScores: [0, 0], running: false });

    const gameLoop = (timestamp: number) => {
      const state = stateRef.current;
      if (!state) { frameRef.current = requestAnimationFrame(gameLoop); return; }

      const interval = 1000 / state.speed;
      if (timestamp - lastTickRef.current >= interval) {
        lastTickRef.current = timestamp;

        for (const input of inputQueueRef.current) {
          const p = state.players[input.player];
          if (p && p.alive && !isOpposite(p.direction, input.dir)) {
            p.direction = input.dir;
          }
        }
        inputQueueRef.current = [];

        const newState = tick(state);
        stateRef.current = newState;

        if (newState.gameOver !== state.gameOver || newState.winnerTeam !== state.winnerTeam) {
          setUiState({ gameOver: newState.gameOver, winnerTeam: newState.winnerTeam, teamScores: newState.teamScores, running: newState.running });
        }
      }

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
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-cyan-glow box-glow-cyan" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00e5a0", boxShadow: "0 0 8px rgba(0,229,160,0.6)" }} />
          </div>
          <span className="font-display text-lg tracking-widest text-foreground">
            EQUIPE 1 <span className="glow-cyan">{uiState.teamScores[0]}</span>
          </span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-black tracking-[0.3em] glow-cyan uppercase">
          Light Cycles
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg tracking-widest text-secondary">
            <span className="glow-orange">{uiState.teamScores[1]}</span> EQUIPE 2
          </span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-glow box-glow-orange" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff2d6d", boxShadow: "0 0 8px rgba(255,45,109,0.6)" }} />
          </div>
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
                <p className={`font-display text-4xl md:text-5xl font-black tracking-widest mb-4 ${uiState.winnerTeam === 0 ? 'glow-cyan' : uiState.winnerTeam === 1 ? 'glow-orange' : 'text-foreground'}`}>
                  {uiState.winnerTeam === null ? "EMPATE!" : `EQUIPE ${uiState.winnerTeam + 1} VENCEU!`}
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
                <div className="flex gap-12 mb-8">
                  <div className="flex flex-col gap-2 text-center">
                    <p className="font-display text-sm tracking-widest glow-cyan mb-1">EQUIPE 1</p>
                    <p className="font-body text-sm text-muted-foreground">
                      <span style={{ color: "#00e5ff" }} className="font-semibold">P1:</span> W A S D
                    </p>
                    <p className="font-body text-sm text-muted-foreground">
                      <span style={{ color: "#00e5a0" }} className="font-semibold">P2:</span> I J K L
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-center">
                    <p className="font-display text-sm tracking-widest glow-orange mb-1">EQUIPE 2</p>
                    <p className="font-body text-sm text-muted-foreground">
                      <span style={{ color: "#ff6d00" }} className="font-semibold">P3:</span> ← ↑ ↓ →
                    </p>
                    <p className="font-body text-sm text-muted-foreground">
                      <span style={{ color: "#ff2d6d" }} className="font-semibold">P4:</span> Numpad 4 8 5 6
                    </p>
                  </div>
                </div>
                <p className="font-body text-lg text-muted-foreground">Elimine a equipe adversária para marcar ponto</p>
                <p className="font-body text-xl text-muted-foreground animate-pulse-glow mt-4">
                  Pressione ESPAÇO para começar
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <p className="font-body text-sm text-muted-foreground tracking-wider">
        Trabalhe em equipe. Elimine os adversários. Domine a arena.
      </p>
    </div>
  );
};

export default TronGame;
