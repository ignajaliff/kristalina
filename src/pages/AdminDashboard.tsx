
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/AdminSidebar";
import AdminDashboardStats from "@/components/AdminDashboardStats";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                Dashboard Financiero
              </h1>
              <p className="text-slate-500">
                Resumen de rendimiento y métricas clave
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-slate-700 hover:bg-gray-50 flex items-center gap-2">
                <span>Exportar</span>
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-slate-700 hover:bg-gray-50 flex items-center gap-2">
                <span>Filtrar</span>
              </button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <AdminDashboardStats />
          
          {/* Charts */}
          <AdminDashboardCharts />
          
          {/* Recent Activity */}
          <div className="mt-8">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-semibold text-slate-800">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-slate-800">Nuevo presupuesto enviado - Edificio Los Alpes</p>
                    <p className="text-slate-500 text-sm">Hace 2 horas</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-slate-800">Presupuesto aceptado - Condominio Vista Hermosa</p>
                    <p className="text-slate-500 text-sm">Hace 4 horas</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-slate-800">Instalación completada - Edificio Marina Bay</p>
                    <p className="text-slate-500 text-sm">Hace 12 horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Promotion Card */}
          <div className="mt-8">
            <Card className="border-0 shadow-md bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Promoción de Verano</h3>
                  <p className="text-blue-100 mb-4">Descuento especial para instalaciones en edificios nuevos</p>
                  <button className="px-4 py-2 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors">
                    Ver detalles
                  </button>
                </div>
                <div className="hidden md:block">
                  <Droplet className="h-24 w-24 text-blue-300 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

// Importamos Droplet de lucide-react para el ícono
import { Droplet } from "lucide-react";
