import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, Building, MapPin, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

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

const Clientes = () => {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCliente, setUpdatingCliente] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .in('estado_contacto', ['Primer Contacto', 'Segundo Contacto'])
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

  const updateEstadoContacto = async (clienteId: string, nuevoEstado: string) => {
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
        const cliente = clientes.find(c => c.id === clienteId);
        if (cliente) {
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
        return "Marcar como Segundo Contacto";
      case "Segundo Contacto":
        return "Enviar Presupuesto";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <AdminSidebar />
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
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona el seguimiento de clientes y actualiza su estado de contacto
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-8">
          {clientes.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                <p className="text-gray-600">
                  No se encontraron clientes en proceso de contacto.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {clientes.map((cliente) => (
                <Card key={cliente.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {cliente.communityname}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {cliente.buildingtype} • {cliente.units} unidades
                        </p>
                      </div>
                      <Badge className={`${getEstadoBadgeColor(cliente.estado_contacto)} text-xs`}>
                        {cliente.estado_contacto}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Admin:</span>
                        <span className="font-medium">{cliente.adminname}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{cliente.adminemail}</span>
                      </div>
                      
                      {cliente.buildingaddress && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{cliente.buildingaddress}</span>
                        </div>
                      )}
                      
                      {cliente.managementcompany && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{cliente.managementcompany}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      
                      {cliente.vendedor && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Vendedor:</span>
                          <span className="font-medium">{cliente.vendedor}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => {
                          const nextEstado = getNextEstado(cliente.estado_contacto);
                          if (nextEstado) {
                            updateEstadoContacto(cliente.id, nextEstado);
                          }
                        }}
                        disabled={updatingCliente === cliente.id}
                        className="w-full flex items-center gap-2"
                        size="sm"
                      >
                        {updatingCliente === cliente.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Actualizando...
                          </>
                        ) : (
                          <>
                            {getNextActionLabel(cliente.estado_contacto)}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clientes;
