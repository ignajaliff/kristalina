
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckSquare, Users, DollarSign, TrendingUp, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboardStats = () => {
  // Fetch presupuestos data
  const { data: presupuestosData } = useQuery({
    queryKey: ['presupuestos-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('presupuesto_aceptado, equipos_instalados');
      
      if (error) {
        console.error('Error fetching presupuestos stats:', error);
        throw error;
      }
      
      return data;
    },
  });

  // Fetch nuevos clientes data for current month
  const { data: nuevosClientesData } = useQuery({
    queryKey: ['nuevos-clientes-stats'],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('presupuestos')
        .select('estado_contacto, created_at')
        .in('estado_contacto', ['Primer Contacto', 'Segundo Contacto'])
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString());
      
      if (error) {
        console.error('Error fetching nuevos clientes stats:', error);
        throw error;
      }
      
      return data;
    },
  });

  // Fetch gestion data for monthly income calculation
  const { data: gestionData } = useQuery({
    queryKey: ['gestion-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gestion')
        .select('mesrenting, estadopago');
      
      if (error) {
        console.error('Error fetching gestion stats:', error);
        throw error;
      }
      
      return data;
    },
  });

  // Calculate stats
  const presupuestosEnviados = presupuestosData?.filter(p => !p.presupuesto_aceptado).length || 0;
  const presupuestosAceptados = presupuestosData?.filter(p => p.presupuesto_aceptado).length || 0;
  const clientesGestionandose = presupuestosData?.filter(p => p.equipos_instalados === 'completed').length || 0;
  const nuevosClientesAgregados = nuevosClientesData?.length || 0;
  
  // Calculate monthly income from mesrenting where estadopago is "Mes pagado"
  const ingresosMensuales = gestionData?.reduce((total, item) => {
    if (item.estadopago === 'Mes pagado') {
      return total + (item.mesrenting || 0);
    }
    return total;
  }, 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5">
      <StatCard 
        title="Presupuestos Enviados"
        value={presupuestosEnviados.toString()}
        description={`${presupuestosEnviados > 0 ? Math.round((presupuestosEnviados / (presupuestosData?.length || 1)) * 100) : 0}% del total`}
        icon={<FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />}
        className="stat-card-gradient-1"
        trend="+15%"
      />
      
      <StatCard 
        title="Presupuestos Aceptados"
        value={presupuestosAceptados.toString()}
        description={`${presupuestosData?.length ? Math.round((presupuestosAceptados / presupuestosData.length) * 100) : 0}% de conversión`}
        icon={<CheckSquare className="h-5 w-5 md:h-6 md:w-6 text-white" />}
        className="stat-card-gradient-2"
        trend="+8%"
      />
      
      <StatCard 
        title="Clientes Gestionándose"
        value={clientesGestionandose.toString()}
        description="Equipos completados"
        icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-white" />}
        className="stat-card-gradient-3"
        trend="+22%"
      />

      <StatCard 
        title="Nuevos Clientes Agregados"
        value={nuevosClientesAgregados.toString()}
        description="Este mes"
        icon={<UserPlus className="h-5 w-5 md:h-6 md:w-6 text-white" />}
        className="stat-card-gradient-4"
        trend="+18%"
      />
      
      <StatCard 
        title="Ingresos Mensuales"
        value={formatCurrency(ingresosMensuales)}
        description="+12% vs. mes anterior"
        icon={<DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />}
        className="stat-card-gradient-green"
        trend="+12%"
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  trend?: string;
}

const StatCard = ({ title, value, description, icon, className, trend }: StatCardProps) => (
  <Card className={`border-0 shadow overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}>
    <CardContent className="p-4 md:p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium opacity-90 mb-1 truncate">{title}</p>
          <p className="text-xl md:text-2xl font-bold mb-2 truncate">{value}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs md:text-sm opacity-80 truncate flex-1">{description}</p>
            {trend && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <TrendingUp className="h-3 w-3 opacity-80" />
                <span className="text-xs font-medium opacity-90">{trend}</span>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-full p-2 md:p-3 bg-white/20 ml-3 md:ml-4 flex-shrink-0">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboardStats;
