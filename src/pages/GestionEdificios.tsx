
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, FilterIcon, PlusIcon, SearchIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AddGestionDialog from "@/components/AddGestionDialog";
import EditGestionDialog from "@/components/EditGestionDialog";
import { useToast } from "@/components/ui/use-toast";

interface GestionItem {
  id: string;
  legalrepresentative: string;
  buildingtype: string;
  buildingaddress: string;
  mesrenting: number;
  fechapago: string;
  estadopago: string;
  created_at: string;
  updated_at: string;
}

const GestionEdificios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GestionItem | null>(null);
  const { toast } = useToast();

  const { data: gestionItems, isLoading, refetch } = useQuery({
    queryKey: ['gestion', monthFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('gestion')
        .select('*')
        .order('fechapago', { ascending: false });

      // Filter by month if selected
      if (monthFilter !== 'all') {
        const year = new Date().getFullYear();
        const month = parseInt(monthFilter);
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        query = query
          .gte('fechapago', format(startDate, 'yyyy-MM-dd'))
          .lte('fechapago', format(endDate, 'yyyy-MM-dd'));
      }

      // Filter by status if selected
      if (statusFilter !== 'all') {
        query = query.eq('estadopago', statusFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching gestion data:', error);
        throw error;
      }
      
      return data as GestionItem[];
    },
  });

  const handleConfirmPayment = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('gestion')
        .update({ 
          estadopago: 'Pago confirmado',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error confirming payment:', error);
        toast({
          title: "Error",
          description: "No se pudo confirmar el pago. Intenta nuevamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Pago confirmado",
        description: "El estado del pago ha sido actualizado exitosamente.",
      });

      refetch();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago confirmado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pago confirmado</Badge>;
      case 'En fecha/No pagado':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En fecha/No pagado</Badge>;
      case 'No en fecha':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">No en fecha</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const months = [
    { value: 'all', label: 'Todos los meses' },
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
  ];

  const filteredItems = gestionItems?.filter(item =>
    item.legalrepresentative.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.buildingtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.buildingaddress.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Gestión de Edificios
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Administra los pagos de renta y estado de edificios instalados
              </p>
            </div>
            
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Edificio
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por representante legal, tipo de edificio o dirección..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-48">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Pago confirmado">Pago confirmado</SelectItem>
                    <SelectItem value="En fecha/No pagado">En fecha/No pagado</SelectItem>
                    <SelectItem value="No en fecha">No en fecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Lista de Edificios ({filteredItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Representante Legal</TableHead>
                    <TableHead>Tipo de Edificio</TableHead>
                    <TableHead>Dirección del Edificio</TableHead>
                    <TableHead>Mes Renting</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Estado del Pago</TableHead>
                    <TableHead>Confirmar Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        No se encontraron edificios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.legalrepresentative}
                        </TableCell>
                        <TableCell>{item.buildingtype}</TableCell>
                        <TableCell>{item.buildingaddress}</TableCell>
                        <TableCell>{item.mesrenting}</TableCell>
                        <TableCell>
                          {format(new Date(item.fechapago), "dd 'de' MMMM, yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.estadopago)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleConfirmPayment(item.id)}
                            disabled={item.estadopago !== 'En fecha/No pagado'}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirmar Pago
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AddGestionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          refetch();
          setIsAddDialogOpen(false);
        }}
      />

      <EditGestionDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        onSuccess={() => {
          refetch();
          setEditingItem(null);
        }}
      />
    </div>
  );
};

export default GestionEdificios;
