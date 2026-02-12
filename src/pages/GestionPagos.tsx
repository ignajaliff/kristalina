import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import MobileDrawer from "@/components/MobileDrawer";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface GestionItem {
  id: string;
  cliente: any;
  data_presupuesto: any;
  data_contrato: any;
  mesrenting: number;
  fechapago: string;
  estadopago: string;
  created_at: string;
  updated_at: string;
  vendedor_id: string | null;
}

const GestionEdificios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GestionItem | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
            cliente: item.cliente,
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
        return <Badge className="bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7] hover:bg-[#F0FDF4] font-bold text-[10px] uppercase tracking-wider">Mes pagado</Badge>;
      case 'En fecha/No pagado':
        return <Badge className="bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2] hover:bg-[#FEF2F2] font-bold text-[10px] uppercase tracking-wider">En fecha/No pagado</Badge>;
      case 'No en fecha':
        return <Badge className="bg-[#F5F3FF] text-[#7C3AED] border-[#EDE9FE] hover:bg-[#F5F3FF] font-bold text-[10px] uppercase tracking-wider">No en fecha</Badge>;
      default:
        return <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">{status}</Badge>;
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

  const filteredItems = gestionItems?.filter(item => {
    const cliente = item.cliente || {};
    const searchLower = searchTerm.toLowerCase();
    return (
      (cliente.communityname || '').toLowerCase().includes(searchLower) ||
      (cliente.adminname || '').toLowerCase().includes(searchLower) ||
      (cliente.buildingaddress || '').toLowerCase().includes(searchLower)
    );
  }) || [];

  // Calculate stats
  const totalEdificios = filteredItems.length;
  const mesPagado = filteredItems.filter(item => item.estadopago === 'Mes pagado').length;
  const enFechaNoPagado = filteredItems.filter(item => item.estadopago === 'En fecha/No pagado').length;
  const noEnFecha = filteredItems.filter(item => item.estadopago === 'No en fecha').length;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="flex items-center gap-4">
            {isMobile && <MobileDrawer />}
            <div>
              <h1 className="text-2xl md:text-[26px] font-bold text-[#1E293B] tracking-tight leading-none mb-2">
                Gestión de Pagos
              </h1>
              <p className="text-sm font-medium text-[#64748B] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Administra los pagos de renta y estado de edificios instalados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="h-10 px-4 bg-[#1A367F] hover:bg-[#12285e] text-white font-bold text-xs gap-2 rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
              Registrar Edificio
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Edificios" value={totalEdificios.toString()} description="En gestión" icon={Building2} iconColor="text-[#1A367F]" iconBg="bg-[#F1F3F9]" />
          <StatCard title="Mes Pagado" value={mesPagado.toString()} description="Este período" icon={CheckCircle} iconColor="text-[#10B981]" iconBg="bg-[#F0FDF4]" />
          <StatCard title="En Fecha/No Pagado" value={enFechaNoPagado.toString()} description="En fecha" icon={Users} iconColor="text-[#F59E0B]" iconBg="bg-[#FFFBEB]" />
          <StatCard title="No en Fecha" value={noEnFecha.toString()} description="Requieren atención" icon={TrendingUp} iconColor="text-[#7C3AED]" iconBg="bg-[#F5F3FF]" />
        </div>

        {/* Filters Card */}
        <Card className="border border-[#E2E8F0] shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <Input placeholder="Buscar por comunidad, administrador o dirección..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-10 border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:ring-1 focus:ring-[#1A367F]" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 border-[#E2E8F0] bg-white text-xs font-semibold">
                    <div className="flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5 text-[#64748B]" /><SelectValue placeholder="Filtrar por mes" /></div>
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (<SelectItem key={month.value} value={month.value} className="text-xs">{month.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 border-[#E2E8F0] bg-white text-xs font-semibold">
                    <div className="flex items-center gap-2"><FilterIcon className="h-3.5 w-3.5 text-[#64748B]" /><SelectValue placeholder="Filtrar por estado" /></div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos los estados</SelectItem>
                    <SelectItem value="Mes pagado" className="text-xs">Mes pagado</SelectItem>
                    <SelectItem value="En fecha/No pagado" className="text-xs">En fecha/No pagado</SelectItem>
                    <SelectItem value="No en fecha" className="text-xs">No en fecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="border border-[#E2E8F0] shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1)] bg-white rounded-xl overflow-hidden">
          <CardHeader className="border-b border-[#F1F5F9] p-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]"><Building2 className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} /></div>
              <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Lista de Edificios ({filteredItems.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC] border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 pl-6">Comunidad</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4">Administrador</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 hidden md:table-cell">Dirección</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 hidden lg:table-cell">Renting</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 hidden lg:table-cell">Fecha Pago</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 text-center">Estado</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 text-right pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center"><div className="flex flex-col items-center justify-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1A367F]"></div><span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Cargando...</span></div></TableCell></TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-48 text-center"><div className="flex flex-col items-center justify-center gap-2"><Building2 className="h-8 w-8 text-[#E2E8F0]" /><p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">No se encontraron edificios</p><p className="text-[11px] text-[#94A3B8]">Intenta ajustar los filtros de búsqueda</p></div></TableCell></TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="group border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                        <TableCell className="py-4 pl-6"><p className="text-[13px] font-semibold text-[#1E293B]">{item.cliente?.communityname || 'N/A'}</p></TableCell>
                        <TableCell className="py-4"><p className="text-[12px] font-medium text-[#64748B]">{item.cliente?.adminname || 'N/A'}</p></TableCell>
                        <TableCell className="py-4 hidden md:table-cell"><p className="text-[12px] text-[#64748B] truncate max-w-[200px]">{item.cliente?.buildingaddress || 'N/A'}</p></TableCell>
                        <TableCell className="py-4 hidden lg:table-cell"><p className="text-[12px] font-semibold text-[#1E293B]">${item.mesrenting.toLocaleString()}</p></TableCell>
                        <TableCell className="py-4 hidden lg:table-cell"><p className="text-[12px] text-[#64748B]">{formatPaymentDate(item.fechapago)}</p></TableCell>
                        <TableCell className="py-4 text-center">{getStatusBadge(item.estadopago)}</TableCell>
                        <TableCell className="py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)} className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] rounded-md"><Edit className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => handleConfirmPayment(item.id)} disabled={item.estadopago !== 'En fecha/No pagado'} className={cn("h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all", item.estadopago === 'En fecha/No pagado' ? "border-[#10B981] text-[#10B981] hover:bg-[#F0FDF4]" : "border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed")}><CheckCircle className="h-3.5 w-3.5 mr-1" />Confirmar</Button>
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

      <AddGestionDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={() => { refetch(); setIsAddDialogOpen(false); }} />
      <EditGestionDialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)} item={editingItem} onSuccess={() => { refetch(); setEditingItem(null); }} />
    </div>
  );
};
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: typeof Building2;
  iconColor: string;
  iconBg: string;
}

const StatCard = ({ title, value, description, icon: Icon, iconColor, iconBg }: StatCardProps) => (
  <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white overflow-hidden transition-all hover:shadow-md">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-lg shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={2.5} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-[28px] font-bold text-[#1E293B] leading-tight truncate tracking-tight">
            {value}
          </h3>
        </div>
        <p className="text-[11px] font-medium text-[#64748B] tracking-tight">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default GestionEdificios;
