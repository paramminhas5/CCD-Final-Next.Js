/**
 * ArtistGigChart — bar chart of gigs by year using Recharts.
 * Shows as a horizontal scrollable chart of yearly gig counts.
 */
"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

interface Appearance {
  year?: number;
  city?: string;
  role?: string;
}

interface Props {
  appearances: Appearance[];
}

const CCD_COLOURS = ["#f5e642", "#e040fb", "#00bfff", "#ff6600", "#aaff00"];

export default function ArtistGigChart({ appearances }: Props) {
  if (!appearances || appearances.length === 0) return null;

  // Group by year
  const byYear = appearances.reduce((acc, a) => {
    const y = a.year || 0;
    if (!y) return acc;
    acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const data = Object.entries(byYear)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);

  if (data.length === 0) return null;

  // City breakdown for top bar
  const byCity = appearances.reduce((acc, a) => {
    const c = a.city || "Unknown";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCities = Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="border-4 border-ink bg-cream p-4">
        <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-4">Gigs Per Year</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a20" />
            <XAxis
              dataKey="year"
              tick={{ fontFamily: "inherit", fontSize: 10, fill: "#1a1a1a" }}
              axisLine={{ stroke: "#1a1a1a" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "inherit", fontSize: 10, fill: "#1a1a1a" }}
              axisLine={{ stroke: "#1a1a1a" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#f5f0e8",
                border: "4px solid #1a1a1a",
                borderRadius: 0,
                fontFamily: "inherit",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value} gig${value !== 1 ? "s" : ""}`, ""]}
            />
            <Bar dataKey="count" radius={0} stroke="#1a1a1a" strokeWidth={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={CCD_COLOURS[i % CCD_COLOURS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top cities */}
      {topCities.length > 0 && (
        <div className="border-4 border-ink bg-cream p-4">
          <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-3">Top Cities</p>
          <div className="space-y-2">
            {topCities.map(([city, count], i) => {
              const max = topCities[0][1];
              return (
                <div key={city} className="flex items-center gap-3">
                  <span className="font-display text-xs w-24 truncate text-ink uppercase">{city}</span>
                  <div className="flex-1 bg-ink/10 border border-ink h-5 relative overflow-hidden">
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${(count / max) * 100}%`,
                        background: CCD_COLOURS[i % CCD_COLOURS.length],
                      }}
                    />
                  </div>
                  <span className="font-display text-xs text-ink/60 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
