
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/AdminSidebar";
import AdminDashboardStats from "@/components/AdminDashboardStats";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-sistema-blue-dark mb-6">
          Dashboard Kristalina
        </h1>
        
        {/* Stats Cards */}
        <AdminDashboardStats />
        
        {/* Charts */}
        <AdminDashboardCharts />
        
        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader className="bg-sistema-blue/10">
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                <div className="border-l-4 border-sistema-blue pl-4 py-2">
                  <p className="font-medium">Nuevo presupuesto enviado - Edificio Los Alpes</p>
                  <p className="text-sistema-gray text-sm">Hace 2 horas</p>
                </div>
                <div className="border-l-4 border-sistema-blue pl-4 py-2">
                  <p className="font-medium">Presupuesto aceptado - Condominio Vista Hermosa</p>
                  <p className="text-sistema-gray text-sm">Hace 4 horas</p>
                </div>
                <div className="border-l-4 border-sistema-blue pl-4 py-2">
                  <p className="font-medium">Instalación completada - Edificio Marina Bay</p>
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
