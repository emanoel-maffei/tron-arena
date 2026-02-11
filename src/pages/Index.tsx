import { useNavigate } from "react-router-dom";
import tronIcon from "@/assets/tron-icon.jpg";
import pongIcon from "@/assets/pong-icon.jpg";

const games = [
  {
    id: "tron",
    title: "Light Cycles",
    description: "Não cruze os rastros. Não bata nas paredes. Sobreviva.",
    image: tronIcon,
    path: "/tron",
    accentClass: "glow-cyan",
    borderClass: "hover:border-primary",
    shadowClass: "hover:box-glow-cyan",
  },
  {
    id: "pong",
    title: "Pong",
    description: "O clássico dos clássicos. Rebata a bola e marque pontos.",
    image: pongIcon,
    path: "/pong",
    accentClass: "glow-orange",
    borderClass: "hover:border-secondary",
    shadowClass: "hover:box-glow-orange",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 gap-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl md:text-6xl font-black tracking-[0.3em] glow-cyan uppercase">
          Arena
        </h1>
        <p className="font-body text-xl md:text-2xl text-muted-foreground tracking-wider">
          Jogos para dois jogadores — local multiplayer
        </p>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => navigate(game.path)}
            className={`group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 ${game.borderClass} ${game.shadowClass} focus:outline-none focus:ring-2 focus:ring-ring`}
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
              />
            </div>
            <div className="p-5 text-left space-y-2">
              <h2 className={`font-display text-xl md:text-2xl font-bold tracking-widest uppercase ${game.accentClass}`}>
                {game.title}
              </h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {game.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="font-body text-sm text-muted-foreground tracking-wider animate-pulse-glow">
        Escolha um jogo e pressione ESPAÇO para começar
      </p>
    </div>
  );
};

export default Index;
