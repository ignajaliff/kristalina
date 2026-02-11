import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import SellerLayout from "./components/SellerLayout";

// Páginas
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import SellerProspects from "./pages/SellerProspects";
import SellerQuotes from "./pages/SellerQuotes";
import SellerAcceptedQuotes from "./pages/SellerAcceptedQuotes";
import SellerClientes from "./pages/SellerClientes";
import SellerDashboardMain from "./pages/SellerDashboardMain";
import NotFound from "./pages/NotFound";
import ProspectForm from "./pages/ProspectForm";
import QuotesTable from "./pages/QuotesTable";
import AcceptedQuotes from "./pages/AcceptedQuotes";
import GestionEdificios from "./pages/GestionEdificios";
import Clientes from "./pages/Clientes";
import PresupuestosAceptados from "./pages/PresupuestosAceptados";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas para administrador con layout persistente */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="prospects" element={<ProspectForm />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="quotes" element={<QuotesTable />} />
              <Route path="accepted-quotes" element={<PresupuestosAceptados />} />
              <Route path="gestion" element={<GestionEdificios />} />
            </Route>
            
            {/* Rutas protegidas para vendedor con layout persistente */}
            <Route path="/seller" element={
              <ProtectedRoute allowedRoles={['vendedor']}>
                <SellerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SellerDashboardMain />} />
              <Route path="dashboard" element={<SellerDashboardMain />} />
              <Route path="prospects" element={<SellerProspects />} />
              <Route path="clientes" element={<SellerClientes />} />
              <Route path="quotes" element={<SellerQuotes />} />
              <Route path="accepted-quotes" element={<SellerAcceptedQuotes />} />
            </Route>
            
            {/* Redirección de ruta raíz a login */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Ruta de 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
