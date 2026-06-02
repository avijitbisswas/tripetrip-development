import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, User, Menu, X, Search, LayoutDashboard, LogOut, Plane } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { signOut } from '@/src/services/auth';
import { getProfile } from '@/src/services/profiles';
import { cn } from '@/lib/utils';
import AIAssistant from './AIAssistant';

interface LayoutProps {
  session: SupabaseUser | null;
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

  const navLinks = [
    { name: 'Discover', href: '/search', icon: Compass },
  ];

  if (session) {
    if (userRole === 'vendor') {
      navLinks.push({ name: 'Vendor Console', href: '/vendor', icon: LayoutDashboard });
    } else {
      navLinks.push({ name: 'My Trips', href: '/dashboard', icon: LayoutDashboard });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <Plane className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-indigo-900">Tripetrip</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-indigo-600",
                  location.pathname === link.href ? "text-indigo-600" : "text-slate-500"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            {session ? (
              <div className="flex items-center space-x-4 border-l border-slate-200 pl-6 ml-6">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600 font-medium" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4 border-l border-slate-200 pl-6 ml-6">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600 font-medium">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 font-semibold">Join</Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-slate-500" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden">
          <nav className="flex flex-col space-y-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                to={link.href}
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  location.pathname === link.href ? "text-indigo-600" : "text-slate-900"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {session ? (
              <button onClick={handleLogout} className="text-2xl font-bold tracking-tight text-left text-red-600">
                Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" className="text-2xl font-bold tracking-tight text-slate-900" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="text-2xl font-bold tracking-tight text-indigo-600" onClick={() => setIsMenuOpen(false)}>Join</Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      <AIAssistant />

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs font-medium">
          <div className="mb-4 md:mb-0">© 2024 Tripetrip Marketplace • Direct Booking Only</div>
          <div className="flex space-x-6 text-[10px] uppercase tracking-wider">
            <Link to="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link to="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <div className="flex gap-4 border-l border-slate-200 pl-6">
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-emerald-500 rounded-full"></div> 1,290 Bookings Today</span>
              <span className="flex items-center gap-1 italic">V1.0.4-beta</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
