
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import EditDialog from "@/components/EditDialog";
import SearchAndFilter from "@/components/SearchAndFilter";
import { useAuth } from "@/contexts/AuthContext";
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

const SellerClientes = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCliente, setUpdatingCliente] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => { fetchClientes(); }, [userProfile?.id]);
  useEffect(() => { setFilteredClientes(clientes); }, [clientes]);

  const fetchClientes = async () => {
    if (!userProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('prospectos')
        .select('*')
        .in('estado_contacto', ['Primer Contacto', 'Segundo Contacto'])
        .eq('vendedor_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
        return;
      }
      setClientes(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al cargar los clientes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) { setFilteredClientes(clientes); return; }
    const filtered = clientes.filter(c =>
      c.communityname.toLowerCase().includes(query.toLowerCase()) ||
      c.adminname.toLowerCase().includes(query.toLowerCase()) ||
      c.adminemail.toLowerCase().includes(query.toLowerCase()) ||
      (c.buildingaddress && c.buildingaddress.toLowerCase().includes(query.toLowerCase()))
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
    const missingFields: string[] = [];
    if (!cliente.adminname?.trim()) missingFields.push('Nombre del Administrador');
    if (!cliente.adminemail?.trim()) missingFields.push('Email del Administrador');
    if (!cliente.units || cliente.units <= 0) missingFields.push('Unidades');
    return missingFields;
  };

  const updateEstadoContacto = async (clienteId: string, nuevoEstado: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;

    const missingFields = validateClienteData(cliente);
    if (missingFields.length > 0) {
      toast({ title: "Campos requeridos incompletos", description: `Obligatorios: ${missingFields.join(', ')}`, variant: "destructive" });
      return;
    }

    setUpdatingCliente(clienteId);
    try {
      const { error } = await supabase
        .from('prospectos')
        .update({ estado_contacto: nuevoEstado })
        .eq('id', clienteId);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
        return;
      }

      // Auto-create presupuesto when changing to "Presupuesto Enviado"
      if (nuevoEstado === "Presupuesto Enviado") {
        const { error: presupuestoError } = await supabase
          .from('presupuestos')
          .insert([{ prospecto_id: clienteId, estado: 'Enviado', monto: 0, por_unidad: 0, inversion: 0 }]);

        if (presupuestoError) {
          console.error('Error creating presupuesto:', presupuestoError);
        }

        try {
          await fetch(WEBHOOK_URL, {
            method: "POST", headers: { "Content-Type": "application/json" }, mode: "no-cors",
            body: JSON.stringify({ ...cliente, estado_contacto: nuevoEstado, timestamp: new Date().toISOString() }),
          });
        } catch (e) { console.error("Webhook error:", e); }
      }

      toast({ title: "Estado actualizado", description: `Actualizado a ${nuevoEstado}.` });
      fetchClientes();
    } catch (error) {
      toast({ title: "Error", description: "Error al actualizar.", variant: "destructive" });
    } finally {
      setUpdatingCliente(null);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Primer Contacto": return "bg-blue-100 text-blue-800";
      case "Segundo Contacto": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getNextEstado = (e: string) => {
    if (e === "Primer Contacto") return "Segundo Contacto";
    if (e === "Segundo Contacto") return "Presupuesto Enviado";
    return null;
  };

  const getNextActionLabel = (e: string) => {
    if (e === "Primer Contacto") return "Confirmar Primer Contacto";
    if (e === "Segundo Contacto") return "Enviar Presupuesto";
    return "";
  };

  const filterOptions = [
    { label: "Estado", key: "estado_contacto", options: [{ value: "Primer Contacto", label: "Primer Contacto" }, { value: "Segundo Contacto", label: "Segundo Contacto" }] },
    { label: "Tipo", key: "buildingtype", options: [{ value: "Edificio", label: "Edificio" }, { value: "Condominio", label: "Condominio" }, { value: "Casa", label: "Casa" }] }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
            <p className="text-sm text-gray-600 mt-1">Gestiona el seguimiento de tus clientes</p>
          </div>
        </div>
      </div>
      <div className="p-8">
        <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} filterOptions={filterOptions} searchPlaceholder="Buscar por nombre, email, dirección..." />
        {filteredClientes.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
              <p className="text-gray-600">No tienes clientes asignados.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comunidad</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.communityname}</TableCell>
                      <TableCell>{cliente.buildingaddress || "N/A"}</TableCell>
                      <TableCell>{cliente.adminname}</TableCell>
                      <TableCell>{cliente.adminemail}</TableCell>
                      <TableCell>{cliente.units}</TableCell>
                      <TableCell><Badge className={getEstadoBadgeColor(cliente.estado_contacto)}>{cliente.estado_contacto}</Badge></TableCell>
                      <TableCell>{new Date(cliente.created_at).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(cliente)}>
                            <Edit className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          {getNextEstado(cliente.estado_contacto) && (
                            <Button size="sm" onClick={() => { const next = getNextEstado(cliente.estado_contacto); if (next) updateEstadoContacto(cliente.id, next); }} disabled={updatingCliente === cliente.id}>
                              {updatingCliente === cliente.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><ArrowRight className="h-4 w-4 mr-1" />{getNextActionLabel(cliente.estado_contacto)}</>}
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
    </div>
  );
};

export default SellerClientes;
