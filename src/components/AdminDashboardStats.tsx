
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckSquare, Building, DollarSign, TrendingUp, Users } from "lucide-react";

const AdminDashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard 
        title="Presupuestos Enviados"
        value="124"
        description="28 este mes"
        icon={<FileText className="h-6 w-6 text-white" />}
        className="stat-card-gradient-1"
        trend="+15%"
      />
      
      <StatCard 
        title="Presupuestos Aceptados"
        value="56"
        description="45% de conversión"
        icon={<CheckSquare className="h-6 w-6 text-white" />}
        className="stat-card-gradient-2"
        trend="+8%"
      />
      
      <StatCard 
        title="Unidades Instaladas"
        value="842"
        description="34 este mes"
        icon={<Building className="h-6 w-6 text-white" />}
        className="stat-card-gradient-3"
        trend="+22%"
      />
      
      <StatCard 
        title="Ingresos Mensuales"
        value="$5,245,000"
        description="+12% vs. mes anterior"
        icon={<DollarSign className="h-6 w-6 text-white" />}
        className="stat-card-gradient-4"
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
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
          <p className="text-2xl font-bold mb-2">{value}</p>
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-80">{description}</p>
            {trend && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 opacity-80" />
                <span className="text-xs font-medium opacity-90">{trend}</span>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-full p-3 bg-white/20 ml-4">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboardStats;
