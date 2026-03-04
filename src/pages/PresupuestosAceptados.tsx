
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Building2, Settings2, Pencil, Download } from "lucide-react";


import SearchAndFilter from "@/components/SearchAndFilter";
import EditContratoDialog from "@/components/EditContratoDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { generateContratoPDF } from "@/utils/contractPdfGenerator";

interface ContratoRow {
  id: string;
  prospecto_id: string;
  estado_contrato: string;
  estado_equipos: string;
  fecha_instalacion_equipos: string | null;
  fecha_contrato_firmado: string | null;
  created_at: string;
  datos_contrato: any;
  doc_contrato: string | null;
  prospectos: {
    communityname: string;
    adminname: string;
    adminemail: string;
    buildingaddress: string | null;
    vendedor: string | null;
    buildingtype: string;
    units: number;
  };
}

const PresupuestosAceptados = () => {
  const { toast } = useToast();
  const [contratos, setContratos] = useState<ContratoRow[]>([]);
  const [filteredContratos, setFilteredContratos] = useState<ContratoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editContrato, setEditContrato] = useState<ContratoRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchContratos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contratos")
        .select("*, prospectos(communityname, adminname, adminemail, buildingaddress, vendedor, buildingtype, units)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContratos((data as any) || []);
      setFilteredContratos((data as any) || []);
    } catch (error) {
      console.error("Error fetching contratos:", error);
      toast({ title: "Error", description: "Error al cargar los contratos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchContratos(); }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) { setFilteredContratos(contratos); return; }
    const filtered = contratos.filter(c =>
      c.prospectos?.communityname?.toLowerCase().includes(query.toLowerCase()) ||
      c.prospectos?.adminname?.toLowerCase().includes(query.toLowerCase()) ||
      (c.prospectos?.vendedor && c.prospectos.vendedor.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredContratos(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = contratos;
    if (filters.estado_contrato) filtered = filtered.filter(c => c.estado_contrato === filters.estado_contrato);
    if (filters.estado_equipos) filtered = filtered.filter(c => c.estado_equipos === filters.estado_equipos);
    setFilteredContratos(filtered);
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "n/a";
    try { return format(new Date(dateString), "dd MMM"); } catch { return "n/a"; }
  };

  const getContratoBadgeColor = (estado: string) => {
    if (estado === "Contrato firmado") return "bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold";
    return "bg-slate-50 text-[#64748B] border border-slate-100 font-bold";
  };

  const getEquiposBadgeColor = (estado: string) => {
    if (estado === "Instalacion completada y verificada") return "bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold";
    if (estado === "En espera de instalacion") return "bg-blue-50 text-[#1A367F] border border-blue-100 font-bold";
    return "bg-slate-50 text-[#64748B] border border-slate-100 font-bold";
  };

  const filterOptions = [
    { label: "Estado Contrato", key: "estado_contrato", options: [{ value: "Contrato no firmado", label: "No firmado" }, { value: "Contrato firmado", label: "Firmado" }] },
    { label: "Estado Equipos", key: "estado_equipos", options: [{ value: "Equipos sin instalar", label: "Sin instalar" }, { value: "En espera de instalacion", label: "En espera" }, { value: "Instalacion completada y verificada", label: "Completada" }] },
  ];

  return (
    <>
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-6">
        <div className="bg-white border-b border-[#E2E8F0] px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EFF6FF] rounded-xl"><Settings2 className="h-6 w-6 text-[#1A367F]" strokeWidth={2.5} /></div>
            <div>
              <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">Gestión de Contratos</h1>
              <p className="text-[12px] text-[#64748B] font-medium mt-0.5">Administra los contratos e instalaciones</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 pt-8 pb-8 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto space-y-6">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} filterOptions={filterOptions} searchPlaceholder="Buscar comunidad, administrador..." />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando contratos...</p>
              </div>
            ) : filteredContratos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="p-4 bg-slate-50 rounded-full mb-4"><Building2 className="h-8 w-8 text-slate-300" /></div>
                <h3 className="text-lg font-bold text-slate-900">No hay contratos</h3>
                <p className="text-sm text-slate-500 mt-1">Los contratos aparecerán cuando se acepten presupuestos</p>
              </div>
            ) : (
              <Card className="border-[#E2E8F0] shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Comunidad</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Administrador</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Vendedor</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Estado Contrato</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Estado Equipos</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Fecha Contrato</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Fecha Instalación</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContratos.map((contrato) => (
                        <TableRow key={contrato.id} className="border-b border-[#F1F5F9] hover:bg-slate-50/50 transition-colors">
                          <TableCell className="px-6 py-4"><span className="text-[13px] font-bold text-[#1E293B]">{contrato.prospectos?.communityname}</span></TableCell>
                          <TableCell className="px-6 py-4"><span className="text-[13px] font-semibold text-[#1E293B]">{contrato.prospectos?.adminname}</span></TableCell>
                          <TableCell className="px-6 py-4"><span className="text-[12px] text-[#64748B] font-medium">{contrato.prospectos?.vendedor || "N/A"}</span></TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className={cn("px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider shadow-none", getContratoBadgeColor(contrato.estado_contrato))}>{contrato.estado_contrato}</Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className={cn("px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider shadow-none", getEquiposBadgeColor(contrato.estado_equipos))}>{contrato.estado_equipos}</Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4"><span className="text-[12px] text-[#94A3B8] font-medium">{formatDate(contrato.fecha_contrato_firmado)}</span></TableCell>
                          <TableCell className="px-6 py-4"><span className="text-[12px] text-[#94A3B8] font-medium">{formatDate(contrato.fecha_instalacion_equipos)}</span></TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {(contrato.doc_contrato || contrato.datos_contrato) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-[#64748B] hover:text-orange-600 hover:bg-orange-50 rounded-md"
                                  title="Descargar PDF contrato"
                                  onClick={() => {
                                    if (contrato.doc_contrato) {
                                      // Download the manually uploaded contract
                                      const a = document.createElement("a");
                                      a.href = contrato.doc_contrato;
                                      a.target = "_blank";
                                      a.download = `contrato_${contrato.prospectos?.communityname}.pdf`;
                                      a.click();
                                    } else {
                                      // Fall back to template generation
                                      const datos = contrato.datos_contrato as any;
                                      const blob = generateContratoPDF({
                                        adminname: contrato.prospectos?.adminname || '',
                                        adminemail: contrato.prospectos?.adminemail || '',
                                        communityname: contrato.prospectos?.communityname || '',
                                        buildingaddress: contrato.prospectos?.buildingaddress,
                                        buildingtype: contrato.prospectos?.buildingtype || '',
                                        units: contrato.prospectos?.units || 0,
                                        vendedor: contrato.prospectos?.vendedor,
                                        monto: null,
                                      }, datos);
                                      const url = URL.createObjectURL(blob);
                                      const a2 = document.createElement("a");
                                      a2.href = url;
                                      a2.download = `contrato_${contrato.prospectos?.communityname}.pdf`;
                                      a2.click();
                                      URL.revokeObjectURL(url);
                                    }
                                  }}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[11px] font-semibold gap-1.5 h-8 border-[#E2E8F0] text-[#1A367F] hover:bg-[#EFF6FF]"
                                onClick={() => { setEditContrato(contrato); setEditOpen(true); }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Modificar estados
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <EditContratoDialog
        contrato={editContrato}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaveComplete={fetchContratos}
      />
    </>
  );
};

export default PresupuestosAceptados;
