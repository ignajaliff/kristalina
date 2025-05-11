
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AcceptedQuote, Quote, loadAcceptedQuotes, loadQuotes, updateQuote } from "@/utils/quoteStorage";
import AdminSidebar from "@/components/AdminSidebar";
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

// Schema for form updates
const quoteUpdateSchema = z.object({
  contractSignDate: z.date().optional(),
  equipmentInstallDate: z.date().optional(),
  contractTerms: z.string().optional(),
  equipmentStatus: z.string().default("not_installed")
});

type QuoteUpdateFormValues = z.infer<typeof quoteUpdateSchema>;

// Component to update an accepted quote with additional info
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
      contractTerms: "",
      equipmentStatus: "not_installed"
    }
  });
  
  const onSubmit = (data: QuoteUpdateFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Update the quote with the additional information
      updateQuote(quoteId, {
        contractSignDate: data.contractSignDate?.toISOString(),
        equipmentInstallDate: data.equipmentInstallDate?.toISOString(),
        contractTerms: data.contractTerms,
        equipmentStatus: data.equipmentStatus
      });
      
      toast({
        title: "Actualización exitosa",
        description: "La información del presupuesto ha sido actualizada.",
        variant: "default", // Changed from "success" to "default" to fix the type error
      });
      
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
          name="contractTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Términos del Contrato</FormLabel>
              <FormControl>
                <textarea
                  className="w-full border rounded-md p-3 min-h-[100px]"
                  placeholder="Ingrese los términos del contrato"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
                  <SelectItem value="installed">Equipos instalados</SelectItem>
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

// Main page component
const AcceptedQuotes = () => {
  const { toast } = useToast();
  const [acceptedQuotes, setAcceptedQuotes] = useState<AcceptedQuote[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  
  // Define the refreshData function before using it
  const refreshData = () => {
    const loadedAcceptedQuotes = loadAcceptedQuotes();
    const loadedQuotes = loadQuotes();
    setAcceptedQuotes(loadedAcceptedQuotes);
    setQuotes(loadedQuotes);
  };
  
  // Use useEffect instead of useState for initialization
  useEffect(() => {
    refreshData();
  }, []);
  
  // Find the quote data for an accepted quote
  const findQuoteData = (acceptedQuoteId: string): Quote | undefined => {
    return quotes.find(quote => quote.id === acceptedQuoteId);
  };
  
  // Get equipment status display text
  const getEquipmentStatusText = (status?: string): string => {
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
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No establecido";
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Fecha inválida";
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Presupuestos Aceptados</h1>
          
          {acceptedQuotes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No hay presupuestos aceptados</CardTitle>
                <CardDescription>
                  Los presupuestos aceptados aparecerán aquí.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comunidad</TableHead>
                      <TableHead>Representante Legal</TableHead>
                      <TableHead>Fecha Aprobación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acceptedQuotes.map((acceptedQuote) => {
                      const quoteData = findQuoteData(acceptedQuote.quoteId);
                      if (!quoteData) return null;
                      
                      return (
                        <TableRow key={acceptedQuote.quoteId}>
                          <TableCell className="font-medium">
                            {quoteData.communityName}
                          </TableCell>
                          <TableCell>{acceptedQuote.legalRepresentativeRut}</TableCell>
                          <TableCell>{formatDate(acceptedQuote.acceptedAt)}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              quoteData.equipmentStatus === "completed" ? "bg-green-100 text-green-800" :
                              quoteData.equipmentStatus === "installed" ? "bg-blue-100 text-blue-800" :
                              quoteData.equipmentStatus === "contract_signed" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {quoteData.equipmentStatus === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                              {getEquipmentStatusText(quoteData.equipmentStatus)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedQuoteId(acceptedQuote.quoteId === selectedQuoteId ? null : acceptedQuote.quoteId)}
                            >
                              {acceptedQuote.quoteId === selectedQuoteId ? "Cerrar" : "Ver Detalles"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {selectedQuoteId && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Detalles del Presupuesto</CardTitle>
                    <CardDescription>
                      Actualizar información adicional del presupuesto aceptado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const acceptedQuote = acceptedQuotes.find(q => q.quoteId === selectedQuoteId);
                      const quoteData = findQuoteData(selectedQuoteId);
                      
                      if (!acceptedQuote || !quoteData) {
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
                                  <dd>{quoteData.communityName}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Dirección:</dt>
                                  <dd>{quoteData.buildingAddress}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Comuna:</dt>
                                  <dd>{quoteData.comuna}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">RUT Comunidad:</dt>
                                  <dd>{acceptedQuote.communityRut}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Email:</dt>
                                  <dd>{acceptedQuote.communityEmail}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Fecha Constitución:</dt>
                                  <dd>{formatDate(acceptedQuote.communityFormationDate)}</dd>
                                </div>
                              </dl>
                            </div>
                            
                            <div>
                              <h3 className="font-medium text-gray-700">Información del Representante Legal</h3>
                              <dl className="mt-2 space-y-1">
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Nombre:</dt>
                                  <dd>{quoteData.legalRepresentative || 'No especificado'}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">RUT:</dt>
                                  <dd>{acceptedQuote.legalRepresentativeRut}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Teléfono:</dt>
                                  <dd>{acceptedQuote.legalRepresentativePhone}</dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-700">Información del Presupuesto</h3>
                            <dl className="mt-2 space-y-1">
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Monto:</dt>
                                <dd>{quoteData.quoteAmount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Monto por Unidad:</dt>
                                <dd>{quoteData.quotePerUnit.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Valor Inversión:</dt>
                                <dd>{quoteData.investmentValue.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Fecha Aprobación:</dt>
                                <dd>{formatDate(acceptedQuote.acceptedAt)}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Firma Contrato:</dt>
                                <dd>{formatDate(quoteData.contractSignDate)}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Instalación Equipos:</dt>
                                <dd>{formatDate(quoteData.equipmentInstallDate)}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Estado Equipos:</dt>
                                <dd>{getEquipmentStatusText(quoteData.equipmentStatus)}</dd>
                              </div>
                            </dl>
                          </div>
                          
                          {quoteData.contractTerms && (
                            <div>
                              <h3 className="font-medium text-gray-700">Términos del Contrato</h3>
                              <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                                <p className="whitespace-pre-wrap">{quoteData.contractTerms}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="border-t pt-6">
                            <h3 className="font-medium text-gray-700 mb-4">Actualizar Información</h3>
                            <QuoteUpdateForm quoteId={selectedQuoteId} onUpdate={refreshData} />
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
  );
};

export default AcceptedQuotes;
