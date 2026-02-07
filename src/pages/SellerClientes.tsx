
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import SellerSidebar from "@/components/SellerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, Building, MapPin, Calendar, ArrowRight, Edit, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import EditDialog from "@/components/EditDialog";
import SearchAndFilter from "@/components/SearchAndFilter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  legalrepresentative: string | null;
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

  useEffect(() => {
    fetchClientes();
  }, [userProfile?.id]);

  useEffect(() => {
    setFilteredClientes(clientes);
  }, [clientes]);

  const fetchClientes = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .in('estado_contacto', ['Primer Contacto', 'Segundo Contacto'])
        .eq('vendedor_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clientes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes.",
          variant: "destructive",
        });
        return;
      }

      setClientes(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredClientes(clientes);
      return;
    }

    const filtered = clientes.filter(cliente =>
      cliente.communityname.toLowerCase().includes(query.toLowerCase()) ||
      cliente.adminname.toLowerCase().includes(query.toLowerCase()) ||
      cliente.adminemail.toLowerCase().includes(query.toLowerCase()) ||
      (cliente.buildingaddress && cliente.buildingaddress.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredClientes(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = clientes;

    if (filters.estado_contacto) {
      filtered = filtered.filter(cliente => cliente.estado_contacto === filters.estado_contacto);
    }

    if (filters.buildingtype) {
      filtered = filtered.filter(cliente => cliente.buildingtype === filters.buildingtype);
    }

    setFilteredClientes(filtered);
  };

  const handleEditClick = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingCliente(null);
  };

  const validateClienteData = (cliente: Cliente) => {
    const missingFields = [];
    
    if (!cliente.adminname || cliente.adminname.trim() === '') {
      missingFields.push('Nombre del Administrador');
    }
    
    if (!cliente.adminemail || cliente.adminemail.trim() === '') {
      missingFields.push('Email del Administrador');
    }
    
    if (!cliente.units || cliente.units <= 0) {
      missingFields.push('Unidades');
    }
    
    return missingFields;
  };

  const updateEstadoContacto = async (clienteId: string, nuevoEstado: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;

    // Validate required fields before updating status
    const missingFields = validateClienteData(cliente);
    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos incompletos",
        description: `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setUpdatingCliente(clienteId);
    
    try {
      const { error } = await supabase
        .from('presupuestos')
        .update({ estado_contacto: nuevoEstado })
        .eq('id', clienteId);

      if (error) {
        console.error('Error updating estado_contacto:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del cliente.",
          variant: "destructive",
        });
        return;
      }

      // If changing to "Presupuesto Enviado", trigger webhook
      if (nuevoEstado === "Presupuesto Enviado") {
        try {
          const webhookData = {
            ...cliente,
            estado_contacto: nuevoEstado,
            timestamp: new Date().toISOString(),
            source: "Kristalina CRM - Cliente Status Update"
          };

          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            mode: "no-cors",
            body: JSON.stringify(webhookData),
          });

          console.log("Webhook triggered for presupuesto enviado");
        } catch (webhookError) {
          console.error("Error triggering webhook:", webhookError);
        }
      }

      toast({
        title: "Estado actualizado",
        description: `El cliente ha sido actualizado a ${nuevoEstado}.`,
      });

      // Refresh the list
      fetchClientes();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado del cliente.",
        variant: "destructive",
      });
    } finally {
      setUpdatingCliente(null);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Primer Contacto":
        return "bg-blue-100 text-blue-800";
      case "Segundo Contacto":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNextEstado = (currentEstado: string) => {
    switch (currentEstado) {
      case "Primer Contacto":
        return "Segundo Contacto";
      case "Segundo Contacto":
        return "Presupuesto Enviado";
      default:
        return null;
    }
  };

  const getNextActionLabel = (currentEstado: string) => {
    switch (currentEstado) {
      case "Primer Contacto":
        return "Confirmar Primer Contacto";
      case "Segundo Contacto":
        return "Enviar Presupuesto";
      default:
        return "";
    }
  };

  const filterOptions = [
    {
      label: "Estado",
      key: "estado_contacto",
      options: [
        { value: "Primer Contacto", label: "Primer Contacto" },
        { value: "Segundo Contacto", label: "Segundo Contacto" },
      ]
    },
    {
      label: "Tipo de Edificio",
      key: "buildingtype",
      options: [
        { value: "Edificio", label: "Edificio" },
        { value: "Condominio", label: "Condominio" },
        { value: "Casa", label: "Casa" },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SellerSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona el seguimiento de tus clientes y actualiza su estado de contacto
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-8">
          <SearchAndFilter
            onSearch={handleSearch}
            onFilter={handleFilter}
            filterOptions={filterOptions}
            searchPlaceholder="Buscar por nombre, email, dirección..."
          />

          {filteredClientes.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                <p className="text-gray-600">
                  No tienes clientes asignados o no se encontraron clientes que coincidan con los criterios de búsqueda.
                </p>
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
                        <TableCell className="font-medium">
                          {cliente.communityname}
                        </TableCell>
                        <TableCell>{cliente.buildingaddress || "N/A"}</TableCell>
                        <TableCell>{cliente.adminname}</TableCell>
                        <TableCell>{cliente.adminemail}</TableCell>
                        <TableCell>{cliente.units}</TableCell>
                        <TableCell>
                          <Badge className={getEstadoBadgeColor(cliente.estado_contacto)}>
                            {cliente.estado_contacto}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(cliente)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const nextEstado = getNextEstado(cliente.estado_contacto);
                                if (nextEstado) {
                                  updateEstadoContacto(cliente.id, nextEstado);
                                }
                              }}
                              disabled={updatingCliente === cliente.id}
                            >
                              {updatingCliente === cliente.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  {getNextActionLabel(cliente.estado_contacto)}
                                </>
                              )}
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

      <EditDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        record={editingCliente}
        onUpdate={fetchClientes}
        type="cliente"
      />
    </div>
  );
};

export default SellerClientes;
