import {
  Copy,
  Check,
  Pickaxe,
  Gem,
  Sparkles,
  Heart,
  Sword,
  Compass,
  Wifi,
  Map as MapIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SERVER_IP = "mc.mufticraft.store";

type BlockKind = "grass" | "dirt" | "diamond" | "gold" | "lava" | "emerald";

const BLOCK_COLORS: Record<BlockKind, string> = {
  grass: "#5cb85c",
  dirt: "#8b5a2b",
  diamond: "#5ee6e0",
  gold: "#ffd34e",
  lava: "#ff7a18",
  emerald: "#17c964",
};

function Block({
  kind,
  size = 48,
  className = "",
  style,
}: {
  kind: BlockKind;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`block-border ${className}`}
      style={{
        width: size,
        height: size,
        background: BLOCK_COLORS[kind],
        ...style,
      }}
      aria-hidden
    />
  );
}

function FloatingBlocks() {
  const blocks: Array<{
    kind: BlockKind;
    size: number;
    top: string;
    left: string;
    delay: string;
    anim: string;
  }> = [
    { kind: "grass", size: 56, top: "8%", left: "6%", delay: "0s", anim: "animate-float" },
    { kind: "diamond", size: 36, top: "16%", left: "84%", delay: "0.6s", anim: "animate-float-slow" },
    { kind: "gold", size: 28, top: "62%", left: "4%", delay: "1.2s", anim: "animate-float" },
    { kind: "dirt", size: 44, top: "70%", left: "90%", delay: "0.3s", anim: "animate-float-slow" },
    { kind: "emerald", size: 24, top: "38%", left: "12%", delay: "1.8s", anim: "animate-float" },
    { kind: "lava", size: 30, top: "30%", left: "92%", delay: "2.4s", anim: "animate-float-slow" },
    { kind: "diamond", size: 22, top: "82%", left: "48%", delay: "0.9s", anim: "animate-float" },
    { kind: "grass", size: 32, top: "4%", left: "52%", delay: "1.5s", anim: "animate-float-slow" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {blocks.map((b, i) => (
        <div
          key={i}
          className={`absolute ${b.anim}`}
          style={{
            top: b.top,
            left: b.left,
            animationDelay: b.delay,
          }}
        >
          <Block kind={b.kind} size={b.size} />
        </div>
      ))}
    </div>
  );
}

function Cloud({
  top,
  duration,
  delay,
  scale = 1,
}: {
  top: string;
  duration: string;
  delay: string;
  scale?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute animate-drift-slow"
      style={{
        top,
        left: 0,
        animationDuration: duration,
        animationDelay: delay,
        transform: `scale(${scale})`,
      }}
      aria-hidden
    >
      <div className="flex">
        <div className="w-10 h-6 bg-white/85 block-border" />
        <div className="w-14 h-8 bg-white/85 block-border -ml-1" />
        <div className="w-8 h-5 bg-white/85 block-border -ml-1" />
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "diamond" | "gold" | "grass" | "lava";
}) {
  const toneMap = {
    diamond: "bg-diamond/20 text-diamond border-diamond/60",
    gold: "bg-gold/20 text-gold border-gold/60",
    grass: "bg-grass/20 text-grass-light border-grass/60",
    lava: "bg-lava/20 text-lava border-lava/60",
  } as const;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-2 ${toneMap[tone]} block-border backdrop-blur-sm bg-black/20`}
    >
      <div className={`shrink-0 ${toneMap[tone].split(" ")[1]}`}>{icon}</div>
      <div>
        <div className="font-pixel text-[10px] uppercase tracking-wider text-white/70">
          {label}
        </div>
        <div className="font-retro text-2xl leading-none text-white">{value}</div>
      </div>
    </div>
  );
}

function QuickStartCard({
  step,
  title,
  body,
  icon,
  color,
  rotate,
}: {
  step: number;
  title: string;
  body: string;
  icon: React.ReactNode;
  color: string;
  rotate: string;
}) {
  return (
    <div
      className={`relative bg-sky-night/80 backdrop-blur p-6 block-border border-2 border-white/20 transition-transform hover:-translate-y-1 hover:rotate-0 ${rotate}`}
    >
      <div
        className="absolute -top-4 -left-4 w-10 h-10 font-pixel text-xs grid place-items-center block-border"
        style={{ background: color, color: "#0d1b3d" }}
      >
        {step}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-white">{icon}</div>
        <h3 className="font-pixel text-sm text-white">{title}</h3>
      </div>
      <p className="font-retro text-xl text-white/85 leading-snug">{body}</p>
    </div>
  );
}

function App() {
  const [copied, setCopied] = useState(false);
  const [creeperLoose, setCreeperLoose] = useState(false);
  const logoTapsRef = useRef(0);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tapLogo = () => {
    logoTapsRef.current += 1;
    if (logoTapsRef.current >= 3) {
      logoTapsRef.current = 0;
      setCreeperLoose(true);
    }
  };

  useEffect(() => {
    if (!creeperLoose) return;
    const t = setTimeout(() => setCreeperLoose(false), 2400);
    return () => clearTimeout(t);
  }, [creeperLoose]);

  return (
    <div className="relative min-h-screen bg-mc-sky text-white overflow-hidden">
      {/* Drifting clouds */}
      <Cloud top="6%" duration="70s" delay="0s" />
      <Cloud top="22%" duration="95s" delay="-30s" scale={0.7} />
      <Cloud top="40%" duration="110s" delay="-60s" scale={1.1} />

      {/* Floating blocks decoration */}
      <FloatingBlocks />

      {/* Grass + dirt floor at the bottom */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24">
        <div className="h-4 bg-grass-light" />
        <div className="h-3 bg-grass" />
        <div className="h-3 bg-grass-dark" />
        <div className="flex-1 h-full bg-dirt" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b-4 border-grass-dark/60 bg-sky-night/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <button
                onClick={tapLogo}
                className="flex items-center gap-3 group select-none"
                aria-label="MuftiCraft logo"
              >
                {/* Grass block logo */}
                <div className="relative w-12 h-12 transition-transform group-hover:rotate-12 group-active:scale-90">
                  <div className="absolute inset-0 bg-dirt block-border" />
                  <div className="absolute inset-x-0 top-0 h-5 bg-grass block-border" />
                  <div className="absolute inset-x-0 top-4 h-1 bg-grass-dark" />
                </div>
                <div className="text-left">
                  <h1 className="font-pixel text-lg sm:text-xl text-white text-stroke leading-none">
                    MuftiCraft
                  </h1>
                  <p className="font-retro text-base text-gold mt-1 leading-none">
                    Mine. Build. Vibe.
                  </p>
                </div>
              </button>

              <button
                onClick={copyToClipboard}
                className="group relative flex items-center gap-2 bg-gold hover:bg-yellow-300 text-sky-night font-pixel text-xs sm:text-sm px-5 py-4 block-border border-2 border-yellow-700 transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pixel-sm shadow-pixel-gold"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>YOINKED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 group-hover:animate-wiggle" />
                    <span className="hidden sm:inline">{SERVER_IP}</span>
                    <span className="sm:hidden">COPY IP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center">
          <div className="inline-block animate-bob">
            <span className="font-pixel text-[10px] uppercase tracking-[0.3em] text-gold bg-sky-night/70 px-3 py-2 block-border border-2 border-gold/50">
              ▶ Server online
            </span>
          </div>
          <h2 className="mt-6 font-pixel text-3xl sm:text-5xl text-white text-stroke leading-tight">
            Bring your pickaxe.
            <br />
            <span className="text-gold">Leave your worries.</span>
          </h2>
          <p className="mt-6 font-retro text-2xl text-white/90 max-w-2xl mx-auto">
            A cozy survival server with a live map, friendly chunks, and exactly
            zero creepers in your basement.
            <span className="text-diamond"> Probably.</span>
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <StatChip
              icon={<Wifi className="w-5 h-5" />}
              label="Status"
              value="Online"
              tone="grass"
            />
            <StatChip
              icon={<Gem className="w-5 h-5" />}
              label="Mode"
              value="Survival"
              tone="diamond"
            />
            <StatChip
              icon={<Sword className="w-5 h-5" />}
              label="Version"
              value="Latest"
              tone="gold"
            />
            <StatChip
              icon={<Heart className="w-5 h-5 animate-shimmer" />}
              label="Vibes"
              value="11/10"
              tone="lava"
            />
          </div>
        </section>

        {/* Quick start */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-gold animate-shimmer" />
            <h3 className="font-pixel text-sm sm:text-base text-white text-stroke">
              How to join (it's three blocks easy)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <QuickStartCard
              step={1}
              title="Steal the IP"
              body="Smack the big gold button up top. It does the clipboard thing."
              icon={<Copy className="w-6 h-6" />}
              color={BLOCK_COLORS.gold}
              rotate="-rotate-1"
            />
            <QuickStartCard
              step={2}
              title="Open Minecraft"
              body="Multiplayer → Add Server → paste IP. You know the dance."
              icon={<Pickaxe className="w-6 h-6" />}
              color={BLOCK_COLORS.diamond}
              rotate="rotate-1"
            />
            <QuickStartCard
              step={3}
              title="Touch grass"
              body="Build a tower. Pet a dog. Avoid lava. Mostly. We believe in you."
              icon={<Compass className="w-6 h-6" />}
              color={BLOCK_COLORS.emerald}
              rotate="-rotate-1"
            />
          </div>
        </section>

        {/* Map */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-sky-night/80 backdrop-blur-md block-border border-2 border-white/20 overflow-hidden shadow-pixel-lg">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b-4 border-grass-dark/60 bg-gradient-to-r from-grass-dark via-grass to-grass-dark">
              <div className="flex items-center gap-3">
                <MapIcon className="w-5 h-5 text-white" />
                <h3 className="font-pixel text-xs sm:text-sm text-white text-stroke">
                  Live Server Map
                </h3>
              </div>
              <span className="font-retro text-lg text-white/90 hidden sm:inline">
                pan • zoom • snoop on the neighbors
              </span>
              <span className="flex items-center gap-2 font-pixel text-[10px] text-grass-light">
                <span className="w-2.5 h-2.5 bg-grass-light rounded-full animate-shimmer" />
                LIVE
              </span>
            </div>

            <div
              className="relative"
              style={{ height: "calc(100vh - 460px)", minHeight: "520px" }}
            >
              <iframe
                src="https://map.mufticraft.store/"
                className="w-full h-full"
                title="MuftiCraft Server Map"
                style={{ border: "none" }}
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t-4 border-grass-dark/60 bg-sky-night/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-retro text-xl text-white/80">
              Built with sticks and string · © {new Date().getFullYear()} MuftiCraft
            </p>
            <p className="font-pixel text-[10px] text-white/60">
              "ssssss—" — a creeper, probably
            </p>
          </div>
        </footer>
      </div>

      {/* Easter egg: triple-tap the logo → creeper drive-by */}
      {creeperLoose && (
        <div
          className="pointer-events-none fixed bottom-24 left-0 right-0 z-50 flex items-end justify-start"
          aria-hidden
        >
          <div
            className="animate-drift-slow"
            style={{ animationDuration: "2.4s", animationIterationCount: 1 }}
          >
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-4 gap-0.5">
                <div className="w-4 h-4 bg-grass-dark" />
                <div className="w-4 h-4 bg-grass" />
                <div className="w-4 h-4 bg-grass" />
                <div className="w-4 h-4 bg-grass-dark" />
              </div>
              <div className="grid grid-cols-4 gap-0.5">
                <div className="w-4 h-4 bg-grass" />
                <div className="w-4 h-4 bg-sky-night" />
                <div className="w-4 h-4 bg-sky-night" />
                <div className="w-4 h-4 bg-grass" />
              </div>
              <div className="grid grid-cols-4 gap-0.5">
                <div className="w-4 h-4 bg-grass" />
                <div className="w-4 h-4 bg-grass-dark" />
                <div className="w-4 h-4 bg-grass-dark" />
                <div className="w-4 h-4 bg-grass" />
              </div>
              <div className="grid grid-cols-4 gap-0.5">
                <div className="w-4 h-4 bg-grass-dark" />
                <div className="w-4 h-4 bg-grass" />
                <div className="w-4 h-4 bg-grass" />
                <div className="w-4 h-4 bg-grass-dark" />
              </div>
              <p className="font-pixel text-[10px] text-grass-light mt-1 animate-shimmer">
                ssssss…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
