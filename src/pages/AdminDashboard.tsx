
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-sistema-blue-dark mb-6">
          Dashboard de Administrador
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="bg-sistema-blue/10 pb-2">
              <CardTitle className="text-xl text-sistema-blue-dark">Usuarios Totales</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-bold">24</p>
              <p className="text-sistema-gray text-sm mt-2">6 nuevos esta semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-sistema-blue/10 pb-2">
              <CardTitle className="text-xl text-sistema-blue-dark">Productos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-bold">156</p>
              <p className="text-sistema-gray text-sm mt-2">12 añadidos este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-sistema-blue/10 pb-2">
              <CardTitle className="text-xl text-sistema-blue-dark">Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-bold">$15,245</p>
              <p className="text-sistema-gray text-sm mt-2">+12% este mes</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          <Card>
            <CardHeader className="bg-sistema-blue/10">
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                <div className="border-l-4 border-sistema-blue pl-4 py-2">
                  <p className="font-medium">Nuevo usuario registrado</p>
                  <p className="text-sistema-gray text-sm">Hace 2 horas</p>
                </div>
                <div className="border-l-4 border-sistema-blue pl-4 py-2">
                  <p className="font-medium">Producto actualizado: Laptop HP</p>
                  <p className="text-sistema-gray text-sm">Hace 4 horas</p>
                </div>
                <div className="border-l-4 border-sistema-blue pl-4 py-2">
                  <p className="font-medium">Nueva venta completada</p>
                  <p className="text-sistema-gray text-sm">Hace 12 horas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
