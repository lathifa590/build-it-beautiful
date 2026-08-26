import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AgencyRoute } from "@/components/auth/AgencyRoute";
import AgencyDashboard from "./pages/agency/Dashboard";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import AdminCustomers from "./pages/admin/Customers";
import AdminAgencyPackages from "./pages/admin/AgencyPackages";
import AdminAgencyOwners from "./pages/admin/AgencyOwners";
import AdminAgencyPromos from "./pages/admin/AgencyPromos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <TooltipProvider>
            <ConfirmProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={<Landing />} />
                
                {/* Auth routes */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected App routes */}
                <Route
                  path="/app/*"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminRoute>
                      <AdminSettings />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/customers"
                  element={
                    <AdminRoute>
                      <AdminCustomers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/agency/packages"
                  element={
                    <AdminRoute>
                      <AdminAgencyPackages />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/agency/owners"
                  element={
                    <AdminRoute>
                      <AdminAgencyOwners />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/agency/promos"
                  element={
                    <AdminRoute>
                      <AdminAgencyPromos />
                    </AdminRoute>
                  }
                />


                {/* Agency / Reseller Dashboard */}
                <Route
                  path="/agency"
                  element={
                    <AgencyRoute>
                      <AgencyDashboard />
                    </AgencyRoute>
                  }
                />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ConfirmProvider>
          </TooltipProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
