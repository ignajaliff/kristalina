
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SalesStats {
  todaySales: number;
  todayTransactions: number;
  productsSold: number;
  commission: number;
}

interface RecentSale {
  id: string;
  communityname: string;
  adminname: string;
  monto: number | null;
  estado: string;
  created_at: string;
}

export const useSalesData = () => {
  const { userProfile } = useAuth();

  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['salesData', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      // Fetch prospectos for units count
      const { data: prospectos, error: prospectosError } = await supabase
        .from('prospectos')
        .select('id, units')
        .eq('vendedor_id', userProfile.id);

      if (prospectosError) throw prospectosError;

      // Fetch presupuestos with prospectos data
      const { data: presupuestos, error: presupuestosError } = await supabase
        .from('presupuestos')
        .select('*, prospectos!inner(communityname, adminname, vendedor_id)')
        .eq('prospectos.vendedor_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (presupuestosError) throw presupuestosError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysBudgets = presupuestos?.filter(p => {
        const createdDate = new Date(p.created_at);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
      }) || [];

      const todaySales = todaysBudgets.reduce((sum, p) => sum + (p.monto || 0), 0);
      const totalUnits = prospectos?.reduce((sum, p) => sum + p.units, 0) || 0;
      const commission = todaySales * 0.1;

      const stats: SalesStats = {
        todaySales,
        todayTransactions: todaysBudgets.length,
        productsSold: totalUnits,
        commission,
      };

      const recentSales: RecentSale[] = presupuestos?.slice(0, 10).map((p: any) => ({
        id: p.id,
        communityname: p.prospectos?.communityname || '',
        adminname: p.prospectos?.adminname || '',
        monto: p.monto,
        estado: p.estado,
        created_at: p.created_at,
      })) || [];

      return { stats, recentSales };
    },
    enabled: !!userProfile?.id,
  });

  return {
    salesData,
    isLoading,
    error,
    currentSeller: userProfile?.nombre || null,
  };
};
