
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Eye, CheckCircle } from "lucide-react";

import { Quote } from "@/utils/quoteStorage";
import AdminSidebar from "@/components/AdminSidebar";
import QuotesTableHeader from "@/components/QuotesTableHeader";
import SearchAndFilter from "@/components/SearchAndFilter";
import AcceptQuoteDialog from "@/components/AcceptQuoteDialog";
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

const QuotesTable = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching quotes with estado_contacto = "Presupuesto Enviado"...');
      
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("estado_contacto", "Presupuesto Enviado")
        .order("created_at", { ascending: false });

      console.log('Supabase query result:', { data, error });

      if (error) {
        throw error;
      }

      if (data) {
        console.log(`Found ${data.length} quotes with estado_contacto = "Presupuesto Enviado"`);
        
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

        console.log('Processed quotes:', processedQuotes);
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

    if (filters.status) {
      filtered = filtered.filter(quote => quote.status === filters.status);
    }

    console.log('Filtered quotes after filters:', filtered);
    setFilteredQuotes(filtered);
  };

  const handleAcceptQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "No establecido";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return "Fecha inválida";
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
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <QuotesTableHeader />
        
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
                    Obteniendo los presupuestos enviados...
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : filteredQuotes.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No hay presupuestos enviados</CardTitle>
                  <CardDescription>
                    Los presupuestos enviados aparecerán aquí.
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
                          <TableHead>Dirección</TableHead>
                          <TableHead>Fecha Creación</TableHead>
                          <TableHead>Nombre Administrador</TableHead>
                          <TableHead>Vendedor</TableHead>
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
                            <TableCell>{quote.buildingaddress}</TableCell>
                            <TableCell>{formatDate(quote.created_at)}</TableCell>
                            <TableCell>{quote.adminname}</TableCell>
                            <TableCell>{quote.vendedor || "N/A"}</TableCell>
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
                                  onClick={() => setSelectedQuoteId(quote.id === selectedQuoteId ? null : quote.id)}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  {quote.id === selectedQuoteId ? "Cerrar" : "Ver"}
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

                {selectedQuoteId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalles del Presupuesto</CardTitle>
                      <CardDescription>
                        Información completa del presupuesto seleccionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const selectedQuote = filteredQuotes.find(q => q.id === selectedQuoteId);
                        
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
                                    <dt className="text-sm font-medium text-gray-500">Teléfono:</dt>
                                    <dd>{selectedQuote.legalrepresentativephone || 'No especificado'}</dd>
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
                                  <dt className="text-sm font-medium text-gray-500">Unidades:</dt>
                                  <dd>{selectedQuote.units}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Monto Total:</dt>
                                  <dd>{selectedQuote.monto?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Monto por Unidad:</dt>
                                  <dd>{selectedQuote.por_unidad?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Valor Inversión:</dt>
                                  <dd>{selectedQuote.inversion?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Estado:</dt>
                                  <dd>
                                    <Badge variant={selectedQuote.status === "Aceptado" ? "default" : "secondary"}>
                                      {selectedQuote.status}
                                    </Badge>
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Vendedor:</dt>
                                  <dd>{selectedQuote.vendedor || 'No asignado'}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500">Fecha Creación:</dt>
                                  <dd>{formatDate(selectedQuote.created_at)}</dd>
                                </div>
                                {selectedQuote.fecha_aprobacion_presupuesto && (
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500">Fecha Aprobación:</dt>
                                    <dd>{formatDate(selectedQuote.fecha_aprobacion_presupuesto)}</dd>
                                  </div>
                                )}
                              </dl>
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
    </div>
  );
};

export default QuotesTable;
