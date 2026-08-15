import { Users, FileText, School, ThumbsUp } from 'lucide-react';

const stats = [
  {
    value: '100+',
    label: 'Guru Terdaftar',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    value: '1.000+',
    label: 'Dokumen Dibuat',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    value: '50+',
    label: 'Sekolah',
    icon: School,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    value: '98%',
    label: 'Kepuasan Pengguna',
    icon: ThumbsUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export const StatsSection = () => {
  return (
    <section className="py-12 md:py-16 bg-muted/50 border-y-2 border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 ${stat.bgColor} rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 md:w-7 md:h-7 ${stat.color}`} />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
