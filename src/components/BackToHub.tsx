import { useNavigate } from "react-router-dom";

const BackToHub = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      className="absolute top-4 left-4 z-50 font-display text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase border border-border rounded px-3 py-1.5 bg-card/80 backdrop-blur-sm hover:box-glow-cyan"
    >
      ← Arena
    </button>
  );
};

export default BackToHub;
