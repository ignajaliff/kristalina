import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import MobileDrawer from "@/components/MobileDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, FilterIcon, PlusIcon, SearchIcon, CheckCircle, Building2, TrendingUp, Users, DollarSign, Edit, FileText, Send } from "lucide-react";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import AddGestionDialog from "@/components/AddGestionDialog";
import EditGestionDialog from "@/components/EditGestionDialog";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface PagoRecord {
  id?: string;
  mes: number;
  fecha_pago: string;
  monto: number;
  pagado: boolean;
  factura_url: string | null;
  fecha_pago_real: string | null;
  // Emisión de Factura fields
  fecha_emision?: string | null;
  fecha_confirmacion?: string | null;
  es_inmediato?: boolean;
}

interface GestionItem {
  id: string;
  communityname: string | null;
  adminname: string | null;
  adminemail: string | null;
  managementcompany: string | null;
  buildingaddress: string | null;
  comuna: string | null;
  region: string | null;
  buildingtype: string | null;
  units: number | null;
  additional_at: any;
  data_presupuesto: any;
  data_contrato: any;
  mesrenting: number;
  monto_renting: number | null;
  fechapago: string;
  estadopago: string;
  metodo_cobro: string;
  pagos: PagoRecord[] | null;
  created_at: string;
  updated_at: string;
  vendedor_id: string | null;
}

// Compute dynamic status based on today's date, metodo_cobro, and pago state
const computeEstado = (pago: PagoRecord, metodoCobro: string): string => {
  if (pago.pagado) return "Mes pagado";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = pago.fecha_pago.split("-").map(Number);
  const fechaPago = new Date(year, month - 1, day);

  // For "Emisión de Factura" method
  if (metodoCobro === "Emisión de Factura" && !pago.es_inmediato) {
    // If invoice was emitted
    if (pago.fecha_emision) {
      // Check if we've passed to the next month without payment
      const emisionDate = new Date(pago.fecha_emision + "T00:00:00");
      const nextMonth1st = new Date(emisionDate.getFullYear(), emisionDate.getMonth() + 1, 1);
      if (today >= nextMonth1st) {
        return "En fecha/No pagado"; // Overdue - emitted but not paid by next month
      }
      return "Factura Emitida";
    }
    // Not yet emitted - check if we've reached the payment date (1st of month)
    if (today >= fechaPago) {
      return "Factura no Emitida";
    }
    return "No en fecha";
  }

  // For "Inmediato" method (and first payment of Emisión de Factura)
  return today >= fechaPago ? "En fecha/No pagado" : "No en fecha";
};

const getRelevantPago = (
  item: GestionItem,
  monthFilter: string,
  yearFilter: number
): { pago: PagoRecord | null; estadoDisplay: string } => {
  const pagos: PagoRecord[] = Array.isArray(item.pagos)
    ? [...item.pagos].sort((a, b) => a.mes - b.mes)
    : [];

  if (pagos.length === 0) {
    return { pago: null, estadoDisplay: item.estadopago };
  }

  if (monthFilter === "all") {
    const nextPending = pagos.find(p => !p.pagado);
    if (!nextPending) {
      return { pago: pagos[pagos.length - 1], estadoDisplay: "Mes pagado" };
    }
    return {
      pago: nextPending,
      estadoDisplay: computeEstado(nextPending, item.metodo_cobro),
    };
  }

  const month = parseInt(monthFilter);
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
    estadoDisplay: computeEstado(targetPago, item.metodo_cobro),
  };
};

const GestionEdificios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [yearFilter] = useState<number>(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GestionItem | null>(null);
  // Confirmación de pago con factura
  const [confirmTarget, setConfirmTarget] = useState<{ item: GestionItem; mes: number; pago: PagoRecord | null; estadoDisplay: string } | null>(null);
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // Emitir factura: ahora requiere adjuntar el archivo de la factura
  const [emitTarget, setEmitTarget] = useState<{ item: GestionItem; mes: number } | null>(null);
  const [emitFile, setEmitFile] = useState<File | null>(null);
  const [isEmitting, setIsEmitting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: gestionItems, isLoading, refetch } = useQuery({
    queryKey: ["gestion-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gestion")
        .select("*, pagos(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown) as GestionItem[];
    },
  });

  // Abre el popup de confirmación de pago.
  const openConfirmDialog = (item: GestionItem, pago: PagoRecord, estadoDisplay: string) => {
    setConfirmTarget({ item, mes: pago.mes, pago, estadoDisplay });
    setFacturaFile(null);
  };

  const handleConfirmPayment = async () => {
    if (!confirmTarget) return;
    const { item, mes, pago, estadoDisplay } = confirmTarget;
    // Si la factura ya fue emitida/cargada (estado "Factura Emitida" o el pago ya
    // tiene factura_url), NO se pide archivo: solo se reconfirma el pago.
    const yaExisteFactura = estadoDisplay === "Factura Emitida" || !!pago?.factura_url;
    if (!yaExisteFactura && !facturaFile) return;
    setIsConfirming(true);
    try {
      // 1. Si hay que subir una factura nueva (caso sin factura previa), se sube.
      let facturaUrl = pago?.factura_url ?? null;
      if (!yaExisteFactura && facturaFile) {
        const ext = facturaFile.name.split(".").pop();
        const filePath = `facturas/${item.id}/mes-${mes}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("presupuestos-pdf")
          .upload(filePath, facturaFile, { upsert: true, contentType: facturaFile.type });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("presupuestos-pdf").getPublicUrl(filePath);
        facturaUrl = publicUrlData.publicUrl;
      }

      const hoy = format(new Date(), "yyyy-MM-dd");

      // 2. Marcar el pago (fila individual en la tabla `pagos`)
      const pagoUpdate: any = {
        pagado: true,
        fecha_pago_real: hoy,
        fecha_confirmacion: hoy,
        updated_at: new Date().toISOString(),
      };
      if (facturaUrl) pagoUpdate.factura_url = facturaUrl;
      const { error: pagoError } = await supabase
        .from("pagos")
        .update(pagoUpdate)
        .eq("gestion_id", item.id)
        .eq("mes", mes);
      if (pagoError) throw pagoError;

      // 3. Recalcular el resumen de la gestión (estado y próxima fecha de pago)
      const pagos: PagoRecord[] = Array.isArray(item.pagos)
        ? [...item.pagos].sort((a, b) => a.mes - b.mes)
        : [];
      const nextPending = pagos.find(p => p.mes !== mes && !p.pagado);

      const { error } = await supabase
        .from("gestion")
        .update({
          estadopago: nextPending ? "No en fecha" : "Mes pagado",
          fechapago: nextPending ? nextPending.fecha_pago : item.fechapago,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      const webhookUrl =
        "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/8cdde499-cc85-4d5a-b5b4-c40545844fdc";
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          id: item.id,
          cliente: {
            communityname: item.communityname,
            adminname: item.adminname,
            adminemail: item.adminemail,
            buildingaddress: item.buildingaddress,
            comuna: item.comuna,
            region: item.region,
            buildingtype: item.buildingtype,
            units: item.units,
            additional_at: item.additional_at,
          },
          mes_pagado: mes,
          action: "payment_confirmed",
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);

      toast({
        title: "Pago confirmado",
        description: `Mes ${mes} marcado como pagado y factura cargada.`,
      });

      queryClient.invalidateQueries({ queryKey: ["gestion-all"] });
      setConfirmTarget(null);
      setFacturaFile(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el pago.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Abre el popup para emitir factura (ahora requiere adjuntar el archivo).
  const openEmitDialog = (item: GestionItem, mes: number) => {
    setEmitTarget({ item, mes });
    setEmitFile(null);
  };

  const handleEmitInvoice = async () => {
    if (!emitTarget || !emitFile) return; // la factura es obligatoria para emitir
    const { item, mes } = emitTarget;
    setIsEmitting(true);
    try {
      // 1. Subir la factura a Storage.
      const ext = emitFile.name.split(".").pop();
      const filePath = `facturas/${item.id}/mes-${mes}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("presupuestos-pdf")
        .upload(filePath, emitFile, { upsert: true, contentType: emitFile.type });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("presupuestos-pdf").getPublicUrl(filePath);
      const facturaUrl = publicUrlData.publicUrl;

      // 2. Marcar la factura como emitida y guardar el archivo en el pago.
      const { error } = await supabase
        .from("pagos")
        .update({
          fecha_emision: format(new Date(), "yyyy-MM-dd"),
          factura_url: facturaUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("gestion_id", item.id)
        .eq("mes", mes);
      if (error) throw error;

      // TODO (pendiente): acá irá la automatización para enviar un email
      // informativo al cliente avisando que se emitió la factura del mes.

      toast({
        title: "Factura emitida",
        description: `Factura del mes ${mes} cargada y marcada como emitida.`,
      });

      queryClient.invalidateQueries({ queryKey: ["gestion-all"] });
      setEmitTarget(null);
      setEmitFile(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo emitir la factura.",
        variant: "destructive",
      });
    } finally {
      setIsEmitting(false);
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
      case "Factura no Emitida":
        return (
          <Badge className="bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A] hover:bg-[#FFFBEB] font-bold text-[10px] uppercase tracking-wider">
            Factura no Emitida
          </Badge>
        );
      case "Factura Emitida":
        return (
          <Badge className="bg-[#EFF6FF] text-[#3B82F6] border-[#BFDBFE] hover:bg-[#EFF6FF] font-bold text-[10px] uppercase tracking-wider">
            Factura Emitida
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

  const displayRows = useMemo(() => {
    if (!gestionItems) return [];

    return gestionItems
      .map(item => {
        const { pago, estadoDisplay } = getRelevantPago(item, monthFilter, yearFilter);
        return { item, pago, estadoDisplay };
      })
      .filter(({ item, pago, estadoDisplay }) => {
        if (monthFilter !== "all" && !pago) return false;

        if (statusFilter !== "all") {
          if (statusFilter === "Mes pagado" && estadoDisplay !== "Mes pagado" && estadoDisplay !== "Al día") return false;
          if (statusFilter === "En fecha/No pagado" && estadoDisplay !== "En fecha/No pagado") return false;
          if (statusFilter === "No en fecha" && estadoDisplay !== "No en fecha") return false;
          if (statusFilter === "Factura no Emitida" && estadoDisplay !== "Factura no Emitida") return false;
          if (statusFilter === "Factura Emitida" && estadoDisplay !== "Factura Emitida") return false;
        }

        const searchLower = searchTerm.toLowerCase();
        return (
          (item.communityname || "").toLowerCase().includes(searchLower) ||
          (item.adminname || "").toLowerCase().includes(searchLower) ||
          (item.buildingaddress || "").toLowerCase().includes(searchLower)
        );
      });
  }, [gestionItems, monthFilter, yearFilter, statusFilter, searchTerm]);

  const totalEdificios = displayRows.length;
  const mesPagado = displayRows.filter(r => r.estadoDisplay === "Mes pagado").length;
  const enFecha = displayRows.filter(r => r.estadoDisplay === "En fecha/No pagado").length;
  const noEnFecha = displayRows.filter(r => r.estadoDisplay === "No en fecha").length;
  const facturaNoEmitida = displayRows.filter(r => r.estadoDisplay === "Factura no Emitida").length;
  const facturaEmitida = displayRows.filter(r => r.estadoDisplay === "Factura Emitida").length;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Edificios" value={totalEdificios.toString()} description="En gestión" icon={Building2} iconColor="text-[#1A367F]" iconBg="bg-[#F1F3F9]" />
          <StatCard title="Mes Pagado" value={mesPagado.toString()} description="Este período" icon={CheckCircle} iconColor="text-[#10B981]" iconBg="bg-[#F0FDF4]" />
          <StatCard title="En Fecha/No Pagado" value={enFecha.toString()} description="Por cobrar" icon={Users} iconColor="text-[#EF4444]" iconBg="bg-[#FEF2F2]" />
          <StatCard title="No en Fecha" value={noEnFecha.toString()} description="Aún no vencen" icon={TrendingUp} iconColor="text-[#38BDF8]" iconBg="bg-[#EFF6FF]" />
          <StatCard title="Factura no Emitida" value={facturaNoEmitida.toString()} description="Pendiente emisión" icon={FileText} iconColor="text-[#F59E0B]" iconBg="bg-[#FFFBEB]" />
          <StatCard title="Factura Emitida" value={facturaEmitida.toString()} description="Esperando pago" icon={Send} iconColor="text-[#3B82F6]" iconBg="bg-[#EFF6FF]" />
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
                  <SelectTrigger className="w-full sm:w-[200px] h-10 border-[#E2E8F0] bg-white text-xs font-semibold">
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
                    <SelectItem value="Factura no Emitida" className="text-xs">Factura no Emitida</SelectItem>
                    <SelectItem value="Factura Emitida" className="text-xs">Factura Emitida</SelectItem>
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
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 hidden lg:table-cell">Método</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 text-center">Estado</TableHead>
                    <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest py-4 text-right pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1A367F]"></div>
                          <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Cargando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center">
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
                          <p className="text-[13px] font-semibold text-[#1E293B]">{item.communityname || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <p className="text-[12px] font-medium text-[#64748B]">{item.adminname || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden md:table-cell">
                          <p className="text-[12px] text-[#64748B] truncate max-w-[200px]">{item.buildingaddress || "N/A"}</p>
                        </TableCell>
                        <TableCell className="py-4 hidden lg:table-cell">
                          <p className="text-[12px] font-semibold text-[#1E293B]">
                            {item.monto_renting
                              ? (() => {
                                  const moneda = item.data_presupuesto?.datos_presupuesto?.moneda;
                                  if (moneda === "UF") return `${Number(item.monto_renting).toFixed(2)} UF`;
                                  return `$${Number(item.monto_renting).toLocaleString()}`;
                                })()
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
                        <TableCell className="py-4 hidden lg:table-cell">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                            {item.metodo_cobro || "Inmediato"}
                          </Badge>
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

                            {/* Emitir Factura button - only for "Factura no Emitida" state */}
                            {estadoDisplay === "Factura no Emitida" && pago && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEmitDialog(item, pago.mes)}
                                className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md border-[#F59E0B] text-[#F59E0B] hover:bg-[#FFFBEB] transition-all"
                              >
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                Emitir
                              </Button>
                            )}

                            {/* Confirmar button - for "En fecha/No pagado" and "Factura Emitida" */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => pago && openConfirmDialog(item, pago, estadoDisplay)}
                              disabled={!pago || (estadoDisplay !== "En fecha/No pagado" && estadoDisplay !== "Factura Emitida")}
                              className={cn(
                                "h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                (estadoDisplay === "En fecha/No pagado" || estadoDisplay === "Factura Emitida")
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

      {/* Confirmar pago */}
      {(() => {
        const yaExisteFactura = !!confirmTarget && (confirmTarget.estadoDisplay === "Factura Emitida" || !!confirmTarget.pago?.factura_url);
        return (
          <Dialog open={!!confirmTarget} onOpenChange={(open) => { if (!open && !isConfirming) { setConfirmTarget(null); setFacturaFile(null); } }}>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>Confirmar pago</DialogTitle>
                <DialogDescription>
                  {yaExisteFactura ? (
                    <>
                      La factura del {confirmTarget ? `mes ${confirmTarget.mes}` : "pago"} de{" "}
                      <strong>{confirmTarget?.item.communityname || "este edificio"}</strong> ya fue emitida y cargada.
                      ¿Confirmás que el cliente ya pagó este mes?
                    </>
                  ) : (
                    <>
                      Adjunta la factura del {confirmTarget ? `mes ${confirmTarget.mes}` : "pago"} de{" "}
                      <strong>{confirmTarget?.item.communityname || "este edificio"}</strong>. Quedará disponible en el Historial de Pagos.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              {yaExisteFactura ? (
                <div className="space-y-2 py-2">
                  {confirmTarget?.pago?.factura_url && (
                    <a
                      href={confirmTarget.pago.factura_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1A367F] hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> Ver factura cargada
                    </a>
                  )}
                  <p className="text-[11px] text-[#94A3B8]">
                    No hace falta volver a adjuntar la factura. Solo confirmá que el pago fue recibido.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <Label className="text-xs font-semibold text-[#64748B]">Factura *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setFacturaFile(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-[#94A3B8]">
                    Formatos: PDF, JPG, PNG, DOC. La factura es obligatoria para confirmar el pago.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => { setConfirmTarget(null); setFacturaFile(null); }} disabled={isConfirming}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isConfirming || (!yaExisteFactura && !facturaFile)}
                  className="bg-[#10B981] hover:bg-[#059669] text-white"
                >
                  {isConfirming ? "Confirmando..." : "Confirmar pago"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Emitir factura: requiere adjuntar la factura para pasar a "Factura Emitida" */}
      <Dialog open={!!emitTarget} onOpenChange={(open) => { if (!open && !isEmitting) { setEmitTarget(null); setEmitFile(null); } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Emitir factura</DialogTitle>
            <DialogDescription>
              Adjunta la factura del {emitTarget ? `mes ${emitTarget.mes}` : "pago"} de{" "}
              <strong>{emitTarget?.item.communityname || "este edificio"}</strong> para marcarla como emitida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold text-[#64748B]">Factura *</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setEmitFile(e.target.files?.[0] || null)}
              className="text-xs"
            />
            <p className="text-[11px] text-[#94A3B8]">
              La factura es obligatoria para emitir. Sin ella, no pasa al estado "Factura Emitida".
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEmitTarget(null); setEmitFile(null); }} disabled={isEmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleEmitInvoice}
              disabled={!emitFile || isEmitting}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              {isEmitting ? "Emitiendo..." : "Emitir factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <CardContent className="p-5">
      <div className="flex justify-between items-start mb-3">
        <div className={cn("p-2 rounded-lg shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} strokeWidth={2.5} />
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">{title}</p>
        <h3 className="text-[22px] font-bold text-[#1E293B] leading-tight tracking-tight">{value}</h3>
        <p className="text-[10px] font-medium text-[#94A3B8]">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default GestionEdificios;
