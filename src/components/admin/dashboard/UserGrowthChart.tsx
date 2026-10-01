import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { GrowthDataPoint, DayOfWeekDataPoint } from './useDashboardAnalytics';
import { TrendingUp, Users, Calendar, Award } from 'lucide-react';

interface UserGrowthChartProps {
  growthSeries: GrowthDataPoint[];
  dayOfWeekDistribution: DayOfWeekDataPoint[];
  peakRegistration: { label: string; count: number };
  dailyAverageNewUsers: number;
  periodNewUsers: number;
  activeLabel: string;
}

// Custom Tooltip component for Neo-Brutalist look
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border-2 border-foreground rounded-lg p-2.5 shadow-brutal-sm text-xs space-y-1">
        <p className="font-extrabold text-foreground border-b border-border/30 pb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: item.color || item.fill }}
              />
              {item.name}:
            </span>
            <span className="font-extrabold text-foreground">
              {Number(item.value).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  growthSeries,
  dayOfWeekDistribution,
  peakRegistration,
  dailyAverageNewUsers,
  periodNewUsers,
  activeLabel,
}) => {
  const [activeTab, setActiveTab] = useState<'new_users' | 'cumulative' | 'day_pattern'>('new_users');

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 md:p-6 shadow-brutal space-y-4">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-extrabold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Tren Pertumbuhan Pengguna
            </h2>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
              {activeLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analisis lonjakan pendaftaran dan pola adopsi pengguna
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-secondary border-2 border-foreground/20 rounded-lg gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('new_users')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'new_users'
                ? 'bg-card text-foreground shadow-sm border border-foreground/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pendaftaran Baru
          </button>
          <button
            onClick={() => setActiveTab('cumulative')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'cumulative'
                ? 'bg-card text-foreground shadow-sm border border-foreground/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Kumulatif
          </button>
          <button
            onClick={() => setActiveTab('day_pattern')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'day_pattern'
                ? 'bg-card text-foreground shadow-sm border border-foreground/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pola Hari
          </button>
        </div>
      </div>

      {/* Mini Insight Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="p-2.5 bg-secondary/40 border border-foreground/15 rounded-lg flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 text-primary rounded border border-primary/20">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Periode Ini</p>
            <p className="text-sm font-extrabold text-foreground">{periodNewUsers} Pengguna</p>
          </div>
        </div>

        <div className="p-2.5 bg-secondary/40 border border-foreground/15 rounded-lg flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-700 rounded border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Rata-rata Harian</p>
            <p className="text-sm font-extrabold text-foreground">{dailyAverageNewUsers} user/hari</p>
          </div>
        </div>

        <div className="p-2.5 bg-secondary/40 border border-foreground/15 rounded-lg flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <div className="p-1.5 bg-amber-500/10 text-amber-700 rounded border border-amber-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Puncak Tertinggi</p>
            <p className="text-sm font-extrabold text-foreground truncate">
              {peakRegistration.count > 0
                ? `${peakRegistration.count} user (${peakRegistration.label})`
                : 'Belum ada data'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[280px] md:h-[320px] w-full pt-2">
        {activeTab === 'new_users' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar
                name="Pengguna Baru"
                dataKey="newUsers"
                fill="url(#barGradient)"
                stroke="#ea580c"
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'cumulative' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                name="Total Kumulatif"
                dataKey="cumulative"
                stroke="#0284c7"
                strokeWidth={3}
                fill="url(#cumulativeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'day_pattern' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dayOfWeekDistribution}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="dayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar
                name="Jumlah Pendaftaran"
                dataKey="count"
                fill="url(#dayGradient)"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
