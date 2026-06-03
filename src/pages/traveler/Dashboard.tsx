import { useState, useEffect } from 'react';
import { getCurrentSession } from '@/src/services/auth';
import { getProfile } from '@/src/services/profiles';
import { listTravelerBookings } from '@/src/services/bookings';
import type { Booking, Profile } from '@/src/types/domain';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CreditCard, 
  MessageSquare,
  History,
  Plane
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TravelerDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { user } = await getCurrentSession();
      if (!user) return;
      const [profileData, bookingData] = await Promise.all([
        getProfile(user.id),
        listTravelerBookings(user.id),
      ]);
      setProfile(profileData);
      setBookings(bookingData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div>
          <h1 className="text-6xl font-light tracking-tighter uppercase leading-none mb-4">
            Hello, {profile?.full_name?.split(' ')[0] || 'Traveler'}
          </h1>
          <p className="text-white/40 uppercase tracking-[0.2em] text-xs">
            Traveling since {profile ? new Date(profile.created_at).getFullYear() : '2024'} • 0 verified trips
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="border-white/10 rounded-2xl h-14 px-8 uppercase tracking-widest text-[10px] font-bold">
            <CreditCard className="w-4 h-4 mr-2" />
            Wallet: $0.00
          </Button>
          <Button className="bg-white text-black hover:bg-white/90 h-14 px-8 rounded-2xl uppercase tracking-widest text-[10px] font-bold">
            Plan New Trip
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-12">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto">
          <TabsTrigger value="upcoming" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-black uppercase tracking-widest text-[10px] font-bold">
            <Clock className="w-3 h-3 mr-2" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-black uppercase tracking-widest text-[10px] font-bold">
            <History className="w-3 h-3 mr-2" />
            Past Trips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-[40px] animate-pulse" />
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {bookings.map((booking) => (
                <Card key={booking.id} className="bg-white/5 border-white/10 rounded-[40px] overflow-hidden group hover:border-white/30 transition-all">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <Badge className="bg-orange-500/10 text-orange-500 border-none uppercase text-[8px] tracking-[0.2em] px-3 py-1">
                        Confirmed
                      </Badge>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">Ref: #{booking.id.slice(0, 8)}</div>
                    </div>
                    
                    <h3 className="text-2xl font-light uppercase tracking-tighter mb-6">Tripetrip Booking</h3>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center text-sm text-white/60">
                        <Calendar className="w-4 h-4 mr-3 text-white/20" />
                        {new Date(booking.start_date).toLocaleDateString()} - {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center text-sm text-white/60">
                        <MapPin className="w-4 h-4 mr-3 text-white/20" />
                        Listing #{booking.listing_id.slice(0, 8)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-white/10">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px]">
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" className="text-white/60 hover:text-white uppercase tracking-widest text-[10px] font-bold">
                        View Ticket
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border-2 border-dashed border-white/10 rounded-[40px]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="text-white/20 w-10 h-10 -rotate-45" />
              </div>
              <h3 className="text-2xl font-light uppercase tracking-tighter mb-4">The map is blank</h3>
              <p className="text-white/40 uppercase tracking-widest text-[10px] mb-8">You haven't booked any experiences yet.</p>
              <Link to="/search">
                <Button className="bg-white text-black hover:bg-white/90 h-14 px-12 rounded-2xl uppercase tracking-widest text-xs font-bold">
                  Start Exploring
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          <div className="py-20 text-center text-white/20 uppercase tracking-widest text-sm italic">
            Your travel history will appear here...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
