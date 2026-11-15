import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ClientPortalRoute } from './components/ClientPortalRoute';
import { Loader2 } from 'lucide-react';
import { trackPageView } from './utils/analytics';
import { getRouteSeo, setSeo } from './utils/seo';
import './App.css';

const Calculators = lazy(() => import('./pages/Calculators').then(m => ({ default: m.Calculators })));
const Blog = lazy(() => import('./pages/Blog').then(m => ({ default: m.Blog })));
const OsiedleTluszcz = lazy(() => import('./pages/OsiedleTluszcz').then(m => ({ default: m.OsiedleTluszcz })));
const SmartHome = lazy(() => import('./pages/SmartHome').then(m => ({ default: m.SmartHome })));
const AddProperty = lazy(() => import('./pages/AddProperty').then(m => ({ default: m.AddProperty })));
const Properties = lazy(() => import('./pages/Properties').then(m => ({ default: m.Properties })));
const Favorites = lazy(() => import('./pages/Favorites').then(m => ({ default: m.Favorites })));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails').then(m => ({ default: m.PropertyDetails })));
const Login = lazy(() => import('./pages/admin/Login').then(m => ({ default: m.Login })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPropertyForm = lazy(() => import('./pages/admin/AdminPropertyForm').then(m => ({ default: m.AdminPropertyForm })));
const AboutTL = lazy(() => import('./pages/AboutTL').then(m => ({ default: m.AboutTL })));
const ClientPortal = lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })));
const ClientPortalLogin = lazy(() => import('./pages/ClientPortalLogin').then(m => ({ default: m.ClientPortalLogin })));
const CallCardPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/admin/CallCardPreview').then((module) => ({ default: module.CallCardPreview })))
  : null;
const WorkflowPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/admin/WorkflowPreview').then((module) => ({ default: module.WorkflowPreview })))
  : null;

function PageFallback() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
    );
}

function RouteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const pathWithQuery = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(pathWithQuery);
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function RouteSeoManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/oferty/')) return;
    setSeo(getRouteSeo(location.pathname));
  }, [location.pathname]);

  return null;
}

function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isClientPortal = location.pathname.startsWith('/panel-klienta');

  return (
    <div className={`app${isAdminRoute ? ' app--admin' : ''}`}>
      <ScrollToTop />
      <RouteAnalyticsTracker />
      <RouteSeoManager />
      {!isAdminRoute && !isClientPortal && <Header />}
      <main className={isAdminRoute ? 'admin-app-main' : undefined}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kalkulatory" element={<Calculators />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/osiedle-tluszcz" element={<OsiedleTluszcz />} />
            <Route path="/smart-home" element={<SmartHome />} />
            <Route path="/dodaj-nieruchomosc" element={<AddProperty />} />
            <Route path="/oferty" element={<Properties />} />
            <Route path="/oferty/:id" element={<PropertyDetails />} />
            <Route path="/ulubione" element={<Favorites />} />
            <Route path="/o-tluszczu" element={<AboutTL />} />
            <Route path="/panel-klienta/logowanie" element={<ClientPortalLogin />} />
            <Route path="/panel-klienta" element={<ClientPortalRoute><ClientPortal /></ClientPortalRoute>} />
            <Route path="/panel-klienta/demo" element={<ClientPortalRoute><ClientPortal /></ClientPortalRoute>} />
            <Route path="/admin/login" element={<Login />} />
            {CallCardPreview ? <Route path="/admin/dev/karta-rozmowy" element={<CallCardPreview />} /> : null}
            {WorkflowPreview ? <Route path="/admin/dev/kolejka" element={<WorkflowPreview />} /> : null}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/properties/new" element={<ProtectedRoute><AdminPropertyForm /></ProtectedRoute>} />
            <Route path="/admin/properties/:id/edit" element={<ProtectedRoute><AdminPropertyForm /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && !isClientPortal && <Footer />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <Router>
            <AppLayout />
          </Router>
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
