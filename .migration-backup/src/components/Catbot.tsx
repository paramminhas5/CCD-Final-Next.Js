import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "ccd_catbot_history";
const SUGGESTIONS = [
  "When's the next event?",
  "What drops are live?",
  "Where's the playlist?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catbot-chat`;

const Catbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Msg[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });
      if (resp.status === 429) {
        toast.error("Catbot is overloaded — try again in a sec.");
        setBusy(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Catbot is out of treats. Tell the team to top up AI credits.");
        setBusy(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Catbot lost the signal. Try again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Catbot"
        className="fixed bottom-5 right-5 z-40 w-16 h-16 md:w-20 md:h-20 bg-magenta border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform grid place-items-center group"
      >
        <CatFace />
        <span className="absolute -top-9 right-0 bg-ink text-cream font-display text-xs px-2 py-1 border-2 border-ink whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
          ASK CATBOT
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="bg-cream border-l-4 border-ink w-full sm:max-w-md flex flex-col p-0"
        >
          <SheetHeader className="p-5 border-b-4 border-ink bg-acid-yellow">
            <SheetTitle className="font-display text-3xl text-ink flex items-center gap-3">
              <div className="w-10 h-10 bg-magenta border-2 border-ink grid place-items-center">
                <CatFace small />
              </div>
              CATBOT
            </SheetTitle>
            <p className="text-ink/70 font-medium text-sm text-left">
              Ask about events, drops, playlists. I'll keep it brief.
            </p>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="font-display text-ink text-sm mb-2">/ TRY ASKING</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left bg-cream border-4 border-ink px-4 py-3 font-medium hover:bg-acid-yellow transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] border-4 border-ink p-3 ${
                  m.role === "user"
                    ? "ml-auto bg-electric-blue text-ink"
                    : "bg-cream text-ink"
                }`}
              >
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-a:text-magenta prose-a:underline">
                  <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-4 border-t-4 border-ink bg-cream flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ask the cat…"
              maxLength={500}
              disabled={busy}
              className="flex-1 bg-cream text-ink border-4 border-ink px-3 py-2 font-medium focus:outline-none focus:bg-acid-yellow disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="bg-magenta text-cream font-display px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
            >
              {busy ? "…" : "→"}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};

const CatFace = ({ small = false }: { small?: boolean }) => (
  <svg viewBox="0 0 32 32" className={small ? "w-6 h-6" : "w-9 h-9"} fill="hsl(var(--cream))">
    <path d="M5 8 L10 14 L8 20 Z" stroke="hsl(var(--ink))" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M27 8 L22 14 L24 20 Z" stroke="hsl(var(--ink))" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="16" cy="18" r="9" stroke="hsl(var(--ink))" strokeWidth="2"/>
    <circle cx="12" cy="17" r="1.4" fill="hsl(var(--ink))"/>
    <circle cx="20" cy="17" r="1.4" fill="hsl(var(--ink))"/>
    <path d="M14 21 Q16 23 18 21" stroke="hsl(var(--ink))" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

export default Catbot;
