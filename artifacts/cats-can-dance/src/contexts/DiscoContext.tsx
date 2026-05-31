import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type DiscoCtx = { disco: boolean; toggle: () => void; beat: number };
const Ctx = createContext<DiscoCtx>({ disco: false, toggle: () => {}, beat: 0 });

export const DiscoProvider = ({ children }: { children: ReactNode }) => {
  const [disco, setDisco] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (disco) {
      document.body.classList.add("disco");
      const id = setInterval(() => setBeat((b) => b + 1), 500);
      return () => {
        clearInterval(id);
        document.body.classList.remove("disco");
      };
    }
  }, [disco]);

  return (
    <Ctx.Provider value={{ disco, toggle: () => setDisco((v) => !v), beat }}>
      {children}
    </Ctx.Provider>
  );
};

export const useDisco = () => useContext(Ctx);
