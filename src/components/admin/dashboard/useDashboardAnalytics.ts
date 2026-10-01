import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  startOfYear,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  parseISO,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export type TimeRangeOption =
  | '7d'
  | '14d'
  | '30d'
  | 'this_month'
  | '90d'
  | 'ytd'
  | 'all'
  | 'custom';

export interface GrowthDataPoint {
  label: string;
  dateKey: string;
  newUsers: number;
  cumulative: number;
}

export interface DayOfWeekDataPoint {
  day: string;
  count: number;
}

export interface ExpiringCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  account_type: string;
  expires_at: string;
  daysRemaining: number;
  isExpired: boolean;
}

export interface RecentUser {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  hasTeacherProfile: boolean;
}

export interface DashboardMetrics {
  totalUsers: number;
  periodNewUsers: number;
  userGrowthTrend: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  dailyAverageNewUsers: number;
  totalTeacherProfiles: number;
  activationRate: number;
  totalGenerationsAllTime: number;
  periodGenerations: number;
  generationGrowthTrend: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  allowedCustomerStats: {
    total: number;
    claimed: number;
    unclaimed: number;
    claimRate: number;
    byTier: Record<string, number>;
  };
}

export const useDashboardAnalytics = (
  timeRange: TimeRangeOption = '7d',
  customStartDate?: string,
  customEndDate?: string
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Raw states
  const [profiles, setProfiles] = useState<any[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<any[]>([]);
  const [allowedCustomers, setAllowedCustomers] = useState<any[]>([]);
  const [generationCountAllTime, setGenerationCountAllTime] = useState(0);
  const [generationCountPeriod, setGenerationCountPeriod] = useState(0);
  const [generationCountPrevPeriod, setGenerationCountPrevPeriod] = useState(0);

  // 1. Calculate Date Bounds based on timeRange
  const dateBounds = useMemo(() => {
    const now = new Date();
    const todayEnd = endOfDay(now);

    let start = startOfDay(subDays(now, 6));
    let end = todayEnd;
    let prevStart = startOfDay(subDays(start, 7));
    let prevEnd = endOfDay(subDays(start, 1));
    let label = '7 Hari Terakhir';
    let comparisonLabel = '7 hari sebelumnya';

    switch (timeRange) {
      case '7d': {
        start = startOfDay(subDays(now, 6));
        end = todayEnd;
        prevStart = startOfDay(subDays(start, 7));
        prevEnd = endOfDay(subDays(start, 1));
        label = '7 Hari Terakhir';
        comparisonLabel = 'vs 7 hari lalu';
        break;
      }
      case '14d': {
        start = startOfDay(subDays(now, 13));
        end = todayEnd;
        prevStart = startOfDay(subDays(start, 14));
        prevEnd = endOfDay(subDays(start, 1));
        label = '14 Hari Terakhir';
        comparisonLabel = 'vs 14 hari lalu';
        break;
      }
      case '30d': {
        start = startOfDay(subDays(now, 29));
        end = todayEnd;
        prevStart = startOfDay(subDays(start, 30));
        prevEnd = endOfDay(subDays(start, 1));
        label = '30 Hari Terakhir';
        comparisonLabel = 'vs 30 hari lalu';
        break;
      }
      case 'this_month': {
        start = startOfMonth(now);
        end = todayEnd;
        const daysInPeriod = differenceInDays(end, start) + 1;
        prevStart = startOfMonth(subMonths(now, 1));
        prevEnd = endOfDay(subDays(start, 1));
        label = format(now, 'MMMM yyyy', { locale: idLocale });
        comparisonLabel = 'vs bulan lalu';
        break;
      }
      case '90d': {
        start = startOfDay(subDays(now, 89));
        end = todayEnd;
        prevStart = startOfDay(subDays(start, 90));
        prevEnd = endOfDay(subDays(start, 1));
        label = '3 Bulan Terakhir';
        comparisonLabel = 'vs 3 bln lalu';
        break;
      }
      case 'ytd': {
        start = startOfYear(now);
        end = todayEnd;
        prevStart = startOfYear(subDays(start, 365));
        prevEnd = endOfDay(subDays(start, 1));
        label = `Tahun ${now.getFullYear()}`;
        comparisonLabel = 'vs tahun lalu';
        break;
      }
      case 'all': {
        start = new Date('2024-01-01');
        end = todayEnd;
        prevStart = new Date('2023-01-01');
        prevEnd = new Date('2023-12-31');
        label = 'Semua Waktu';
        comparisonLabel = 'total';
        break;
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          start = startOfDay(parseISO(customStartDate));
          end = endOfDay(parseISO(customEndDate));
          const diffDays = Math.max(1, differenceInDays(end, start) + 1);
          prevStart = startOfDay(subDays(start, diffDays));
          prevEnd = endOfDay(subDays(start, 1));
          label = `${format(start, 'dd MMM yy', { locale: idLocale })} - ${format(end, 'dd MMM yy', { locale: idLocale })}`;
          comparisonLabel = `vs ${diffDays} hari lalu`;
        }
        break;
      }
    }

    return { start, end, prevStart, prevEnd, label, comparisonLabel };
  }, [timeRange, customStartDate, customEndDate]);

  // 2. Fetch Data from Supabase
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { start, end, prevStart, prevEnd } = dateBounds;

      const [
        profilesRes,
        teacherProfilesRes,
        allowedCustomersRes,
        totalGenerationsRes,
        periodGenerationsRes,
        prevPeriodGenerationsRes,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, display_name, email, created_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('teacher_profiles')
          .select('id, user_id, name, created_at'),
        supabase
          .from('allowed_customers')
          .select('id, name, email, phone, account_type, subscription_expires_at, is_claimed, created_at'),
        supabase
          .from('generation_logs')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('generation_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase
          .from('generation_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString()),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (teacherProfilesRes.data) setTeacherProfiles(teacherProfilesRes.data);
      if (allowedCustomersRes.data) setAllowedCustomers(allowedCustomersRes.data);
      setGenerationCountAllTime(totalGenerationsRes.count || 0);
      setGenerationCountPeriod(periodGenerationsRes.count || 0);
      setGenerationCountPrevPeriod(prevPeriodGenerationsRes.count || 0);
    } catch (err) {
      console.error('Error fetching admin dashboard analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateBounds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. Process Computed Metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const { start, end, prevStart, prevEnd, comparisonLabel } = dateBounds;
    const totalUsers = profiles.length;

    // Filter period new users
    const periodUsers = profiles.filter((p) => {
      const created = new Date(p.created_at);
      return created >= start && created <= end;
    });

    const prevPeriodUsers = profiles.filter((p) => {
      const created = new Date(p.created_at);
      return created >= prevStart && created <= prevEnd;
    });

    const periodNewUsers = periodUsers.length;
    const prevUsersCount = prevPeriodUsers.length;

    // Calculate Growth Trend
    let userGrowthPercent = 0;
    if (prevUsersCount === 0) {
      userGrowthPercent = periodNewUsers > 0 ? 100 : 0;
    } else {
      userGrowthPercent = Math.round(((periodNewUsers - prevUsersCount) / prevUsersCount) * 100);
    }

    // Daily Average New Users
    const daysInPeriod = Math.max(1, differenceInDays(end, start) + 1);
    const dailyAverageNewUsers = Number((periodNewUsers / daysInPeriod).toFixed(1));

    // Activation Rate (% of users with teacher profile)
    const uniqueUsersWithProfile = new Set(teacherProfiles.map((tp) => tp.user_id));
    const activationRate =
      totalUsers > 0
        ? Math.round((uniqueUsersWithProfile.size / totalUsers) * 100)
        : 0;

    // Generations Growth Trend
    let genGrowthPercent = 0;
    if (generationCountPrevPeriod === 0) {
      genGrowthPercent = generationCountPeriod > 0 ? 100 : 0;
    } else {
      genGrowthPercent = Math.round(
        ((generationCountPeriod - generationCountPrevPeriod) / generationCountPrevPeriod) * 100
      );
    }

    // Allowed customer breakdown
    const claimedCount = allowedCustomers.filter((c) => c.is_claimed).length;
    const byTier: Record<string, number> = {};
    allowedCustomers.forEach((c) => {
      const tier = c.account_type || 'lainnya';
      byTier[tier] = (byTier[tier] || 0) + 1;
    });

    return {
      totalUsers,
      periodNewUsers,
      userGrowthTrend: {
        value: userGrowthPercent,
        isPositive: userGrowthPercent >= 0,
        label: comparisonLabel,
      },
      dailyAverageNewUsers,
      totalTeacherProfiles: teacherProfiles.length,
      activationRate,
      totalGenerationsAllTime: generationCountAllTime,
      periodGenerations: generationCountPeriod,
      generationGrowthTrend: {
        value: genGrowthPercent,
        isPositive: genGrowthPercent >= 0,
        label: comparisonLabel,
      },
      allowedCustomerStats: {
        total: allowedCustomers.length,
        claimed: claimedCount,
        unclaimed: allowedCustomers.length - claimedCount,
        claimRate: allowedCustomers.length > 0
          ? Math.round((claimedCount / allowedCustomers.length) * 100)
          : 0,
        byTier,
      },
    };
  }, [
    profiles,
    teacherProfiles,
    allowedCustomers,
    generationCountAllTime,
    generationCountPeriod,
    generationCountPrevPeriod,
    dateBounds,
  ]);

  // 4. Time-series Chart Data for Recharts
  const chartData = useMemo(() => {
    const { start, end } = dateBounds;
    const diffDays = differenceInDays(end, start) + 1;

    let growthSeries: GrowthDataPoint[] = [];

    if (diffDays <= 35) {
      // Daily Buckets
      const days = eachDayOfInterval({ start, end });
      growthSeries = days.map((day) => {
        const dStart = startOfDay(day);
        const dEnd = endOfDay(day);
        const dateKey = format(day, 'yyyy-MM-dd');
        const label = format(day, 'd MMM', { locale: idLocale });

        const newUsers = profiles.filter((p) => {
          const c = new Date(p.created_at);
          return c >= dStart && c <= dEnd;
        }).length;

        const cumulative = profiles.filter((p) => {
          const c = new Date(p.created_at);
          return c <= dEnd;
        }).length;

        return { label, dateKey, newUsers, cumulative };
      });
    } else if (diffDays <= 120) {
      // Weekly Buckets
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      growthSeries = weeks.map((week, idx) => {
        const wStart = startOfDay(week);
        let wEnd = endOfDay(endOfWeek(week, { weekStartsOn: 1 }));
        if (wEnd > end) wEnd = end;

        const label = `Pekan ${idx + 1} (${format(wStart, 'd/M')})`;
        const dateKey = format(wStart, 'yyyy-MM-dd');

        const newUsers = profiles.filter((p) => {
          const c = new Date(p.created_at);
          return c >= wStart && c <= wEnd;
        }).length;

        const cumulative = profiles.filter((p) => {
          const c = new Date(p.created_at);
          return c <= wEnd;
        }).length;

        return { label, dateKey, newUsers, cumulative };
      });
    } else {
      // Monthly Buckets
      const months = eachMonthOfInterval({ start, end });
      growthSeries = months.map((month) => {
        const mStart = startOfMonth(month);
        const mEnd = endOfDay(new Date(month.getFullYear(), month.getMonth() + 1, 0));
        const label = format(month, 'MMM yy', { locale: idLocale });
        const dateKey = format(month, 'yyyy-MM');

        const newUsers = profiles.filter((p) => {
          const c = new Date(p.created_at);
          return c >= mStart && c <= mEnd;
        }).length;

        const cumulative = profiles.filter((p) => {
          const c = new Date(p.created_at);
          return c <= mEnd;
        }).length;

        return { label, dateKey, newUsers, cumulative };
      });
    }

    // Peak Registration Point
    let peakRegistration = { label: '-', count: 0 };
    if (growthSeries.length > 0) {
      const sortedByNew = [...growthSeries].sort((a, b) => b.newUsers - a.newUsers);
      if (sortedByNew[0].newUsers > 0) {
        peakRegistration = { label: sortedByNew[0].label, count: sortedByNew[0].newUsers };
      }
    }

    // Day of Week Distribution (Mon - Sun)
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    // Filter profiles in current period for day distribution
    profiles.forEach((p) => {
      const c = new Date(p.created_at);
      if (c >= start && c <= end) {
        // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
        const jsDay = c.getDay();
        const index = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0 ... Sun=6
        dayCounts[index] += 1;
      }
    });

    const dayOfWeekDistribution: DayOfWeekDataPoint[] = dayNames.map((day, i) => ({
      day,
      count: dayCounts[i],
    }));

    return {
      growthSeries,
      peakRegistration,
      dayOfWeekDistribution,
    };
  }, [profiles, dateBounds]);

  // 5. Expiring Customers (Watchlist for the next 30 days)
  const expiringCustomers = useMemo((): ExpiringCustomer[] => {
    const now = new Date();
    const thirtyDaysLater = subDays(now, -30);

    const list: ExpiringCustomer[] = [];

    allowedCustomers.forEach((cust) => {
      if (!cust.subscription_expires_at) return;
      const expDate = new Date(cust.subscription_expires_at);
      const isExpired = expDate < now;
      const isExpiringSoon = expDate >= now && expDate <= thirtyDaysLater;

      if (isExpired || isExpiringSoon) {
        const daysRemaining = differenceInDays(expDate, now);
        list.push({
          id: cust.id,
          name: cust.name || 'Pengguna',
          email: cust.email,
          phone: cust.phone,
          account_type: cust.account_type || 'tahunan',
          expires_at: cust.subscription_expires_at,
          daysRemaining,
          isExpired,
        });
      }
    });

    // Sort: Expiring soonest first, then expired
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [allowedCustomers]);

  // 6. Recent Users (10 Latest Registered Users)
  const recentUsers = useMemo((): RecentUser[] => {
    const teacherUserIds = new Set(teacherProfiles.map((tp) => tp.user_id));
    const sorted = [...profiles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sorted.slice(0, 10).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      display_name: p.display_name,
      email: p.email,
      created_at: p.created_at,
      hasTeacherProfile: teacherUserIds.has(p.user_id),
    }));
  }, [profiles, teacherProfiles]);

  // 7. Export Data to CSV
  const exportToCSV = useCallback(() => {
    const { label } = dateBounds;
    const filename = `pertumbuhan-pengguna-modulajar-${timeRange}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;

    const headers = ['Periode / Tanggal', 'Pengguna Baru', 'Total Kumulatif'];
    const rows = chartData.growthSeries.map((item) => [
      `"${item.label}"`,
      item.newUsers,
      item.cumulative,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [chartData, dateBounds, timeRange]);

  return {
    isLoading,
    isRefreshing,
    dateBounds,
    metrics,
    chartData,
    expiringCustomers,
    recentUsers,
    refetch: () => fetchData(true),
    exportToCSV,
  };
};
