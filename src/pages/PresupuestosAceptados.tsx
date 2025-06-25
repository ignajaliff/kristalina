
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, ExternalLink, FileText, Edit } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Quote } from "@/utils/quoteStorage";
import AdminSidebar from "@/components/AdminSidebar";
import EditDialog from "@/components/EditDialog";
import SearchAndFilter from "@/components/SearchAndFilter";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
          let additional_at: Array<{ name: string; email: string }> = [];
          if (quoteData.additional_at) {
            try {
              if (typeof quoteData.additional_at === 'string') {
                additional_at = JSON.parse(quoteData.additional_at);
              } else if (Array.isArray(quoteData.additional_at)) {
                additional_at = quoteData.additional_at as Array<{ name: string; email: string }>;
              }
            } catch (e) {
              console.error("Error parsing additional_at:", e);
              additional_at = [];
            }
          }

          const convertedQuote: Quote = {
            ...quoteData,
            additional_at,
            monto: quoteData.monto || quoteData.units * 50000,
            por_unidad: quoteData.por_unidad || 50000,
            inversion: quoteData.inversion || Math.round((quoteData.monto || quoteData.units * 50000) * 0.8),
            status: "Aceptado" as "Enviado" | "Aceptado"
          };

          await sendWebhook(convertedQuote);
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

const PresupuestosAceptados = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("presupuesto_aceptado", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

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
            ...quote,
            additional_at,
            monto,
            por_unidad,
            inversion,
            status: "Aceptado"
          } as Quote;
        });

        setQuotes(processedQuotes);
        setFilteredQuotes(processedQuotes);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast({
        title: "Error",
        description: "Hubo un error al cargar los presupuestos aceptados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredQuotes(quotes);
      return;
    }

    const filtered = quotes.filter(quote =>
      quote.communityname.toLowerCase().includes(query.toLowerCase()) ||
      quote.adminname.toLowerCase().includes(query.toLowerCase()) ||
      (quote.buildingaddress && quote.buildingaddress.toLowerCase().includes(query.toLowerCase())) ||
      (quote.vendedor && quote.vendedor.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredQuotes(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = quotes;

    if (filters.buildingtype) {
      filtered = filtered.filter(quote => quote.buildingtype === filters.buildingtype);
    }

    if (filters.vendedor) {
      filtered = filtered.filter(quote => quote.vendedor === filters.vendedor);
    }

    setFilteredQuotes(filtered);
  };

  const handleEditClick = (quote: Quote) => {
    setEditingQuote(quote);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingQuote(null);
  };

  const handleUpdateClick = (quote: Quote) => {
    setSelectedQuoteId(quote.id === selectedQuoteId ? null : quote.id);
  };

  const handleOpenContract = (quote: Quote) => {
    if (quote.terminos_contrato) {
      window.open(quote.terminos_contrato, '_blank');
    } else {
      // Default contract URL
      window.open("https://drive.google.com/file/d/1mvjvKucoS22aKcRtoXwhExcynTbFxvTs2oG1QDPeyGA/view", '_blank');
    }
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "No establecido";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return "N/A";
    return amount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
  };

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

  // Get unique vendors for filter
  const uniqueVendors = [...new Set(quotes.filter(q => q.vendedor).map(q => q.vendedor))];

  const filterOptions = [
    {
      label: "Tipo de Edificio",
      key: "buildingtype",
      options: [
        { value: "Edificio", label: "Edificio" },
        { value: "Condominio", label: "Condominio" },
        { value: "Casa", label: "Casa" },
      ]
    },
    {
      label: "Vendedor",
      key: "vendedor",
      options: uniqueVendors.map(vendor => ({ value: vendor!, label: vendor! }))
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
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
                Gestiona todos los presupuestos aceptados por los clientes
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <SearchAndFilter
              onSearch={handleSearch}
              onFilter={handleFilter}
              filterOptions={filterOptions}
              searchPlaceholder="Buscar por comunidad, administrador, dirección..."
            />

            {isLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cargando...</CardTitle>
                  <CardDescription>
                    Obteniendo los presupuestos aceptados...
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : filteredQuotes.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No hay presupuestos aceptados</CardTitle>
                  <CardDescription>
                    Los presupuestos aceptados por los clientes aparecerán aquí.
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
                          <TableHead>Administrador</TableHead>
                          <TableHead>Vendedor</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Unidades</TableHead>
                          <TableHead>Fecha Aceptación</TableHead>
                          <TableHead>Estado Equipos</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuotes.map((quote) => (
                          <TableRow key={quote.id}>
                            <TableCell className="font-medium">
                              {quote.communityname}
                            </TableCell>
                            <TableCell>{quote.adminname}</TableCell>
                            <TableCell>{quote.vendedor || "N/A"}</TableCell>
                            <TableCell>{formatCurrency(quote.monto)}</TableCell>
                            <TableCell>{quote.units}</TableCell>
                            <TableCell>
                              {formatDate(quote.fecha_aprobacion_presupuesto)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                {getEquipmentStatusText(quote.equipos_instalados)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditClick(quote)}
                                >
                                  <Edit className="mr-1 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateClick(quote)}
                                >
                                  {quote.id === selectedQuoteId ? "Cerrar" : "Actualizar"}
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
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {selectedQuoteId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Actualizar Estado del Presupuesto</CardTitle>
                      <CardDescription>
                        Actualizar información adicional del presupuesto aceptado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <QuoteUpdateForm quoteId={selectedQuoteId} onUpdate={fetchQuotes} />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <EditDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        record={editingQuote}
        onUpdate={fetchQuotes}
        type="presupuesto"
      />
    </div>
  );
};

export default PresupuestosAceptados;
