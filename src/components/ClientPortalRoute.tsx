import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function ClientPortalRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setHasAccess(null); return; }
    getDoc(doc(db, 'clientPortals', user.uid)).then(snapshot => setHasAccess(snapshot.exists())).catch(() => setHasAccess(false));
  }, [user]);

  if (loading || (user && hasAccess === null)) return <div className="client-auth-loading"><Loader2 className="animate-spin" size={28} /></div>;
  if (!user) return <Navigate to={`/panel-klienta/logowanie?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!hasAccess) return <Navigate to="/panel-klienta/logowanie?error=no-access" replace />;
  return children;
}
