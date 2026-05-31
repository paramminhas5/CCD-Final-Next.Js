import { useDiscoAudio } from "@/hooks/useDiscoAudio";
import { useDisco } from "@/contexts/DiscoContext";

const DiscoMute = () => {
  const { disco } = useDisco();
  const { muted, setMuted, available } = useDiscoAudio();
  if (!disco) return null;

  if (!available) {
    return (
      <span
        title="Drop an mp3 at /public/audio/disco-loop.mp3 to enable disco audio"
        className="hidden md:inline-flex items-center px-2 h-11 border-4 border-ink bg-cream text-ink text-xs font-display"
      >
        🔇 NO AUDIO FILE
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setMuted((m) => !m)}
      aria-label={muted ? "Unmute disco audio" : "Mute disco audio"}
      title={muted ? "Unmute" : "Mute"}
      className={`w-11 h-11 grid place-items-center border-4 border-ink chunk-shadow text-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform ${
        muted ? "bg-cream text-ink" : "bg-lime text-ink"
      }`}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
};

export default DiscoMute;
