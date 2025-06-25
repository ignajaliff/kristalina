
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, FileText, Calendar, User, Building, Wrench } from "lucide-react";

import { Quote } from "@/utils/quoteStorage";
import AdminSidebar from "@/components/AdminSidebar";
import AcceptedQuotesHeader from "@/components/AcceptedQuotesHeader";
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

const AcceptedQuotes = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching accepted quotes...');
      
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("presupuesto_aceptado", true)
        .order("created_at", { ascending: false });

      console.log('Supabase query result:', { data, error });

      if (error) {
        throw error;
      }

      if (data) {
        console.log(`Found ${data.length} accepted quotes`);
        
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

        console.log('Processed quotes:', processedQuotes);
        setQuotes(processedQuotes);
        setFilteredQuotes(processedQuotes);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
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
    fetchQuotes();
  }, []);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    
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
    
    console.log('Filtered quotes after search:', filtered);
    setFilteredQuotes(filtered);
  };

  const handleFilter = (filters: any) => {
    console.log('Applied filters:', filters);
    let filtered = quotes;

    if (filters.buildingtype) {
      filtered = filtered.filter(quote => quote.buildingtype === filters.buildingtype);
    }

    if (filters.vendedor) {
      filtered = filtered.filter(quote => quote.vendedor === filters.vendedor);
    }

    if (filters.equipos_instalados) {
      filtered = filtered.filter(quote => quote.equipos_instalados === filters.equipos_instalados);
    }

    console.log('Filtered quotes after filters:', filtered);
    setFilteredQuotes(filtered);
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "No establecido";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const getEquiposInstalados = (equipos: string | null): string => {
    if (!equipos) return "No definido";
    
    switch (equipos.toLowerCase()) {
      case "completed":
        return "Completado";
      case "in_progress":
        return "En progreso";
      case "pending":
        return "Pendiente";
      case "contrato no firmado":
        return "Contrato no firmado";
      default:
        return equipos;
    }
  };

  const getEquiposInstaladorBadgeVariant = (equipos: string | null) => {
    if (!equipos) return "secondary";
    
    switch (equipos.toLowerCase()) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "pending":
        return "outline";
      case "contrato no firmado":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Get unique vendors for filter
  const uniqueVendors = [...new Set(quotes.filter(q => q.vendedor).map(q => q.vendedor))];
  const uniqueEquiposStatus = [...new Set(quotes.filter(q => q.equipos_instalados).map(q => q.equipos_instalados))];

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
    },
    {
      label: "Estado Equipos",
      key: "equipos_instalados",
      options: uniqueEquiposStatus.map(status => ({ 
        value: status!, 
        label: getEquiposInstalados(status!) 
      }))
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AcceptedQuotesHeader />
        
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <SearchAndFilter
              onSearch={handleSearch}
              onFilter={handleFilter}
              filterOptions={filterOptions}
              searchPlaceholder="Buscar por comunidad, administrador, dirección, vendedor..."
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
                    Los presupuestos aceptados aparecerán aquí.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Edificio
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Administrador
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Vendedor
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Fecha Firma Contrato
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Fecha Instalación Equipos
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Estado Equipos
                          </div>
                        </TableHead>
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
                          <TableCell>{formatDate(quote.fecha_firma_contrato)}</TableCell>
                          <TableCell>{formatDate(quote.fecha_instalacion_equipos)}</TableCell>
                          <TableCell>
                            <Badge variant={getEquiposInstaladorBadgeVariant(quote.equipos_instalados)}>
                              {getEquiposInstalados(quote.equipos_instalados)}
                            </Badge>
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
    </div>
  );
};

export default AcceptedQuotes;
