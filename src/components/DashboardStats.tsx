import { Card, CardContent } from '@/components/ui/card';
import { Car, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { AccessLog, Vehicle } from '@/types/vehicle';

interface DashboardStatsProps {
  vehicles: Vehicle[];
  logs: AccessLog[];
}

export function DashboardStats({ vehicles, logs }: DashboardStatsProps) {
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const todayLogs = logs.filter(log => {
    const today = new Date();
    const logDate = new Date(log.timestamp);
    return logDate.toDateString() === today.toDateString();
  });
  const todayGranted = todayLogs.filter(l => l.accessGranted).length;
  const todayDenied = todayLogs.filter(l => !l.accessGranted).length;

  const stats = [
    {
      label: 'Veículos Ativos',
      value: activeVehicles,
      total: vehicles.length,
      icon: Car,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Acessos Hoje',
      value: todayGranted,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Negados Hoje',
      value: todayDenied,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Total Registros',
      value: logs.length,
      icon: Clock,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stat.value}
                  {stat.total !== undefined && (
                    <span className="text-sm text-muted-foreground font-normal">
                      /{stat.total}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
