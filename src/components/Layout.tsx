import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProfile } from '@/src/services/profiles';
import { signOut } from '@/src/services/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ChevronDown, Globe2, Heart, LayoutDashboard, LogOut, Menu, Plane, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LayoutProps {
  session: SupabaseUser | null;
}

const mainNav = ['Stays', 'Packages', 'Activities', 'Transport', 'Deals', 'More'];
const navTargets: Record<string, string> = {
  Stays: '/stays',
  Packages: '/packages',
  Activities: '/activities',
  Transport: '/transport',
  Deals: '/deals',
  More: '/search',
};

function isNavActive(pathname: string, name: string) {
  if (name === 'Stays') return pathname.startsWith('/stays');
  if (name === 'Packages') return pathname.startsWith('/packages');
  if (name === 'Activities') return pathname.startsWith('/activities');
  if (name === 'Transport') return pathname.startsWith('/transport');
  if (name === 'Deals') return pathname.startsWith('/deals') || pathname.startsWith('/more');
  if (name === 'More') return pathname === '/search';
  return false;
}

export default function Layout({ session }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      setUserRole(null);
      return;
    }

    getProfile(session.id)
      .then((profile) => setUserRole(profile.role))
      .catch(() => setUserRole(null));
  }, [session]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16A34A] shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="block text-xl font-extrabold tracking-tight text-slate-950">Tripetrip</span>
              <span className="text-[9px] font-bold text-slate-500">Direct Travel Revolution</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {mainNav.map((name) => (
              <Link
                key={name}
                to={navTargets[name]}
                className={cn(
                  'relative text-sm font-bold transition-colors hover:text-[#16A34A]',
                  isNavActive(location.pathname, name) ? 'text-[#16A34A]' : 'text-slate-700',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {name}
                  {name === 'More' && <ChevronDown className="h-3.5 w-3.5" />}
                </span>
                {isNavActive(location.pathname, name) && <span className="absolute -bottom-5 left-0 right-0 h-0.5 rounded-full bg-[#16A34A]" />}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Globe2 className="h-5 w-5 text-slate-800" />
            <Heart className="h-5 w-5 text-slate-800" />
            {session ? (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <Link to={userRole === 'vendor' ? '/vendor' : '/dashboard'}>
                  <Button variant="ghost" size="sm" className="font-semibold text-slate-600 hover:text-[#16A34A]">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="font-semibold text-slate-600 hover:text-[#16A34A]" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-semibold text-slate-600 hover:text-[#16A34A]">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="rounded-xl bg-[#16A34A] px-4 font-bold text-white hover:bg-emerald-700">Join</Button>
                </Link>
              </div>
            )}
          </div>

          <button className="p-2 text-slate-700 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white px-6 pt-24 md:hidden">
          <nav className="flex flex-col gap-6">
            {mainNav.map((name) => (
              <Link key={name} to={navTargets[name]} className={cn('text-2xl font-bold tracking-tight', isNavActive(location.pathname, name) ? 'text-[#16A34A]' : 'text-slate-900')} onClick={() => setIsMenuOpen(false)}>
                {name}
              </Link>
            ))}
            {session ? (
              <button onClick={handleLogout} className="text-left text-2xl font-bold tracking-tight text-red-600">Sign Out</button>
            ) : (
              <>
                <Link to="/login" className="text-2xl font-bold tracking-tight text-slate-900" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="text-2xl font-bold tracking-tight text-[#16A34A]" onClick={() => setIsMenuOpen(false)}>Join</Link>
              </>
            )}
          </nav>
        </div>
      )}

      <main className="pt-16">
        <Outlet />
      </main>

      <footer className="bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 text-xs font-medium md:flex-row">
          <div className="max-w-sm">
            <Link to="/" className="text-2xl font-extrabold hover:text-white/90">Tripetrip</Link>
            <p className="mt-2 text-slate-400">Book directly with verified travel partners worldwide. No middlemen. Better prices. Exclusive offers.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] uppercase tracking-wider text-slate-400">
            <Link to="/terms" className="hover:text-[#16A34A]">Terms</Link>
            <Link to="/privacy" className="hover:text-[#16A34A]">Privacy</Link>
            <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-500" />1,290 Bookings Today</span>
            <span>Direct Booking Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
