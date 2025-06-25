
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, FileText, Edit } from "lucide-react";

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

const PresupuestosAceptados = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
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
              <Card>
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
                          <TableCell>{quote.vendedor || "N/A"}</TableCell>
                          <TableCell>{formatCurrency(quote.monto)}</TableCell>
                          <TableCell>{quote.units}</TableCell>
                          <TableCell>
                            {formatDate(quote.fecha_aprobacion_presupuesto)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Aceptado
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditClick(quote)}
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
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
