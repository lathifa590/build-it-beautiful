import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UserSegmentationCardProps {
  allowedStats: {
    total: number;
    claimed: number;
    unclaimed: number;
    claimRate: number;
    byTier: Record<string, number>;
  };
  totalUsers: number;
  totalTeacherProfiles: number;
  activationRate: number;
}

const TIER_COLORS: Record<string, string> = {
  lifetime: '#ea580c', // primary orange
  annual: '#0284c7',   // blue
  tahunan: '#0284c7',
  trial: '#8b5cf6',    // purple
  sekolah: '#10b981',  // emerald
  agency: '#f59e0b',   // amber
  lainnya: '#64748b',  // slate
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border-2 border-foreground rounded-lg p-2 shadow-brutal-sm text-xs">
        <p className="font-extrabold uppercase text-foreground">{data.name}</p>
        <p className="text-muted-foreground font-semibold">
          {data.value} Lisensi ({((data.value / (data.payload.totalAll || 1)) * 100).toFixed(0)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const UserSegmentationCard: React.FC<UserSegmentationCardProps> = ({
  allowedStats,
  totalUsers,
  totalTeacherProfiles,
  activationRate,
}) => {
  // Build chart items from byTier
  const tierEntries = Object.entries(allowedStats.byTier);
  const totalTiers = tierEntries.reduce((acc, [, val]) => acc + val, 0);

  const pieData = tierEntries.map(([tier, count]) => {
    let cleanName = tier;
    if (tier === 'annual' || tier === 'tahunan') cleanName = 'Tahunan';
    else if (tier === 'lifetime') cleanName = 'Lifetime';
    else if (tier === 'trial') cleanName = 'Trial';

    return {
      name: cleanName,
      value: count,
      totalAll: totalTiers,
      color: TIER_COLORS[tier.toLowerCase()] || '#64748b',
    };
  });

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 md:p-6 shadow-brutal flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Segmentasi & Onboarding
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Komposisi lisensi dan kesiapan profil guru
          </p>
        </div>
      </div>

      {/* Onboarding Activation Funnel */}
      <div className="space-y-2 p-3 bg-secondary/40 border border-foreground/20 rounded-lg">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5 text-foreground">
            <UserCheck className="w-4 h-4 text-primary" /> Tingkat Aktivasi Profil Guru
          </span>
          <span className="text-primary font-extrabold text-sm">{activationRate}%</span>
        </div>
        <Progress value={activationRate} className="h-2.5 bg-secondary border border-foreground/30" />
        <p className="text-[11px] text-muted-foreground">
          {totalTeacherProfiles} profil aktif dari total {totalUsers} pengguna terdaftar.
        </p>
      </div>

      {/* License Claim Status */}
      <div className="space-y-2 p-3 bg-secondary/40 border border-foreground/20 rounded-lg">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5 text-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rasio Klaim Akun Pembeli
          </span>
          <span className="text-emerald-700 font-extrabold text-sm">
            {allowedStats.claimRate}%
          </span>
        </div>
        <Progress value={allowedStats.claimRate} className="h-2.5 bg-secondary border border-foreground/30" />
        <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
          <span>{allowedStats.claimed} Sudah Klaim</span>
          <span>{allowedStats.unclaimed} Belum Aktivasi</span>
        </div>
      </div>

      {/* Donut Chart / Tier breakdown */}
      {pieData.length > 0 ? (
        <div className="pt-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Distribusi Paket Lisensi ({allowedStats.total} Akun)
          </p>
          <div className="flex items-center gap-2">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={1.5} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 truncate text-muted-foreground font-medium">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0 border border-black/30"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-extrabold text-foreground ml-2">
                    {item.value} ({((item.value / (totalTiers || 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-xs text-muted-foreground italic">
          Belum ada data lisensi tercatat.
        </div>
      )}
    </div>
  );
};
