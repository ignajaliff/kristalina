
import SellerSidebar from "@/components/SellerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const SellerDashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <SellerSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-sistema-gray-dark">
            Gestión de Ventas
          </h1>
          <Button className="bg-sistema-gray-dark hover:bg-sistema-gray flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Nueva Venta
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="bg-sistema-gray/10 pb-2">
              <CardTitle className="text-lg">Ventas de Hoy</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">$1,240</p>
              <p className="text-sistema-gray text-sm mt-2">8 transacciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-sistema-gray/10 pb-2">
              <CardTitle className="text-lg">Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">24</p>
              <p className="text-sistema-gray text-sm mt-2">Hoy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-sistema-gray/10 pb-2">
              <CardTitle className="text-lg">Comisión</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">$124</p>
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
              <table className="w-full mt-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Producto</th>
                    <th className="text-left pb-2">Cliente</th>
                    <th className="text-left pb-2">Monto</th>
                    <th className="text-left pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3">Laptop HP 15"</td>
                    <td>Juan Pérez</td>
                    <td>$899</td>
                    <td><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completada</span></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Monitor Dell 24"</td>
                    <td>Ana García</td>
                    <td>$199</td>
                    <td><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completada</span></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Teclado Logitech</td>
                    <td>Carlos Ruiz</td>
                    <td>$45</td>
                    <td><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendiente</span></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Mouse Inalámbrico</td>
                    <td>María López</td>
                    <td>$29</td>
                    <td><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">En proceso</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
