
import SellerSidebar from "@/components/SellerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SellerReports = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <SellerSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-sistema-gray-dark">
            Reportes
          </h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Reportes de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sistema-gray">
              Aquí podrás generar y visualizar reportes detallados de tus ventas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerReports;
