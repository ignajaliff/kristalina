
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Eye, CheckCircle, FileText, Edit } from "lucide-react";

import { Quote } from "@/utils/quoteStorage";
import SellerSidebar from "@/components/SellerSidebar";
import AcceptQuoteDialog from "@/components/AcceptQuoteDialog";
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
import { useAuth } from "@/contexts/AuthContext";

const SellerQuotes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchQuotes = async () => {
    if (!user?.name) return;
    
    setIsLoading(true);
    try {
      console.log('Buscando presupuestos para vendedor:', user.name);
      console.log('Filtrando por estado_contacto: "Presupuesto Enviado"');
      
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("vendedor", user.name)
        .eq("estado_contacto", "Presupuesto Enviado")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error en la consulta de Supabase:', error);
        throw error;
      }

      console.log('Datos encontrados en Supabase:', data);
      console.log('Número de registros encontrados:', data?.length || 0);
      
      // Log each record's estado_contacto to debug
      if (data) {
        data.forEach((record, index) => {
          console.log(`Registro ${index + 1}:`, {
            id: record.id,
            communityname: record.communityname,
            estado_contacto: record.estado_contacto,
            vendedor: record.vendedor
          });
        });
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

        console.log('Presupuestos procesados:', processedQuotes);
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
  }, [user?.name]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredQuotes(quotes);
      return;
    }

    const filtered = quotes.filter(quote =>
      quote.communityname.toLowerCase().includes(query.toLowerCase()) ||
      quote.adminname.toLowerCase().includes(query.toLowerCase()) ||
      (quote.buildingaddress && quote.buildingaddress.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredQuotes(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = quotes;

    if (filters.buildingtype) {
      filtered = filtered.filter(quote => quote.buildingtype === filters.buildingtype);
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
      label: "Estado",
      key: "status",
      options: [
        { value: "Enviado", label: "Enviado" },
        { value: "Aceptado", label: "Aceptado" },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Presupuestos Enviados
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona y supervisa todos tus presupuestos enviados a clientes
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
                    Obteniendo tus presupuestos enviados...
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : filteredQuotes.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No hay presupuestos enviados</CardTitle>
                  <CardDescription>
                    Los presupuestos con estado "Presupuesto Enviado" aparecerán aquí.
                    {user?.name && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Buscando para vendedor: {user.name}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Edificio</TableHead>
                        <TableHead>Administrador</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Unidades</TableHead>
                        <TableHead>Estado Contacto</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead>Estado</TableHead>
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
                          <TableCell>{formatCurrency(quote.monto)}</TableCell>
                          <TableCell>{quote.units}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {quote.estado_contacto || 'No definido'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(quote.created_at)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={quote.status === "Aceptado" ? "default" : "secondary"}
                            >
                              {quote.status === "Aceptado" && (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              )}
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewQuote(quote)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                Ver
                              </Button>
                              {quote.status === "Enviado" && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleAcceptQuote(quote)}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Aceptar
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

export default SellerQuotes;
