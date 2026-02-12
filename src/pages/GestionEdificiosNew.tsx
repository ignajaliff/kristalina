import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import MobileDrawer from "@/components/MobileDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, SearchIcon, MapPin, Users, DollarSign, Phone, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface GestionItem {
  id: string;
  cliente: any;
  data_presupuesto: any;
  data_contrato: any;
  mesrenting: number;
  fechapago: string;
  estadopago: string;
  created_at: string;
  updated_at: string;
  vendedor_id: string | null;
}

const GestionEdificiosNew = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: gestionItems, isLoading } = useQuery({
    queryKey: ['gestion-edificios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gestion')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GestionItem[];
    },
  });

  const filteredItems = gestionItems?.filter(item => {
    const cliente = item.cliente || {};
    const searchLower = searchTerm.toLowerCase();
    return (
      (cliente.communityname || '').toLowerCase().includes(searchLower) ||
      (cliente.adminname || '').toLowerCase().includes(searchLower) ||
      (cliente.buildingaddress || '').toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="flex items-center gap-4">
            {isMobile && <MobileDrawer />}
            <div>
              <h1 className="text-2xl md:text-[26px] font-bold text-[#1E293B] tracking-tight leading-none mb-2">
                Gestión de Edificios
              </h1>
              <p className="text-sm font-medium text-[#64748B] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                Visualiza y gestiona la información de cada edificio instalado
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="border border-[#E2E8F0] shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <Input
                placeholder="Buscar por comunidad, administrador o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:ring-1 focus:ring-[#1A367F]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
            <Building2 className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
            {filteredItems.length} Edificio{filteredItems.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1A367F]"></div>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Cargando...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Building2 className="h-8 w-8 text-[#E2E8F0]" />
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">No se encontraron edificios</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const cliente = item.cliente || {};
              return (
                <Card
                  key={item.id}
                  onClick={() => navigate(`/admin/edificios/${item.id}`)}
                  className="border border-[#E2E8F0] shadow-sm bg-white rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-[#CBD5E1] group"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Building Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-[#F1F3F9] shrink-0">
                          <Building2 className="h-5 w-5 text-[#1A367F]" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[14px] font-bold text-[#1E293B] truncate group-hover:text-[#1A367F] transition-colors">
                            {cliente.communityname || 'Sin nombre'}
                          </h3>
                          <p className="text-[11px] text-[#94A3B8] font-medium">{cliente.buildingtype || 'Edificio'}</p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "font-bold text-[10px] uppercase tracking-wider shrink-0",
                        item.estadopago === 'Mes pagado'
                          ? "bg-[#F0FDF4] text-[#10B981] border-[#DCFCE7] hover:bg-[#F0FDF4]"
                          : item.estadopago === 'En fecha/No pagado'
                          ? "bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2] hover:bg-[#FEF2F2]"
                          : "bg-[#F5F3FF] text-[#7C3AED] border-[#EDE9FE] hover:bg-[#F5F3FF]"
                      )}>
                        {item.estadopago}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 pt-1">
                      {cliente.buildingaddress && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                          <p className="text-[12px] text-[#64748B] truncate">{cliente.buildingaddress}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                        <p className="text-[12px] text-[#64748B]">{cliente.adminname || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                        <p className="text-[12px] font-semibold text-[#1E293B]">${item.mesrenting?.toLocaleString()}/mes</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-[#F1F5F9]">
                      <p className="text-[11px] text-[#94A3B8] font-medium">
                        {cliente.units ? `${cliente.units} unidades` : ''}{cliente.units && cliente.comuna ? ' · ' : ''}{cliente.comuna || ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionEdificiosNew;
