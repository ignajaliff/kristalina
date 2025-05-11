
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
import { FileText, Filter, Search, CheckSquare, MoreHorizontal } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Definición de tipos
interface Quote {
  id: string;
  communityName: string;
  buildingAddress: string;
  comuna: string;
  buildingType: string;
  units: number;
  quoteAmount: number;
  quotePerUnit: number;
  investmentValue: number;
  status: "Enviado" | "Aceptado";
  region: string;
  adminName: string;
  adminEmail: string;
  managementCompany: string;
  legalRepresentative: string;
}

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

  // Cargar datos simulados
  useEffect(() => {
    const mockData: Quote[] = [
      {
        id: "1",
        communityName: "Edificio Los Alpes",
        buildingAddress: "Av. Principal 123",
        comuna: "Providencia",
        region: "Metropolitana",
        buildingType: "Edificio",
        units: 45,
        quoteAmount: 2250000,
        quotePerUnit: 50000,
        investmentValue: 1800000,
        status: "Enviado",
        adminName: "Juan Pérez",
        adminEmail: "jperez@admin.com",
        managementCompany: "Administradora Central",
        legalRepresentative: "María González",
      },
      {
        id: "2",
        communityName: "Colegio San José",
        buildingAddress: "Calle Educación 456",
        comuna: "Las Condes",
        region: "Metropolitana",
        buildingType: "Escolar",
        units: 20,
        quoteAmount: 1500000,
        quotePerUnit: 75000,
        investmentValue: 1200000,
        status: "Aceptado",
        adminName: "Carlos Rodríguez",
        adminEmail: "crodriguez@admin.com",
        managementCompany: "Educación Moderna",
        legalRepresentative: "Pedro Sánchez",
      },
    ];

    setQuotes(mockData);
    setFilteredQuotes(mockData);
  }, []);

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let result = quotes;

    // Aplicar búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.communityName.toLowerCase().includes(term) ||
          quote.buildingAddress.toLowerCase().includes(term) ||
          quote.comuna.toLowerCase().includes(term)
      );
    }

    // Aplicar filtros
    if (filters.comuna) {
      result = result.filter((quote) => 
        quote.comuna.toLowerCase() === filters.comuna.toLowerCase()
      );
    }
    if (filters.region) {
      result = result.filter((quote) => 
        quote.region.toLowerCase() === filters.region.toLowerCase()
      );
    }
    if (filters.buildingType) {
      result = result.filter((quote) => 
        quote.buildingType === filters.buildingType
      );
    }
    if (filters.status) {
      result = result.filter((quote) => 
        quote.status === filters.status
      );
    }

    setFilteredQuotes(result);
  }, [searchTerm, filters, quotes]);

  // Manejar cambio de celda
  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>, id: string, field: string) => {
    let value: any = e.target.value;
    
    // Convierte a número si el campo es numérico
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

  // Guardar cambio de celda
  const saveCellChange = () => {
    if (!editingCell) return;

    const { id, field, value } = editingCell;
    
    const updatedQuotes = quotes.map((quote) =>
      quote.id === id ? { ...quote, [field]: value } : quote
    );

    setQuotes(updatedQuotes);
    setEditingCell(null);

    toast({
      title: "Cambio guardado",
      description: "El cambio en el presupuesto ha sido guardado correctamente.",
    });
  };

  // Aceptar presupuesto
  const handleAcceptQuote = (id: string) => {
    const updatedQuotes = quotes.map((quote) =>
      quote.id === id ? { ...quote, status: "Aceptado" as const } : quote
    );

    setQuotes(updatedQuotes);

    toast({
      title: "Presupuesto aceptado",
      description: "El presupuesto ha sido marcado como aceptado.",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-sistema-blue-dark mb-6 flex items-center">
          <FileText className="mr-2 h-8 w-8 text-sistema-blue" />
          Presupuestos Enviados
        </h1>

        <Card>
          <CardHeader className="bg-sistema-blue/10">
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
                  <DropdownMenuContent align="end" className="w-56">
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
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.communityName}</TableCell>
                      <TableCell>{quote.buildingAddress}</TableCell>
                      <TableCell>{quote.comuna}</TableCell>
                      <TableCell>{quote.buildingType}</TableCell>
                      <TableCell>
                        {editingCell?.id === quote.id && editingCell?.field === "units" ? (
                          <Input
                            type="number"
                            value={editingCell.value}
                            onChange={(e) => handleCellChange(e, quote.id, "units")}
                            onBlur={saveCellChange}
                            autoFocus
                            className="w-20"
                          />
                        ) : (
                          <span onDoubleClick={() => setEditingCell({ id: quote.id, field: "units", value: quote.units })}>
                            {quote.units}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCell?.id === quote.id && editingCell?.field === "quoteAmount" ? (
                          <Input
                            type="number"
                            value={editingCell.value}
                            onChange={(e) => handleCellChange(e, quote.id, "quoteAmount")}
                            onBlur={saveCellChange}
                            autoFocus
                            className="w-24"
                          />
                        ) : (
                          <span onDoubleClick={() => setEditingCell({ id: quote.id, field: "quoteAmount", value: quote.quoteAmount })}>
                            ${quote.quoteAmount.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCell?.id === quote.id && editingCell?.field === "quotePerUnit" ? (
                          <Input
                            type="number"
                            value={editingCell.value}
                            onChange={(e) => handleCellChange(e, quote.id, "quotePerUnit")}
                            onBlur={saveCellChange}
                            autoFocus
                            className="w-24"
                          />
                        ) : (
                          <span onDoubleClick={() => setEditingCell({ id: quote.id, field: "quotePerUnit", value: quote.quotePerUnit })}>
                            ${quote.quotePerUnit.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCell?.id === quote.id && editingCell?.field === "investmentValue" ? (
                          <Input
                            type="number"
                            value={editingCell.value}
                            onChange={(e) => handleCellChange(e, quote.id, "investmentValue")}
                            onBlur={saveCellChange}
                            autoFocus
                            className="w-24"
                          />
                        ) : (
                          <span onDoubleClick={() => setEditingCell({ id: quote.id, field: "investmentValue", value: quote.investmentValue })}>
                            ${quote.investmentValue.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCell?.id === quote.id && editingCell?.field === "status" ? (
                          <select
                            value={editingCell.value}
                            onChange={(e) => 
                              setEditingCell({ 
                                ...editingCell, 
                                value: e.target.value as "Enviado" | "Aceptado" 
                              })
                            }
                            onBlur={saveCellChange}
                            autoFocus
                            className="w-28 rounded-md border border-input px-3 py-1 text-sm"
                          >
                            <option value="Enviado">Enviado</option>
                            <option value="Aceptado">Aceptado</option>
                          </select>
                        ) : (
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              quote.status === "Aceptado" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-blue-100 text-blue-800"
                            }`}
                            onDoubleClick={() => setEditingCell({ id: quote.id, field: "status", value: quote.status })}
                          >
                            {quote.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {quote.status !== "Aceptado" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleAcceptQuote(quote.id)}
                            >
                              <CheckSquare className="h-4 w-4 mr-1" /> Aceptar
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                  ))}
                  
                  {filteredQuotes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        No se encontraron presupuestos con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuotesTable;
