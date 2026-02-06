import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Check, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogAcessoDB } from '@/types/vehicle';

interface AccessLogViewProps {
  logs: LogAcessoDB[];
  onClearLogs: () => void;
}

export function AccessLogView({ logs, onClearLogs }: AccessLogViewProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Log de Acessos
          </CardTitle>
          {logs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearLogs} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Nenhum registro de acesso</p>
            <p className="text-xs">Os acessos aparecerão aqui em tempo real</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead className="hidden sm:table-cell">Proprietário</TableHead>
                  <TableHead className="text-right">Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "transition-colors",
                      log.status_acesso === 'Autorizado' ? "hover:bg-success/5" : "hover:bg-destructive/5"
                    )}
                  >
                    <TableCell>
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full",
                        log.status_acesso === 'Autorizado' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      )}>
                        {log.status_acesso === 'Autorizado' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">{log.placa}</span>
                      {log.modelo && <span className="block text-xs text-muted-foreground">{log.modelo}</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {log.proprietario || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{formatTime(log.horario)}</span>
                      <span className="block text-xs text-muted-foreground">{formatDate(log.horario)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
