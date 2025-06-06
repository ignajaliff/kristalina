
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Droplet, BarChart3 } from "lucide-react";

const barData = [
  { name: 'Ene', presupuestos: 65, aceptados: 28 },
  { name: 'Feb', presupuestos: 59, aceptados: 32 },
  { name: 'Mar', presupuestos: 80, aceptados: 41 },
  { name: 'Abr', presupuestos: 81, aceptados: 37 },
  { name: 'May', presupuestos: 56, aceptados: 24 },
  { name: 'Jun', presupuestos: 55, aceptados: 29 },
];

const pieData = [
  { name: 'Edificio', value: 56, color: '#6b66ff' },
  { name: 'Escolar', value: 24, color: '#33ccff' },
  { name: 'Industrial', value: 20, color: '#ffbb33' },
];

const AdminDashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-white flex flex-row items-center justify-between p-3 md:p-5">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base font-medium">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="truncate">Presupuestos por Mes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-5 h-64 md:h-72 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', 
                  border: 'none',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
              <Bar dataKey="presupuestos" name="Enviados" fill="#6b66ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aceptados" name="Aceptados" fill="#33ccff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-white flex flex-row items-center justify-between p-3 md:p-5">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base font-medium">
            <Droplet className="h-4 w-4 text-blue-600" />
            <span className="truncate">Tipos de Instalaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-5 h-64 md:h-72 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={window.innerWidth < 768 ? 70 : 90}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', 
                  border: 'none',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '15px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardCharts;
