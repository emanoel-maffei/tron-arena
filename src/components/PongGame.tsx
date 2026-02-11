import { useEffect, useRef, useCallback, useState } from "react";
import { createPongState, tickPong, drawPong, PongState } from "@/game/pong-engine";

const PongGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PongState | null>(null);
  const frameRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const [ui, setUi] = useState<{ running: boolean; gameOver: boolean; winner: number | null }>({
    running: false,
    gameOver: false,
    winner: null,
  });

  const getCanvasSize = useCallback(() => {
    const w = Math.floor(window.innerWidth * 0.9);
    const h = Math.floor(window.innerHeight * 0.75);
    return { width: w, height: h };
  }, []);

  const resetGame = useCallback((keepScores = false) => {
    const { width, height } = getCanvasSize();
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = width; canvas.height = height; }
    const ns = createPongState(width, height);
    if (keepScores && stateRef.current) ns.scores = stateRef.current.scores;
    stateRef.current = ns;
    setUi({ running: false, gameOver: false, winner: null });
  }, [getCanvasSize]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.type === "keydown") {
      keysRef.current.add(e.code);
      if (e.code === "Space") {
        e.preventDefault();
        const s = stateRef.current;
        if (!s) return;
        if (s.gameOver) {
          resetGame(true);
          if (stateRef.current) {
            stateRef.current.running = true;
            setUi({ running: true, gameOver: false, winner: null });
          }
        } else if (!s.running) {
          s.running = true;
          setUi(prev => ({ ...prev, running: true }));
        }
      }
    } else {
      keysRef.current.delete(e.code);
    }
  }, [resetGame]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKey); };
  }, [handleKey]);

  useEffect(() => {
    const { width, height } = getCanvasSize();
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = width; canvas.height = height; }
    stateRef.current = createPongState(width, height);

    const gameLoop = () => {
      const s = stateRef.current;
      if (!s) { frameRef.current = requestAnimationFrame(gameLoop); return; }

      // Read keys for paddle movement
      const keys = keysRef.current;
      s.paddles[0].dy = keys.has("KeyW") ? -1 : keys.has("KeyS") ? 1 : 0;
      s.paddles[1].dy = keys.has("ArrowUp") ? -1 : keys.has("ArrowDown") ? 1 : 0;

      const ns = tickPong(s);
      stateRef.current = ns;

      if (ns.gameOver !== s.gameOver) {
        setUi({ running: ns.running, gameOver: ns.gameOver, winner: ns.winner });
      }

      const ctx = canvas?.getContext("2d");
      if (ctx) drawPong(ctx, ns);

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [getCanvasSize]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <div className="flex items-center justify-between w-full max-w-4xl px-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-glow box-glow-cyan" />
          <span className="font-display text-lg tracking-widest text-foreground">P1 (W/S)</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-black tracking-[0.3em] glow-cyan uppercase">Pong</h1>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg tracking-widest text-secondary">P2 (↑/↓)</span>
          <div className="w-3 h-3 rounded-full bg-orange-glow box-glow-orange" />
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} className="border border-border rounded-sm" />

        {(!ui.running || ui.gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-sm">
            {ui.gameOver ? (
              <>
                <p className={`font-display text-4xl md:text-5xl font-black tracking-widest mb-4 ${ui.winner === 0 ? "glow-cyan" : "glow-orange"}`}>
                  JOGADOR {(ui.winner ?? 0) + 1} VENCEU!
                </p>
                <p className="font-body text-xl text-muted-foreground animate-pulse-glow">
                  Pressione ESPAÇO para jogar novamente
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-5xl md:text-6xl font-black tracking-[0.4em] glow-cyan mb-6">PONG</p>
                <div className="flex flex-col gap-2 mb-8 text-center">
                  <p className="font-body text-lg text-muted-foreground">
                    <span className="text-foreground font-semibold">Jogador 1:</span> W / S
                  </p>
                  <p className="font-body text-lg text-muted-foreground">
                    <span className="text-secondary font-semibold">Jogador 2:</span> ↑ / ↓
                  </p>
                </div>
                <p className="font-body text-lg text-muted-foreground">Primeiro a marcar <span className="text-foreground font-bold">7 pontos</span> vence</p>
                <p className="font-body text-xl text-muted-foreground animate-pulse-glow mt-4">
                  Pressione ESPAÇO para começar
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <p className="font-body text-sm text-muted-foreground tracking-wider">
        Rebata a bola. Marque pontos. Domine a arena.
      </p>
    </div>
  );
};

export default PongGame;
