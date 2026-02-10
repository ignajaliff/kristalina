
import SellerSidebar from "@/components/SellerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";
import { Link } from "react-router-dom";

const SellerDashboard = () => {
  const { salesData, isLoading, error, currentSeller } = useSalesData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getStatusBadge = (isAccepted: boolean, hasAmount: boolean) => {
    if (isAccepted) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Aceptado</span>;
    } else if (hasAmount) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Cotizado</span>;
    } else {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Pendiente</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SellerSidebar />
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando datos de ventas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SellerSidebar />
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error al cargar los datos de ventas</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = salesData?.stats || {
    todaySales: 0,
    todayTransactions: 0,
    productsSold: 0,
    commission: 0,
  };

  const recentSales = salesData?.recentSales || [];

  return (
    <div className="flex h-screen overflow-hidden">
      <SellerSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-sistema-gray-dark">
              Gestión de Ventas
            </h1>
            {currentSeller && (
              <p className="text-sistema-gray mt-1">
                Vendedor: {currentSeller}
              </p>
            )}
          </div>
          <Link to="/admin/prospects">
            <Button className="bg-sistema-gray-dark hover:bg-sistema-gray flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Nueva Venta
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="bg-sistema-gray/10 pb-2">
              <CardTitle className="text-lg">Ventas de Hoy</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{formatCurrency(stats.todaySales)}</p>
              <p className="text-sistema-gray text-sm mt-2">{stats.todayTransactions} transacciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-sistema-gray/10 pb-2">
              <CardTitle className="text-lg">Unidades Vendidas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stats.productsSold}</p>
              <p className="text-sistema-gray text-sm mt-2">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-sistema-gray/10 pb-2">
              <CardTitle className="text-lg">Comisión</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{formatCurrency(stats.commission)}</p>
              <p className="text-sistema-gray text-sm mt-2">10% de ventas</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="bg-sistema-gray/10">
            <CardTitle>Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {recentSales.length > 0 ? (
                <table className="w-full mt-4">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Comunidad</th>
                      <th className="text-left pb-2">Cliente</th>
                      <th className="text-left pb-2">Monto</th>
                      <th className="text-left pb-2">Estado</th>
                      <th className="text-left pb-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id} className="border-b">
                        <td className="py-3">{sale.communityname}</td>
                        <td>{sale.adminname}</td>
                        <td>{sale.monto ? formatCurrency(sale.monto) : 'Por cotizar'}</td>
                        <td>{getStatusBadge(sale.estado === 'Aceptado', !!sale.monto)}</td>
                        <td>{new Date(sale.created_at).toLocaleDateString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-sistema-gray">
                  <p>No hay ventas registradas aún.</p>
                  <Link to="/admin/prospects" className="text-blue-600 hover:underline">
                    Crear tu primera venta
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
