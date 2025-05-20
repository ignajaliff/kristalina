
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Filter, Search, CheckSquare, MoreHorizontal, Save, X, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AcceptQuoteDialog from "@/components/AcceptQuoteDialog";
import { supabase } from "@/integrations/supabase/client";

// Define the quote type based on Supabase structure
export interface Quote {
  id: string;
  adminName: string;
  adminEmail: string;
  managementCompany: string | null;
  legalRepresentative: string | null;
  additional_at: Array<{ name: string; email: string }>;
  communityName: string;
  buildingAddress: string | null;
  comuna: string | null;
  region: string | null;
  buildingType: string;
  units: number;
  presupuesto_aceptado: boolean;
  created_at: string;
  
  // Calculated fields for UI
  quoteAmount?: number;
  quotePerUnit?: number;
  investmentValue?: number;
  
  // For editing
  status?: "Enviado" | "Aceptado";
}

const WEBHOOK_URL = "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/66abaac8-fdce-4dde-a287-df61767ba4af";

const QuotesTable = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    comuna: "",
    region: "",
    buildingType: "",
    status: "",
  });
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
    value: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the accept quote dialog
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Fetch quotes from Supabase
  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*");
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Process quotes and add calculated fields
        const processedQuotes = data.map(quote => {
          // Calculate default values
          const baseAmount = 50000; // Base amount per unit in CLP
          const units = quote.units || 0;
          const quotePerUnit = baseAmount;
          const quoteAmount = units * quotePerUnit;
          const investmentValue = Math.round(quoteAmount * 0.8); // 80% of quote amount
          
          return {
            ...quote,
            quoteAmount,
            quotePerUnit,
            investmentValue,
            status: quote.presupuesto_aceptado ? "Aceptado" : "Enviado" as "Enviado" | "Aceptado"
          };
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

  // Load quotes on initial render
  useEffect(() => {
    fetchQuotes();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = quotes;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.communityName?.toLowerCase().includes(term) ||
          quote.buildingAddress?.toLowerCase().includes(term) ||
          quote.comuna?.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (filters.comuna) {
      result = result.filter((quote) => 
        quote.comuna?.toLowerCase() === filters.comuna.toLowerCase()
      );
    }
    if (filters.region) {
      result = result.filter((quote) => 
        quote.region?.toLowerCase() === filters.region.toLowerCase()
      );
    }
    if (filters.buildingType) {
      result = result.filter((quote) => 
        quote.buildingType === filters.buildingType
      );
    }
    if (filters.status) {
      result = result.filter((quote) => 
        (quote.presupuesto_aceptado ? "Aceptado" : "Enviado") === filters.status
      );
    }

    setFilteredQuotes(result);
  }, [searchTerm, filters, quotes]);

  // Handle cell change
  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: string, field: string) => {
    let value: any = e.target.value;
    
    // Convert to number if the field is numeric
    if (
      field === "quoteAmount" ||
      field === "quotePerUnit" ||
      field === "investmentValue" ||
      field === "units"
    ) {
      value = parseFloat(value) || 0;
    }

    setEditingCell({
      id,
      field,
      value,
    });
  };

  // Start editing with current value
  const startEditing = (id: string, field: string, currentValue: any) => {
    setEditingCell({
      id,
      field,
      value: currentValue,
    });
  };

  // Save cell change
  const saveCellChange = async () => {
    if (!editingCell) return;

    const { id, field, value } = editingCell;
    
    try {
      // Map UI field to database field if needed
      let dbField = field;
      let dbValue = value;
      
      if (field === "status") {
        dbField = "presupuesto_aceptado";
        dbValue = value === "Aceptado";
      }
      
      // Update in Supabase
      const { error } = await supabase
        .from("presupuestos")
        .update({ [dbField]: dbValue })
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      // Update in UI state
      const updatedQuotes = quotes.map((quote) =>
        quote.id === id ? { ...quote, [field]: value } : quote
      );

      setQuotes(updatedQuotes);
      setEditingCell(null);

      toast({
        title: "Cambio guardado",
        description: "El cambio en el registro ha sido guardado correctamente.",
      });
    } catch (error) {
      console.error("Error updating quote:", error);
      toast({
        title: "Error",
        description: "Hubo un error al guardar los cambios. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCell(null);
  };

  // Open accept quote dialog
  const handleOpenAcceptDialog = (quote: Quote) => {
    if (quote.presupuesto_aceptado) {
      toast({
        title: "Presupuesto ya aceptado",
        description: "Este presupuesto ya ha sido aceptado anteriormente.",
      });
      return;
    }
    
    setSelectedQuote(quote);
    setAcceptDialogOpen(true);
  };

  // Handle dialog completion
  const handleAcceptComplete = async (acceptedQuoteData: any) => {
    if (!selectedQuote) return;
    
    try {
      // 1. Send to webhook
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            quoteId: selectedQuote.id,
            ...acceptedQuoteData,
            quoteData: selectedQuote,
            timestamp: new Date().toISOString(),
          }),
        });
        
        console.log("Webhook triggered successfully");
      } catch (webhookError) {
        console.error("Error triggering webhook:", webhookError);
      }
      
      // 2. Update in Supabase
      const { error } = await supabase
        .from("presupuestos")
        .update({ 
          presupuesto_aceptado: true,
          legalRepresentativeRut: acceptedQuoteData.legalRepresentativeRut,
          communityRut: acceptedQuoteData.communityRut,
          communityEmail: acceptedQuoteData.communityEmail,
          legalRepresentativePhone: acceptedQuoteData.legalRepresentativePhone,
          communityFormationDate: acceptedQuoteData.communityFormationDate,
          fecha_aprobacion_presupuesto: new Date().toISOString()
        })
        .eq("id", selectedQuote.id);
      
      if (error) {
        throw error;
      }
      
      // Reload quotes
      fetchQuotes();
      
      toast({
        title: "Presupuesto aceptado",
        description: "El presupuesto ha sido marcado como aceptado correctamente.",
      });
    } catch (error) {
      console.error("Error accepting quote:", error);
      toast({
        title: "Error",
        description: "Hubo un error al aceptar el presupuesto. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Componente para celda editable
  const EditableCell = ({ 
    value, 
    id, 
    field, 
    isEditing, 
    type = "text",
    options = [],
    className = ""
  }: { 
    value: any; 
    id: string; 
    field: string; 
    isEditing: boolean;
    type?: string;
    options?: string[];
    className?: string;
  }) => {
    if (isEditing) {
      if (type === "select") {
        return (
          <div className="flex items-center gap-2">
            <select
              value={editingCell?.value}
              onChange={(e) => handleCellChange(e, id, field)}
              className="w-full rounded-md border border-input bg-blue-50 p-2 text-sm"
              autoFocus
            >
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={saveCellChange}>
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <Input
              type={type}
              value={editingCell?.value}
              onChange={(e) => handleCellChange(e, id, field)}
              autoFocus
              className={`${className} py-1 h-8 bg-blue-50 border-blue-200`}
            />
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={saveCellChange}>
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      }
    }

    // Para campos vacíos
    if (value === "" || value === undefined || value === null) {
      return (
        <div className="flex justify-between items-center group">
          <span className="text-gray-400 italic">
            [Sin datos]
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
            onClick={() => startEditing(id, field, value || "")}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    // Formatea el valor de acuerdo al tipo de campo
    let displayValue = value;

    if (type === "number" && typeof value === "number") {
      displayValue = value.toLocaleString();
      if (field === "quoteAmount" || field === "quotePerUnit" || field === "investmentValue") {
        displayValue = `$${displayValue}`;
      }
    }

    // Estilos especiales para el campo de estado
    if (field === "status") {
      return (
        <div className="flex justify-between items-center group">
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === "Aceptado" 
                ? "bg-green-100 text-green-800" 
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {value}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
            onClick={() => startEditing(id, field, value)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    // Celda normal con botón de editar al hacer hover
    return (
      <div className="flex justify-between items-center group">
        <span className="px-2 py-1 rounded">
          {displayValue}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
          onClick={() => startEditing(id, field, value)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-sistema-blue-dark mb-6 flex items-center">
          <FileText className="mr-2 h-8 w-8 text-sistema-blue" />
          Presupuestos Enviados
        </h1>

        <Card className="shadow-sm border-0 glass-card">
          <CardHeader className="bg-sistema-blue/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-sistema-blue-dark">
                Listado de Presupuestos
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sistema-gray" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-8 w-full md:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white">
                    <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <div className="p-2">
                      <p className="text-xs mb-1 font-medium">Comuna</p>
                      <Input 
                        placeholder="Comuna"
                        value={filters.comuna}
                        onChange={(e) => setFilters({...filters, comuna: e.target.value})}
                        className="h-8 mb-2"
                      />
                      
                      <p className="text-xs mb-1 font-medium">Región</p>
                      <Input 
                        placeholder="Región"
                        value={filters.region}
                        onChange={(e) => setFilters({...filters, region: e.target.value})}
                        className="h-8 mb-2"
                      />
                      
                      <p className="text-xs mb-1 font-medium">Tipo de edificio</p>
                      <select
                        className="w-full h-8 rounded-md border border-input px-3 py-1 text-sm mb-2"
                        value={filters.buildingType}
                        onChange={(e) => setFilters({...filters, buildingType: e.target.value})}
                      >
                        <option value="">Todos</option>
                        <option value="Edificio">Edificio</option>
                        <option value="Escolar">Escolar</option>
                        <option value="Industrial">Industrial</option>
                      </select>
                      
                      <p className="text-xs mb-1 font-medium">Estado</p>
                      <select
                        className="w-full h-8 rounded-md border border-input px-3 py-1 text-sm"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                      >
                        <option value="">Todos</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Aceptado">Aceptado</option>
                      </select>
                    </div>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setFilters({
                        comuna: "",
                        region: "",
                        buildingType: "",
                        status: "",
                      })}
                      className="justify-center text-centro"
                    >
                      Limpiar filtros
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Comunidad</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Comuna</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Por Unidad</TableHead>
                    <TableHead>Inversión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center">
                        Cargando presupuestos...
                      </TableCell>
                    </TableRow>
                  ) : filteredQuotes.length > 0 ? (
                    filteredQuotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">
                          {quote.communityName}
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.buildingAddress}
                            id={quote.id}
                            field="buildingAddress"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "buildingAddress"}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.comuna}
                            id={quote.id}
                            field="comuna"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "comuna"}
                          />
                        </TableCell>
                        <TableCell>
                          {quote.buildingType}
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.units}
                            id={quote.id}
                            field="units"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "units"}
                            type="number"
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.quoteAmount}
                            id={quote.id}
                            field="quoteAmount"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "quoteAmount"}
                            type="number"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.quotePerUnit}
                            id={quote.id}
                            field="quotePerUnit"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "quotePerUnit"}
                            type="number"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.investmentValue}
                            id={quote.id}
                            field="investmentValue"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "investmentValue"}
                            type="number"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.presupuesto_aceptado ? "Aceptado" : "Enviado"}
                            id={quote.id}
                            field="status"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "status"}
                            type="select"
                            options={["Enviado", "Aceptado"]}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <EditableCell
                              value={quote.adminName}
                              id={quote.id}
                              field="adminName"
                              isEditing={editingCell?.id === quote.id && editingCell?.field === "adminName"}
                            />
                            {quote.adminEmail && (
                              <div className="text-xs text-gray-500">
                                <EditableCell
                                  value={quote.adminEmail}
                                  id={quote.id}
                                  field="adminEmail"
                                  isEditing={editingCell?.id === quote.id && editingCell?.field === "adminEmail"}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={`h-8 px-2 text-xs ${quote.presupuesto_aceptado ? "opacity-50" : ""}`}
                              onClick={() => handleOpenAcceptDialog(quote)}
                              disabled={quote.presupuesto_aceptado}
                            >
                              <CheckSquare className="h-4 w-4 mr-1" /> Aceptar
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white">
                                <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                                <DropdownMenuItem>Editar completo</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center">
                        No se encontraron presupuestos con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog for accepting quotes with additional information */}
        <AcceptQuoteDialog 
          quote={selectedQuote}
          open={acceptDialogOpen}
          onOpenChange={setAcceptDialogOpen}
          onAcceptComplete={handleAcceptComplete}
        />
      </div>
    </div>
  );
};

export default QuotesTable;
