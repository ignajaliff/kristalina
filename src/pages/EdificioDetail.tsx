import { useState, useRef } from "react";
import { generatePresupuestoPDF } from "@/utils/pdfGenerator";
import { generateContratoPDF } from "@/utils/contractPdfGenerator";
import { generateReportePDF } from "@/utils/reportPdfGenerator";
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
import {
  Building2, ArrowLeft, MapPin, Users, DollarSign, Mail,
  FileText, Calendar, BarChart3, TrendingUp, CheckCircle, Download,
  ChevronDown, ChevronUp, Upload, ClipboardList, Loader2, PlusIcon
} from "lucide-react";
import { format, parseISO, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const EdificioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: item, isLoading } = useQuery({
    queryKey: ['edificio', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gestion')
        .select('*')
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

  const cliente = item.cliente as any || {};
  const dataPresupuesto = item.data_presupuesto as any || {};
  const dataContrato = item.data_contrato as any || {};
  const datosPresupuesto = dataPresupuesto.datos_presupuesto || {};
  const datosContrato = dataContrato.datos_contrato || {};

  // Calculate report data
  const totalPagado = item.estadopago === 'Mes pagado' ? item.mesrenting : 0;

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

        {/* Tabs */}
        <Tabs defaultValue="informacion" className="space-y-6">
          <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-lg">
            <TabsTrigger value="informacion" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#1A367F] data-[state=active]:shadow-sm rounded-md px-4">
              Información
            </TabsTrigger>
            <TabsTrigger value="reportes" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#1A367F] data-[state=active]:shadow-sm rounded-md px-4">
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="informacion" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cliente Info */}
              <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
                <CardHeader className="border-b border-[#F1F5F9] p-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                      <Users className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
                    </div>
                    <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Datos del Cliente</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <InfoRow label="Comunidad" value={cliente.communityname} />
                  <InfoRow label="Administrador" value={cliente.adminname} />
                  <InfoRow label="Email" value={cliente.adminemail} icon={Mail} />
                  <InfoRow label="Empresa Gestora" value={cliente.managementcompany} />
                  <InfoRow label="Tipo" value={cliente.buildingtype} />
                  <InfoRow label="Unidades" value={cliente.units?.toString()} />
                  <InfoRow label="Dirección" value={cliente.buildingaddress} />
                  <InfoRow label="Comuna" value={cliente.comuna} />
                  <InfoRow label="Región" value={cliente.region} />
                  <InfoRow label="Portero" value={cliente.nombre_portero} />
                  <InfoRow label="Vendedor" value={cliente.vendedor} />
                </CardContent>
              </Card>

              {/* Presupuesto Info */}
              <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
                <CardHeader className="border-b border-[#F1F5F9] p-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                      <FileText className="h-4 w-4 text-[#F59E0B]" strokeWidth={2.5} />
                    </div>
                    <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Presupuesto</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <InfoRow label="Ascensores" value={datosPresupuesto.numAscensores?.toString()} />
                  <InfoRow label="Pisos" value={datosPresupuesto.numPisos?.toString()} />
                  <InfoRow label="Precio Mensual" value={datosPresupuesto.precioMensual ? `$${Number(datosPresupuesto.precioMensual).toLocaleString()}` : undefined} />
                  <InfoRow label="Precio Total" value={datosPresupuesto.precioTotal ? `$${Number(datosPresupuesto.precioTotal).toLocaleString()}` : undefined} />
                  <InfoRow label="Duración Contrato" value={datosPresupuesto.duracionContrato ? `${datosPresupuesto.duracionContrato} meses` : undefined} />
                  {datosPresupuesto && Object.keys(datosPresupuesto).length > 0 && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[12px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1.5 h-auto p-0"
                        onClick={() => {
                          const blob = generatePresupuestoPDF(cliente, datosPresupuesto);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `presupuesto_${cliente.communityname || 'edificio'}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar PDF presupuesto
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contrato Info */}
              <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
                <CardHeader className="border-b border-[#F1F5F9] p-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                      <CheckCircle className="h-4 w-4 text-[#10B981]" strokeWidth={2.5} />
                    </div>
                    <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Contrato</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {dataContrato.fecha_contrato_firmado && (
                    <InfoRow label="Fecha Firma" value={formatDate(dataContrato.fecha_contrato_firmado)} />
                  )}
                  {dataContrato.fecha_instalacion_equipos && (
                    <InfoRow label="Fecha Instalación" value={formatDate(dataContrato.fecha_instalacion_equipos)} />
                  )}
                  {dataContrato.doc_contrato && (
                    <div className="pt-2">
                      <a href={dataContrato.doc_contrato} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Ver contrato subido
                      </a>
                    </div>
                  )}
                  {datosContrato && Object.keys(datosContrato).length > 0 && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[12px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1.5 h-auto p-0"
                        onClick={() => {
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
                          a.href = url;
                          a.download = `contrato_${cliente.communityname || 'edificio'}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar contrato plantillado
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

// --- Reportes Tab Component ---
interface PagoRecord {
  mes: number;
  fecha_pago: string;
  monto: number;
  pagado: boolean;
  factura_url: string | null;
  fecha_pago_real: string | null;
}

const ReportesTab = ({ item, formatDate }: { item: any; formatDate: (d: string) => string }) => {
  const queryClient = useQueryClient();
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [uploadingMes, setUploadingMes] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMes, setSelectedMes] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [efectividad, setEfectividad] = useState("");
  const [efectividadComentario, setEfectividadComentario] = useState("");
  const [condicionGeneral, setCondicionGeneral] = useState("");
  const [funcionamiento, setFuncionamiento] = useState("");
  const [fechaRevision, setFechaRevision] = useState("");
  const [revisadoPor, setRevisadoPor] = useState("");

  const pagosJson: PagoRecord[] = Array.isArray(item.pagos_json) ? item.pagos_json : [];
  const montoRenting = item.monto_renting || 0;

  const pagadosList = pagosJson.filter(p => p.pagado);
  const pendientesList = pagosJson.filter(p => !p.pagado);

  // Fetch reportes for this gestion
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

  const handleUploadFactura = async () => {
    if (!selectedFile || !selectedMes) return;
    setIsUploading(true);
    try {
      const mesNum = parseInt(selectedMes);
      const filePath = `facturas/${item.id}/mes-${mesNum}-${Date.now()}.${selectedFile.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage
        .from("presupuestos-pdf")
        .upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("presupuestos-pdf")
        .getPublicUrl(filePath);
      const facturaUrl = publicUrlData.publicUrl;

      const updatedPagos = pagosJson.map(p =>
        p.mes === mesNum ? { ...p, factura_url: facturaUrl } : p
      );

      const { error: updateError } = await supabase
        .from("gestion")
        .update({ pagos_json: updatedPagos as any })
        .eq("id", item.id);
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

  const handleCreateReport = async () => {
    if (!efectividad || !condicionGeneral) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    setIsCreatingReport(true);
    try {
      const datosReporte = {
        efectividad,
        efectividad_comentario: efectividadComentario,
        condicion_general: condicionGeneral,
        funcionamiento,
        fecha_revision: fechaRevision,
        revisado_por: revisadoPor,
      };

      const { error } = await supabase
        .from("reportes")
        .insert({
          gestion_id: item.id,
          datos_reporte: datosReporte as any,
        });

      if (error) throw error;

      toast.success("Reporte creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ['reportes', item.id] });
      setReportDialogOpen(false);
      // Reset form
      setEfectividad("");
      setEfectividadComentario("");
      setCondicionGeneral("");
      setFuncionamiento("");
      setFechaRevision("");
      setRevisadoPor("");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el reporte");
    } finally {
      setIsCreatingReport(false);
    }
  };

  const handleDownloadReport = (reporte: any, index: number) => {
    const numero = (reportes?.length || 0) - index;
    const cliente = item.cliente as any || {};
    const blob = generateReportePDF({
      cliente,
      pagosJson,
      montoRenting,
      datosReporte: reporte.datos_reporte,
      numero,
      fecha: format(parseISO(reporte.created_at), "dd/MM/yyyy"),
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${numero}_${cliente.communityname || 'edificio'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const proximoPago = pendientesList[0];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard title="Renting Mensual" value={montoRenting ? `$${Number(montoRenting).toLocaleString()}` : "N/A"} icon={DollarSign} iconColor="text-[#1A367F]" iconBg="bg-[#F1F3F9]" />
        <ReportCard title="Estado Actual" value={item.estadopago} icon={CheckCircle} iconColor="text-[#10B981]" iconBg="bg-[#F0FDF4]" />
        <ReportCard title="Meses Pagados" value={`${pagadosList.length} / ${pagosJson.length}`} icon={Calendar} iconColor="text-[#F59E0B]" iconBg="bg-[#FFFBEB]" />
        <ReportCard title="Próximo Pago" value={proximoPago ? formatDate(proximoPago.fecha_pago) : "N/A"} icon={TrendingUp} iconColor="text-[#7C3AED]" iconBg="bg-[#F5F3FF]" />
      </div>

      {/* Payment history */}
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
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">${Number(p.monto).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7] hover:bg-[#F0FDF4] text-[10px] font-bold uppercase tracking-wider">Pagado</Badge>
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
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">${Number(proximoPago.monto).toLocaleString()}</TableCell>
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
                      <TableCell className="text-[12px] font-semibold text-[#94A3B8]">${Number(p.monto).toLocaleString()}</TableCell>
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

      {/* Reportes Generados */}
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
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Archivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingReportes ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
                      <span className="text-[12px] text-[#94A3B8]">Cargando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !reportes || reportes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[12px] text-[#94A3B8]">
                    No hay reportes generados
                  </TableCell>
                </TableRow>
              ) : (
                reportes.map((reporte, index) => {
                  const numero = reportes.length - index;
                  const datos = reporte.datos_reporte as any || {};
                  return (
                    <TableRow key={reporte.id} className="hover:bg-[#F8FAFC]">
                      <TableCell className="text-[12px] font-semibold text-[#1E293B]">#{numero}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{format(parseISO(reporte.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{datos.efectividad || "N/A"}</TableCell>
                      <TableCell className="text-[12px] text-[#64748B]">{datos.condicion_general || "N/A"}</TableCell>
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

      {/* Create Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Reporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Effectiveness section */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-[#1E293B]">Evaluación de efectividad de la solución</Label>
              <Select value={efectividad} onValueChange={setEfectividad}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
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

            {/* General condition section */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-[#1E293B]">Condición general</Label>
              <Select value={condicionGeneral} onValueChange={setCondicionGeneral}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Óptima">Óptima</SelectItem>
                  <SelectItem value="Buena">Buena</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Deficiente">Deficiente</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#64748B]">Funcionamiento</Label>
                <Textarea
                  placeholder="Describe el funcionamiento..."
                  value={funcionamiento}
                  onChange={e => setFuncionamiento(e.target.value)}
                  className="min-h-[50px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#64748B]">Fecha de Revisión</Label>
                <Input
                  type="date"
                  value={fechaRevision}
                  onChange={e => setFechaRevision(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#64748B]">Revisado por</Label>
                <Input
                  placeholder="Nombre del revisor"
                  value={revisadoPor}
                  onChange={e => setRevisadoPor(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancelar</Button>
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
    </div>
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

