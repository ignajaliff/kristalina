
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
import { CalendarIcon, FilterIcon, PlusIcon, SearchIcon, CheckCircle, Building2, TrendingUp, Users, DollarSign, Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
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
      const item = gestionItems?.find(i => i.id === itemId);
      if (!item) {
        toast({
          title: "Error",
          description: "No se encontró el registro.",
          variant: "destructive",
        });
        return;
      }

      // Send webhook data
      const webhookUrl = "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/8cdde499-cc85-4d5a-b5b4-c40545844fdc";
      
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            id: item.id,
            legalrepresentative: item.legalrepresentative,
            buildingtype: item.buildingtype,
            buildingaddress: item.buildingaddress,
            mesrenting: item.mesrenting,
            fechapago: item.fechapago,
            estadopago: item.estadopago,
            created_at: item.created_at,
            updated_at: item.updated_at,
            action: "payment_confirmed",
            timestamp: new Date().toISOString()
          }),
        });
        
        console.log("Webhook sent successfully for payment confirmation");
      } catch (webhookError) {
        console.error("Error sending webhook:", webhookError);
        // Continue with the database update even if webhook fails
      }

      const { error } = await supabase
        .from('gestion')
        .update({ 
          estadopago: 'Mes pagado',
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
        description: "El estado del pago ha sido actualizado exitosamente y se ha enviado la notificación.",
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
      case 'Mes pagado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Mes pagado</Badge>;
      case 'En fecha/No pagado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">En fecha/No pagado</Badge>;
      case 'No en fecha':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">No en fecha</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Function to properly format date avoiding timezone issues
  const formatPaymentDate = (dateString: string) => {
    try {
      // Parse the date string and format it properly to avoid timezone shifts
      const date = parseISO(dateString + 'T00:00:00');
      return format(date, "dd 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
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

  // Calculate stats
  const totalEdificios = filteredItems.length;
  const mesPagado = filteredItems.filter(item => item.estadopago === 'Mes pagado').length;
  const enFechaNoPagado = filteredItems.filter(item => item.estadopago === 'En fecha/No pagado').length;
  const noEnFecha = filteredItems.filter(item => item.estadopago === 'No en fecha').length;

  return (
    <div className="min-h-screen bg-corporate-slate-50">
      <div className="flex w-full">
        <AdminSidebar />
        <div className="flex-1 overflow-hidden">
          <div className="h-screen overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-corporate-slate-900 mb-2">
                      Gestión de Edificios
                    </h1>
                    <p className="text-corporate-slate-600">
                      Administra los pagos de renta y estado de edificios instalados
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-corporate-blue-600 hover:bg-corporate-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                    size="lg"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Agregar Edificio
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-0 shadow-lg overflow-hidden stat-card-gradient-3 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium opacity-90 text-white">Total Edificios</p>
                        <p className="text-3xl font-bold mt-1 text-white">{totalEdificios}</p>
                        <p className="text-sm mt-2 opacity-80 text-white">En gestión</p>
                      </div>
                      <div className="rounded-full p-3 bg-white/20">
                        <Building2 className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg overflow-hidden stat-card-gradient-2 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium opacity-90 text-white">Mes Pagado</p>
                        <p className="text-3xl font-bold mt-1 text-white">{mesPagado}</p>
                        <p className="text-sm mt-2 opacity-80 text-white">Este período</p>
                      </div>
                      <div className="rounded-full p-3 bg-white/20">
                        <CheckCircle className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg overflow-hidden stat-card-gradient-4 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium opacity-90 text-white">En Fecha/No Pagado</p>
                        <p className="text-3xl font-bold mt-1 text-white">{enFechaNoPagado}</p>
                        <p className="text-sm mt-2 opacity-80 text-white">En fecha</p>
                      </div>
                      <div className="rounded-full p-3 bg-white/20">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg overflow-hidden stat-card-gradient-1 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium opacity-90 text-white">No en Fecha</p>
                        <p className="text-3xl font-bold mt-1 text-white">{noEnFecha}</p>
                        <p className="text-sm mt-2 opacity-80 text-white">Requieren atención</p>
                      </div>
                      <div className="rounded-full p-3 bg-white/20">
                        <TrendingUp className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="mb-8 border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-corporate-slate-400 h-5 w-5" />
                        <Input
                          placeholder="Buscar por representante legal, tipo de edificio o dirección..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 h-12 border-corporate-slate-200 focus:border-corporate-blue-500 focus:ring-corporate-blue-500"
                        />
                      </div>
                    </div>
                    
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger className="w-full lg:w-56 h-12 border-corporate-slate-200">
                        <CalendarIcon className="h-5 w-5 mr-2 text-corporate-slate-500" />
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
                      <SelectTrigger className="w-full lg:w-56 h-12 border-corporate-slate-200">
                        <FilterIcon className="h-5 w-5 mr-2 text-corporate-slate-500" />
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="Mes pagado">Mes pagado</SelectItem>
                        <SelectItem value="En fecha/No pagado">En fecha/No pagado</SelectItem>
                        <SelectItem value="No en fecha">No en fecha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-corporate-slate-100 bg-corporate-slate-50 p-6">
                  <CardTitle className="text-xl font-semibold text-corporate-slate-900 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-corporate-blue-600" />
                    Lista de Edificios ({filteredItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-corporate-slate-50/50 hover:bg-corporate-slate-50/50">
                          <TableHead className="font-semibold text-corporate-slate-700 py-4">Representante Legal</TableHead>
                          <TableHead className="font-semibold text-corporate-slate-700 py-4">Tipo de Edificio</TableHead>
                          <TableHead className="font-semibold text-corporate-slate-700 py-4">Dirección del Edificio</TableHead>
                          <TableHead className="font-semibold text-corporate-slate-700 py-4">Mes Renting</TableHead>
                          <TableHead className="font-semibold text-corporate-slate-700 py-4">Fecha de Pago</TableHead>
                          <TableHead className="font-semibold text-corporate-slate-700 py-4">Estado del Pago</TableHead>
                          <TableHead className="font-semibold text-corporate-slate-700 py-4 text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-blue-600"></div>
                                <span className="ml-3 text-corporate-slate-600">Cargando...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="text-corporate-slate-500">
                                <Building2 className="h-12 w-12 mx-auto mb-4 text-corporate-slate-300" />
                                <p className="text-lg font-medium mb-2">No se encontraron edificios</p>
                                <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItems.map((item) => (
                            <TableRow 
                              key={item.id} 
                              className={`transition-colors duration-150 ${
                                item.estadopago === 'Mes pagado' 
                                  ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500' 
                                  : 'hover:bg-corporate-slate-50/50'
                              }`}
                            >
                              <TableCell className="font-medium text-corporate-slate-900 py-4">
                                {item.legalrepresentative}
                              </TableCell>
                              <TableCell className="text-corporate-slate-700 py-4">{item.buildingtype}</TableCell>
                              <TableCell className="text-corporate-slate-700 py-4">{item.buildingaddress}</TableCell>
                              <TableCell className="text-corporate-slate-700 py-4">{item.mesrenting}</TableCell>
                              <TableCell className="text-corporate-slate-700 py-4">
                                {formatPaymentDate(item.fechapago)}
                              </TableCell>
                              <TableCell className="py-4">
                                {getStatusBadge(item.estadopago)}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingItem(item)}
                                    className="border-corporate-slate-200 text-corporate-slate-700 hover:bg-corporate-slate-50"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleConfirmPayment(item.id)}
                                    disabled={item.estadopago !== 'En fecha/No pagado'}
                                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-corporate-slate-300"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirmar Pago
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
