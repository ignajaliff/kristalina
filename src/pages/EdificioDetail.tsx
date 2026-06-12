import { useState, useRef, useMemo, useEffect, memo } from "react";
import { generatePresupuestoPDF } from "@/utils/pdfGenerator";
import { generateContratoPDF } from "@/utils/contractPdfGenerator";
import { generateReportePDF } from "@/utils/reportPdfGenerator";
import { queueAndSendEmail } from "@/utils/email";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileDrawer from "@/components/MobileDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Building2, ArrowLeft, MapPin, Users, DollarSign, Mail,
  FileText, Calendar, BarChart3, TrendingUp, CheckCircle, Download,
  ChevronDown, ChevronUp, Upload, ClipboardList, Loader2, PlusIcon, Activity, Pencil
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// --- Types ---
interface PagoRecord {
  mes: number;
  fecha_pago: string;
  monto: number;
  pagado: boolean;
  factura_url: string | null;
  fecha_pago_real: string | null;
  fecha_emision?: string | null;
  fecha_confirmacion?: string | null;
  es_inmediato?: boolean;
}

interface ActividadRow {
  item: string;
  horario_activo: string;
  horario_reposo: string;
}

const EMPTY_ACTIVIDAD: ActividadRow[] = Array.from({ length: 8 }, () => ({
  item: "",
  horario_activo: "",
  horario_reposo: "",
}));

const TIME_OPTIONS = [
  "00.00 AM", "01.00 AM", "02.00 AM", "03.00 AM", "04.00 AM", "05.00 AM",
  "06.00 AM", "07.00 AM", "08.00 AM", "09.00 AM", "10.00 AM", "11.00 AM",
  "12.00 PM", "01.00 PM", "02.00 PM", "03.00 PM", "04.00 PM", "05.00 PM",
  "06.00 PM", "07.00 PM", "08.00 PM", "09.00 PM", "10.00 PM", "11.00 PM",
];

const parseTimeRange = (value: string): [string, string] => {
  if (!value) return ["", ""];
  if (value.includes(" - ")) {
    const parts = value.split(" - ");
    return [parts[0]?.trim() || "", parts[1]?.trim() || ""];
  }
  // Handle partial value (only from selected)
  const trimmed = value.trim();
  if (TIME_OPTIONS.includes(trimmed)) return [trimmed, ""];
  return ["", ""];
};

// Usa <select> NATIVOS (no Radix) a propósito: la tabla tiene decenas de estos
// y los Select de Radix son muy pesados de montar (causaban lag al entrar).
const TIME_SELECT_CLASS =
  "h-8 flex-1 min-w-0 rounded-md border border-[#E2E8F0] bg-white px-2 text-[11px] text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#1A367F]";

const TimeRangeCell = memo(({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [from, to] = parseTimeRange(value);
  const handleChange = (side: "from" | "to", val: string) => {
    const newFrom = side === "from" ? val : from;
    const newTo = side === "to" ? val : to;
    // Always store with separator so parseTimeRange works
    onChange(`${newFrom || ""} - ${newTo || ""}`);
  };
  return (
    <div className="flex items-center gap-1">
      <select value={from || ""} onChange={e => handleChange("from", e.target.value)} className={TIME_SELECT_CLASS}>
        <option value="" disabled>Inicio</option>
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <span className="text-[10px] text-[#94A3B8] shrink-0">-</span>
      <select value={to || ""} onChange={e => handleChange("to", e.target.value)} className={TIME_SELECT_CLASS}>
        <option value="" disabled>Fin</option>
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
});
TimeRangeCell.displayName = "TimeRangeCell";

const EdificioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: item, isLoading } = useQuery({
    queryKey: ['edificio', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gestion')
        .select('*, user_roles(nombre), pagos(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1A367F]"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Building2 className="h-12 w-12 text-[#E2E8F0]" />
        <p className="text-sm text-[#64748B]">Edificio no encontrado</p>
        <Button variant="outline" onClick={() => navigate('/admin/edificios')}>Volver</Button>
      </div>
    );
  }

  // Cliente reconstruido desde las columnas individuales (el JSON cliente quedó como respaldo).
  const cliente = {
    communityname: item.communityname,
    adminname: item.adminname,
    adminemail: item.adminemail,
    managementcompany: item.managementcompany,
    buildingaddress: item.buildingaddress,
    comuna: item.comuna,
    region: item.region,
    buildingtype: item.buildingtype,
    units: item.units,
    nombre_portero: item.nombre_portero,
    notas: item.notas,
    additional_at: item.additional_at,
    vendedor: (item as any).user_roles?.nombre ?? null,
  } as any;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {isMobile && <MobileDrawer />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/edificios')}
              className="h-8 px-3 text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] rounded-md gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-semibold">Volver</span>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#F1F3F9]">
                <Building2 className="h-7 w-7 text-[#1A367F]" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl md:text-[26px] font-bold text-[#1E293B] tracking-tight leading-none mb-1">
                  {cliente.communityname || 'Sin nombre'}
                </h1>
                <p className="text-sm text-[#64748B] flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {cliente.buildingaddress || 'Sin dirección'}
                </p>
              </div>
            </div>
            <Badge className={cn(
              "font-bold text-[10px] uppercase tracking-wider self-start",
              item.estadopago === 'Mes pagado'
                ? "bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7] hover:bg-[#F0FDF4]"
                : item.estadopago === 'En fecha/No pagado'
                  ? "bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2] hover:bg-[#FEF2F2]"
                  : "bg-[#F5F3FF] text-[#7C3AED] border-[#EDE9FE] hover:bg-[#F5F3FF]"
            )}>
              {item.estadopago}
            </Badge>
          </div>
        </div>

        {/* Tabs - 3 tabs now */}
        <Tabs defaultValue="informacion" className="space-y-6">
          <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-lg">
            <TabsTrigger value="informacion" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#1A367F] data-[state=active]:shadow-sm rounded-md px-4">
              Información
            </TabsTrigger>
            <TabsTrigger value="pagos" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#1A367F] data-[state=active]:shadow-sm rounded-md px-4">
              Historial de Pagos
            </TabsTrigger>
            <TabsTrigger value="reportes" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#1A367F] data-[state=active]:shadow-sm rounded-md px-4">
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="informacion" className="space-y-6">
            <ClienteInfoCard item={item} />
            <PresupuestoContratoCard item={item} cliente={cliente} formatDate={formatDate} />
          </TabsContent>

          {/* Historial de Pagos Tab */}
          <TabsContent value="pagos" className="space-y-6">
            <HistorialPagosTab item={item} formatDate={formatDate} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reportes" className="space-y-6">
            <ReportesTab item={item} formatDate={formatDate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Historial de Pagos Tab
// ═══════════════════════════════════════════════════════════════════════
const HistorialPagosTab = ({ item, formatDate }: { item: any; formatDate: (d: string) => string }) => {
  const queryClient = useQueryClient();
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMes, setSelectedMes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pagosJson: PagoRecord[] = Array.isArray(item.pagos)
    ? [...item.pagos].sort((a: PagoRecord, b: PagoRecord) => a.mes - b.mes)
    : [];
  const montoRenting = item.monto_renting || 0;
  const metodoCobro = item.metodo_cobro || "Inmediato";
  const pagadosList = pagosJson.filter(p => p.pagado);
  const pendientesList = pagosJson.filter(p => !p.pagado);
  const proximoPago = pendientesList[0];

  const handleUploadFactura = async () => {
    if (!selectedFile || !selectedMes) return;
    setIsUploading(true);
    try {
      const mesNum = parseInt(selectedMes);
      const filePath = `facturas/${item.id}/mes-${mesNum}-${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from("presupuestos-pdf").upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("presupuestos-pdf").getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from("pagos")
        .update({ factura_url: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
        .eq("gestion_id", item.id)
        .eq("mes", mesNum);
      if (updateError) throw updateError;
      toast.success(`Factura del mes ${mesNum} cargada correctamente`);
      queryClient.invalidateQueries({ queryKey: ['edificio', item.id] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedMes("");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir la factura");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ReportCard title="Renting Mensual" value={(() => {
          if (!montoRenting) return "N/A";
          const moneda = (item.data_presupuesto as any)?.datos_presupuesto?.moneda;
          if (moneda === "UF") return `${Number(montoRenting).toFixed(2)} UF`;
          return `$${Number(montoRenting).toLocaleString()}`;
        })()} icon={DollarSign} iconColor="text-[#1A367F]" iconBg="bg-[#F1F3F9]" />
        <ReportCard title="Estado Actual" value={item.estadopago} icon={CheckCircle} iconColor="text-[#10B981]" iconBg="bg-[#F0FDF4]" />
        <ReportCard title="Meses Pagados" value={`${pagadosList.length} / ${pagosJson.length}`} icon={Calendar} iconColor="text-[#F59E0B]" iconBg="bg-[#FFFBEB]" />
        <ReportCard title="Próximo Pago" value={proximoPago ? formatDate(proximoPago.fecha_pago) : "N/A"} icon={TrendingUp} iconColor="text-[#7C3AED]" iconBg="bg-[#F5F3FF]" />
        <ReportCard title="Método de Cobro" value={metodoCobro} icon={FileText} iconColor="text-[#3B82F6]" iconBg="bg-[#EFF6FF]" />
      </div>

      {/* Payment history table */}
      <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-[#F1F5F9] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <BarChart3 className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Historial de Pagos</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
              className="h-8 px-4 bg-[#1A367F] hover:bg-[#152D6B] text-white text-[11px] font-bold rounded-lg gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Cargar Factura
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Mes</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Fecha Pago</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Monto</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Estado</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Factura</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagosJson.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[12px] text-[#94A3B8]">
                    No hay pagos configurados para este edificio
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {pagadosList.map((p) => (
                    <TableRow key={p.mes} className="hover:bg-[#F8FAFC]">
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">Mes {p.mes}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{formatDate(p.fecha_pago)}</TableCell>
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">{(() => {
                        const moneda = (item.data_presupuesto as any)?.datos_presupuesto?.moneda;
                        if (moneda === "UF") return `${Number(p.monto).toFixed(2)} UF`;
                        return `$${Number(p.monto).toLocaleString()}`;
                      })()}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className="bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7] hover:bg-[#F0FDF4] text-[10px] font-bold uppercase tracking-wider">Pagado</Badge>
                          {p.fecha_emision && (
                            <p className="text-[10px] text-[#94A3B8]">Emitida: {formatDate(p.fecha_emision)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.factura_url ? (
                          <a href={p.factura_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Ver factura
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">Sin factura</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.factura_url && (
                          <a href={p.factura_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[#1A367F] hover:bg-[#EFF6FF]">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {!showUpcoming && proximoPago && (
                    <TableRow className="bg-[#FFFBEB] border-l-2 border-[#F59E0B]">
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">Mes {proximoPago.mes}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{formatDate(proximoPago.fecha_pago)}</TableCell>
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">{(() => {
                        const moneda = (item.data_presupuesto as any)?.datos_presupuesto?.moneda;
                        if (moneda === "UF") return `${Number(proximoPago.monto).toFixed(2)} UF`;
                        return `$${Number(proximoPago.monto).toLocaleString()}`;
                      })()}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A] hover:bg-[#FFFBEB] text-[10px] font-bold uppercase tracking-wider">Pendiente</Badge>
                      </TableCell>
                      <TableCell>
                        {proximoPago.factura_url ? (
                          <a href={proximoPago.factura_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Ver factura
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">Sin factura</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-[10px] text-[#94A3B8] italic">Marcar en Gestión de Pagos</span>
                      </TableCell>
                    </TableRow>
                  )}

                  {showUpcoming && pendientesList.map((p) => (
                    <TableRow key={`upcoming-${p.mes}`} className={cn("hover:bg-[#F8FAFC]", p.mes === proximoPago?.mes && "bg-[#FFFBEB]")}>
                      <TableCell className="text-[12px] font-semibold text-[#94A3B8]">Mes {p.mes}</TableCell>
                      <TableCell className="text-[12px] text-[#94A3B8]">{formatDate(p.fecha_pago)}</TableCell>
                      <TableCell className="text-[12px] font-semibold text-[#94A3B8]">{(() => {
                        const moneda = (item.data_presupuesto as any)?.datos_presupuesto?.moneda;
                        if (moneda === "UF") return `${Number(p.monto).toFixed(2)} UF`;
                        return `$${Number(p.monto).toLocaleString()}`;
                      })()}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] hover:bg-[#F1F5F9] text-[10px] font-bold uppercase tracking-wider">Pendiente</Badge>
                      </TableCell>
                      <TableCell>
                        {p.factura_url ? (
                          <a href={p.factura_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Ver factura
                          </a>
                        ) : <span className="text-[11px] text-[#94A3B8]">Sin factura</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.mes === proximoPago?.mes && (
                          <span className="text-[10px] text-[#94A3B8] italic">Marcar en Gestión de Pagos</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
          {pendientesList.length > 1 && (
            <div className="p-4 border-t border-[#F1F5F9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpcoming(!showUpcoming)}
                className="w-full text-[12px] font-semibold text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] border-[#E2E8F0] gap-2"
              >
                {showUpcoming ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showUpcoming ? "Ocultar todos los pagos pendientes" : `Ver todos los pagos pendientes (${pendientesList.length - 1} más)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload invoice dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cargar Factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748B]">Selecciona el mes al que corresponde</label>
              <Select value={selectedMes} onValueChange={setSelectedMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige el mes de renting" />
                </SelectTrigger>
                <SelectContent>
                  {pagosJson.map(p => (
                    <SelectItem key={p.mes} value={p.mes.toString()}>
                      Mes {p.mes} — {formatDate(p.fecha_pago)} {p.pagado ? "(Pagado)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748B]">Archivo de factura (PDF, imagen)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#EFF6FF] file:text-[#1A367F] hover:file:bg-[#DBEAFE] cursor-pointer"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleUploadFactura}
              disabled={!selectedFile || !selectedMes || isUploading}
              className="bg-[#1A367F] hover:bg-[#142a5f]"
            >
              {isUploading ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Subiendo...</> : "Cargar Factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Compresión de imágenes en el navegador
// Redimensiona a un máximo de lado y re-encoda como JPEG para que el reporte
// no pese de más (de ~10MB a típicamente <500KB por imagen).
// ═══════════════════════════════════════════════════════════════════════
const compressImage = (file: File, maxDim = 1280, quality = 0.72): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No se pudo procesar la imagen")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")); };
    img.src = url;
  });

// ═══════════════════════════════════════════════════════════════════════
// Slot individual para una imagen (vista previa + quitar)
// ═══════════════════════════════════════════════════════════════════════
const ImageSlot = ({ index, file, onChange }: { index: number; file: File | null; onChange: (f: File | null) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={e => onChange(e.target.files?.[0] || null)}
      />
      {file && previewUrl ? (
        <div className="relative group border border-[#E2E8F0] rounded-lg overflow-hidden">
          <img src={previewUrl} alt={`Imagen ${index + 1}`} className="w-full h-36 object-cover" />
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-md bg-black/60 text-white text-xs font-bold hover:bg-black/80 transition-colors"
            aria-label="Quitar imagen"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-[#E2E8F0] rounded-lg text-[#94A3B8] hover:border-[#1A367F] hover:text-[#1A367F] hover:bg-[#F8FAFC] transition-colors"
        >
          <Upload className="h-5 w-5" />
          <span className="text-[11px] font-semibold">Imagen {index + 1}</span>
        </button>
      )}
    </div>
  );
};

// Convierte un Blob a data URL (base64), para embeber imágenes en el PDF sin
// tener que subirlas a storage por separado.
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// ═══════════════════════════════════════════════════════════════════════
// Genera el PDF del reporte a partir de los datos del edificio + el reporte.
// `imagenesParaPdf` pueden ser data URLs (al crear) o URLs remotas (reportes
// viejos que aún tienen imágenes en storage).
// ═══════════════════════════════════════════════════════════════════════
const buildReportePDFBlob = async (
  item: any,
  datosReporte: any,
  imagenesParaPdf: string[],
  numero: number,
  fecha: string,
): Promise<Blob> => {
  const clientePdf = {
    communityname: item.communityname,
    adminname: item.adminname,
    adminemail: item.adminemail,
    buildingaddress: item.buildingaddress,
    buildingtype: item.buildingtype,
    units: item.units,
    vendedor: (item as any).user_roles?.nombre ?? null,
  } as any;

  const pagosJson: PagoRecord[] = Array.isArray(item.pagos)
    ? [...item.pagos].sort((a: PagoRecord, b: PagoRecord) => a.mes - b.mes)
    : [];
  const moneda = (item.data_presupuesto as any)?.datos_presupuesto?.moneda;
  const hasTorre = (item.data_presupuesto as any)?.datos_presupuesto?.torre_enfriamiento === true;
  const actividad: ActividadRow[] = Array.isArray(item.actividad_solucion) && item.actividad_solucion.length > 0
    ? item.actividad_solucion
    : EMPTY_ACTIVIDAD;
  const torre: ActividadRow[] = Array.isArray(item.torre_enfriamiento) && (item.torre_enfriamiento as any[]).length > 0
    ? (item.torre_enfriamiento as ActividadRow[])
    : EMPTY_ACTIVIDAD;

  return generateReportePDF({
    cliente: clientePdf,
    pagosJson,
    montoRenting: item.monto_renting || 0,
    moneda,
    datosReporte,
    numero,
    fecha,
    actividadSolucion: actividad,
    torreEnfriamiento: hasTorre ? torre : undefined,
    imagenesReporte: imagenesParaPdf,
    dataContrato: (item.data_contrato as any)?.datos_contrato || {},
  });
};

// Sube el PDF del reporte a storage y devuelve su URL pública + nombre de archivo.
const subirReportePDF = async (item: any, blob: Blob, numero: number) => {
  const fileName = `reporte_${numero}_${(item.communityname || "edificio").replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
  const filePath = `reportes-pdf/${item.id}/${Date.now()}-${fileName}`;
  const { error: upErr } = await supabase.storage
    .from("presupuestos-pdf")
    .upload(filePath, blob, { upsert: true, contentType: "application/pdf" });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("presupuestos-pdf").getPublicUrl(filePath);
  return { pdfUrl: pub.publicUrl, fileName };
};

// Envía por email el PDF ya generado (no lo regenera). Cliente (To) + internos (CC).
// PRUEBA: subject fijo "EMAIL DE PRUEBA", el cuerpo es solo el reporte adjunto.
const enviarReporteEmail = async (item: any, pdfUrl: string, fileName: string, reportId: string) => {
  const internos = ["aramirez@kristalina.cl", "eporro@kristalina.cl"];
  const clientEmail = (item.adminemail || "").trim();
  const toEmail = clientEmail || internos[0];
  const ccList = clientEmail ? internos : internos.slice(1);

  return queueAndSendEmail({
    toEmail,
    toName: item.adminname || undefined,
    cc: ccList,
    subject: "EMAIL DE PRUEBA",
    bodyHtml: "<p>Reporte adjunto.</p>",
    attachmentUrl: pdfUrl,
    attachmentFilename: fileName,
    tipo: "reporte",
    relatedId: reportId,
  });
};

// ═══════════════════════════════════════════════════════════════════════
// Popup "Nuevo Reporte" — componente aislado para que escribir no re-renderice
// las tablas pesadas (Sala de Bombas / Torre) del tab de reportes.
// ═══════════════════════════════════════════════════════════════════════
interface ReportCreatedPayload {
  reportId: string;
  pdfUrl: string;
  fileName: string;
  enviarEmail: boolean;
}

const NuevoReporteDialog = ({ item, open, onOpenChange, onCreated }: {
  item: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (payload: ReportCreatedPayload) => void;
}) => {
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [efectividad, setEfectividad] = useState("");
  const [efectividadComentario, setEfectividadComentario] = useState("");
  const [condicionGeneral, setCondicionGeneral] = useState("");
  const [funcionamiento, setFuncionamiento] = useState("");
  const [fechaRevision, setFechaRevision] = useState("");
  const [revisadoPor, setRevisadoPor] = useState("");
  const [requiereMantenimiento, setRequiereMantenimiento] = useState(false);
  const [detalleMantenimiento, setDetalleMantenimiento] = useState("");
  const [fechaProximaMantenimiento, setFechaProximaMantenimiento] = useState("");
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [conclusion, setConclusion] = useState("");

  // Dos espacios independientes, una imagen en cada uno.
  const [imageSlot1, setImageSlot1] = useState<File | null>(null);
  const [imageSlot2, setImageSlot2] = useState<File | null>(null);

  // Enviar el reporte por email al cliente (toggle Sí/No).
  const [enviarEmail, setEnviarEmail] = useState(false);

  const resetForm = () => {
    setEfectividad("");
    setEfectividadComentario("");
    setCondicionGeneral("");
    setFuncionamiento("");
    setFechaRevision("");
    setRevisadoPor("");
    setRequiereMantenimiento(false);
    setDetalleMantenimiento("");
    setFechaProximaMantenimiento("");
    setObservacionesGenerales("");
    setConclusion("");
    setImageSlot1(null);
    setImageSlot2(null);
    setEnviarEmail(false);
  };

  const handleCreateReport = async () => {
    if (!efectividad || !condicionGeneral) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    setIsCreatingReport(true);
    try {
      // 1. Comprimir las imágenes y convertirlas a data URL (NO se suben sueltas:
      //    quedan embebidas dentro del PDF).
      const slots = [imageSlot1, imageSlot2].filter((f): f is File => f !== null);
      const imagenesDataUrls: string[] = [];
      for (const file of slots) {
        const compressed = await compressImage(file);
        imagenesDataUrls.push(await blobToDataUrl(compressed));
      }

      const datosReporte: any = {
        efectividad,
        efectividad_comentario: efectividadComentario,
        condicion_general: condicionGeneral,
        funcionamiento,
        fecha_revision: fechaRevision,
        revisado_por: revisadoPor,
        requiere_mantenimiento: requiereMantenimiento,
        detalle_mantenimiento: detalleMantenimiento,
        fecha_proxima_mantenimiento: fechaProximaMantenimiento,
        observaciones_generales: observacionesGenerales,
        conclusion,
      };

      // 2. Número de reporte = cantidad actual + 1.
      const { count } = await supabase
        .from("reportes")
        .select("id", { count: "exact", head: true })
        .eq("gestion_id", item.id);
      const numero = (count || 0) + 1;

      // 3. Generar el PDF UNA vez (con las imágenes embebidas) y subirlo a storage.
      const blob = await buildReportePDFBlob(
        item,
        datosReporte,
        imagenesDataUrls,
        numero,
        format(new Date(), "dd/MM/yyyy"),
      );
      const { pdfUrl, fileName } = await subirReportePDF(item, blob, numero);
      datosReporte.pdf_url = pdfUrl;

      // 4. Guardar el reporte con la URL del PDF (ya no se guardan imágenes sueltas).
      const { data: inserted, error } = await supabase.from("reportes").insert({
        gestion_id: item.id,
        datos_reporte: datosReporte as any,
      }).select("id").single();
      if (error) throw error;
      toast.success("Reporte creado exitosamente");

      // 5. Cerrar el popup al instante y delegar el envío del email al padre, que
      //    muestra el progreso (ruedita → enviado) en la fila del reporte.
      onCreated({
        reportId: inserted.id,
        pdfUrl,
        fileName,
        enviarEmail,
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el reporte");
    } finally {
      setIsCreatingReport(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isCreatingReport) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Reporte</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-[#1E293B]">Evaluación de efectividad de la solución</Label>
            <Select value={efectividad} onValueChange={setEfectividad}>
              <SelectTrigger><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectiva">Efectiva</SelectItem>
                <SelectItem value="En observación">En observación</SelectItem>
                <SelectItem value="Requiere Ajustes">Requiere Ajustes</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Comentario sobre la efectividad..."
              value={efectividadComentario}
              onChange={e => setEfectividadComentario(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold text-[#1E293B]">Condición general</Label>
            <Select value={condicionGeneral} onValueChange={setCondicionGeneral}>
              <SelectTrigger><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Óptima">Óptima</SelectItem>
                <SelectItem value="Buena">Buena</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Deficiente">Deficiente</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Funcionamiento</Label>
              <Textarea placeholder="Describe el funcionamiento..." value={funcionamiento} onChange={e => setFuncionamiento(e.target.value)} className="min-h-[50px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Fecha de Revisión</Label>
              <Input type="date" value={fechaRevision} onChange={e => setFechaRevision(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Revisado por</Label>
              <Input placeholder="Nombre del revisor" value={revisadoPor} onChange={e => setRevisadoPor(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-bold text-[#1E293B]">Mantenimiento</Label>
            <div className="flex items-center gap-3">
              <Label className="text-xs font-semibold text-[#64748B]">¿Requiere mantenimiento la Solución?</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="mantenimiento" checked={requiereMantenimiento} onChange={() => setRequiereMantenimiento(true)} className="accent-[#1A367F]" />
                  <span className="text-xs font-semibold">Sí</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="mantenimiento" checked={!requiereMantenimiento} onChange={() => setRequiereMantenimiento(false)} className="accent-[#1A367F]" />
                  <span className="text-xs font-semibold">No</span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Detalle de mantenimiento</Label>
              <Textarea placeholder="Detalle del mantenimiento requerido..." value={detalleMantenimiento} onChange={e => setDetalleMantenimiento(e.target.value)} className="min-h-[50px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Fecha próxima de mantenimiento</Label>
              <Input type="date" value={fechaProximaMantenimiento} onChange={e => setFechaProximaMantenimiento(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-[#1E293B]">Observaciones generales</Label>
              <Textarea placeholder="Observaciones generales del reporte..." value={observacionesGenerales} onChange={e => setObservacionesGenerales(e.target.value)} className="min-h-[80px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-[#1E293B]">Conclusión</Label>
              <Textarea placeholder="Conclusión del reporte..." value={conclusion} onChange={e => setConclusion(e.target.value)} className="min-h-[80px]" />
            </div>
          </div>

          {/* Imágenes del reporte: 2 espacios, una imagen en cada uno */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-bold text-[#1E293B]">Imágenes del reporte</Label>
              <span className="text-[10px] text-[#94A3B8]">(opcional · se comprimen automáticamente)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ImageSlot index={0} file={imageSlot1} onChange={setImageSlot1} />
              <ImageSlot index={1} file={imageSlot2} onChange={setImageSlot2} />
            </div>
          </div>

          {/* Enviar por email al cliente (Sí/No) */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-[#1E293B]">Enviar reporte por email al cliente</Label>
                <p className="text-[11px] text-[#64748B]">
                  Se envía a <span className="font-semibold">{(item.adminemail || "—")}</span> con copia a aramirez@kristalina.cl y eporro@kristalina.cl
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-xs font-bold", !enviarEmail ? "text-[#1E293B]" : "text-[#94A3B8]")}>No</span>
                <Switch checked={enviarEmail} onCheckedChange={setEnviarEmail} />
                <span className={cn("text-xs font-bold", enviarEmail ? "text-[#1A367F]" : "text-[#94A3B8]")}>Sí</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleCreateReport}
            disabled={!efectividad || !condicionGeneral || isCreatingReport}
            className="bg-[#1A367F] hover:bg-[#142a5f]"
          >
            {isCreatingReport ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Creando...</> : "Crear Reporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Reportes Tab
// ═══════════════════════════════════════════════════════════════════════
const ReportesTab = ({ item, formatDate }: { item: any; formatDate: (d: string) => string }) => {
  const queryClient = useQueryClient();

  // Solo el estado de apertura del popup vive acá (ligero). El formulario y sus
  // imágenes viven dentro de <NuevoReporteDialog/> para evitar re-renders.
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Actividad de solución state
  const savedActividad: ActividadRow[] = Array.isArray(item.actividad_solucion) && item.actividad_solucion.length > 0
    ? item.actividad_solucion
    : EMPTY_ACTIVIDAD;
  const [actividad, setActividad] = useState<ActividadRow[]>(savedActividad);
  

  // Torre enfriamiento state
  const hasTorreEnfriamiento = (item.data_presupuesto as any)?.datos_presupuesto?.torre_enfriamiento === true;
  const savedTorre: ActividadRow[] = Array.isArray(item.torre_enfriamiento) && (item.torre_enfriamiento as any[]).length > 0
    ? (item.torre_enfriamiento as ActividadRow[])
    : EMPTY_ACTIVIDAD;
  const [torreEnfriamiento, setTorreEnfriamiento] = useState<ActividadRow[]>(savedTorre);

  // Fetch reportes
  const { data: reportes, isLoading: loadingReportes } = useQuery({
    queryKey: ['reportes', item.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reportes")
        .select("*")
        .eq("gestion_id", item.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Estado del envío de email por reporte (solo para los creados en esta sesión).
  const [emailStatusById, setEmailStatusById] = useState<Record<string, "sending" | "sent" | "error">>({});

  // Al crear un reporte: refresca la lista (aparece el nuevo) y, si corresponde,
  // envía el email en segundo plano mostrando el progreso en su fila.
  const handleReportCreated = async (payload: ReportCreatedPayload) => {
    await queryClient.invalidateQueries({ queryKey: ['reportes', item.id] });
    if (!payload.enviarEmail) return;

    setEmailStatusById(prev => ({ ...prev, [payload.reportId]: "sending" }));
    try {
      const result = await enviarReporteEmail(item, payload.pdfUrl, payload.fileName, payload.reportId);
      setEmailStatusById(prev => ({ ...prev, [payload.reportId]: result.sent ? "sent" : "error" }));
      if (!result.sent) {
        toast.warning(result.message || "El reporte quedó pendiente de envío por email.");
      }
    } catch (err) {
      console.error("Error enviando el reporte por email:", err);
      setEmailStatusById(prev => ({ ...prev, [payload.reportId]: "error" }));
      toast.error("El reporte se creó, pero falló el envío por email.");
    }
  };

  const handleUpdateActividad = (index: number, field: keyof ActividadRow, value: string) => {
    const updated = [...actividad];
    updated[index] = { ...updated[index], [field]: value };
    setActividad(updated);
    // Auto-save
    autoSaveActividad(updated);
  };

  const autoSaveActividadTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTorreTimeout = useRef<NodeJS.Timeout | null>(null);

  const autoSaveActividad = (data: ActividadRow[]) => {
    if (autoSaveActividadTimeout.current) clearTimeout(autoSaveActividadTimeout.current);
    autoSaveActividadTimeout.current = setTimeout(async () => {
      try {
        await supabase.from("gestion").update({ actividad_solucion: data as any }).eq("id", item.id);
        queryClient.invalidateQueries({ queryKey: ['edificio', item.id] });
      } catch (err) {
        console.error("Auto-save actividad error:", err);
      }
    }, 1000);
  };

  const handleUpdateTorre = (index: number, field: keyof ActividadRow, value: string) => {
    const updated = [...torreEnfriamiento];
    updated[index] = { ...updated[index], [field]: value };
    setTorreEnfriamiento(updated);
    // Auto-save
    autoSaveTorre(updated);
  };

  const autoSaveTorre = (data: ActividadRow[]) => {
    if (autoSaveTorreTimeout.current) clearTimeout(autoSaveTorreTimeout.current);
    autoSaveTorreTimeout.current = setTimeout(async () => {
      try {
        await supabase.from("gestion").update({ torre_enfriamiento: data as any }).eq("id", item.id);
        queryClient.invalidateQueries({ queryKey: ['edificio', item.id] });
      } catch (err) {
        console.error("Auto-save torre error:", err);
      }
    }, 1000);
  };

  const handleDownloadReport = async (reporte: any, index: number) => {
    try {
      const numero = (reportes?.length || 0) - index;
      const datos = (reporte.datos_reporte as any) || {};

      // Reportes nuevos: se descarga el PDF guardado (el mismo que se envió por email).
      if (datos.pdf_url) {
        const resp = await fetch(datos.pdf_url);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_${numero}_${item.communityname || 'edificio'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Reportes viejos (sin pdf_url): se regenera a partir de sus imágenes guardadas.
      const imagenesDelReporte = Array.isArray(datos.imagenes) ? datos.imagenes : [];
      const blob = await buildReportePDFBlob(
        item,
        reporte.datos_reporte,
        imagenesDelReporte,
        numero,
        format(parseISO(reporte.created_at), "dd/MM/yyyy"),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${numero}_${item.communityname || 'edificio'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar el reporte:", err);
      toast.error("Hubo un error al generar el PDF del reporte");
    }
  };

  return (
    <div className="space-y-6">
      {/* Reportes Generados CRM */}
      <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-[#F1F5F9] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <ClipboardList className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Reportes Generados</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => setReportDialogOpen(true)}
              className="h-8 px-4 bg-[#1A367F] hover:bg-[#152D6B] text-white text-[11px] font-bold rounded-lg gap-1.5"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Nuevo Reporte
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">#</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Efectividad</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Condición</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Correo</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Archivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingReportes ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
                      <span className="text-[12px] text-[#94A3B8]">Cargando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !reportes || reportes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[12px] text-[#94A3B8]">
                    No hay reportes generados
                  </TableCell>
                </TableRow>
              ) : (
                reportes.map((reporte, index) => {
                  const numero = reportes.length - index;
                  const datos = reporte.datos_reporte as any || {};
                  const emailStatus = emailStatusById[reporte.id];
                  return (
                    <TableRow key={reporte.id} className="hover:bg-[#F8FAFC]">
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">#{numero}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{format(parseISO(reporte.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{datos.efectividad || "N/A"}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{datos.condicion_general || "N/A"}</TableCell>
                      <TableCell>
                        {emailStatus === "sending" && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1A367F]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...
                          </span>
                        )}
                        {emailStatus === "sent" && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981]">
                            <CheckCircle className="h-3.5 w-3.5" /> Enviado
                          </span>
                        )}
                        {emailStatus === "error" && (
                          <span className="text-[11px] font-semibold text-[#EF4444]">Falló el envío</span>
                        )}
                        {!emailStatus && <span className="text-[11px] text-[#CBD5E1]">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReport(reporte, index)}
                          className="h-7 px-2 text-[#1A367F] hover:bg-[#EFF6FF]"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          <span className="text-[11px]">PDF</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sala de Bombas (previously Actividad de Solución) */}
      <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-[#F1F5F9] p-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
              <Activity className="h-4 w-4 text-[#7C3AED]" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Sala de Bombas</CardTitle>
            <span className="text-[10px] text-[#94A3B8] italic">Guardado automático</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider w-[40%]">Item</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider w-[30%]">Horario Activo</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider w-[30%]">Horario Reposo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actividad.map((row, i) => (
                <TableRow key={i} className="hover:bg-[#F8FAFC]">
                  <TableCell className="py-1 px-2">
                    <Input
                      value={row.item}
                      onChange={e => handleUpdateActividad(i, 'item', e.target.value)}
                      placeholder={`Item ${i + 1}`}
                      className="h-8 text-[12px] border-[#E2E8F0]"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <TimeRangeCell
                      value={row.horario_activo}
                      onChange={v => handleUpdateActividad(i, 'horario_activo', v)}
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <TimeRangeCell
                      value={row.horario_reposo}
                      onChange={v => handleUpdateActividad(i, 'horario_reposo', v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Torre Enfriamiento - only if enabled in presupuesto */}
      {hasTorreEnfriamiento && (
        <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
          <CardHeader className="border-b border-[#F1F5F9] p-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <Activity className="h-4 w-4 text-[#F59E0B]" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Torre Enfriamiento</CardTitle>
              <span className="text-[10px] text-[#94A3B8] italic">Guardado automático</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider w-[40%]">Item</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider w-[30%]">Horario Activo</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider w-[30%]">Horario Reposo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {torreEnfriamiento.map((row, i) => (
                  <TableRow key={i} className="hover:bg-[#F8FAFC]">
                    <TableCell className="py-1 px-2">
                      <Input
                        value={row.item}
                        onChange={e => handleUpdateTorre(i, 'item', e.target.value)}
                        placeholder={`Item ${i + 1}`}
                        className="h-8 text-[12px] border-[#E2E8F0]"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <TimeRangeCell
                        value={row.horario_activo}
                        onChange={v => handleUpdateTorre(i, 'horario_activo', v)}
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <TimeRangeCell
                        value={row.horario_reposo}
                        onChange={v => handleUpdateTorre(i, 'horario_reposo', v)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Report Dialog (componente aislado para evitar lag al escribir) */}
      <NuevoReporteDialog item={item} open={reportDialogOpen} onOpenChange={setReportDialogOpen} onCreated={handleReportCreated} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Shared components
// ═══════════════════════════════════════════════════════════════════════
// Campo grande y cómodo (label arriba, valor destacado)
const BigField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</p>
    <p className="text-[15px] font-semibold text-[#1E293B] break-words leading-snug">{value || '—'}</p>
  </div>
);

// Campos editables de los datos del cliente (columnas de gestion)
const CLIENTE_FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "communityname", label: "Comunidad" },
  { key: "adminname", label: "Administrador" },
  { key: "adminemail", label: "Email", type: "email" },
  { key: "managementcompany", label: "Empresa Gestora" },
  { key: "buildingtype", label: "Tipo" },
  { key: "units", label: "Unidades", type: "number" },
  { key: "buildingaddress", label: "Dirección" },
  { key: "comuna", label: "Comuna" },
  { key: "region", label: "Región" },
  { key: "nombre_portero", label: "Portero" },
];

const ClienteInfoCard = ({ item }: { item: any }) => {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const vendedorNombre = item.user_roles?.nombre ?? null;

  const buildForm = () =>
    Object.fromEntries(CLIENTE_FIELDS.map(f => [f.key, item[f.key] ?? ""])) as Record<string, any>;
  const [form, setForm] = useState<Record<string, any>>(buildForm());

  const startEdit = () => { setForm(buildForm()); setEditMode(true); };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("gestion").update({
        communityname: form.communityname || null,
        adminname: form.adminname || null,
        adminemail: form.adminemail || null,
        managementcompany: form.managementcompany || null,
        buildingtype: form.buildingtype || null,
        units: form.units === "" || form.units == null ? null : Number(form.units),
        buildingaddress: form.buildingaddress || null,
        comuna: form.comuna || null,
        region: form.region || null,
        nombre_portero: form.nombre_portero || null,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      if (error) throw error;
      toast.success("Datos del cliente actualizados");
      queryClient.invalidateQueries({ queryKey: ["edificio", item.id] });
      setEditMode(false);
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
      <CardHeader className="border-b border-[#F1F5F9] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
              <Users className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Datos del Cliente</CardTitle>
          </div>
          {editMode ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={saving} className="h-8 text-xs">Cancelar</Button>
              <Button size="sm" onClick={save} disabled={saving} className="h-8 text-xs bg-[#1A367F] hover:bg-[#12285e]">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={startEdit} className="h-8 text-xs gap-1.5 border-[#E2E8F0] text-[#1A367F] hover:bg-[#EFF6FF]">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLIENTE_FIELDS.map(f => (
              <div className="space-y-1.5" key={f.key}>
                <Label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{f.label}</Label>
                <Input
                  type={f.type || "text"}
                  value={form[f.key] ?? ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Vendedor</Label>
              <Input value={vendedorNombre || "—"} disabled className="h-9 text-sm bg-[#F8FAFC]" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            <BigField label="Comunidad" value={item.communityname} />
            <BigField label="Administrador" value={item.adminname} />
            <BigField label="Email" value={item.adminemail} />
            <BigField label="Empresa Gestora" value={item.managementcompany} />
            <BigField label="Tipo" value={item.buildingtype} />
            <BigField label="Unidades" value={item.units?.toString()} />
            <BigField label="Dirección" value={item.buildingaddress} />
            <BigField label="Comuna" value={item.comuna} />
            <BigField label="Región" value={item.region} />
            <BigField label="Portero" value={item.nombre_portero} />
            <BigField label="Vendedor" value={vendedorNombre} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PresupuestoContratoCard = ({ item, cliente, formatDate }: { item: any; cliente: any; formatDate: (d: string) => string }) => {
  const queryClient = useQueryClient();
  const datosPresupuesto = (item.data_presupuesto?.datos_presupuesto) || {};
  const dataContrato = item.data_contrato || {};
  const datosContrato = dataContrato.datos_contrato || {};
  const moneda = datosPresupuesto.moneda;
  const hasPresupuesto = Object.keys(datosPresupuesto).length > 0;
  const hasContrato = Object.keys(datosContrato).length > 0;

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const buildForm = () => ({
    moneda: datosPresupuesto.moneda ?? "Pesos",
    presupuesto_total_deptos: datosPresupuesto.presupuesto_total_deptos ?? "",
    descuento_porcentaje: datosPresupuesto.descuento_porcentaje ?? "",
    precio_instalacion: datosPresupuesto.precio_instalacion ?? "",
    anos_contrato: datosPresupuesto.anos_contrato ?? "",
    matriz_principal: datosPresupuesto.matriz_principal ?? "",
    recirculacion: datosPresupuesto.recirculacion ?? "",
    torre_enfriamiento: !!datosPresupuesto.torre_enfriamiento,
    monto_renting: item.monto_renting ?? "",
    metodo_cobro: item.metodo_cobro ?? "Inmediato",
    fecha_contrato_firmado: (dataContrato.fecha_contrato_firmado ?? "").slice(0, 10),
    fecha_instalacion_equipos: (dataContrato.fecha_instalacion_equipos ?? "").slice(0, 10),
  });
  const [form, setForm] = useState(buildForm());
  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const num = (v: any) => (v === "" || v == null ? null : Number(v));

  const startEdit = () => { setForm(buildForm()); setEditMode(true); };

  const save = async () => {
    setSaving(true);
    try {
      const newDatosPresupuesto = {
        ...datosPresupuesto,
        moneda: form.moneda,
        presupuesto_total_deptos: num(form.presupuesto_total_deptos),
        descuento_porcentaje: num(form.descuento_porcentaje),
        precio_instalacion: num(form.precio_instalacion),
        anos_contrato: num(form.anos_contrato),
        matriz_principal: num(form.matriz_principal),
        recirculacion: num(form.recirculacion),
        torre_enfriamiento: form.torre_enfriamiento,
      };
      const newDataPresupuesto = { ...(item.data_presupuesto || {}), datos_presupuesto: newDatosPresupuesto };
      const newDataContrato = {
        ...(item.data_contrato || {}),
        fecha_contrato_firmado: form.fecha_contrato_firmado || null,
        fecha_instalacion_equipos: form.fecha_instalacion_equipos || null,
      };
      const { error } = await supabase.from("gestion").update({
        data_presupuesto: newDataPresupuesto as any,
        data_contrato: newDataContrato as any,
        monto_renting: num(form.monto_renting),
        metodo_cobro: form.metodo_cobro,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      if (error) throw error;
      toast.success("Presupuesto y contrato actualizados");
      queryClient.invalidateQueries({ queryKey: ["edificio", item.id] });
      setEditMode(false);
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const fmtMonto = (v: any) =>
    v == null || v === "" ? "—" : moneda === "UF"
      ? `${Number(v).toLocaleString("es-CL")} UF`
      : `$${Number(v).toLocaleString("es-CL")}`;

  const downloadPresupuesto = () => {
    const blob = generatePresupuestoPDF(cliente, datosPresupuesto);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `presupuesto_${cliente.communityname || 'edificio'}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadContrato = () => {
    const blob = generateContratoPDF(
      {
        adminname: cliente.adminname || '',
        adminemail: cliente.adminemail || '',
        communityname: cliente.communityname || '',
        buildingaddress: cliente.buildingaddress || null,
        buildingtype: cliente.buildingtype || '',
        units: cliente.units || 0,
        vendedor: cliente.vendedor || null,
        monto: null,
      },
      datosContrato
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `contrato_${cliente.communityname || 'edificio'}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  // Campo editable (label + input numérico/texto)
  const EditField = ({ label, k, type = "number", suffix }: { label: string; k: string; type?: string; suffix?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{label}{suffix ? ` (${suffix})` : ""}</Label>
      <Input type={type} value={(form as any)[k] ?? ""} onChange={e => setF(k, e.target.value)} className="h-9 text-sm" />
    </div>
  );

  return (
    <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
      <CardHeader className="border-b border-[#F1F5F9] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
              <FileText className="h-4 w-4 text-[#F59E0B]" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Presupuesto y Contrato</CardTitle>
          </div>
          {editMode ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={saving} className="h-8 text-xs">Cancelar</Button>
              <Button size="sm" onClick={save} disabled={saving} className="h-8 text-xs bg-[#1A367F] hover:bg-[#12285e]">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={startEdit} className="h-8 text-xs gap-1.5 border-[#E2E8F0] text-[#1A367F] hover:bg-[#EFF6FF]">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Presupuesto */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-[#1A367F] uppercase tracking-wider bg-[#EFF6FF] px-3 py-1.5 rounded-md border border-blue-100">Presupuesto</h4>
            {!editMode && hasPresupuesto && (
              <Button variant="ghost" size="sm" onClick={downloadPresupuesto} className="h-auto p-0 text-[12px] text-[#1A367F] font-semibold hover:underline gap-1.5">
                <Download className="h-3.5 w-3.5" /> Descargar PDF
              </Button>
            )}
          </div>
          {editMode ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Moneda</Label>
                <Select value={form.moneda} onValueChange={v => setF("moneda", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pesos">Pesos (CLP)</SelectItem>
                    <SelectItem value="UF">UF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <EditField label="Presup. total deptos" k="presupuesto_total_deptos" />
              <EditField label="Descuento" k="descuento_porcentaje" suffix="%" />
              <EditField label="Precio instalación" k="precio_instalacion" />
              <EditField label="Años contrato" k="anos_contrato" />
              <EditField label="Renting mensual" k="monto_renting" />
              <EditField label="Matriz principal" k="matriz_principal" />
              <EditField label="Recirculación" k="recirculacion" />
              <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] col-span-2 sm:col-span-1">
                <Label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Torre enfriamiento</Label>
                <Switch checked={form.torre_enfriamiento} onCheckedChange={v => setF("torre_enfriamiento", v)} />
              </div>
            </div>
          ) : hasPresupuesto ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
              <BigField label="Moneda" value={moneda} />
              <BigField label="Presup. total deptos" value={fmtMonto(datosPresupuesto.presupuesto_total_deptos)} />
              <BigField label="Descuento" value={datosPresupuesto.descuento_porcentaje != null ? `${datosPresupuesto.descuento_porcentaje}%` : "—"} />
              <BigField label="Precio instalación" value={fmtMonto(datosPresupuesto.precio_instalacion)} />
              <BigField label="Años contrato" value={datosPresupuesto.anos_contrato ? `${datosPresupuesto.anos_contrato} años` : "—"} />
              <BigField label="Renting mensual" value={fmtMonto(item.monto_renting)} />
              <BigField label="Matriz principal" value={datosPresupuesto.matriz_principal?.toString()} />
              <BigField label="Recirculación" value={datosPresupuesto.recirculacion?.toString()} />
              <BigField label="Torre enfriamiento" value={datosPresupuesto.torre_enfriamiento ? "Sí" : "No"} />
            </div>
          ) : (
            <p className="text-[13px] text-[#94A3B8]">Sin datos de presupuesto.</p>
          )}
        </div>

        <div className="border-t border-[#F1F5F9]" />

        {/* Contrato */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider bg-[#F0FDF4] px-3 py-1.5 rounded-md border border-emerald-100">Contrato</h4>
            {!editMode && hasContrato && (
              <Button variant="ghost" size="sm" onClick={downloadContrato} className="h-auto p-0 text-[12px] text-[#1A367F] font-semibold hover:underline gap-1.5">
                <Download className="h-3.5 w-3.5" /> Descargar PDF
              </Button>
            )}
          </div>
          {editMode ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Método de cobro</Label>
                <Select value={form.metodo_cobro} onValueChange={v => setF("metodo_cobro", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inmediato">Inmediato</SelectItem>
                    <SelectItem value="Emisión de Factura">Emisión de Factura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <EditField label="Fecha firma" k="fecha_contrato_firmado" type="date" />
              <EditField label="Fecha instalación" k="fecha_instalacion_equipos" type="date" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
              <BigField label="Método de cobro" value={item.metodo_cobro} />
              <BigField label="Fecha firma" value={dataContrato.fecha_contrato_firmado ? formatDate(dataContrato.fecha_contrato_firmado) : "—"} />
              <BigField label="Fecha instalación" value={dataContrato.fecha_instalacion_equipos ? formatDate(dataContrato.fecha_instalacion_equipos) : "—"} />
            </div>
          )}
          {!editMode && dataContrato.doc_contrato && (
            <a href={dataContrato.doc_contrato} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1.5 w-fit">
              <FileText className="h-3.5 w-3.5" /> Ver contrato subido
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const InfoRow = ({ label, value, icon: Icon }: { label: string; value?: string; icon?: any }) => {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-[12px] font-medium text-[#1E293B] text-right truncate max-w-[180px]">{value}</span>
    </div>
  );
};

interface ReportCardProps {
  title: string;
  value: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}

const ReportCard = ({ title, value, icon: Icon, iconColor, iconBg }: ReportCardProps) => (
  <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white overflow-hidden transition-all hover:shadow-md">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-lg shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={2.5} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{title}</p>
        <h3 className="text-[18px] font-bold text-[#1E293B] leading-tight truncate tracking-tight">{value}</h3>
      </div>
    </CardContent>
  </Card>
);

export default EdificioDetail;
