import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/AdminSidebar";
import AdminDashboardStats from "@/components/AdminDashboardStats";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import MobileDrawer from "@/components/MobileDrawer";
import { Bell, Filter, Download, Droplet, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminDashboard = () => {
  const isMobile = useIsMobile();

  // Fetch recent activity from both tables
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Get recent presupuestos updates
      const { data: presupuestos, error: presupuestosError } = await supabase
        .from('presupuestos')
        .select('id, communityname, presupuesto_aceptado, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (presupuestosError) {
        console.error('Error fetching presupuestos activity:', presupuestosError);
      }

      // Get recent gestion updates
      const { data: gestion, error: gestionError } = await supabase
        .from('gestion')
        .select('id, legalrepresentative, estadopago, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (gestionError) {
        console.error('Error fetching gestion activity:', gestionError);
      }

      // Combine and sort all activities
      const allActivities = [
        ...(presupuestos || []).map(p => ({
          id: p.id,
          type: 'presupuesto' as const,
          title: p.presupuesto_aceptado ? 'Presupuesto aceptado' : 'Nuevo presupuesto enviado',
          detail: p.communityname,
          timestamp: p.created_at,
          color: p.presupuesto_aceptado ? 'green' : 'blue'
        })),
        ...(gestion || []).map(g => ({
          id: g.id,
          type: 'gestion' as const,
          title: g.estadopago === 'Mes pagado' ? 'Pago confirmado' : 'Registro actualizado',
          detail: g.legalrepresentative,
          timestamp: g.updated_at || g.created_at,
          color: g.estadopago === 'Mes pagado' ? 'green' : 'purple'
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 6);

      return allActivities;
    },
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = parseISO(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minutos`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {!isMobile && <AdminSidebar />}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
            <div className="flex items-center gap-3">
              <MobileDrawer />
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-slate-800">
                  Dashboard Financiero
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Resumen de rendimiento y métricas clave
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <Button size="sm" variant="ghost" className="text-slate-600 h-8 w-8 md:h-9 md:w-9 p-0">
                <Bell className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              
              <Button size="sm" variant="outline" className="text-slate-700 h-8 md:h-9 gap-1 md:gap-2 text-xs">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Últimos 30 días</span>
                <span className="sm:hidden">30d</span>
              </Button>
              
              <Button size="sm" variant="outline" className="text-slate-700 h-8 md:h-9 gap-1 md:gap-2 text-xs">
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
              
              <Button size="sm" variant="outline" className="text-slate-700 h-8 md:h-9 gap-1 md:gap-2 text-xs">
                <Download className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <AdminDashboardStats />
          
          {/* Charts */}
          <AdminDashboardCharts />
          
          {/* Recent Activity */}
          <div className="mt-6 md:mt-8">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b p-3 md:p-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm md:text-base font-medium text-slate-800">Actividad Reciente</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs h-7 md:h-8 gap-1">
                    <Plus className="h-3 w-3" />
                    <span className="hidden sm:inline">Nueva actividad</span>
                    <span className="sm:hidden">Nueva</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {recentActivity?.length ? (
                    recentActivity.map((activity) => (
                      <ActivityItem
                        key={`${activity.type}-${activity.id}`}
                        title={activity.title}
                        detail={activity.detail}
                        time={formatTimeAgo(activity.timestamp)}
                        color={activity.color as "blue" | "green" | "purple" | "orange"}
                      />
                    ))
                  ) : (
                    <div className="p-6 md:p-8 text-center text-slate-500">
                      <p className="text-sm">No hay actividad reciente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Promotion Card */}
          <div className="mt-4 md:mt-6 mb-6 md:mb-8">
            <Card className="border-0 shadow-md bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
              <CardContent className="p-4 md:p-5 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-medium mb-2">Promoción de Verano</h3>
                  <p className="text-blue-100 mb-3 md:mb-4 text-xs md:text-sm">Descuento especial para instalaciones en edificios nuevos</p>
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 px-3 md:px-4 text-xs h-7 md:h-8">
                    Ver detalles
                  </Button>
                </div>
                <div className="hidden md:block ml-4">
                  <Droplet className="h-16 w-16 md:h-20 md:w-20 text-blue-300 opacity-50" />
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
    <div className="flex items-center px-3 md:px-5 py-2 md:py-3 hover:bg-slate-50">
      <div className={`w-2 h-2 rounded-full ${colorMap[color]} mr-2 md:mr-3`}></div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs md:text-sm text-slate-800 truncate">{title} - {detail}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
