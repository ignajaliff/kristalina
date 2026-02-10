
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle,
  ExternalLink,
  FileText,
  Edit,
  ArrowRight,
  Loader2,
  Building2,
  ChevronRight,
  Settings2
} from "lucide-react";
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

      toast({
        title: "Sincronización Exitosa",
        description: "Los datos operativos han sido actualizados en la plataforma central.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error enviando webhook:', error);
      toast({
        title: "Error de Sincronización",
        description: "No se pudo actualizar el sistema central, pero los cambios locales se guardaron.",
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
        title: "Información Actualizada",
        description: "El estado operativo del proyecto ha sido registrado.",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="contractSignDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Fecha Firma Contrato</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-11 pl-3 text-left font-semibold text-[13px] border-[#E2E8F0] rounded-xl bg-slate-50/50 hover:bg-white transition-all",
                          !field.value && "text-[#94A3B8]"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd 'de' MMMM, yyyy")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 text-[#1A367F]" />
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
                <FormLabel className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Fecha Instalación Equipos</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-11 pl-3 text-left font-semibold text-[13px] border-[#E2E8F0] rounded-xl bg-slate-50/50 hover:bg-white transition-all",
                          !field.value && "text-[#94A3B8]"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd 'de' MMMM, yyyy")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 text-[#1A367F]" />
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
              <FormLabel className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Estado de Equipos / Instalación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 border-[#E2E8F0] rounded-xl bg-slate-50/50 hover:bg-white transition-all font-semibold text-[13px]">
                    <SelectValue placeholder="Seleccione estado operativo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl border-[#E2E8F0]">
                  <SelectItem value="not_installed" className="text-[13px] font-medium py-2.5">Contrato no firmado / Equipos sin instalar</SelectItem>
                  <SelectItem value="contract_signed" className="text-[13px] font-medium py-2.5">Contrato firmado / En espera de instalación</SelectItem>
                  <SelectItem value="completed" className="text-[13px] font-medium py-2.5 text-emerald-600 focus:text-emerald-700">Instalación completada y verificada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-[#1A367F] hover:bg-[#12285e] text-white font-bold text-[13px] rounded-xl gap-2 shadow-sm transition-all active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              Actualizar Estado del Proyecto
              <ArrowRight className="h-4 w-4" />
            </>
          )}
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
      window.open("https://drive.google.com/file/d/1mvjvKucoS22aKcRtoXwhExcynTbFxvTs2oG1QDPeyGA/view", '_blank');
    }
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "n/a";
    try {
      return format(new Date(dateString), "dd MMM");
    } catch (error) {
      return "n/a";
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return "N/A";
    return amount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
  };

  const getEquipmentStatusText = (status?: string | null): string => {
    switch (status) {
      case "not_installed":
        return "Pendiente contrato / Instalación";
      case "contract_signed":
        return "Contrato Firmado / En proceso";
      case "installed":
        return "Equipos en sitio";
      case "completed":
        return "Instalación Verificada";
      default:
        return "Estado Desconocido";
    }
  };

  const getStatusBadgeColor = (status?: string | null) => {
    if (status === "completed") return "bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold";
    if (status === "contract_signed") return "bg-blue-50 text-[#1A367F] border border-blue-100 font-bold";
    return "bg-slate-50 text-[#64748B] border border-slate-100 font-bold";
  };

  const uniqueVendors = [...new Set(quotes.filter(q => q.vendedor).map(q => q.vendedor))];

  const filterOptions = [
    {
      label: "Tipo",
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
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="max-w-[1440px] ml-0 p-8 pt-10 pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-[14px] border border-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
                  Presupuestos Aceptados
                </h1>
                <p className="text-[#64748B] text-sm font-medium mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cartera de Clientes Activos - Gestión y Seguimiento Operativo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 pt-8 pb-8 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto space-y-8">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <SearchAndFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                filterOptions={filterOptions}
                searchPlaceholder="Buscar comunidad, administrador o vendedor..."
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando Proyectos...</p>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Building2 className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No se encontraron proyectos activos</h3>
                <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-bold text-[11px]">Ajusta los filtros de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="border-[#E2E8F0] shadow-sm overflow-hidden rounded-xl bg-white">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Comunidad</TableHead>
                          <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Administrador / Vendedor</TableHead>
                          <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Comercial</TableHead>
                          <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Estado Operativo</TableHead>
                          <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Fecha</TableHead>
                          <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuotes.map((quote) => (
                          <TableRow key={quote.id} className="border-b border-[#F1F5F9] hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="text-[13px] font-bold text-[#1E293B] tracking-tight">{quote.communityname}</span>
                                <span className="text-[11px] text-[#94A3B8] font-medium leading-tight line-clamp-1 truncate max-w-[200px]">
                                  {quote.buildingaddress || "No registrada"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-[12px] font-semibold text-[#1E293B]">{quote.adminname}</span>
                                <span className="text-[11px] text-[#64748B] font-medium mt-0.5">Vend: {quote.vendedor || "n/a"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#1A367F]">{formatCurrency(quote.monto)}</span>
                                <span className="text-[11px] font-bold text-[#64748B]">{quote.units} Unidades</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <Badge className={cn("px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-none flex items-center w-fit gap-1.5", getStatusBadgeColor(quote.equipos_instalados))}>
                                {quote.equipos_instalados === "completed" && <CheckCircle className="h-3 w-3" />}
                                {getEquipmentStatusText(quote.equipos_instalados)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-[12px] text-[#1E293B] font-bold">Aceptado</span>
                                <span className="text-[11px] text-[#94A3B8] font-medium">
                                  {formatDate(quote.fecha_aprobacion_presupuesto)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] rounded-lg"
                                  onClick={() => handleEditClick(quote)}
                                  title="Editar Registro"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-[#64748B] hover:text-[#059669] hover:bg-emerald-50 rounded-lg"
                                  onClick={() => handleOpenContract(quote)}
                                  title="Ver Contrato"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={quote.id === selectedQuoteId ? "default" : "outline"}
                                  className={cn(
                                    "h-8 px-3 font-bold text-[10px] uppercase tracking-wider rounded-lg border-[#E2E8F0] transition-all",
                                    quote.id === selectedQuoteId
                                      ? "bg-[#1A367F] text-white"
                                      : "bg-white text-[#1E293B] hover:bg-slate-50"
                                  )}
                                  onClick={() => handleUpdateClick(quote)}
                                >
                                  {quote.id === selectedQuoteId ? "Cerrar" : "Operaciones"}
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
                  <Card className="border-2 border-[#1A367F] shadow-xl overflow-hidden rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardContent className="p-0">
                      <div className="bg-[#1A367F] p-5 flex items-center gap-4 text-white">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                          <Settings2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold leading-none">Gestión Operativa del Proyecto</h3>
                          <p className="text-[11px] text-blue-100 mt-1.5 font-medium uppercase tracking-widest">
                            {filteredQuotes.find(q => q.id === selectedQuoteId)?.communityname}
                          </p>
                        </div>
                      </div>
                      <div className="p-8 bg-white">
                        <QuoteUpdateForm quoteId={selectedQuoteId} onUpdate={fetchQuotes} />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
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
