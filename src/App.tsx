
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
            
            {/* Rutas protegidas para administrador */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/prospects" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProspectForm />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/clientes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Clientes />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/quotes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QuotesTable />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/accepted-quotes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PresupuestosAceptados />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/gestion" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <GestionEdificios />
              </ProtectedRoute>
            } />
            
            {/* Rutas protegidas para vendedor */}
            <Route path="/seller" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboardMain />
              </ProtectedRoute>
            } />
            
            <Route path="/seller/dashboard" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboardMain />
              </ProtectedRoute>
            } />
            
            <Route path="/seller/prospects" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerProspects />
              </ProtectedRoute>
            } />
            
            <Route path="/seller/clientes" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerClientes />
              </ProtectedRoute>
            } />
            
            <Route path="/seller/quotes" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerQuotes />
              </ProtectedRoute>
            } />
            
            <Route path="/seller/accepted-quotes" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerAcceptedQuotes />
              </ProtectedRoute>
            } />
            
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
