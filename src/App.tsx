import { lazy, Suspense, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/src/components/Layout';
import { getCurrentSession, subscribeToAuthState } from '@/src/services/auth';
import { Toaster } from 'sonner';

const Home = lazy(() => import('@/src/pages/Home'));
const Search = lazy(() => import('@/src/pages/Search'));
const Deals = lazy(() => import('@/src/pages/Deals'));
const DealsConfirmation = lazy(() => import('@/src/pages/deals/Confirmation'));
const AdminDeals = lazy(() => import('@/src/pages/admin/Deals'));
const ProviderDeals = lazy(() => import('@/src/pages/provider/Deals'));
const StaySearch = lazy(() => import('@/src/pages/stays/Search'));
const Activities = lazy(() => import('@/src/pages/Activities'));
const Transport = lazy(() => import('@/src/pages/Transport'));
const ListingDetail = lazy(() => import('@/src/pages/ListingDetail'));
const StayListingDetail = lazy(() => import('@/src/pages/stays/ListingDetail'));
const BookingConfirmation = lazy(() => import('@/src/pages/BookingConfirmation'));
const StayBookingConfirmation = lazy(() => import('@/src/pages/stays/BookingConfirmation'));
const Login = lazy(() => import('@/src/pages/Login'));
const Register = lazy(() => import('@/src/pages/Register'));
const TravelerDashboard = lazy(() => import('@/src/pages/traveler/Dashboard'));
const VendorDashboard = lazy(() => import('@/src/pages/vendor/Dashboard'));
const ListingManager = lazy(() => import('@/src/pages/vendor/ListingManager'));
const PublicVendorPage = lazy(() => import('@/src/pages/PublicVendorPage'));
const VendorOSDashboard = lazy(() => import('@/src/features/vendor-os/pages/Dashboard'));

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-center" theme="dark" />
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route element={<Layout session={session} />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/more" element={<Deals />} />
              <Route path="/more/:dealId" element={<Deals />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/:dealId" element={<Deals />} />
              <Route path="/deals/confirmation" element={<DealsConfirmation />} />
              <Route path="/admin/deals" element={<AdminDeals />} />
              <Route path="/provider/deals" element={<ProviderDeals />} />
              <Route path="/packages" element={<Search />} />
              <Route path="/stays" element={<StaySearch />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/transport/:id" element={<Transport />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/booking-confirmed" element={<BookingConfirmation />} />
              <Route path="/stays/booking-confirmed" element={<StayBookingConfirmation />} />
              <Route path="/stays/:id" element={<StayListingDetail />} />
              <Route path="/v/:slug" element={<PublicVendorPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={session ? <TravelerDashboard /> : <Navigate to="/login" />} />
              <Route path="/vendor" element={session ? <VendorDashboard /> : <Navigate to="/login" />} />
              <Route
                path="/vendor/os"
                element={session ? <VendorOSDashboard initialUserId={session.id} /> : <Navigate to="/login" />}
              />
              <Route
                path="/vendor/os/:module"
                element={session ? <VendorOSDashboard initialUserId={session.id} /> : <Navigate to="/login" />}
              />
              <Route path="/vendor/listing/new" element={session ? <ListingManager /> : <Navigate to="/login" />} />
              <Route path="/vendor/listing/edit/:id" element={session ? <ListingManager /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}
