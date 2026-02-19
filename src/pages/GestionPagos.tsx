import { useState, useMemo } from "react";
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
import { format, parseISO, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import AddGestionDialog from "@/components/AddGestionDialog";
import EditGestionDialog from "@/components/EditGestionDialog";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface PagoRecord {
  mes: number;
  fecha_pago: string;
  monto: number;
  pagado: boolean;
  factura_url: string | null;
  fecha_pago_real: string | null;
}

interface GestionItem {
  id: string;
  cliente: any;
  data_presupuesto: any;
  data_contrato: any;
  mesrenting: number;
  monto_renting: number | null;
  fechapago: string;
  estadopago: string;
  dia_pago: number | null;
  fecha_primera_factura: string | null;
  pagos_json: PagoRecord[] | null;
  created_at: string;
  updated_at: string;
  vendedor_id: string | null;
}

// Compute dynamic status based on today's date vs fecha_pago
const computeEstado = (pago: PagoRecord): string => {
  if (pago.pagado) return "Mes pagado";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = pago.fecha_pago.split("-").map(Number);
  const fechaPago = new Date(year, month - 1, day);
  // If today >= fecha_pago => "En fecha/No pagado" (payment is due or overdue)
  // If today < fecha_pago => "No en fecha" (not yet due)
  return today >= fechaPago ? "En fecha/No pagado" : "No en fecha";
};

// For each building, find the payment that corresponds to the selected month/year
// If "all", return the next pending payment
const getRelevantPago = (
  item: GestionItem,
  monthFilter: string,
  yearFilter: number
): { pago: PagoRecord | null; estadoDisplay: string } => {
  const pagos: PagoRecord[] = Array.isArray(item.pagos_json) ? item.pagos_json : [];

  if (pagos.length === 0) {
    return { pago: null, estadoDisplay: item.estadopago };
  }

  if (monthFilter === "all") {
    // Show next pending payment
    const nextPending = pagos.find(p => !p.pagado);
    if (!nextPending) {
      return { pago: pagos[pagos.length - 1], estadoDisplay: "Mes pagado" };
    }
    return {
      pago: nextPending,
      estadoDisplay: computeEstado(nextPending),
    };
  }

  // Find pago matching month+year
  const month = parseInt(monthFilter); // 0-indexed
  const targetPago = pagos.find(p => {
    try {
      const d = parseISO(p.fecha_pago + "T00:00:00");
      return getMonth(d) === month && getYear(d) === yearFilter;
    } catch {
      return false;
    }
  });

  if (!targetPago) return { pago: null, estadoDisplay: "Sin pago" };

  return {
    pago: targetPago,
    estadoDisplay: computeEstado(targetPago),
  };
};

const GestionEdificios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [yearFilter] = useState<number>(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GestionItem | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch ALL gestion items (no date filter at DB level — we filter client-side via pagos_json)
  const { data: gestionItems, isLoading, refetch } = useQuery({
    queryKey: ["gestion-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gestion")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown) as GestionItem[];
    },
  });

  const handleConfirmPayment = async (item: GestionItem, mes: number) => {
    try {
      const pagos: PagoRecord[] = Array.isArray(item.pagos_json) ? item.pagos_json : [];
      const updatedPagos = pagos.map(p =>
        p.mes === mes
          ? { ...p, pagado: true, fecha_pago_real: format(new Date(), "yyyy-MM-dd") }
          : p
      );

      // Next pending after marking this one
      const nextPending = updatedPagos.find(p => !p.pagado);

      const { error } = await supabase
        .from("gestion")
        .update({
          pagos_json: updatedPagos as any,
          estadopago: nextPending ? "No en fecha" : "Mes pagado",
          fechapago: nextPending ? nextPending.fecha_pago : item.fechapago,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      // Send webhook
      const webhookUrl =
        "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/8cdde499-cc85-4d5a-b5b4-c40545844fdc";
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          id: item.id,
          cliente: item.cliente,
          mes_pagado: mes,
          action: "payment_confirmed",
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);

      toast({
        title: "Pago confirmado",
        description: `Mes ${mes} marcado como pagado.`,
      });

      queryClient.invalidateQueries({ queryKey: ["gestion-all"] });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el pago.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Mes pagado":
        return (
          <Badge className="bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7] hover:bg-[#F0FDF4] font-bold text-[10px] uppercase tracking-wider">
            Mes pagado
          </Badge>
        );
      case "En fecha/No pagado":
        return (
          <Badge className="bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2] hover:bg-[#FEF2F2] font-bold text-[10px] uppercase tracking-wider">
            En fecha/No pagado
          </Badge>
        );
      case "No en fecha":
        return (
          <Badge className="bg-[#EFF6FF] text-[#38BDF8] border-[#BAE6FD] hover:bg-[#EFF6FF] font-bold text-[10px] uppercase tracking-wider">
            No en fecha
          </Badge>
        );
      case "Sin pago":
        return (
          <Badge className="bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] hover:bg-[#F1F5F9] font-bold text-[10px] uppercase tracking-wider">
            Sin pago
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">
            {status}
          </Badge>
        );
    }
  };

  const formatPaymentDate = (dateString: string) => {
    try {
      return format(parseISO(dateString + "T00:00:00"), "dd 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const months = [
    { value: "all", label: "Todos los meses" },
    { value: "0", label: "Enero" },
    { value: "1", label: "Febrero" },
    { value: "2", label: "Marzo" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Mayo" },
    { value: "5", label: "Junio" },
    { value: "6", label: "Julio" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Septiembre" },
    { value: "9", label: "Octubre" },
    { value: "10", label: "Noviembre" },
    { value: "11", label: "Diciembre" },
  ];

  // Build display rows: one per building, with the relevant pago for the selected month
  const displayRows = useMemo(() => {
    if (!gestionItems) return [];

    return gestionItems
      .map(item => {
        const { pago, estadoDisplay } = getRelevantPago(item, monthFilter, yearFilter);
        return { item, pago, estadoDisplay };
      })
      .filter(({ item, pago, estadoDisplay }) => {
        // If a specific month is selected and there's no payment for that month, hide the row
        if (monthFilter !== "all" && !pago) return false;

        // Status filter
        if (statusFilter !== "all") {
          if (statusFilter === "Mes pagado" && estadoDisplay !== "Mes pagado" && estadoDisplay !== "Al día") return false;
          if (statusFilter === "En fecha/No pagado" && estadoDisplay !== "En fecha/No pagado") return false;
          if (statusFilter === "No en fecha" && estadoDisplay !== "No en fecha") return false;
        }

        // Search filter
        const cliente = item.cliente || {};
        const searchLower = searchTerm.toLowerCase();
        return (
          (cliente.communityname || "").toLowerCase().includes(searchLower) ||
          (cliente.adminname || "").toLowerCase().includes(searchLower) ||
          (cliente.buildingaddress || "").toLowerCase().includes(searchLower)
        );
      });
  }, [gestionItems, monthFilter, yearFilter, statusFilter, searchTerm]);

  // Stats
  const totalEdificios = displayRows.length;
  const mesPagado = displayRows.filter(r => r.estadoDisplay === "Mes pagado").length;
  const enFecha = displayRows.filter(r => r.estadoDisplay === "En fecha/No pagado").length;
  const noEnFecha = displayRows.filter(r => r.estadoDisplay === "No en fecha").length;

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
          <StatCard title="En Fecha/No Pagado" value={enFecha.toString()} description="Por cobrar" icon={Users} iconColor="text-[#EF4444]" iconBg="bg-[#FEF2F2]" />
          <StatCard title="No en Fecha" value={noEnFecha.toString()} description="Aún no vencen" icon={TrendingUp} iconColor="text-[#38BDF8]" iconBg="bg-[#EFF6FF]" />
        </div>

        {/* Filters Card */}
        <Card className="border border-[#E2E8F0] shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <Input
                  placeholder="Buscar por comunidad, administrador o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:ring-1 focus:ring-[#1A367F]"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 border-[#E2E8F0] bg-white text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-[#64748B]" />
                      <SelectValue placeholder="Filtrar por mes" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value} className="text-xs">
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 border-[#E2E8F0] bg-white text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <FilterIcon className="h-3.5 w-3.5 text-[#64748B]" />
                      <SelectValue placeholder="Filtrar por estado" />
                    </div>
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
              <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <Building2 className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
                Lista de Edificios ({displayRows.length})
              </CardTitle>
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
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 hidden lg:table-cell">Mes</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 text-center">Estado</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 text-right pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1A367F]"></div>
                          <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Cargando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Building2 className="h-8 w-8 text-[#E2E8F0]" />
                          <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">No se encontraron edificios</p>
                          <p className="text-[11px] text-[#94A3B8]">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayRows.map(({ item, pago, estadoDisplay }) => (
                      <TableRow
                        key={item.id}
                        className="group border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <TableCell className="py-4 pl-6">
                          <p className="text-[13px] font-semibold text-[#1E293B]">{item.cliente?.communityname || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="text-[12px] font-medium text-[#64748B]">{item.cliente?.adminname || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden md:table-cell">
                          <p className="text-[12px] text-[#64748B] truncate max-w-[200px]">{item.cliente?.buildingaddress || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden lg:table-cell">
                          <p className="text-[12px] font-semibold text-[#1E293B]">
                            {item.monto_renting
                              ? `$${Number(item.monto_renting).toLocaleString()}`
                              : "N/A"}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 hidden lg:table-cell">
                          <p className="text-[12px] text-[#64748B]">
                            {pago ? formatPaymentDate(pago.fecha_pago) : "—"}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 hidden lg:table-cell">
                          <p className="text-[12px] text-[#64748B]">
                            {pago ? `Mes ${pago.mes}` : "—"}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          {getStatusBadge(estadoDisplay)}
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                              className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] rounded-md"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => pago && estadoDisplay === "En fecha/No pagado" && handleConfirmPayment(item, pago.mes)}
                              disabled={!pago || estadoDisplay !== "En fecha/No pagado"}
                              className={cn(
                                "h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                estadoDisplay === "En fecha/No pagado"
                                  ? "border-[#10B981] text-[#10B981] hover:bg-[#F0FDF4]"
                                  : "border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                              )}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Confirmar
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

      <AddGestionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["gestion-all"] });
          setIsAddDialogOpen(false);
        }}
      />
      <EditGestionDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["gestion-all"] });
          setEditingItem(null);
        }}
      />
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
        <h3 className="text-[28px] font-bold text-[#1E293B] leading-tight tracking-tight">{value}</h3>
        <p className="text-[11px] font-medium text-[#94A3B8]">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default GestionEdificios;
