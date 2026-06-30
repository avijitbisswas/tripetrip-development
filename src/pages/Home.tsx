import { Button } from '@/components/ui/button';
import EnhancedSearchBar from '@/src/components/marketplace/EnhancedSearchBar';
import MarketplaceSection from '@/src/components/marketplace/MarketplaceSection';
import { ActivityCard, DealCard, PackageCard, PropertyCard, TransportCard } from '@/src/components/marketplace/cards';
import { usePublicSiteConfig } from '@/src/hooks/usePublicSiteConfig';
import { ArrowRight, BadgeCheck, Handshake, ShieldCheck, Sparkles, Tags } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const heroImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=85&w=2400';

const packages = [
  { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=900', destination: 'Goa Getaway', duration: '3D / 2N', rating: '4.6 (128)', provider: 'TripGo Holidays', originalPrice: 9999, directPrice: 7999, savings: 'Save ₹2,000' },
  { image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=80&w=900', destination: 'Manali Escape', duration: '4D / 3N', rating: '4.7 (96)', provider: 'Himalaya Trips', originalPrice: 12999, directPrice: 9999, savings: 'Save ₹3,000' },
  { image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=900', destination: 'Bali Bliss', duration: '5D / 4N', rating: '4.8 (74)', provider: 'WonderWorld', originalPrice: 29999, directPrice: 24999, savings: 'Save ₹5,000' },
  { image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=900', destination: 'Kerala Magic', duration: '4D / 3N', rating: '4.6 (88)', provider: 'Green Trails', originalPrice: 14499, directPrice: 12499, savings: 'Save ₹2,500' },
  { image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=900', destination: 'Andaman Blue', duration: '5D / 4N', rating: '4.9 (112)', provider: 'Island Direct', originalPrice: 32999, directPrice: 27999, savings: 'Save ₹5,000' },
];

const properties = [
  { image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=900', type: 'Villa', location: 'Luxury Beach Villa, Goa', amenities: ['Pool', 'WiFi', 'Breakfast'], rating: '4.7 (56)', originalPrice: 12000, directPrice: 8499, availability: 'Available Today' },
  { image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=900', type: 'Resort', location: 'The Lake Resort, Nainital', amenities: ['Lake View', 'Spa', 'Parking'], rating: '4.6 (78)', originalPrice: 7600, directPrice: 5499, availability: '3 Rooms Left' },
  { image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=900', type: 'Homestay', location: 'Mountain View Homestay, Manali', amenities: ['Host Meals', 'Bonfire'], rating: '4.8 (42)', originalPrice: 3000, directPrice: 2199, availability: 'Instant Book' },
  { image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=900', type: 'Hostel', location: 'Backpackers Hostel, Rishikesh', amenities: ['Dorms', 'Cafe', 'WiFi'], rating: '4.5 (63)', originalPrice: 800, directPrice: 499, availability: 'Pay at Property' },
  { image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=900', type: 'Boutique Stay', location: 'Tea Estate Bungalow, Munnar', amenities: ['Garden', 'Tours'], rating: '4.9 (37)', originalPrice: 9200, directPrice: 6999, availability: 'Verified Host' },
];

const activities = [
  { image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=80&w=900', name: 'River Rafting', location: 'Rishikesh, Uttarakhand', difficulty: 'Moderate', duration: '3 Hrs', safetyBadge: 'Safety Checked', directPrice: 799, rating: '4.7 (120)' },
  { image: 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?auto=format&fit=crop&q=80&w=900', name: 'Paragliding', location: 'Bir Billing, Himachal', difficulty: 'Easy', duration: '15 Min', safetyBadge: 'Certified Pilot', directPrice: 2499, rating: '4.8 (88)' },
  { image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=900', name: 'Scuba Diving', location: 'Andaman Islands', difficulty: 'Moderate', duration: '2 Hrs', safetyBadge: 'PADI Partner', directPrice: 3999, rating: '4.6 (66)' },
  { image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&q=80&w=900', name: 'Bungee Jumping', location: 'Rishikesh, Uttarakhand', difficulty: 'Extreme', duration: '1 Jump', safetyBadge: 'Harness Audit', directPrice: 3499, rating: '4.9 (151)' },
  { image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=900', name: 'Guided Trek', location: 'Kasol, Himachal', difficulty: 'Hard', duration: '2 Days', safetyBadge: 'Local Guide', directPrice: 2999, rating: '4.8 (74)' },
];

const transports = [
  { image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=900', serviceType: 'Airport Transfer', pickup: 'Delhi Airport', rating: '4.6 (204)', capacity: '4 Seater', directPrice: 1199 },
  { image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=900', serviceType: 'Bike Rental', pickup: 'Manali', rating: '4.7 (186)', capacity: '2 Seater', directPrice: 999 },
  { image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=900', serviceType: 'Tempo Traveller', pickup: 'Shimla', rating: '4.6 (112)', capacity: '12 Seater', directPrice: 4999 },
  { image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=900', serviceType: 'Self Drive Car', pickup: 'Goa', rating: '4.5 (93)', capacity: '4 Seater', directPrice: 1499 },
  { image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=900', serviceType: 'Premium SUV', pickup: 'Jaipur', rating: '4.8 (64)', capacity: '6 Seater', directPrice: 3299 },
];

const deals = [
  { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=900', title: 'Goa Special', discount: 'Up to 30% Off', category: 'On all beach stays', hours: '02 : 15 : 45' },
  { image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=80&w=900', title: 'Manali Madness', discount: 'Flat 25% Off', category: 'On packages', hours: '01 : 15 : 45' },
  { image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=900', title: 'Andaman Escape', discount: 'Up to 20% Off', category: 'On activities', hours: '03 : 15 : 45' },
  { image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=900', title: 'Kerala Retreat', discount: 'Flat 15% Off', category: 'On houseboats', hours: '02 : 15 : 45' },
];

export default function Home() {
  const { content, system } = usePublicSiteConfig();
  const announcement = typeof content.homepageAnnouncement === 'string' ? content.homepageAnnouncement : '';

  return (
    <main className="bg-slate-50">
      <section className="relative min-h-[640px] overflow-visible pb-24 pt-24 md:pb-28">
        <img src={heroImage} alt="Paragliding over a mountain valley" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-slate-900/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-50 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-2xl pb-10 pt-6 text-white md:pt-14">
            {system.maintenanceMode ? (
              <div className="mb-4 inline-flex max-w-xl rounded-2xl border border-amber-300/30 bg-amber-400/15 px-4 py-3 text-sm font-bold text-amber-50 backdrop-blur">
                Tripetrip is in maintenance mode. Core browsing is available while admin updates are in progress.
              </div>
            ) : null}
            {announcement ? (
              <div className="mb-4 inline-flex max-w-xl rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-sm font-bold text-emerald-50 backdrop-blur">
                {announcement}
              </div>
            ) : null}
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur">Direct Travel Revolution</p>
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
              Travel Direct.
              <span className="block text-emerald-300">Save More.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg font-bold leading-relaxed text-white/90">
              No middleman. Best prices. Exclusive offers only on Tripetrip.
            </p>
          </motion.div>
          <EnhancedSearchBar />
        </div>
      </section>

      <MarketplaceSection title="Curated Escapes" subtitle="Handpicked trips from trusted travel partners at exclusive direct-booking prices" icon="✨">
        {packages.map((item) => <PackageCard key={item.destination} {...item} />)}
      </MarketplaceSection>

      <MarketplaceSection title="Stay Beyond Hotels" subtitle="Discover villas, resorts, homestays and hostels from verified hosts" icon="🛏️">
        {properties.map((item) => <PropertyCard key={item.location} {...item} />)}
      </MarketplaceSection>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-emerald-100 bg-white/80 p-3 shadow-sm backdrop-blur md:grid-cols-5">
          {['Free WiFi', 'Breakfast', 'Free Cancellation', 'Pay at Property', 'Verified Hosts'].map((pill) => (
            <div key={pill} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-3 py-3 text-[11px] font-bold text-emerald-700">
              <BadgeCheck className="h-4 w-4" />
              {pill}
            </div>
          ))}
        </div>
      </div>

      <MarketplaceSection title="Thrill Zone" subtitle="Adventure experiences from verified local operators" icon="♻️">
        {activities.map((item) => <ActivityCard key={item.name} {...item} />)}
      </MarketplaceSection>

      <MarketplaceSection title="Ride & Roam" subtitle="Travel smarter with transport providers" icon="🚗">
        {transports.map((item) => <TransportCard key={item.serviceType} {...item} />)}
      </MarketplaceSection>

      <MarketplaceSection title="Limited-Time Direct Deals" subtitle="Grab the best offers before they expire" icon="🔥">
        {deals.map((item) => <DealCard key={item.title} {...item} />)}
      </MarketplaceSection>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-3 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm md:grid-cols-4">
          {[
            { icon: Tags, title: 'Lowest Prices', text: 'Best price guarantee' },
            { icon: Handshake, title: 'No Middlemen', text: 'Book directly & save more' },
            { icon: ShieldCheck, title: 'Verified Partners', text: 'Trusted & verified' },
            { icon: Sparkles, title: 'Exclusive Offers', text: 'Only on Tripetrip' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-2xl px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
                <p className="text-xs font-medium text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4">
        <div className="overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-emerald-50 p-8 shadow-sm md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">List Your Property or Service</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Reach thousands of travellers directly with lower commission pressure.</p>
            </div>
            <Link to="/register?role=vendor">
              <Button className="rounded-2xl bg-emerald-600 px-7 font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
