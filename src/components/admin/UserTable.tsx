import { MoreVertical, Edit, Trash2, Shield, User as UserIcon, Key } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface UserData {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

interface UserTableProps {
  users: UserData[];
  isLoading: boolean;
  onEditRole: (userId: string, newRole: 'admin' | 'user') => void;
  onDelete: (userId: string) => void;
  onResetPassword: (user: UserData) => void;
  currentUserId?: string;
}

export const UserTable = ({
  users,
  isLoading,
  onEditRole,
  onDelete,
  onResetPassword,
  currentUserId,
}: UserTableProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card border-2 border-foreground rounded-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-secondary rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card border-2 border-foreground rounded-xl p-8 text-center">
        <UserIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Belum ada pengguna terdaftar</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-foreground rounded-xl overflow-hidden shadow-brutal">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary border-b-2 border-foreground">
              <th className="text-left px-6 py-4 text-xs font-bold uppercase text-muted-foreground">
                Pengguna
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase text-muted-foreground">
                Email
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase text-muted-foreground">
                Role
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase text-muted-foreground">
                Bergabung
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold uppercase text-muted-foreground">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.id}
                className={`border-b border-foreground/10 hover:bg-secondary/50 transition-colors ${
                  index === users.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30">
                      <span className="text-sm font-bold text-primary">
                        {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.display_name || 'Tanpa Nama'}
                      </p>
                      {currentUserId === user.user_id && (
                        <span className="text-xs text-primary font-medium">(Anda)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {user.email || '-'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase border-2 ${
                      user.role === 'admin'
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-secondary text-muted-foreground border-foreground/20'
                    }`}
                  >
                    {user.role === 'admin' ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <UserIcon className="w-3 h-3" />
                    )}
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() =>
                          onEditRole(
                            user.user_id,
                            user.role === 'admin' ? 'user' : 'admin'
                          )
                        }
                        disabled={currentUserId === user.user_id}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {user.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onResetPassword(user)}
                        disabled={currentUserId === user.user_id}
                        className="cursor-pointer"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(user.user_id)}
                        disabled={currentUserId === user.user_id}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Pengguna
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
