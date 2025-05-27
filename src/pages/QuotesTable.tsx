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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Filter, Search, CheckSquare, MoreHorizontal, Save, X, Pencil, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AcceptQuoteDialog from "@/components/AcceptQuoteDialog";
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/utils/quoteStorage";

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
  
  // State for view details dialog
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  
  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);

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
        // Process quotes and add calculated fields if necessary
        const processedQuotes: Quote[] = data.map(quote => {
          // Calculate default values if not provided in the database
          const monto = quote.monto || quote.units * 50000; // Use DB value or calculate
          const por_unidad = quote.por_unidad || 50000; // Use DB value or default
          const inversion = quote.inversion || Math.round(monto * 0.8); // Use DB value or calculate
          
          // Safely parse additional_at field
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
          quote.communityname?.toLowerCase().includes(term) ||
          quote.buildingaddress?.toLowerCase().includes(term) ||
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
        quote.buildingtype === filters.buildingType
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
      field === "monto" ||
      field === "por_unidad" ||
      field === "inversion" ||
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

  // Handle dialog completion - fixed function signature
  const handleAcceptComplete = () => {
    // Reload quotes after accepting
    fetchQuotes();
    
    toast({
      title: "Presupuesto aceptado",
      description: "El presupuesto ha sido marcado como aceptado correctamente.",
    });
  };

  // Handle view details
  const handleViewDetails = (quote: Quote) => {
    setViewingQuote(quote);
    setViewDetailsOpen(true);
  };

  // Handle edit complete
  const handleEditComplete = (quote: Quote) => {
    setEditingQuote(quote);
    setEditDialogOpen(true);
  };

  // Handle delete quote
  const handleDeleteQuote = (quote: Quote) => {
    setDeletingQuote(quote);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingQuote) return;

    try {
      const { error } = await supabase
        .from("presupuestos")
        .delete()
        .eq("id", deletingQuote.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Registro eliminado",
        description: "El presupuesto ha sido eliminado correctamente.",
      });

      // Refresh quotes list
      fetchQuotes();
      setDeleteDialogOpen(false);
      setDeletingQuote(null);
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast({
        title: "Error",
        description: "Hubo un error al eliminar el presupuesto. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "No establecido";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Fecha inválida";
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
      if (field === "monto" || field === "por_unidad" || field === "inversion") {
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
                          {quote.communityname}
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.buildingaddress}
                            id={quote.id}
                            field="buildingaddress"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "buildingaddress"}
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
                          {quote.buildingtype}
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
                            value={quote.monto}
                            id={quote.id}
                            field="monto"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "monto"}
                            type="number"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.por_unidad}
                            id={quote.id}
                            field="por_unidad"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "por_unidad"}
                            type="number"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={quote.inversion}
                            id={quote.id}
                            field="inversion"
                            isEditing={editingCell?.id === quote.id && editingCell?.field === "inversion"}
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
                              value={quote.adminname}
                              id={quote.id}
                              field="adminname"
                              isEditing={editingCell?.id === quote.id && editingCell?.field === "adminname"}
                            />
                            {quote.adminemail && (
                              <div className="text-xs text-gray-500">
                                <EditableCell
                                  value={quote.adminemail}
                                  id={quote.id}
                                  field="adminemail"
                                  isEditing={editingCell?.id === quote.id && editingCell?.field === "adminemail"}
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
                                <DropdownMenuItem onClick={() => handleViewDetails(quote)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditComplete(quote)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar completo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteQuote(quote)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
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

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Presupuesto</DialogTitle>
              <DialogDescription>
                Información completa del presupuesto seleccionado
              </DialogDescription>
            </DialogHeader>
            {viewingQuote && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Información de la Comunidad</h3>
                    <dl className="mt-2 space-y-1">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Nombre:</dt>
                        <dd>{viewingQuote.communityname}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Dirección:</dt>
                        <dd>{viewingQuote.buildingaddress}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Comuna:</dt>
                        <dd>{viewingQuote.comuna}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Región:</dt>
                        <dd>{viewingQuote.region}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Tipo de edificio:</dt>
                        <dd>{viewingQuote.buildingtype}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Unidades:</dt>
                        <dd>{viewingQuote.units}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Información del Administrador</h3>
                    <dl className="mt-2 space-y-1">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Nombre:</dt>
                        <dd>{viewingQuote.adminname}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email:</dt>
                        <dd>{viewingQuote.adminemail}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Empresa administradora:</dt>
                        <dd>{viewingQuote.managementcompany || 'No especificado'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Información del Presupuesto</h3>
                  <dl className="mt-2 space-y-1">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Monto total:</dt>
                      <dd>{viewingQuote.monto ? viewingQuote.monto.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }) : 'No especificado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Monto por unidad:</dt>
                      <dd>{viewingQuote.por_unidad ? viewingQuote.por_unidad.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }) : 'No especificado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valor inversión:</dt>
                      <dd>{viewingQuote.inversion ? viewingQuote.inversion.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }) : 'No especificado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estado:</dt>
                      <dd>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          viewingQuote.presupuesto_aceptado 
                            ? "bg-green-100 text-green-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {viewingQuote.presupuesto_aceptado ? "Aceptado" : "Enviado"}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de creación:</dt>
                      <dd>{formatDate(viewingQuote.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Complete Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Presupuesto Completo</DialogTitle>
              <DialogDescription>
                Edite todos los campos del presupuesto seleccionado
              </DialogDescription>
            </DialogHeader>
            {editingQuote && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre de la comunidad</label>
                    <Input 
                      value={editingQuote.communityname || ""} 
                      onChange={(e) => setEditingQuote({...editingQuote, communityname: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Dirección</label>
                    <Input 
                      value={editingQuote.buildingaddress || ""} 
                      onChange={(e) => setEditingQuote({...editingQuote, buildingaddress: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Comuna</label>
                    <Input 
                      value={editingQuote.comuna || ""} 
                      onChange={(e) => setEditingQuote({...editingQuote, comuna: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Región</label>
                    <Input 
                      value={editingQuote.region || ""} 
                      onChange={(e) => setEditingQuote({...editingQuote, region: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo de edificio</label>
                    <select
                      className="w-full rounded-md border border-input px-3 py-2 text-sm"
                      value={editingQuote.buildingtype || ""}
                      onChange={(e) => setEditingQuote({...editingQuote, buildingtype: e.target.value})}
                    >
                      <option value="Edificio">Edificio</option>
                      <option value="Escolar">Escolar</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Unidades</label>
                    <Input 
                      type="number"
                      value={editingQuote.units || ""} 
                      onChange={(e) => setEditingQuote({...editingQuote, units: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre del administrador</label>
                    <Input 
                      value={editingQuote.adminname || ""} 
                      onChange={(e) => setEditingQuote({...editingQuote, adminname: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email del administrador</label>
                    <Input 
                      type="email"
                      value={editingQuote.adminemail || ""} 
                      onChange={(e) => setEditingQuote({...editingQuote, adminemail: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (!editingQuote) return;
                  
                  try {
                    const { error } = await supabase
                      .from("presupuestos")
                      .update({
                        communityname: editingQuote.communityname,
                        buildingaddress: editingQuote.buildingaddress,
                        comuna: editingQuote.comuna,
                        region: editingQuote.region,
                        buildingtype: editingQuote.buildingtype,
                        units: editingQuote.units,
                        adminname: editingQuote.adminname,
                        adminemail: editingQuote.adminemail,
                      })
                      .eq("id", editingQuote.id);

                    if (error) throw error;

                    toast({
                      title: "Presupuesto actualizado",
                      description: "Los datos del presupuesto han sido actualizados correctamente.",
                    });

                    fetchQuotes();
                    setEditDialogOpen(false);
                    setEditingQuote(null);
                  } catch (error) {
                    console.error("Error updating quote:", error);
                    toast({
                      title: "Error",
                      description: "Hubo un error al actualizar el presupuesto.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente de la base de datos.
                {deletingQuote && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <strong>Presupuesto:</strong> {deletingQuote.communityname}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default QuotesTable;
