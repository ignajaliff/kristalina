
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Building, User, Calendar } from "lucide-react";

import SellerSidebar from "@/components/SellerSidebar";
import SearchAndFilter from "@/components/SearchAndFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AcceptedQuoteRow {
  id: string;
  prospecto_id: string;
  estado: string;
  fecha_aprobacion: string | null;
  monto: number;
  created_at: string;
  prospectos: {
    communityname: string;
    adminname: string;
    buildingaddress: string | null;
    vendedor: string | null;
    buildingtype: string;
    units: number;
  };
}

const SellerAcceptedQuotes = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [quotes, setQuotes] = useState<AcceptedQuoteRow[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<AcceptedQuoteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotes = async () => {
    if (!userProfile?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*, prospectos!inner(communityname, adminname, buildingaddress, vendedor, vendedor_id, buildingtype, units)")
        .eq("estado", "Aceptado")
        .eq("prospectos.vendedor_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes((data as any) || []);
      setFilteredQuotes((data as any) || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast({ title: "Error", description: "Error al cargar presupuestos aceptados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, [userProfile?.id]);

  const handleSearch = (query: string) => {
    if (!query.trim()) { setFilteredQuotes(quotes); return; }
    const filtered = quotes.filter(q =>
      q.prospectos?.communityname?.toLowerCase().includes(query.toLowerCase()) ||
      q.prospectos?.adminname?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredQuotes(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = quotes;
    if (filters.buildingtype) filtered = filtered.filter(q => q.prospectos?.buildingtype === filters.buildingtype);
    setFilteredQuotes(filtered);
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "No establecido";
    try { return format(new Date(dateString), "dd/MM/yyyy"); } catch { return "Fecha inválida"; }
  };

  const filterOptions = [
    { label: "Tipo", key: "buildingtype", options: [{ value: "Edificio", label: "Edificio" }, { value: "Condominio", label: "Condominio" }, { value: "Casa", label: "Casa" }] }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Presupuestos Aceptados</h1>
              <p className="text-sm text-gray-600 mt-1">
                Presupuestos aceptados por los clientes
                {userProfile?.nombre && <span className="ml-2 text-blue-600 font-medium">• Vendedor: {userProfile.nombre}</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} filterOptions={filterOptions} searchPlaceholder="Buscar por comunidad, administrador..." />

            {isLoading ? (
              <Card><CardHeader><CardTitle>Cargando...</CardTitle></CardHeader></Card>
            ) : filteredQuotes.length === 0 ? (
              <Card><CardHeader><CardTitle>No hay presupuestos aceptados</CardTitle><CardDescription>Los presupuestos aceptados aparecerán aquí.</CardDescription></CardHeader></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><div className="flex items-center gap-2"><Building className="h-4 w-4" />Edificio</div></TableHead>
                        <TableHead><div className="flex items-center gap-2"><User className="h-4 w-4" />Administrador</div></TableHead>
                        <TableHead><div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha Aprobación</div></TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotes.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">{quote.prospectos?.communityname}</TableCell>
                          <TableCell>{quote.prospectos?.adminname}</TableCell>
                          <TableCell>{formatDate(quote.fecha_aprobacion)}</TableCell>
                          <TableCell><Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="mr-1 h-3 w-3" />Aceptado</Badge></TableCell>
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

export default SellerAcceptedQuotes;
