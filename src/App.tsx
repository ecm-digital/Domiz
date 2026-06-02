import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
      <Router>
        <div className="app">
          <RouteAnalyticsTracker />
          <RouteSeoManager />
          <Header />
          <main>
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

              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/properties/new" element={
                <ProtectedRoute>
                  <AdminPropertyForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/properties/:id/edit" element={
                <ProtectedRoute>
                  <AdminPropertyForm />
                </ProtectedRoute>
              } />

              {/* Catch-all Route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
