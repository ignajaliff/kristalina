
import SellerSidebar from "@/components/SellerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Users, TrendingUp, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const SellerDashboardMain = () => {
  const { userProfile } = useAuth();

  // Fetch presupuestos enviados del vendedor
  const { data: presupuestosEnviados } = useQuery({
    queryKey: ['seller-quotes-sent', userProfile?.nombre],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('estado_contacto', 'Presupuesto Enviado')
        .eq('vendedor', userProfile?.nombre || '');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.nombre,
  });

  // Fetch presupuestos aceptados del vendedor
  const { data: presupuestosAceptados } = useQuery({
    queryKey: ['seller-quotes-accepted', userProfile?.nombre],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('presupuesto_aceptado', true)
        .eq('vendedor', userProfile?.nombre || '');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.nombre,
  });

  // Fetch clientes del vendedor
  const { data: clientes } = useQuery({
    queryKey: ['seller-clients', userProfile?.nombre],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .in('estado_contacto', ['Primer Contacto', 'Segundo Contacto'])
        .eq('vendedor', userProfile?.nombre || '');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.nombre,
  });

  // Calculate stats
  const totalPresupuestosEnviados = presupuestosEnviados?.length || 0;
  const totalPresupuestosAceptados = presupuestosAceptados?.length || 0;
  const totalClientes = clientes?.length || 0;
  
  // Calculate total value of accepted quotes
  const valorTotalAceptados = presupuestosAceptados?.reduce((sum, quote) => sum + (quote.monto || 0), 0) || 0;
  
  // Calculate conversion rate
  const conversionRate = totalPresupuestosEnviados > 0 
    ? Math.round((totalPresupuestosAceptados / totalPresupuestosEnviados) * 100) 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Vendedor</h1>
              <p className="text-sm text-gray-600 mt-1">
                Resumen de tu actividad de ventas
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium opacity-90 mb-1">Clientes</p>
                    <p className="text-2xl font-bold mb-2">{totalClientes}</p>
                    <p className="text-xs opacity-80">En seguimiento</p>
                  </div>
                  <div className="rounded-full p-3 bg-white/20">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-400 to-purple-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium opacity-90 mb-1">Presupuestos Enviados</p>
                    <p className="text-2xl font-bold mb-2">{totalPresupuestosEnviados}</p>
                    <p className="text-xs opacity-80">Total enviados</p>
                  </div>
                  <div className="rounded-full p-3 bg-white/20">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium opacity-90 mb-1">Presupuestos Aceptados</p>
                    <p className="text-2xl font-bold mb-2">{totalPresupuestosAceptados}</p>
                    <p className="text-xs opacity-80">{conversionRate}% conversión</p>
                  </div>
                  <div className="rounded-full p-3 bg-white/20">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium opacity-90 mb-1">Valor Total Aceptados</p>
                    <p className="text-xl font-bold mb-2">{formatCurrency(valorTotalAceptados)}</p>
                    <p className="text-xs opacity-80">Valor en ventas</p>
                  </div>
                  <div className="rounded-full p-3 bg-white/20">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sent Quotes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Presupuestos Enviados Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {presupuestosEnviados && presupuestosEnviados.length > 0 ? (
                  <div className="space-y-3">
                    {presupuestosEnviados.slice(0, 5).map((quote) => (
                      <div key={quote.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{quote.communityname}</p>
                          <p className="text-xs text-gray-600">{quote.adminname}</p>
                          <p className="text-xs text-gray-500">{formatDate(quote.created_at)}</p>
                        </div>
                        <Badge variant="secondary">Enviado</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay presupuestos enviados</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Accepted Quotes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Presupuestos Aceptados Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {presupuestosAceptados && presupuestosAceptados.length > 0 ? (
                  <div className="space-y-3">
                    {presupuestosAceptados.slice(0, 5).map((quote) => (
                      <div key={quote.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{quote.communityname}</p>
                          <p className="text-xs text-gray-600">{quote.adminname}</p>
                          <p className="text-xs text-gray-500">{formatDate(quote.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800">Aceptado</Badge>
                          {quote.monto && (
                            <p className="text-xs font-medium mt-1">{formatCurrency(quote.monto)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay presupuestos aceptados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardMain;
