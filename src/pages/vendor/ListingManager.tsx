import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentSession } from '@/src/services/auth';
import { createListing, getListingById, updateListing } from '@/src/services/listings';
import { getVendorByUserId } from '@/src/services/vendors';
import type { PriceUnit } from '@/src/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Home, 
  Mountain, 
  Car, 
  Map,
  Utensils,
  Clock,
  Users as UsersIcon,
  ShieldCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ListingManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Stays',
    base_price: 0,
    price_unit: 'per_night',
    max_capacity: 2,
    location: '',
    images: [] as string[],
    amenities: [] as string[],
    specifics: {} as any // Business specific tools data
  });

  useEffect(() => {
    if (isEdit) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    if (!id) return;
    try {
      const data = await getListingById(id);
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        base_price: data.base_price,
        price_unit: data.price_unit,
        max_capacity: data.max_capacity ?? 2,
        location: data.location,
        images: data.images,
        amenities: data.amenities,
        specifics: data.specifics || {},
      } as any);
    } catch (error) {
      console.error("Error fetching listing:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { user } = await getCurrentSession();
      if (!user) {
        toast.error('Please log in to manage listings');
        return;
      }

      const vendorProfile = await getVendorByUserId(user.id);
      if (!vendorProfile) {
        toast.error('Vendor profile not found');
        return;
      }

      const payload = {
        ...formData,
        vendor_id: vendorProfile.id,
        max_capacity: Number(formData.max_capacity),
        base_price: Number(formData.base_price),
        price_unit: formData.price_unit as PriceUnit,
        lat: null,
        lng: null,
        is_active: true,
      };

      if (isEdit && id) {
        await updateListing(id, payload);
      } else {
        await createListing(payload);
      }

      toast.success(isEdit ? 'Listing updated' : 'Listing created');
      navigate('/vendor');
    } catch (error: any) {
      toast.error('Failed to save listing: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Stays', icon: Home },
    { name: 'Adventure', icon: Mountain },
    { name: 'Transport', icon: Car },
    { name: 'Tours', icon: Map },
    { name: 'Food', icon: Utensils }
  ];

  const renderSpecificTools = () => {
    const category = formData.category === 'Hotels' ? 'Stays' : formData.category;
    switch (category) {
      case 'Stays':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Stay Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Property Type</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm"
                  value={formData.specifics.property_type || 'Hotel'}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, property_type: e.target.value}})}
                >
                  <option>Hotel</option>
                  <option>BnB / Homestay</option>
                  <option>Camping / Glamping</option>
                  <option>Hostel</option>
                  <option>Villa / Apartment</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Room/Tent Count</label>
                <Input 
                  type="number"
                  placeholder="Number of units" 
                  value={formData.specifics.units || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, units: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Check-in Time</label>
                <Input 
                  type="time"
                  value={formData.specifics.check_in || '14:00'}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, check_in: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Check-out Time</label>
                <Input 
                  type="time"
                  value={formData.specifics.check_out || '11:00'}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, check_out: e.target.value}})}
                />
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900 uppercase">Direct Booking Optimization Enabled</span>
               </div>
               <Badge className="bg-indigo-600">ACTIVE</Badge>
            </div>
          </div>
        );
      case 'Adventure':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Adventure Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Activity Level</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm"
                  value={formData.specifics.difficulty || 'Moderate'}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, difficulty: e.target.value}})}
                >
                  <option>Beginner</option>
                  <option>Moderate</option>
                  <option>Advanced</option>
                  <option>Professional</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Duration</label>
                <Input 
                  placeholder="e.g. 4 Hours or 2 Days" 
                  value={formData.specifics.duration || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, duration: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Min. Age Requirement</label>
                <Input 
                  type="number"
                  placeholder="e.g. 12" 
                  value={formData.specifics.min_age || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, min_age: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Gear Included</label>
                <Input 
                  placeholder="e.g. Helmet, Harness" 
                  value={formData.specifics.gear || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, gear: e.target.value}})}
                />
              </div>
            </div>
          </div>
        );
      case 'Transport':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Fleet Management Hub</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Vehicle Type</label>
                  <Input 
                    placeholder="e.g. Royal Enfield 350 or SUV" 
                    value={formData.specifics.vehicle_type || ''}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, vehicle_type: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Fuel Policy</label>
                  <select 
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm"
                    value={formData.specifics.fuel_policy || 'Full to Full'}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, fuel_policy: e.target.value}})}
                  >
                    <option>Full to Full</option>
                    <option>Included</option>
                    <option>Self-pay</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Transmission</label>
                  <select 
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm"
                    value={formData.specifics.transmission || 'Manual'}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, transmission: e.target.value}})}
                  >
                    <option>Manual</option>
                    <option>Automatic</option>
                    <option>Not Applicable</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">License Required</label>
                  <Input 
                    placeholder="e.g. Driving License Class A" 
                    value={formData.specifics.license_needed || ''}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, license_needed: e.target.value}})}
                  />
                </div>
             </div>
          </div>
        );
      case 'Tours':
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Experience & Tour Hosting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Language(s)</label>
                  <Input 
                    placeholder="e.g. English, Hindi, local dialect" 
                    value={formData.specifics.languages || ''}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, languages: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Max Group Size</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 10" 
                    value={formData.specifics.group_size || ''}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, group_size: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Starting Point</label>
                  <Input 
                    placeholder="Where do people meet?" 
                    value={formData.specifics.meeting_point || ''}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, meeting_point: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Inclusions</label>
                  <Input 
                    placeholder="e.g. Free water, local lunch" 
                    value={formData.specifics.inclusions || ''}
                    onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, inclusions: e.target.value}})}
                  />
                </div>
              </div>
            </div>
          );
      case 'Food':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Dining & Culinary Ops</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Cuisine Expertise</label>
                <Input 
                  placeholder="e.g. Traditional Pahari, Italian" 
                  value={formData.specifics.cuisine || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, cuisine: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Meal Options</label>
                <Input 
                  placeholder="e.g. Veg, Vegan, Gluten-free" 
                  value={formData.specifics.dietary || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, dietary: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Speciality Dish</label>
                <Input 
                  placeholder="e.g. Wood-fired Pizza" 
                  value={formData.specifics.speciality || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, speciality: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Capacity</label>
                <Input 
                  type="number"
                  placeholder="Max tables/seats" 
                  value={formData.specifics.capacity || ''}
                  onChange={(e) => setFormData({...formData, specifics: {...formData.specifics, capacity: e.target.value}})}
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Select a category to unlock specialized management tools</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/vendor')}
            className="rounded-full hover:bg-white text-slate-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">{isEdit ? 'Refine Listing' : 'Market Launch'}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {isEdit ? 'Updating your business presence' : 'Connecting your services directly to travelers'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/vendor')}
            className="border-slate-200 bg-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] h-10 px-8 rounded-xl shadow-lg shadow-indigo-100"
          >
            {loading ? 'Processing...' : (isEdit ? 'Apply Changes' : 'Initialize Listing')}
            {!loading && <Save className="ml-2 w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-slate-200 shadow-sm rounded-2xl space-y-8">
            {/* Category Selector */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Service Category</label>
              <div className="grid grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setFormData({...formData, category: cat.name})}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 group",
                      formData.category === cat.name 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
                    )}
                  >
                    <cat.icon className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Public Title</label>
                <Input 
                  placeholder="e.g. Riverside Sanctuary Retreat" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Detailed Description</label>
                <textarea 
                  rows={4}
                  placeholder="Tell travelers why they should choose you..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-xl font-medium text-sm focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>
            </div>

            {/* Dynamic Specifics */}
            <div className="pt-8 border-t border-slate-100">
               {renderSpecificTools()}
            </div>
          </Card>

          {/* Pricing & Logistics */}
          <Card className="p-8 border-slate-200 shadow-sm rounded-2xl space-y-8">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Base Listing Price ($)</label>
                   <Input 
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData({...formData, base_price: Number(e.target.value)})}
                      className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Price Model</label>
                   <select 
                      className="w-full h-12 px-4 bg-slate-50/50 border border-slate-100 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-600"
                      value={formData.price_unit}
                      onChange={(e) => setFormData({...formData, price_unit: e.target.value as any})}
                   >
                      <option value="per_night">Per Night</option>
                      <option value="per_person">Per Person</option>
                      <option value="per_day">Per Day</option>
                      <option value="fixed">Fixed Rate</option>
                   </select>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">GPS Location / Coordinates</label>
                <div className="flex gap-2">
                   <Input 
                      placeholder="Latitude, Longitude or Address" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="h-12 bg-slate-50/50 border-slate-100 rounded-xl flex-1"
                   />
                   <Button variant="outline" className="h-12 border-slate-100 bg-white rounded-xl px-4">
                      <Map className="w-4 h-4 text-indigo-600" />
                   </Button>
                </div>
             </div>
          </Card>
        </div>

        {/* Sidebar / Assets */}
        <div className="space-y-6">
           <Card className="p-6 border-slate-200 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Media Gallery</h4>
                 <Badge className="bg-slate-100 text-slate-400 border-none rounded-md px-2 py-0.5 text-[9px]">{formData.images.length}/6</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                 {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-slate-100 relative group overflow-hidden border border-slate-100">
                       <img src={img} className="w-full h-full object-cover" />
                       <button 
                        onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                          <X className="w-3 h-3" />
                       </button>
                    </div>
                 ))}
                 {formData.images.length < 6 && (
                    <button 
                      onClick={() => setFormData({...formData, images: [...formData.images, `https://picsum.photos/seed/${Math.random()}/800/600`]}) }
                      className="aspect-square rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                       <ImageIcon className="w-6 h-6" />
                       <span className="text-[9px] font-bold uppercase tracking-widest">Add Photo</span>
                    </button>
                 )}
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-bold uppercase tracking-widest text-emerald-600 leading-relaxed text-center">
                 HD Visuals increase direct booking conversion by 40%
              </div>
           </Card>

           <Card className="p-6 border-slate-200 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Direct Inclusions</h4>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                 {['Fast WiFi', 'Free Parking', 'Kitchen', 'Guide'].map(amenity => (
                    <button 
                       key={amenity}
                       onClick={() => {
                          const exists = formData.amenities.includes(amenity);
                          setFormData({
                             ...formData, 
                             amenities: exists 
                                ? formData.amenities.filter(a => a !== amenity) 
                                : [...formData.amenities, amenity]
                          })
                       }}
                       className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                          formData.amenities.includes(amenity)
                             ? "bg-indigo-600 border-indigo-600 text-white"
                             : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                       )}
                    >
                       {amenity}
                    </button>
                 ))}
              </div>
              <Button variant="outline" className="w-full border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest h-10 rounded-xl text-slate-400">
                 <Plus className="w-3.5 h-3.5 mr-2" />
                 Customize
              </Button>
           </Card>

           {isEdit && (
              <Button 
                variant="ghost" 
                className="w-full text-red-400 hover:text-red-500 hover:bg-red-50 font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl group"
              >
                 <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                 Archive Listing
              </Button>
           )}
        </div>
      </div>
    </div>
  );
}
