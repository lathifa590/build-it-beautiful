import { Toaster } from "@/components/ui/toaster";
import "@/assets/styles/store-management.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AgencyRoute } from "@/components/auth/AgencyRoute";
import { StoreGate } from "@/components/auth/StoreGate";
import { SchoolPilotRoute } from "@/components/auth/SchoolPilotRoute";
import { Suspense, lazy } from "react";
import { PageLoader } from "@/components/ui/PageLoader";

const AgencyDashboard = lazy(() => import("./pages/agency/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminAgencyPackages = lazy(() => import("./pages/admin/AgencyPackages"));
const AdminAgencyOwners = lazy(() => import("./pages/admin/AgencyOwners"));
const AdminAgencyPromos = lazy(() => import("./pages/admin/AgencyPromos"));
const AdminSchools = lazy(() => import("./pages/admin/Schools"));
const SekolahKalender = lazy(() => import("./pages/sekolah/Kalender"));
const SekolahDashboard = lazy(() => import("./pages/sekolah/Dashboard"));
const SekolahJoin = lazy(() => import("./pages/sekolah/Join"));
const SekolahBank = lazy(() => import("./pages/sekolah/Bank"));
const SekolahAnggota = lazy(() => import("./pages/sekolah/Anggota"));
const SekolahStandar = lazy(() => import("./pages/sekolah/Standar"));
const SekolahExport = lazy(() => import("./pages/sekolah/Export"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SEOPage = lazy(() => import("./pages/landing/SEOPage"));
const BlogIndex = lazy(() => import("./pages/blog/BlogIndex"));
const BlogDetail = lazy(() => import("./pages/blog/BlogDetail"));

// Store Imports
const StoreIndex = lazy(() => import("./pages/store/StoreIndex"));
const StoreProfile = lazy(() => import("./pages/store/StoreProfile"));
const StoreDetail = lazy(() => import("./pages/store/StoreDetail"));
const StoreManagement = lazy(() => import("./pages/store/StoreManagement"));
const StoreCheckout = lazy(() => import("./pages/store/StoreCheckout"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <SchoolProvider>
            <TooltipProvider>
              <ConfirmProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={<Landing />} />
                
                {/* SEO Landing Pages */}
                <Route path="/generator-modul-ajar" element={<SEOPage explicitSlug="generator-modul-ajar" />} />
                <Route path="/generator-rpp" element={<SEOPage explicitSlug="generator-rpp" />} />
                <Route path="/generator-lkpd" element={<SEOPage explicitSlug="generator-lkpd" />} />
                <Route path="/generator-asesmen" element={<SEOPage explicitSlug="generator-asesmen" />} />
                <Route path="/kurikulum-merdeka" element={<SEOPage explicitSlug="kurikulum-merdeka" />} />
                <Route path="/kurikulum-kbc" element={<SEOPage explicitSlug="kurikulum-kbc" />} />
                <Route path="/rpp-madrasah" element={<SEOPage explicitSlug="rpp-madrasah" />} />
                <Route path="/modul-ajar-mi" element={<SEOPage explicitSlug="modul-ajar-mi" />} />
                <Route path="/modul-ajar-mts" element={<SEOPage explicitSlug="modul-ajar-mts" />} />
                <Route path="/modul-ajar-ma" element={<SEOPage explicitSlug="modul-ajar-ma" />} />
                
                {/* Blog Routes */}
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                
                {/* Auth routes */}
                <Route path="/auth" element={<Auth />} />

                {/* Public Store routes (Temporarily Gated) */}
                <Route path="/store" element={<StoreGate><StoreIndex /></StoreGate>} />
                <Route path="/store/:storeSlug" element={<StoreGate><StoreProfile /></StoreGate>} />
                <Route path="/store/item/:listingId" element={<StoreGate><StoreDetail /></StoreGate>} />
                <Route path="/checkout/:orderId" element={<StoreGate><StoreCheckout /></StoreGate>} />
                
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
                
                {/* Protected Store Management */}
                  <Route 
                    path="/app/store-management" 
                    element={
                      <ProtectedRoute>
                        <StoreGate>
                          <StoreManagement />
                        </StoreGate>
                      </ProtectedRoute>
                    } 
                  />

                {/* Mode Sekolah Routes (Deploy Terbatas: Admin & jagofeed@gmail.com) */}
                <Route
                  path="/sekolah/join"
                  element={
                    <SchoolPilotRoute>
                      <SekolahJoin />
                    </SchoolPilotRoute>
                  }
                />
                <Route
                  path="/sekolah"
                  element={
                    <SchoolPilotRoute>
                      <SekolahDashboard />
                    </SchoolPilotRoute>
                  }
                />
                <Route
                  path="/sekolah/kalender"
                  element={
                    <SchoolPilotRoute>
                      <SekolahKalender />
                    </SchoolPilotRoute>
                  }
                />
                <Route
                  path="/sekolah/bank"
                  element={
                    <SchoolPilotRoute>
                      <SekolahBank />
                    </SchoolPilotRoute>
                  }
                />
                <Route
                  path="/sekolah/anggota"
                  element={
                    <SchoolPilotRoute>
                      <SekolahAnggota />
                    </SchoolPilotRoute>
                  }
                />
                <Route
                  path="/sekolah/standar"
                  element={
                    <SchoolPilotRoute>
                      <SekolahStandar />
                    </SchoolPilotRoute>
                  }
                />
                <Route
                  path="/sekolah/export"
                  element={
                    <SchoolPilotRoute>
                      <SekolahExport />
                    </SchoolPilotRoute>
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
                  path="/admin/schools"
                  element={
                    <AdminRoute>
                      <AdminSchools />
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
              </Suspense>
              </ConfirmProvider>
            </TooltipProvider>
          </SchoolProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
