
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/AdminSidebar";
import AdminDashboardStats from "@/components/AdminDashboardStats";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import { Bell, Filter, Download, Droplet, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Dashboard Financiero
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Resumen de rendimiento y métricas clave
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button size="sm" variant="ghost" className="text-slate-600 h-9 w-9 p-0">
                <Bell className="h-4 w-4" />
              </Button>
              
              <Button size="sm" variant="outline" className="text-slate-700 h-9 gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Últimos 30 días</span>
              </Button>
              
              <Button size="sm" variant="outline" className="text-slate-700 h-9 gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-xs">Filtros</span>
              </Button>
              
              <Button size="sm" variant="outline" className="text-slate-700 h-9 gap-2">
                <Download className="h-4 w-4" />
                <span className="text-xs">Exportar</span>
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <AdminDashboardStats />
          
          {/* Charts */}
          <AdminDashboardCharts />
          
          {/* Recent Activity */}
          <div className="mt-8">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b p-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-slate-800">Actividad Reciente</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                    <Plus className="h-3 w-3" />
                    Nueva actividad
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  <ActivityItem
                    title="Nuevo presupuesto enviado"
                    detail="Edificio Los Alpes"
                    time="Hace 2 horas"
                    color="blue"
                  />
                  <ActivityItem
                    title="Presupuesto aceptado"
                    detail="Condominio Vista Hermosa"
                    time="Hace 4 horas"
                    color="green"
                  />
                  <ActivityItem
                    title="Instalación completada"
                    detail="Edificio Marina Bay"
                    time="Hace 12 horas"
                    color="purple"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Promotion Card */}
          <div className="mt-6 mb-8">
            <Card className="border-0 shadow-md bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">Promoción de Verano</h3>
                  <p className="text-blue-100 mb-4 text-sm">Descuento especial para instalaciones en edificios nuevos</p>
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 px-4 text-xs">
                    Ver detalles
                  </Button>
                </div>
                <div className="hidden md:block">
                  <Droplet className="h-20 w-20 text-blue-300 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ActivityItemProps {
  title: string;
  detail: string;
  time: string;
  color: "blue" | "green" | "purple" | "orange";
}

const ActivityItem = ({ title, detail, time, color }: ActivityItemProps) => {
  const colorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };
  
  return (
    <div className="flex items-center px-5 py-3 hover:bg-slate-50">
      <div className={`w-2 h-2 rounded-full ${colorMap[color]} mr-3`}></div>
      <div className="flex-1">
        <p className="font-medium text-sm text-slate-800">{title} - {detail}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
