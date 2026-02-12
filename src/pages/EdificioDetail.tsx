import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileDrawer from "@/components/MobileDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, ArrowLeft, MapPin, Users, DollarSign, Mail, Phone,
  FileText, Calendar, BarChart3, TrendingUp, CheckCircle, Download,
  ChevronDown, ChevronUp, Plus, ClipboardList
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
                  {dataPresupuesto.doc_presupuesto && (
                    <div className="pt-2">
                      <a href={dataPresupuesto.doc_presupuesto} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#1A367F] font-semibold hover:underline flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Ver PDF del presupuesto
                      </a>
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
                        Ver PDF del contrato
                      </a>
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
const ReportesTab = ({ item, formatDate }: { item: any; formatDate: (d: string) => string }) => {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [reports, setReports] = useState<{ id: number; fecha: string; tipo: string; notas: string }[]>([
    { id: 1, fecha: "2026-01-15", tipo: "Reporte Mensual", notas: "Sin novedades" },
  ]);

  const mesRenting = item.mesrenting || 1;
  const montoMensual = (() => {
    const dp = item.data_presupuesto as any;
    return dp?.datos_presupuesto?.precioMensual || item.mesrenting || 0;
  })();

  const startDate = item.created_at ? parseISO(item.created_at) : new Date();
  const paidPayments = Array.from({ length: mesRenting }, (_, i) => ({
    mes: i + 1,
    fecha: format(addMonths(startDate, i), "dd/MM/yyyy"),
    monto: montoMensual,
    estado: "Pagado" as const,
  }));

  const upcomingPayments = Array.from({ length: 12 }, (_, i) => ({
    mes: mesRenting + i + 1,
    fecha: format(addMonths(startDate, mesRenting + i), "dd/MM/yyyy"),
    monto: montoMensual,
    estado: "Pendiente" as const,
  }));

  const handleDownload = (mes: number) => {
    toast.success(`Descargando comprobante del mes ${mes}`);
  };

  const handleCreateReport = () => {
    const newReport = {
      id: reports.length + 1,
      fecha: format(new Date(), "yyyy-MM-dd"),
      tipo: "Reporte Mensual",
      notas: "Reporte generado automáticamente",
    };
    setReports([...reports, newReport]);
    toast.success("Reporte creado exitosamente");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard title="Renting Mensual" value={`$${Number(montoMensual).toLocaleString()}`} icon={DollarSign} iconColor="text-[#1A367F]" iconBg="bg-[#F1F3F9]" />
        <ReportCard title="Estado Actual" value={item.estadopago} icon={CheckCircle} iconColor="text-[#10B981]" iconBg="bg-[#F0FDF4]" />
        <ReportCard title="Mes Renting" value={`Mes ${mesRenting}`} icon={Calendar} iconColor="text-[#F59E0B]" iconBg="bg-[#FFFBEB]" />
        <ReportCard title="Próximo Pago" value={formatDate(item.fechapago)} icon={TrendingUp} iconColor="text-[#7C3AED]" iconBg="bg-[#F5F3FF]" />
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-[#F1F5F9] p-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
              <BarChart3 className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Historial de Pagos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Mes</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Monto</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Estado</TableHead>
                <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paidPayments.map((p) => (
                <TableRow key={p.mes} className="hover:bg-[#F8FAFC]">
                  <TableCell className="text-[12px] font-semibold text-[#1E293B]">Mes {p.mes}</TableCell>
                  <TableCell className="text-[12px] text-[#64748B]">{p.fecha}</TableCell>
                  <TableCell className="text-[12px] font-semibold text-[#1E293B]">${Number(p.monto).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7] hover:bg-[#F0FDF4] text-[10px] font-bold uppercase tracking-wider">
                      {p.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(p.mes)} className="h-7 px-2 text-[#1A367F] hover:bg-[#EFF6FF]">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {showUpcoming && upcomingPayments.map((p) => (
                <TableRow key={`upcoming-${p.mes}`} className="bg-[#F8FAFC] opacity-50">
                  <TableCell className="text-[12px] font-semibold text-[#94A3B8]">Mes {p.mes}</TableCell>
                  <TableCell className="text-[12px] text-[#CBD5E1]">{p.fecha}</TableCell>
                  <TableCell className="text-[12px] font-semibold text-[#94A3B8]">${Number(p.monto).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] hover:bg-[#F1F5F9] text-[10px] font-bold uppercase tracking-wider">
                      Pendiente
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled className="h-7 px-2 text-[#CBD5E1]">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-[#F1F5F9]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpcoming(!showUpcoming)}
              className="w-full text-[12px] font-semibold text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] border-[#E2E8F0] gap-2"
            >
              {showUpcoming ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showUpcoming ? "Ocultar próximos pagos" : "Ver próximos pagos"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-[#F1F5F9] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <ClipboardList className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Reportes</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={handleCreateReport}
              className="h-8 px-4 bg-[#1A367F] hover:bg-[#152D6B] text-white text-[11px] font-bold rounded-lg gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear Reporte
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
              <ClipboardList className="h-10 w-10 text-[#E2E8F0]" />
              <p className="text-sm font-semibold text-[#64748B]">Sin reportes</p>
              <p className="text-[12px] text-[#94A3B8]">Crea tu primer reporte usando el botón de arriba</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">#</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Fecha</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Tipo</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Notas</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} className="hover:bg-[#F8FAFC]">
                    <TableCell className="text-[12px] font-semibold text-[#1E293B]">{r.id}</TableCell>
                    <TableCell className="text-[12px] text-[#64748B]">{formatDate(r.fecha)}</TableCell>
                    <TableCell className="text-[12px] font-medium text-[#1E293B]">{r.tipo}</TableCell>
                    <TableCell className="text-[12px] text-[#64748B] max-w-[200px] truncate">{r.notas}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => toast.success(`Descargando reporte #${r.id}`)} className="h-7 px-2 text-[#1A367F] hover:bg-[#EFF6FF]">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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
