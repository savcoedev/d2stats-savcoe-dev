import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";

interface PlayerData {
  steam_id: string;
  persona_name: string;
  avg_map_pressure: number;
  avg_combat: number;
  avg_survival: number;
}

interface RadarComparisonProps {
  players: PlayerData[];
}

const COLORS = ["hsl(200 70% 55%)", "hsl(280 45% 55%)", "hsl(142 55% 45%)"];

const RadarComparison = ({ players }: RadarComparisonProps) => {
  const data = [
    { metric: "Map Pressure", ...Object.fromEntries(players.map((p, i) => [`p${i}`, p.avg_map_pressure])) },
    { metric: "Combat", ...Object.fromEntries(players.map((p, i) => [`p${i}`, p.avg_combat])) },
    { metric: "Survival", ...Object.fromEntries(players.map((p, i) => [`p${i}`, p.avg_survival])) },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-base font-semibold mb-4">Comparison Radar</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(220 15% 20%)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "hsl(215 12% 55%)" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} />
            {players.map((p, i) => (
              <Radar
                key={p.steam_id}
                name={p.persona_name}
                dataKey={`p${i}`}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Legend />
            <Tooltip
              contentStyle={{
                background: "hsl(220 18% 12% / 0.95)",
                border: "1px solid hsl(220 15% 25%)",
                borderRadius: "8px",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RadarComparison;
