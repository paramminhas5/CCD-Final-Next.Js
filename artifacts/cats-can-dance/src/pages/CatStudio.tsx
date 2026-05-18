import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase-shim";

import catLeft from "@/assets/cat-left.svg";
import catRight from "@/assets/cat-right.svg";
import catHeadphones from "@/assets/cat-headphones.png";
import { imgUrl } from "@/lib/img";
import catHandstand from "@/assets/cat-handstand.png";
import catCap from "@/assets/cat-cap.png";
import catHpDance from "@/assets/cat-headphones-dance.png";
import catDancer from "@/assets/cat-dancer.png";
import catDjNew from "@/assets/cat-dj-new.png";
import vinyl from "@/assets/vinyl-music.png";
import musicNote from "@/assets/music-note.png";
import star from "@/assets/star.png";

const BASES = [
  { id: "headphones", src: catHeadphones, label: "DJ Cat" },
  { id: "handstand", src: catHandstand, label: "Handstand" },
  { id: "cap", src: catCap, label: "Cap Cat" },
  { id: "hpDance", src: catHpDance, label: "Dance" },
  { id: "left", src: catLeft, label: "Left Cat" },
  { id: "right", src: catRight, label: "Right Cat" },
  { id: "dancer", src: catDancer, label: "Raver" },
  { id: "djNew", src: catDjNew, label: "DJ Set" },
];

const STICKERS = [
  { id: "none", src: null, label: "None" },
  { id: "vinyl", src: vinyl, label: "Vinyl" },
  { id: "note", src: musicNote, label: "Note" },
  { id: "star", src: star, label: "Star" },
];

const COLORS = [
  { id: "blue", className: "bg-electric-blue", label: "Blue", hex: "#1E90FF" },
  { id: "magenta", className: "bg-magenta", label: "Magenta", hex: "#E91E63" },
  { id: "yellow", className: "bg-acid-yellow", label: "Acid", hex: "#F4FF3A" },
  { id: "lime", className: "bg-lime", label: "Lime", hex: "#B6FF3C" },
  { id: "cream", className: "bg-cream", label: "Cream", hex: "#FFF7E8" },
];

const VIBES = ["DJ", "Skater", "Headphones", "Disco", "Pet-mode", "Streetwear", "Late-night", "Warehouse"];

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const composeToCanvas = async (opts: {
  bgHex: string;
  baseSrc: string;
  stickerSrc: string | null;
  name: string;
}) => {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = opts.bgHex;
  ctx.fillRect(0, 0, size, size);

  // ink border
  ctx.strokeStyle = "#0B0B0F";
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, size - 24, size - 24);

  const base = await loadImage(opts.baseSrc);
  const baseW = size * 0.72;
  const baseH = (base.height / base.width) * baseW;
  ctx.drawImage(base, (size - baseW) / 2, (size - baseH) / 2, baseW, baseH);

  if (opts.stickerSrc) {
    const stk = await loadImage(opts.stickerSrc);
    const sW = size * 0.28;
    const sH = (stk.height / stk.width) * sW;
    ctx.drawImage(stk, size - sW - 60, 60, sW, sH);
  }

  if (opts.name.trim()) {
    const name = opts.name.trim().toUpperCase().slice(0, 20);
    ctx.font = "bold 64px 'Archivo Black', system-ui, sans-serif";
    ctx.textAlign = "center";
    const textW = ctx.measureText(name).width + 60;
    const tagX = size / 2 - textW / 2;
    const tagY = size - 130;
    ctx.fillStyle = "#FFF7E8";
    ctx.fillRect(tagX, tagY, textW, 90);
    ctx.lineWidth = 10; ctx.strokeStyle = "#0B0B0F";
    ctx.strokeRect(tagX, tagY, textW, 90);
    ctx.fillStyle = "#0B0B0F";
    ctx.fillText(name, size / 2, tagY + 62);
  }

  return canvas;
};

const downloadDataUrl = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
};

const CatStudio = () => {
  const [base, setBase] = useState(BASES[0]);
  const [sticker, setSticker] = useState(STICKERS[1]);
  const [color, setColor] = useState(COLORS[0]);
  const [name, setName] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);

  // AI
  const [vibes, setVibes] = useState<string[]>(["DJ"]);
  const [aiName, setAiName] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [useBuildAsRef, setUseBuildAsRef] = useState(true);

  const downloadBuild = async () => {
    try {
      const canvas = await composeToCanvas({
        bgHex: color.hex, baseSrc: imgUrl(base.src), stickerSrc: sticker.src ? imgUrl(sticker.src) : null, name,
      });
      downloadDataUrl(canvas.toDataURL("image/png"), `my-ccd-cat-${Date.now()}.png`);
    } catch (e) {
      toast.error("Couldn't export — try again");
    }
  };

  const remixWithAI = async () => {
    setAiBusy(true);
    setAiImage(null);
    try {
      let inputImage: string | undefined;
      if (useBuildAsRef) {
        const canvas = await composeToCanvas({
          bgHex: color.hex, baseSrc: imgUrl(base.src), stickerSrc: sticker.src ? imgUrl(sticker.src) : null, name,
        });
        inputImage = canvas.toDataURL("image/png");
      }
      const { data, error } = await supabase.functions.invoke("cat-generate", {
        body: { vibes, name: aiName || name, color: color.label, inputImage },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const img = (data as any)?.image;
      if (!img) throw new Error("No image");
      setAiImage(img);
    } catch (e: any) {
      toast.error(e?.message ?? "AI remix failed");
    } finally {
      setAiBusy(false);
    }
  };

  const downloadAI = () => {
    if (!aiImage) return;
    downloadDataUrl(aiImage, `ccd-cat-ai-${Date.now()}.png`);
  };

  const toggleVibe = (v: string) =>
    setVibes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].slice(0, 6));

  return (
    <main className="bg-background text-foreground">
      <SEO
        title="Cat Studio — Create Your Own CCD Cat"
        description="Build your own dancing cat in the Cats Can Dance style. Mix bases, stickers and colors, or remix with AI. Download as PNG."
        path="/cat-studio"
        noindex
      />
      <Nav />
      <PageHero
        eyebrow="CAT STUDIO"
        title={<>MAKE<br/>YOUR CAT.</>}
        bg="bg-acid-yellow"
        textColor="text-ink"
        eyebrowColor="text-magenta"
        shadow={false}
      />
      <div className="bg-cream border-b-4 border-ink pt-6">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cat Studio" }]} />
        </div>
      </div>

      <section className="bg-cream border-b-4 border-ink py-10 md:py-14">
        <div className="container">
          <Tabs defaultValue="builder">
            <TabsList className="bg-cream border-4 border-ink p-1 mb-8">
              <TabsTrigger value="builder" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">
                LAYER BUILDER
              </TabsTrigger>
              <TabsTrigger value="ai" className="font-display data-[state=active]:bg-ink data-[state=active]:text-cream">
                AI REMIX ✦
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Stage */}
                <div className="order-2 lg:order-1">
                  <div
                    ref={stageRef}
                    className={`relative aspect-square ${color.className} border-4 border-ink chunk-shadow-lg overflow-hidden`}
                  >
                    <img src={imgUrl(base.src)} alt="" className="absolute inset-0 m-auto w-[72%] h-[72%] object-contain drop-shadow-[8px_8px_0_hsl(var(--ink))]" />
                    {sticker.src && (
                      <img src={imgUrl(sticker.src)} alt="" className="absolute top-4 right-4 w-[28%] drop-shadow-[6px_6px_0_hsl(var(--ink))]" />
                    )}
                    {name.trim() && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-cream border-4 border-ink px-4 py-2 font-display text-ink text-2xl whitespace-nowrap">
                        {name.trim().toUpperCase().slice(0, 20)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <button onClick={downloadBuild} className="bg-magenta text-cream font-display text-lg px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                      DOWNLOAD PNG ↓
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div className="order-1 lg:order-2 space-y-6">
                  <div>
                    <p className="font-display text-ink text-lg mb-2">BASE</p>
                    <div className="grid grid-cols-4 gap-2">
                      {BASES.map((b) => (
                        <button key={b.id} onClick={() => setBase(b)}
                          className={`aspect-square bg-cream border-4 ${base.id === b.id ? "border-magenta" : "border-ink"} chunk-shadow grid place-items-center p-2`}>
                          <img src={imgUrl(b.src)} alt={b.label} className="max-w-full max-h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-display text-ink text-lg mb-2">STICKER</p>
                    <div className="grid grid-cols-4 gap-2">
                      {STICKERS.map((s) => (
                        <button key={s.id} onClick={() => setSticker(s)}
                          className={`aspect-square bg-cream border-4 ${sticker.id === s.id ? "border-magenta" : "border-ink"} chunk-shadow grid place-items-center p-2 font-display text-ink`}>
                          {s.src ? <img src={imgUrl(s.src)} alt={s.label} className="max-w-full max-h-full object-contain" /> : "✕"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-display text-ink text-lg mb-2">BACKGROUND</p>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button key={c.id} onClick={() => setColor(c)}
                          className={`w-12 h-12 ${c.className} border-4 ${color.id === c.id ? "border-magenta" : "border-ink"} chunk-shadow`}
                          aria-label={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-display text-ink text-lg mb-2">NAME TAG (optional)</p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={20}
                      placeholder="MEOW DJ"
                      className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-display text-lg placeholder:text-ink/60 focus:outline-none focus:bg-acid-yellow"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <div className={`relative aspect-square ${color.className} border-4 border-ink chunk-shadow-lg overflow-hidden grid place-items-center`}>
                    {aiBusy && (
                      <div className="font-display text-ink text-2xl text-center px-6">
                        COOKING UP YOUR CAT…
                        <div className="mt-4 w-12 h-12 mx-auto border-4 border-ink border-t-magenta rounded-full animate-spin" />
                      </div>
                    )}
                    {!aiBusy && aiImage && (
                      <img src={aiImage} alt="Your AI-generated CCD cat" className="w-full h-full object-cover" />
                    )}
                    {!aiBusy && !aiImage && (
                      <p className="font-display text-ink text-2xl text-center px-6">
                        PICK YOUR VIBES →<br/>HIT REMIX
                      </p>
                    )}
                  </div>
                  {aiImage && !aiBusy && (
                    <button onClick={downloadAI} className="mt-6 bg-magenta text-cream font-display text-lg px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                      DOWNLOAD PNG ↓
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="font-display text-ink text-lg mb-2">VIBES (max 6)</p>
                    <div className="flex flex-wrap gap-2">
                      {VIBES.map((v) => (
                        <button key={v} onClick={() => toggleVibe(v)}
                          className={`font-display text-sm px-3 py-2 border-4 border-ink chunk-shadow ${
                            vibes.includes(v) ? "bg-magenta text-cream" : "bg-cream text-ink"
                          }`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-display text-ink text-lg mb-2">SPIRIT NAME (optional)</p>
                    <input
                      value={aiName}
                      onChange={(e) => setAiName(e.target.value)}
                      maxLength={40}
                      placeholder="DJ MITTENS"
                      className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-display text-lg placeholder:text-ink/60 focus:outline-none focus:bg-acid-yellow"
                    />
                  </div>

                  <div>
                    <p className="font-display text-ink text-lg mb-2">BACKGROUND COLOR</p>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button key={c.id} onClick={() => setColor(c)}
                          className={`w-12 h-12 ${c.className} border-4 ${color.id === c.id ? "border-magenta" : "border-ink"} chunk-shadow`}
                          aria-label={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 font-display text-ink cursor-pointer">
                    <input type="checkbox" checked={useBuildAsRef} onChange={(e) => setUseBuildAsRef(e.target.checked)} className="w-5 h-5 accent-magenta" />
                    USE MY LAYERED BUILD AS A REFERENCE
                  </label>

                  <button
                    onClick={remixWithAI}
                    disabled={aiBusy || vibes.length === 0}
                    className="bg-ink text-cream font-display text-xl px-6 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-50"
                  >
                    {aiBusy ? "REMIXING…" : "REMIX WITH AI ✦"}
                  </button>
                  <p className="text-ink/60 text-xs">Uses Lovable AI. Style is locked to the CCD aesthetic. Be patient — image gen takes a few seconds.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default CatStudio;
