
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Droplet, BarChart3, Info } from "lucide-react";

const barData = [
  { name: 'Ene', presupuestos: 65, aceptados: 28 },
  { name: 'Feb', presupuestos: 59, aceptados: 32 },
  { name: 'Mar', presupuestos: 80, aceptados: 41 },
  { name: 'Abr', presupuestos: 81, aceptados: 37 },
  { name: 'May', presupuestos: 56, aceptados: 24 },
  { name: 'Jun', presupuestos: 55, aceptados: 29 },
];

const pieData = [
  { name: 'Edificio', value: 56, color: '#1A367F' }, // Brand Primary
  { name: 'Escolar', value: 24, color: '#3B82F6' },  // Brand Secondary
  { name: 'Industrial', value: 20, color: '#94A3B8' }, // Brand Tertiary
];

const AdminDashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8 font-sans">
      <Card className="border border-[#E2E8F0] shadow-sm overflow-hidden bg-white rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] flex flex-row items-center justify-between p-5">
          <CardTitle className="flex items-center gap-2.5 text-sm font-bold text-[#1E293B] uppercase tracking-wider">
            <div className="p-1.5 bg-[#EFF6FF] rounded-md transition-colors">
              <BarChart3 className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
            </div>
            <span>Rendimiento Mensual</span>
          </CardTitle>
          <Info className="h-4 w-4 text-[#94A3B8] cursor-help" />
        </CardHeader>
        <CardContent className="p-6 h-[320px] bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E2E8F0',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#1E293B',
                  padding: '10px 14px'
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px' }}
              />
              <Bar dataKey="presupuestos" name="Enviados" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="aceptados" name="Aceptados" fill="#1A367F" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-[#E2E8F0] shadow-sm overflow-hidden bg-white rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] flex flex-row items-center justify-between p-5">
          <CardTitle className="flex items-center gap-2.5 text-sm font-bold text-[#1E293B] uppercase tracking-wider">
            <div className="p-1.5 bg-[#F0FDF4] rounded-md transition-colors">
              <Droplet className="h-4 w-4 text-[#10B981]" strokeWidth={2.5} />
            </div>
            <span>Distribución por Sector</span>
          </CardTitle>
          <Info className="h-4 w-4 text-[#94A3B8] cursor-help" />
        </CardHeader>
        <CardContent className="p-6 h-[320px] bg-white flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E2E8F0',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '10px 14px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                layout="horizontal"
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardCharts;
