import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Eye, CheckCircle, ArrowRight, Loader2, Building2 } from "lucide-react";

import { Quote } from "@/utils/quoteStorage";
import AdminSidebar from "@/components/AdminSidebar";
import QuotesTableHeader from "@/components/QuotesTableHeader";
import SearchAndFilter from "@/components/SearchAndFilter";
import AcceptQuoteDialog from "@/components/AcceptQuoteDialog";
import EditDialog from "@/components/EditDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const QuotesTable = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("estado_contacto", "Presupuesto Enviado")
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
            status: quote.presupuesto_aceptado ? "Aceptado" : "Enviado"
          } as Quote;
        });

        setQuotes(processedQuotes);
        setFilteredQuotes(processedQuotes);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast({
        title: "Error",
        description: "Hubo un error al cargar los presupuestos. Por favor, intente nuevamente.",
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

    if (filters.status) {
      filtered = filtered.filter(quote => quote.status === filters.status);
    }

    setFilteredQuotes(filtered);
  };

  const handleAcceptQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDialogOpen(true);
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedQuote(null);
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "n/a";
    try {
      return format(new Date(dateString), "dd MMM");
    } catch (error) {
      return "n/a";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "Aceptado") return "bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold";
    return "bg-blue-50 text-[#1A367F] border border-blue-100 font-bold";
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
      label: "Estado",
      key: "status",
      options: [
        { value: "Enviado", label: "Enviado" },
        { value: "Aceptado", label: "Aceptado" },
      ]
    },
    {
      label: "Vendedor",
      key: "vendedor",
      options: uniqueVendors.map(vendor => ({ value: vendor!, label: vendor! }))
    }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <QuotesTableHeader />

        <div className="flex-1 px-8 pt-8 pb-8 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto space-y-6">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
              <SearchAndFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                filterOptions={filterOptions}
                searchPlaceholder="Buscar comunidad, dirección o administrador..."
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando CRM...</p>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Building2 className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No se encontraron registros</h3>
                <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-bold text-[11px]">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              <Card className="border-[#E2E8F0] shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Comunidad</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Dirección</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Administrador</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Vendedor</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Estado</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Fecha</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotes.map((quote) => (
                        <TableRow key={quote.id} className="border-b border-[#F1F5F9] hover:bg-slate-50/50 transition-colors group">
                          <TableCell className="px-6 py-4">
                            <span className="text-[13px] font-bold text-[#1E293B] tracking-tight">{quote.communityname}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-[12px] text-[#64748B] font-medium leading-tight">
                              {quote.buildingaddress || "No registrada"}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-[13px] font-semibold text-[#1E293B]">{quote.adminname}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-[12px] text-[#64748B] font-medium">{quote.vendedor || "Sin asignar"}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className={cn("px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-none", getStatusBadgeColor(quote.status))}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-[12px] text-[#94A3B8] font-medium">
                              {formatDate(quote.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] rounded-md"
                                onClick={() => handleViewQuote(quote)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {quote.status === "Enviado" && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[10px] uppercase tracking-wider gap-2 rounded-md transition-all active:scale-[0.98]"
                                  onClick={() => handleAcceptQuote(quote)}
                                >
                                  <span>Aceptar</span>
                                  <CheckCircle className="h-3 w-3" strokeWidth={2.5} />
                                </Button>
                              )}
                              {quote.status === "Aceptado" && (
                                <div className="h-8 w-8 flex items-center justify-center text-emerald-500">
                                  <CheckCircle className="h-4 w-4" />
                                </div>
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
        </div>
      </div>

      <AcceptQuoteDialog
        quote={selectedQuote}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAcceptComplete={() => {
          setIsDialogOpen(false);
          setSelectedQuote(null);
          fetchQuotes();
        }}
      />

      <EditDialog
        isOpen={isViewDialogOpen}
        onClose={handleCloseViewDialog}
        record={selectedQuote}
        onUpdate={fetchQuotes}
        type="presupuesto"
      />
    </div>
  );
};

export default QuotesTable;
