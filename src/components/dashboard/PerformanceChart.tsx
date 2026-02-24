import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ChartDataPoint {
  match: number;
  mapPressure: number;
  combat: number;
  survival: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <h3 className="text-base font-semibold mb-4">Performance Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
            <XAxis
              dataKey="match"
              tick={{ fontSize: 12, fill: "hsl(215 12% 55%)" }}
              axisLine={{ stroke: "hsl(220 15% 20%)" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "hsl(215 12% 55%)" }}
              axisLine={{ stroke: "hsl(220 15% 20%)" }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(220 18% 12% / 0.95)",
                border: "1px solid hsl(220 15% 25%)",
                borderRadius: "8px",
                backdropFilter: "blur(8px)",
              }}
              labelStyle={{ color: "hsl(210 20% 92%)" }}
            />
            <Line
              type="monotone" dataKey="mapPressure" name="Map Pressure"
              stroke="hsl(200 70% 55%)" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: "hsl(200 70% 55%)" }}
            />
            <Line
              type="monotone" dataKey="combat" name="Combat"
              stroke="hsl(280 45% 55%)" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: "hsl(280 45% 55%)" }}
            />
            <Line
              type="monotone" dataKey="survival" name="Survival"
              stroke="hsl(142 55% 45%)" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: "hsl(142 55% 45%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PerformanceChart;
