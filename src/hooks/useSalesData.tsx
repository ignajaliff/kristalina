
import { useState, useEffect } from 'react';
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
  presupuesto_aceptado: boolean;
  created_at: string;
}

export const useSalesData = () => {
  const { user } = useAuth();
  const [currentSeller, setCurrentSeller] = useState<string | null>(null);

  // Fetch current seller name
  useEffect(() => {
    const fetchCurrentSeller = async () => {
      if (user?.email) {
        const { data: seller, error } = await supabase
          .from('vendedores')
          .select('nombre')
          .eq('email', user.email)
          .single();
        
        if (seller && !error) {
          setCurrentSeller(seller.nombre);
        }
      }
    };

    fetchCurrentSeller();
  }, [user?.email]);

  // Fetch sales data
  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['salesData', currentSeller],
    queryFn: async () => {
      if (!currentSeller) return null;

      const { data: presupuestos, error } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('vendedor', currentSeller)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysBudgets = presupuestos?.filter(p => {
        const createdDate = new Date(p.created_at);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
      }) || [];

      const acceptedBudgets = presupuestos?.filter(p => p.presupuesto_aceptado) || [];
      
      const todaySales = todaysBudgets.reduce((sum, p) => sum + (p.monto || 0), 0);
      const totalUnits = presupuestos?.reduce((sum, p) => sum + p.units, 0) || 0;
      const commission = todaySales * 0.1; // 10% commission

      const stats: SalesStats = {
        todaySales,
        todayTransactions: todaysBudgets.length,
        productsSold: totalUnits,
        commission,
      };

      const recentSales: RecentSale[] = presupuestos?.slice(0, 10).map(p => ({
        id: p.id,
        communityname: p.communityname,
        adminname: p.adminname,
        monto: p.monto,
        presupuesto_aceptado: p.presupuesto_aceptado,
        created_at: p.created_at,
      })) || [];

      return { stats, recentSales };
    },
    enabled: !!currentSeller,
  });

  return {
    salesData,
    isLoading,
    error,
    currentSeller,
  };
};
