
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Edit, UserRound, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import EditDialog from "@/components/EditDialog";
import EnviarPresupuestoDialog from "@/components/EnviarPresupuestoDialog";
import SearchAndFilter from "@/components/SearchAndFilter";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const WEBHOOK_URL = "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/66abaac8-fdce-4dde-a287-df61767ba4af";

interface Cliente {
  id: string;
  adminname: string;
  adminemail: string;
  communityname: string;
  buildingaddress: string | null;
  buildingtype: string;
  units: number;
  vendedor: string | null;
  estado_contacto: string;
  created_at: string;
  managementcompany: string | null;
  additional_at: Json | null;
  comuna: string | null;
  region: string | null;
}

const Clientes = () => {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCliente, setUpdatingCliente] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [presupuestoCliente, setPresupuestoCliente] = useState<Cliente | null>(null);
  const [isPresupuestoDialogOpen, setIsPresupuestoDialogOpen] = useState(false);

  useEffect(() => { fetchClientes(); }, []);
  useEffect(() => { setFilteredClientes(clientes); }, [clientes]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('prospectos')
        .select('*')
        .in('estado_contacto', ['Primer Contacto', 'Segundo Contacto'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clientes:', error);
        toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
        return;
      }
      setClientes(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "Ocurrió un error al cargar los clientes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) { setFilteredClientes(clientes); return; }
    const filtered = clientes.filter(cliente =>
      cliente.communityname.toLowerCase().includes(query.toLowerCase()) ||
      cliente.adminname.toLowerCase().includes(query.toLowerCase()) ||
      cliente.adminemail.toLowerCase().includes(query.toLowerCase()) ||
      (cliente.buildingaddress && cliente.buildingaddress.toLowerCase().includes(query.toLowerCase())) ||
      (cliente.vendedor && cliente.vendedor.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredClientes(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = clientes;
    if (filters.estado_contacto) filtered = filtered.filter(c => c.estado_contacto === filters.estado_contacto);
    if (filters.buildingtype) filtered = filtered.filter(c => c.buildingtype === filters.buildingtype);
    setFilteredClientes(filtered);
  };

  const handleEditClick = (cliente: Cliente) => { setEditingCliente(cliente); setIsEditDialogOpen(true); };
  const handleCloseEditDialog = () => { setIsEditDialogOpen(false); setEditingCliente(null); };

  const validateClienteData = (cliente: Cliente) => {
    const missingFields = [];
    if (!cliente.adminname || cliente.adminname.trim() === '') missingFields.push('Nombre del Administrador');
    if (!cliente.adminemail || cliente.adminemail.trim() === '') missingFields.push('Email del Administrador');
    if (!cliente.units || cliente.units <= 0) missingFields.push('Unidades');
    return missingFields;
  };

  const updateEstadoContacto = async (clienteId: string, nuevoEstado: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;

    const missingFields = validateClienteData(cliente);
    if (missingFields.length > 0) {
      toast({ title: "Campos requeridos incompletos", description: `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`, variant: "destructive" });
      return;
    }

    // If moving to "Presupuesto Enviado", open the presupuesto dialog instead
    if (nuevoEstado === "Presupuesto Enviado") {
      setPresupuestoCliente(cliente);
      setIsPresupuestoDialogOpen(true);
      return;
    }

    setUpdatingCliente(clienteId);
    try {
      const { error } = await supabase
        .from('prospectos')
        .update({ estado_contacto: nuevoEstado })
        .eq('id', clienteId);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el estado del cliente.", variant: "destructive" });
        return;
      }

      toast({ title: "Estado actualizado", description: `El cliente ha sido actualizado a ${nuevoEstado}.` });
      fetchClientes();
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al actualizar el estado.", variant: "destructive" });
    } finally {
      setUpdatingCliente(null);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Primer Contacto": return "bg-[#EFF6FF] text-[#1A367F]";
      case "Segundo Contacto": return "bg-[#FFFBEB] text-[#F59E0B]";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getNextEstado = (currentEstado: string) => {
    switch (currentEstado) {
      case "Primer Contacto": return "Segundo Contacto";
      case "Segundo Contacto": return "Presupuesto Enviado";
      default: return null;
    }
  };

  const getNextActionLabel = (currentEstado: string) => {
    switch (currentEstado) {
      case "Primer Contacto": return "Confirmar Primer Contacto";
      case "Segundo Contacto": return "Enviar Presupuesto";
      default: return "";
    }
  };

  const filterOptions = [
    { label: "Estado", key: "estado_contacto", options: [{ value: "Primer Contacto", label: "Primer Contacto" }, { value: "Segundo Contacto", label: "Segundo Contacto" }] },
    { label: "Tipo de Edificio", key: "buildingtype", options: [{ value: "Edificio", label: "Edificio" }, { value: "Condominio", label: "Condominio" }, { value: "Casa", label: "Casa" }] }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A367F] mx-auto"></div>
          <p className="mt-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto p-8 pt-10 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EFF6FF] rounded-[14px]"><UserRound className="h-7 w-7 text-[#1A367F]" strokeWidth={2.5} /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">Gestión de Clientes</h1>
              <p className="text-[#64748B] text-sm font-medium mt-0.5 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Administra tu cartera y haz seguimiento de prospectos
              </p>
            </div>
          </div>
        </div>
      </div>

        <div className="max-w-[1440px] mx-auto p-8 space-y-8">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4">
            <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} filterOptions={filterOptions} searchPlaceholder="Buscar por comunidad, administrador o dirección..." />
          </div>

          {filteredClientes.length === 0 ? (
            <div className="py-20 text-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="h-8 w-8 text-slate-300" /></div>
              <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-widest mb-1">No se encontraron registros</h3>
              <p className="text-[12px] text-[#94A3B8]">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <Card className="border border-[#E2E8F0] shadow-sm bg-white rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-[#F8FAFC]">
                    <TableRow className="border-b border-[#F1F5F9] hover:bg-transparent">
                      <TableHead className="h-12 px-6 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Comunidad</TableHead>
                      <TableHead className="h-12 px-6 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Dirección</TableHead>
                      <TableHead className="h-12 px-6 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Administrador</TableHead>
                      <TableHead className="h-12 px-6 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Email</TableHead>
                      <TableHead className="h-12 px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] text-center">Und.</TableHead>
                      <TableHead className="h-12 px-6 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Estado</TableHead>
                      <TableHead className="h-12 px-6 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Fecha</TableHead>
                      <TableHead className="h-12 px-6 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente) => (
                      <TableRow key={cliente.id} className="border-b border-[#F1F5F9] hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="px-6 py-4"><span className="text-[13px] font-bold text-[#1E293B] tracking-tight">{cliente.communityname}</span></TableCell>
                        <TableCell className="px-6 py-4"><span className="text-[12px] text-[#64748B] font-medium">{cliente.buildingaddress || "No registrada"}</span></TableCell>
                        <TableCell className="px-6 py-4"><span className="text-[13px] font-semibold text-[#1E293B]">{cliente.adminname}</span></TableCell>
                        <TableCell className="px-6 py-4"><span className="text-[12px] text-[#64748B] font-medium">{cliente.adminemail}</span></TableCell>
                        <TableCell className="px-4 py-4 text-center"><span className="text-[12px] font-bold text-[#1E293B]">{cliente.units}</span></TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className={cn("px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border-0 shadow-none", getEstadoBadgeColor(cliente.estado_contacto))}>{cliente.estado_contacto}</Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4"><span className="text-[12px] text-[#94A3B8] font-medium">{new Date(cliente.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span></TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] rounded-md" onClick={() => handleEditClick(cliente)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {getNextEstado(cliente.estado_contacto) && (
                              <Button size="sm" className="h-8 px-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[10px] uppercase tracking-wider gap-2 rounded-md transition-all active:scale-[0.98]"
                                onClick={() => { const next = getNextEstado(cliente.estado_contacto); if (next) updateEstadoContacto(cliente.id, next); }}
                                disabled={updatingCliente === cliente.id}
                              >
                                {updatingCliente === cliente.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                ) : (
                                  <><span>{getNextActionLabel(cliente.estado_contacto).split(' ')[0]}</span><ArrowRight className="h-3 w-3" strokeWidth={2.5} /></>
                                )}
                              </Button>
                            )}
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
      <EditDialog isOpen={isEditDialogOpen} onClose={handleCloseEditDialog} record={editingCliente} onUpdate={fetchClientes} type="cliente" />
      <EnviarPresupuestoDialog cliente={presupuestoCliente} open={isPresupuestoDialogOpen} onOpenChange={setIsPresupuestoDialogOpen} onComplete={fetchClientes} />
    </div>
  );
};

export default Clientes;
