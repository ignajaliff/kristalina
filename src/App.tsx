
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
import SellerDashboard from "./pages/SellerDashboard";
import NotFound from "./pages/NotFound";
import ProspectForm from "./pages/ProspectForm";
import QuotesTable from "./pages/QuotesTable";
import AcceptedQuotes from "./pages/AcceptedQuotes";

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
            
            <Route path="/admin/quotes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QuotesTable />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/accepted-quotes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AcceptedQuotes />
              </ProtectedRoute>
            } />
            
            {/* Rutas protegidas para vendedor */}
            <Route path="/seller" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
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
