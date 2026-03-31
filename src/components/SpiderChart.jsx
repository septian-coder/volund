import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function SpiderChart({ categories }) {
  const data = categories.map(cat => ({
    subject: cat.label.split(' ')[0], // Simplify label for chart
    fullMark: cat.max,
    A: cat.score,
  }));

  return (
    <div style={{ width: '100%', height: 320, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="var(--border-subtle)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, opacity: 0.6 }} 
          />
          <Radar
            name="Score"
            dataKey="A"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="var(--accent)"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
