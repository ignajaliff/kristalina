
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SellerProducts = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-sistema-gray-dark">
          Productos
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sistema-gray">
            Aquí podrás gestionar el catálogo de productos disponibles para la venta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerProducts;
