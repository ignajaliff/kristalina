import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, ExternalLink, FileText } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Quote } from "@/utils/quoteStorage";
import SellerSidebar from "@/components/SellerSidebar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const quoteUpdateSchema = z.object({
  contractSignDate: z.date().optional(),
  equipmentInstallDate: z.date().optional(),
  equipmentStatus: z.string().default("not_installed")
});

type QuoteUpdateFormValues = z.infer<typeof quoteUpdateSchema>;

const QuoteUpdateForm = ({ 
  quoteId, 
  onUpdate 
}: { 
  quoteId: string;
  onUpdate: () => void;
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<QuoteUpdateFormValues>({
    resolver: zodResolver(quoteUpdateSchema),
    defaultValues: {
      equipmentStatus: "not_installed"
    }
  });
  
  const sendWebhook = async (quoteData: Quote) => {
    try {
      const webhookData = {
        monto: quoteData.monto,
        fecha_instalacion_equipos: quoteData.fecha_instalacion_equipos,
        communityemail: quoteData.communityemail,
        buildingaddress: quoteData.buildingaddress,
        legalrepresentative: quoteData.legalrepresentative,
        buildingtype: quoteData.buildingtype
      };

      console.log('Enviando datos al webhook:', webhookData);

      const response = await fetch('https://n8n-n8n.qqtfab.easypanel.host/webhook-test/aa9be5f3-adfc-4eb1-9ca3-d87d6d79fc3f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Error en webhook: ${response.status}`);
      }

      console.log('Webhook enviado exitosamente');
      toast({
        title: "Webhook enviado",
        description: "Los datos han sido enviados exitosamente al webhook.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error enviando webhook:', error);
      toast({
        title: "Error en webhook",
        description: "No se pudo enviar los datos al webhook, pero la actualización se guardó.",
        variant: "destructive",
      });
    }
  };
  
  const onSubmit = async (data: QuoteUpdateFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("presupuestos")
        .update({
          fecha_firma_contrato: data.contractSignDate?.toISOString().split('T')[0],
          fecha_instalacion_equipos: data.equipmentInstallDate?.toISOString().split('T')[0],
          equipos_instalados: data.equipmentStatus
        })
        .eq("id", quoteId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Actualización exitosa",
        description: "La información del presupuesto ha sido actualizada.",
        variant: "default",
      });

      if (data.equipmentStatus === "completed") {
        const { data: quoteData, error: fetchError } = await supabase
          .from("presupuestos")
          .select("*")
          .eq("id", quoteId)
          .single();

        if (fetchError) {
          console.error("Error fetching quote data for webhook:", fetchError);
        } else if (quoteData) {
          await sendWebhook(quoteData as Quote);
        }
      }
      
      onUpdate();
    } catch (error) {
      console.error("Error al actualizar el presupuesto:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del presupuesto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contractSignDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Firma Contrato</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="equipmentInstallDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Instalación Equipos</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="equipmentStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado de Equipos</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="not_installed">Contrato no firmado y equipos no instalados</SelectItem>
                  <SelectItem value="contract_signed">Contrato firmado, equipos no instalados</SelectItem>
                  <SelectItem value="completed">Instalación completada y verificada</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Estado actual de la instalación de equipos
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Actualizando..." : "Actualizar Información"}
        </Button>
      </form>
    </Form>
  );
};

const SellerAcceptedQuotes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [acceptedQuotes, setAcceptedQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchAcceptedQuotes = async () => {
    if (!user?.name) return;
    
    setIsLoading(true);
    try {
      console.log('Buscando presupuestos aceptados para vendedor:', user.name);
      
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("presupuesto_aceptado", true)
        .eq("vendedor", user.name);
      
      if (error) {
        throw error;
      }
      
      console.log('Datos de presupuestos aceptados encontrados:', data);
      
      if (data) {
        const processedQuotes: Quote[] = data.map(quote => {
          const monto = quote.monto || quote.units * 50000;
          const por_unidad = quote.por_unidad || 50000;
          const inversion = quote.inversion || Math.round(monto * 0.8);
          
          let additional_at: Array<{ name: string; email: string }> = [];
          if (quote.additional_at) {
            try {
              if (typeof quote.additional_at === 'string') {
                additional_at = JSON.parse(quote.additional_at);
              } else if (Array.isArray(quote.additional_at)) {
                additional_at = quote.additional_at as Array<{ name: string; email: string }>;
              }
            } catch (e) {
              console.error("Error parsing additional_at:", e);
              additional_at = [];
            }
          }
          
          return {
            id: quote.id,
            adminname: quote.adminname,
            adminemail: quote.adminemail,
            managementcompany: quote.managementcompany,
            legalrepresentative: quote.legalrepresentative,
            additional_at,
            communityname: quote.communityname,
            buildingaddress: quote.buildingaddress,
            comuna: quote.comuna,
            region: quote.region,
            buildingtype: quote.buildingtype,
            units: quote.units,
            presupuesto_aceptado: quote.presupuesto_aceptado,
            created_at: quote.created_at,
            monto,
            por_unidad, 
            inversion,
            fecha_aprobacion_presupuesto: quote.fecha_aprobacion_presupuesto,
            fecha_firma_contrato: quote.fecha_firma_contrato,
            fecha_instalacion_equipos: quote.fecha_instalacion_equipos,
            terminos_contrato: quote.terminos_contrato,
            legalrepresentativerut: quote.legalrepresentativerut,
            communityrut: quote.communityrut,
            communityemail: quote.communityemail,
            legalrepresentativephone: quote.legalrepresentativephone,
            equipos_instalados: quote.equipos_instalados,
            communityformationdate: quote.communityformationdate,
            status: "Aceptado" as "Enviado" | "Aceptado"
          } as Quote;
        });
        
        setAcceptedQuotes(processedQuotes);
        console.log('Presupuestos aceptados procesados:', processedQuotes);
      }
    } catch (error) {
      console.error("Error fetching accepted quotes:", error);
      toast({
        title: "Error",
        description: "Hubo un error al cargar los presupuestos aceptados. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAcceptedQuotes();
  }, [user?.name]);
  
  const getEquipmentStatusText = (status?: string | null): string => {
    switch (status) {
      case "not_installed":
        return "Contrato no firmado y equipos no instalados";
      case "contract_signed":
        return "Contrato firmado, equipos no instalados";
      case "installed":
        return "Equipos instalados";
      case "completed":
        return "Instalación completada y verificada";
      default:
        return "Contrato no firmado y equipos no instalados";
    }
  };
  
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "No establecido";
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const handleOpenContract = (quote: Quote) => {
    if (quote.terminos_contrato) {
      window.open(quote.terminos_contrato, '_blank');
    } else {
      toast({
        title: "Sin contrato",
        description: "Este presupuesto no tiene un contrato disponible.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Presupuestos Aceptados
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Revisa tus presupuestos que han sido aprobados por los clientes
                {user?.name && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • Vendedor: {user.name}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cargando...</CardTitle>
                  <CardDescription>
                    Obteniendo tus presupuestos aceptados...
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : acceptedQuotes.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No hay presupuestos aceptados</CardTitle>
                  <CardDescription>
                    Los presupuestos que aceptes aparecerán aquí.
                    {user?.name && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Buscando para vendedor: {user.name}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <Card className="mb-6">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Edificio</TableHead>
                          <TableHead>Fecha firma de contrato</TableHead>
                          <TableHead>Fecha instalación de equipos</TableHead>
                          <TableHead>Fecha envío de contrato</TableHead>
                          <TableHead>Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {acceptedQuotes.map((quote) => {
                          return (
                            <TableRow key={quote.id}>
                              <TableCell className="font-medium">
                                {quote.communityname}
                              </TableCell>
                              <TableCell>{formatDate(quote.fecha_firma_contrato)}</TableCell>
                              <TableCell>{formatDate(quote.fecha_instalacion_equipos)}</TableCell>
                              <TableCell>{formatDate(quote.fecha_aprobacion_presupuesto)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedQuoteId(quote.id === selectedQuoteId ? null : quote.id)}
                                  >
                                    {quote.id === selectedQuoteId ? "Cerrar" : "Ver Detalles"}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenContract(quote)}
                                  >
                                    <FileText className="mr-1 h-4 w-4" />
                                    Contrato
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {selectedQuoteId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalles del Presupuesto</CardTitle>
                      <CardDescription>
                        Actualizar información adicional del presupuesto aceptado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const selectedQuote = acceptedQuotes.find(q => q.id === selectedQuoteId);
                        
                        if (!selectedQuote) {
                          return <p>No se encontró la información del presupuesto.</p>;
                        }
                        
                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-medium text-gray-700">Información de la Comunidad</h3>
                                <dl className="mt-2 space-y-1">
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Nombre:</dt>
                                    <dd>{selectedQuote.communityname}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Dirección:</dt>
                                    <dd>{selectedQuote.buildingaddress}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Comuna:</dt>
                                    <dd>{selectedQuote.comuna}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">RUT Comunidad:</dt>
                                    <dd>{selectedQuote.communityrut || 'No especificado'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Email:</dt>
                                    <dd>{selectedQuote.communityemail || selectedQuote.adminemail}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Fecha Constitución:</dt>
                                    <dd>{formatDate(selectedQuote.communityformationdate)}</dd>
                                  </div>
                                </dl>
                              </div>
                              
                              <div>
                                <h3 className="font-medium text-gray-700">Información del Representante Legal</h3>
                                <dl className="mt-2 space-y-1">
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Nombre:</dt>
                                    <dd>{selectedQuote.legalrepresentative || 'No especificado'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">RUT:</dt>
                                    <dd>{selectedQuote.legalrepresentativerut || 'No especificado'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Teléfono:</dt>
                                    <dd>{selectedQuote.legalrepresentativephone || 'No especificado'}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-medium text-gray-700">Información del Presupuesto</h3>
                              <dl className="mt-2 space-y-1">
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Monto:</dt>
                                  <dd>{selectedQuote.monto ? selectedQuote.monto.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }) : 'No especificado'}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Monto por Unidad:</dt>
                                  <dd>{selectedQuote.por_unidad ? selectedQuote.por_unidad.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }) : 'No especificado'}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Valor Inversión:</dt>
                                  <dd>{selectedQuote.inversion ? selectedQuote.inversion.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }) : 'No especificado'}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Fecha Aprobación:</dt>
                                  <dd>{formatDate(selectedQuote.fecha_aprobacion_presupuesto)}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Firma Contrato:</dt>
                                  <dd>{formatDate(selectedQuote.fecha_firma_contrato)}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Instalación Equipos:</dt>
                                  <dd>{formatDate(selectedQuote.fecha_instalacion_equipos)}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Estado Equipos:</dt>
                                  <dd>{getEquipmentStatusText(selectedQuote.equipos_instalados)}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Documentos:</dt>
                                  <dd>
                                    <a 
                                      href="https://drive.google.com/file/d/1mvjvKucoS22aKcRtoXwhExcynTbFxvTs2oG1QDPeyGA/view"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                                    >
                                      Ver documento en Google Drive
                                      <ExternalLink className="ml-1 h-4 w-4" />
                                    </a>
                                  </dd>
                                </div>
                              </dl>
                            </div>
                            
                            <div className="border-t pt-6">
                              <h3 className="font-medium text-gray-700 mb-4">Actualizar Información</h3>
                              <QuoteUpdateForm quoteId={selectedQuoteId} onUpdate={fetchAcceptedQuotes} />
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAcceptedQuotes;

}
