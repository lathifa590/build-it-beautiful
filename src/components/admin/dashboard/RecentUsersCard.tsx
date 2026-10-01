import React from 'react';
import { RecentUser } from './useDashboardAnalytics';
import { Users, ArrowRight, UserCheck, UserX, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface RecentUsersCardProps {
  users: RecentUser[];
}

export const RecentUsersCard: React.FC<RecentUsersCardProps> = ({ users }) => {
  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 md:p-6 shadow-brutal space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Pendaftar Terbaru
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar pengguna yang baru bergabung dan status setup akun
          </p>
        </div>
        <a
          href="/admin/users"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span>Kelola Pengguna</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* List */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground italic">
            Belum ada pengguna terdaftar.
          </div>
        ) : (
          users.slice(0, 7).map((user) => {
            const timeAgo = formatDistanceToNow(new Date(user.created_at), {
              addSuffix: true,
              locale: idLocale,
            });
            const formattedDate = format(new Date(user.created_at), 'd MMM yyyy, HH:mm', {
              locale: idLocale,
            });

            // Initial letter
            const initial = (user.display_name || user.email || 'U')[0].toUpperCase();

            return (
              <div
                key={user.id}
                className="p-2.5 bg-secondary/30 border border-foreground/15 rounded-lg flex items-center justify-between gap-3 hover:border-foreground/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-foreground flex items-center justify-center font-extrabold text-primary text-sm flex-shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs md:text-sm text-foreground truncate">
                      {user.display_name || 'Pengguna Baru'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 text-right">
                  {user.hasTeacherProfile ? (
                    <Badge
                      variant="secondary"
                      className="hidden sm:inline-flex text-[10px] py-0 px-2 h-5 font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 gap-1"
                    >
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>Profil Siap</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="hidden sm:inline-flex text-[10px] py-0 px-2 h-5 font-bold bg-slate-200 text-slate-700 border border-slate-300 gap-1"
                    >
                      <UserX className="w-3 h-3 text-slate-500" />
                      <span>Belum Profil</span>
                    </Badge>
                  )}

                  <div className="text-right">
                    <p className="text-[11px] font-bold text-foreground capitalize">{timeAgo}</p>
                    <p className="text-[10px] text-muted-foreground hidden md:block">{formattedDate}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
