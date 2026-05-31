import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const RADIUS = 50;
const SQUARE = 6.5;
const PREC = 19.55;
const FUZZY = 0.001;

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randColor = (bright = false) => {
  const c = bright ? randInt(170, 255) : randInt(120, 200);
  return `rgb(${c},${c},${c})`;
};

const ShinyBall = () => {
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;
    ball.innerHTML = "";

    // re-add the inner core
    const middle = document.createElement("div");
    middle.id = "discoBallMiddle";
    middle.style.cssText = `
      width: 100%; height: 100%; border-radius: 100%;
      position: absolute; inset: 0;
      background: linear-gradient(180deg, #111, #444);
      animation: rotateDiscoBallMiddle 18s linear infinite;
      transform-style: preserve-3d;
    `;
    ball.appendChild(middle);

    const inc = (Math.PI - FUZZY) / PREC;
    for (let t = FUZZY; t < Math.PI; t += inc) {
      const z = RADIUS * Math.cos(t);
      const currentRadius =
        Math.abs(RADIUS * Math.cos(0) * Math.sin(t) - RADIUS * Math.cos(Math.PI) * Math.sin(t)) / 2.5;
      const circumference = Math.abs(2 * Math.PI * currentRadius);
      const squaresThatFit = Math.max(1, Math.floor(circumference / SQUARE));
      const angleInc = (Math.PI * 2 - FUZZY) / squaresThatFit;

      for (let i = angleInc / 2 + FUZZY; i < Math.PI * 2; i += angleInc) {
        const square = document.createElement("div");
        const tile = document.createElement("div");
        tile.style.width = SQUARE + "px";
        tile.style.height = SQUARE + "px";
        tile.style.transformOrigin = "0 0 0";
        tile.style.transform = `rotate(${i}rad) rotateY(${t}rad)`;
        const bright = (t > 1.3 && t < 1.9) || (t < -1.3 && t > -1.9);
        tile.style.backgroundColor = randColor(bright);
        tile.style.animation = `reflect 2s linear infinite`;
        tile.style.animationDelay = `${randInt(0, 20) / 10}s`;
        tile.style.backfaceVisibility = "hidden";
        square.appendChild(tile);
        square.className = "shiny-square";
        const x = RADIUS * Math.cos(i) * Math.sin(t);
        const y = RADIUS * Math.sin(i) * Math.sin(t);
        square.style.position = "absolute";
        square.style.top = "50px";
        square.style.left = "50px";
        square.style.transformStyle = "preserve-3d";
        square.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px)`;
        ball.appendChild(square);
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ y: -400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 11 }}
      className="pointer-events-none"
      aria-hidden
    >
      <div className="w-1 h-20 bg-ink mx-auto" />
      <div className="relative" style={{ width: 100, height: 100, margin: "0 auto", perspective: 800 }}>
        <div
          className="absolute inset-0 rounded-full bg-cream"
          style={{ filter: "blur(24px)", opacity: 0.5 }}
        />
        <div
          ref={ballRef}
          id="discoBall"
          style={{
            transformStyle: "preserve-3d",
            width: 100,
            height: 100,
            position: "absolute",
            inset: 0,
            animation: "rotateDiscoBall 18s linear infinite",
          }}
        />
      </div>
    </motion.div>
  );
};

export default ShinyBall;