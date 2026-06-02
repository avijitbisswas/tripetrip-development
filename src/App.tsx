import { lazy, Suspense, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/src/components/Layout';
import { getCurrentSession, subscribeToAuthState } from '@/src/services/auth';
import { Toaster } from 'sonner';

const Home = lazy(() => import('@/src/pages/Home'));
const Search = lazy(() => import('@/src/pages/Search'));
const ListingDetail = lazy(() => import('@/src/pages/ListingDetail'));
const Login = lazy(() => import('@/src/pages/Login'));
const Register = lazy(() => import('@/src/pages/Register'));
const TravelerDashboard = lazy(() => import('@/src/pages/traveler/Dashboard'));
const VendorDashboard = lazy(() => import('@/src/pages/vendor/Dashboard'));
const ListingManager = lazy(() => import('@/src/pages/vendor/ListingManager'));
const PublicVendorPage = lazy(() => import('@/src/pages/PublicVendorPage'));

function AppLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse flex flex-col items-center">
        <div className="text-4xl font-light tracking-tighter mb-4">Tripetrip</div>
        <div className="h-1 w-24 bg-white/20 overflow-hidden">
          <div className="h-full bg-white animate-[loading_1.5s_infinite]" style={{ width: '30%' }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getCurrentSession()
      .then((state) => {
        if (mounted) {
          setSession(state.user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      });

    const unsubscribe = subscribeToAuthState((state) => {
      setSession(state.user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <Router>
      <Toaster position="top-center" theme="dark" />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route element={<Layout session={session} />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/v/:slug" element={<PublicVendorPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={session ? <TravelerDashboard /> : <Navigate to="/login" />} />
            <Route path="/vendor" element={session ? <VendorDashboard /> : <Navigate to="/login" />} />
            <Route path="/vendor/listing/new" element={session ? <ListingManager /> : <Navigate to="/login" />} />
            <Route path="/vendor/listing/edit/:id" element={session ? <ListingManager /> : <Navigate to="/login" />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
