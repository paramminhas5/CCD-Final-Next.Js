import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

type Ev = { id: string; slug: string; title: string; date: string; city: string; venue: string; status: string };

const Embed = () => {
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, slug, title, date, city, venue, status")
        .eq("status", "upcoming")
        .order("sort_order", { ascending: true })
        .limit(3);
      setEvents((data ?? []) as Ev[]);
    })();
  }, []);

  return (
    <html lang="en">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>CCD Upcoming · Embed</title>
      </Helmet>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            background: "#FBF6E2",
            color: "#0F0F0F",
            border: "4px solid #0F0F0F",
            padding: "16px",
            borderRadius: 0,
            maxWidth: 380,
          }}
        >
          <p style={{ margin: 0, fontWeight: 800, color: "#E60099", fontSize: 14, letterSpacing: 1 }}>
            CATS CAN DANCE — UPCOMING
          </p>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {events.length === 0 && <li style={{ color: "#666" }}>Next Episode dropping soon.</li>}
            {events.map((e) => (
              <li key={e.id} style={{ borderTop: "2px solid #0F0F0F", padding: "10px 0" }}>
                <a
                  href={`https://catscandance.com/events/${e.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0F0F0F", textDecoration: "none" }}
                >
                  <p style={{ margin: 0, fontWeight: 800 }}>{e.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#444" }}>
                    {e.date} · {e.venue}, {e.city}
                  </p>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="https://catscandance.com/events"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#0F0F0F",
              color: "#FBF6E2",
              padding: "8px 14px",
              fontWeight: 800,
              marginTop: 8,
              textDecoration: "none",
            }}
          >
            RSVP →
          </a>
        </div>
      </body>
    </html>
  );
};

export default Embed;
