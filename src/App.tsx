import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LangProvider } from "@/context/LangContext";
import { Layout } from "@/components/Layout";
import { RequireAdmin, RequireAuth } from "@/components/RouteGuards";
import { HomePage } from "@/pages/HomePage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { SearchPage } from "@/pages/SearchPage";
import { TalentProfilePage } from "@/pages/TalentProfilePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { TalentDashboardPage } from "@/pages/TalentDashboardPage";
import { SubscriptionPage } from "@/pages/SubscriptionPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MobileApp } from "@/pages/MobileApp";
import { PrototypeHub } from "@/pages/PrototypeHub";

// HashRouter is used so the single-file build works from any static host
// (and inside a WebView for the future Android/iOS wrapper) without server
// rewrites. Swap to BrowserRouter if you deploy with Firebase Hosting rewrites.
export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <HashRouter>
          <ScrollToTop />
          <Routes>
            {/* MOBILE APP INTERFACE (artists) – own phone-style shell, no site chrome */}
            <Route path="/app/*" element={<MobileApp />} />

            <Route element={<Layout />}>
              {/* Prototype hub: pick an interface */}
              <Route path="/prototype" element={<PrototypeHub />} />

              {/* WEB INTERFACE (recruiters) */}
              <Route path="/" element={<HomePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/web" element={<SearchPage />} />
              <Route path="/talent/:id" element={<TalentProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Creator Studio & Profile */}
              <Route element={<RequireAuth roles={["talent", "customer"]} />}>
                <Route path="/dashboard" element={<TalentDashboardPage />} />
                <Route path="/profile" element={<TalentDashboardPage />} />
                <Route path="/subscribe" element={<SubscriptionPage />} />
              </Route>

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </LangProvider>
  );
}
