import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Plus, Pencil, Trash2, Search, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VeiculoDB } from '@/types/vehicle';
import { useToast } from '@/hooks/use-toast';

interface VehicleManagementProps {
  vehicles: VeiculoDB[];
  onAddVehicle: (vehicle: { codigo: string; proprietario: string; modelo: string; cor: string; status: boolean; tag: string; tipo: string; marca: string }) => Promise<any>;
  onUpdateVehicle: (id: string, updates: Partial<VeiculoDB>) => Promise<any>;
  onDeleteVehicle: (id: string) => Promise<any>;
}

const emptyForm = { codigo: '', modelo: '', cor: '', proprietario: '', status: true, tag: '', tipo: 'carro', marca: '' };

export function VehicleManagement({ vehicles, onAddVehicle, onUpdateVehicle, onDeleteVehicle }: VehicleManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VeiculoDB | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingVehicle(null);
  };

  const handleOpenDialog = (vehicle?: VeiculoDB) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        codigo: vehicle.codigo,
        modelo: vehicle.modelo,
        cor: vehicle.cor || '',
        proprietario: vehicle.proprietario,
        status: vehicle.status,
        tag: vehicle.tag || '',
        tipo: vehicle.tipo || 'carro',
        marca: vehicle.marca || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = editingVehicle
      ? await onUpdateVehicle(editingVehicle.id, formData)
      : await onAddVehicle(formData);

    if (error) {
      const msg = error.message?.includes('veiculos_tag_unique')
        ? 'Este número de TAG já está cadastrado.'
        : error.message;
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } else {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este veículo?')) {
      await onDeleteVehicle(id);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (!searchTerm) return true;
    const term = searchTerm.toUpperCase();
    return v.codigo.toUpperCase().includes(term) || (v.tag?.toUpperCase().includes(term) ?? false);
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            Veículos Autorizados
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
                <DialogDescription>
                  {editingVehicle ? 'Atualize as informações do veículo.' : 'Preencha os dados para cadastrar um novo veículo.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag">Nº da TAG</Label>
                    <Input id="tag" placeholder="000123" value={formData.tag} onChange={(e) => setFormData(p => ({ ...p, tag: e.target.value.toUpperCase() }))} className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(val) => setFormData(p => ({ ...p, tipo: val }))}>
                      <SelectTrigger id="tipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carro">Carro</SelectItem>
                        <SelectItem value="moto">Moto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Placa *</Label>
                    <Input id="codigo" placeholder="ABC-1234" value={formData.codigo} onChange={(e) => setFormData(p => ({ ...p, codigo: e.target.value.toUpperCase() }))} required className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input id="marca" placeholder="Toyota" value={formData.marca} onChange={(e) => setFormData(p => ({ ...p, marca: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input id="modelo" placeholder="Corolla" value={formData.modelo} onChange={(e) => setFormData(p => ({ ...p, modelo: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input id="cor" placeholder="Prata" value={formData.cor} onChange={(e) => setFormData(p => ({ ...p, cor: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proprietario">Proprietário *</Label>
                  <Input id="proprietario" placeholder="Nome do proprietário" value={formData.proprietario} onChange={(e) => setFormData(p => ({ ...p, proprietario: e.target.value }))} required />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Acesso ativo</Label>
                  <Switch id="status" checked={formData.status} onCheckedChange={(checked) => setFormData(p => ({ ...p, status: checked }))} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editingVehicle ? 'Salvar' : 'Cadastrar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por TAG ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Car className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">{searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}</p>
            {!searchTerm && <p className="text-xs">Clique em Adicionar para começar</p>}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TAG</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead className="hidden md:table-cell">Marca/Modelo</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium">{v.tag || '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs">
                        {v.tipo === 'moto' ? <Bike className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
                        {v.tipo === 'moto' ? 'Moto' : 'Carro'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{v.codigo}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {v.marca} {v.modelo}
                      {v.cor && <span className="text-xs ml-1">({v.cor})</span>}
                    </TableCell>
                    <TableCell>{v.proprietario}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        v.status ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {v.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
