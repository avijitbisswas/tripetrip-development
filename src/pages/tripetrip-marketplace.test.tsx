import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import StaySearch from '@/src/pages/stays/Search';
import PackageSearch from '@/src/pages/Search';
import StayListingDetail from '@/src/pages/stays/ListingDetail';
import StayBookingConfirmation from '@/src/pages/stays/BookingConfirmation';
import Activities from '@/src/pages/Activities';
import Transport from '@/src/pages/Transport';
import ListingDetail from '@/src/pages/ListingDetail';
import BookingConfirmation from '@/src/pages/BookingConfirmation';
import Deals from '@/src/pages/Deals';
import DealsConfirmation from '@/src/pages/deals/Confirmation';
import AdminDeals from '@/src/pages/admin/Deals';
import ProviderDeals from '@/src/pages/provider/Deals';

function renderWithRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/stays" element={<StaySearch />} />
        <Route path="/packages" element={<PackageSearch />} />
        <Route path="/stays/booking-confirmed" element={<StayBookingConfirmation />} />
        <Route path="/stays/:id" element={<StayListingDetail />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/transport/:id" element={<Transport />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/deals/:dealId" element={<Deals />} />
        <Route path="/deals/confirmation" element={<DealsConfirmation />} />
        <Route path="/admin/deals" element={<AdminDeals />} />
        <Route path="/provider/deals" element={<ProviderDeals />} />
        <Route path="/booking-confirmed" element={<BookingConfirmation />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Tripetrip premium marketplace screens', () => {
  it('renders the stay listing hero, filters, trust badges, and property cards', () => {
    renderWithRoutes('/stays');

    expect(screen.getByRole('heading', { name: /Stay Beyond Hotels/i })).toBeInTheDocument();
    expect(screen.getByText(/Verified Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/Best Direct Prices/i)).toBeInTheDocument();
    expect(screen.getByText(/Search by Property Name/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Luxury Beach Villa/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /The Lake Resort/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Book Direct & Save/i).length).toBeGreaterThan(3);
  });

  it('filters stay listings from the q search parameter', () => {
    renderWithRoutes('/stays?q=Goa');

    expect(screen.getByDisplayValue('Goa')).toBeInTheDocument();
    expect(screen.getByText(/1 Stay Found/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Luxury Beach Villa/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /The Lake Resort/i })).not.toBeInTheDocument();
  });

  it('renders an Airbnb-inspired property detail page with a sticky booking widget', () => {
    renderWithRoutes('/stays/luxury-beach-villa');

    expect(screen.getByRole('heading', { name: /Luxury Beach Villa/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Verified Property/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/Save ₹2,500/i).length).toBeGreaterThan(1);
    expect(screen.getByRole('heading', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Book Now/i }).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/John D'Souza/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Similar Properties/i })).toBeInTheDocument();
  });

  it('renders the booking confirmation success actions', () => {
    renderWithRoutes('/stays/booking-confirmed');

    expect(screen.getByRole('heading', { name: /Booking Confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/TRP78451236/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Voucher/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chat With Host/i })).toBeInTheDocument();
  });

  it('renders the Thrill Zone adventure listing marketplace', () => {
    renderWithRoutes('/activities');

    expect(screen.getByRole('heading', { name: /Thrill Zone/i })).toBeInTheDocument();
    expect(screen.getByText(/Adventure experiences from verified local operators/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Verified Operators/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Paragliding in Bir Billing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Scuba Diving Andaman/i })).toBeInTheDocument();
  });

  it('filters activity listings from the q search parameter', () => {
    renderWithRoutes('/activities?q=Andaman');

    expect(screen.getByDisplayValue('Andaman')).toBeInTheDocument();
    expect(screen.getByText(/1 adventure found/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Scuba Diving Andaman/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Paragliding in Bir Billing/i })).not.toBeInTheDocument();
  });

  it('filters package listings from the q search parameter', () => {
    renderWithRoutes('/packages?q=Kerala');

    expect(screen.getAllByText('Kerala').length).toBeGreaterThan(0);
    expect(screen.getByText(/1 Package Found/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Kerala Backwaters/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Goa Beach Escape/i })).not.toBeInTheDocument();
  });

  it('renders the Thrill Zone adventure detail page', () => {
    renderWithRoutes('/listing/paragliding-bir-billing');

    expect(screen.getByRole('heading', { name: /Paragliding in Bir Billing/i })).toBeInTheDocument();
    expect(screen.getByText(/Safety Certified/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining Slots/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Book Now/i }).length).toBeGreaterThan(1);
    expect(screen.getByRole('heading', { name: /^Safety$/i })).toBeInTheDocument();
  });

  it('renders the Thrill Zone adventure booking confirmation pass', () => {
    renderWithRoutes('/booking-confirmed');

    expect(screen.getByRole('heading', { name: /Booking Confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/Adventure Pass/i)).toBeInTheDocument();
    expect(screen.getByText(/THR12345678/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Ticket/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add To Calendar/i })).toBeInTheDocument();
  });

  it('renders the Ride & Roam transport marketplace screens', () => {
    renderWithRoutes('/transport');

    expect(screen.getByTestId('transport-listing-screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Ride & Roam/i })).toBeInTheDocument();
    expect(screen.getByText(/Travel smarter with trusted transport providers/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Drivers/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Toyota Innova Crysta/i })).toHaveAttribute('href', '/transport/toyota-innova-crysta');
    expect(screen.getByRole('heading', { name: /Mercedes E-Class/i })).toBeInTheDocument();
    expect(screen.queryByTestId('transport-detail-screen')).not.toBeInTheDocument();
  });

  it('prefills transport pickup from the q search parameter', () => {
    renderWithRoutes('/transport?q=Delhi');

    expect(screen.getByDisplayValue('Delhi')).toBeInTheDocument();
  });

  it('opens a Ride & Roam vehicle detail screen from the transport listing flow', () => {
    renderWithRoutes('/transport/toyota-innova-crysta');

    expect(screen.getByTestId('transport-detail-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('transport-listing-screen')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Toyota Innova Crysta/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Vehicle Overview/i })).toBeInTheDocument();
    expect(screen.getByText(/360-degree preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book Now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contact Provider/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Customer Reviews/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Similar Vehicles/i })).toBeInTheDocument();
  });

  it('renders limited-time direct deals on the deals page', () => {
    renderWithRoutes('/deals');

    expect(screen.getByRole('heading', { name: /Book Exclusive Offers Before They Disappear/i })).toBeInTheDocument();
    expect(screen.getByText(/Book exclusive offers before they disappear/i)).toBeInTheDocument();
    expect(screen.getByText(/50\+ Deals Live/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Deals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Festival Offers/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Goa Beach Escape/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Book Now Goa Beach Escape/i })).toHaveAttribute('href', '/deals/goa-beach-escape');
    expect(screen.getByText(/Direct Booking Advantages/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Explore Curated Escapes/i })).not.toBeInTheDocument();
  });

  it('renders a deal detail page with urgency and booking controls', () => {
    renderWithRoutes('/deals/goa-beach-escape');

    expect(screen.getByRole('heading', { name: /Goa Beach Escape/i })).toBeInTheDocument();
    expect(screen.getByText(/Deals > Goa Beach Escape/i)).toBeInTheDocument();
    expect(screen.getByText(/Only 3 Left/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Book Now$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reserve This Deal/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Similar Deals/i })).toBeInTheDocument();
  });

  it('creates a manual-payment deal booking from the detail page', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            booking: {
              id: 'TRIPLIVE123',
              dealTitle: 'Goa Beach Escape',
              travelDate: '2026-06-24',
              participants: 2,
              amount: 9999,
              status: 'awaiting_payment_approval',
              voucherStatus: 'locked',
              voucherCode: 'VCH-TRIPLIVE123',
            },
            payment: {
              id: 'manual_live_1',
              bookingId: 'TRIPLIVE123',
              reference: 'TRIPLIVE123-9999',
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            booking: {
              id: 'TRIPLIVE123',
              dealTitle: 'Goa Beach Escape',
              travelDate: '2026-06-24',
              participants: 2,
              amount: 9999,
              status: 'awaiting_payment_approval',
              voucherStatus: 'locked',
              voucherCode: 'VCH-TRIPLIVE123',
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );

    try {
      renderWithRoutes('/deals/goa-beach-escape');

      await userEvent.click(screen.getByRole('button', { name: /^Book Now$/i }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith('/api/deals/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: 'goa-beach-escape',
            dealTitle: 'Goa Beach Escape',
            amount: 9999,
            travelerName: 'Guest Traveler',
            travelDate: '2026-06-24',
            participants: 2,
          }),
        }),
      );
      expect((await screen.findAllByText(/TRIPLIVE123/i)).length).toBeGreaterThan(0);
      expect(screen.getByText(/Awaiting Admin Approval/i)).toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('shows a sold-out message when deal inventory cannot be reserved', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Deal is sold out' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    try {
      renderWithRoutes('/deals/goa-beach-escape');

      await userEvent.click(screen.getByRole('button', { name: /^Book Now$/i }));

      expect(await screen.findByText(/Deal is sold out/i)).toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('renders the deal confirmation success page', () => {
    renderWithRoutes('/deals/confirmation');

    expect(screen.getByRole('heading', { name: /Deal Locked/i })).toBeInTheDocument();
    expect(screen.getAllByText(/TRIP67845291/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Manual Barcode Payment/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Awaiting Admin Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan this barcode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Voucher/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add To Calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share Trip/i })).toBeInTheDocument();
  });

  it('loads live deal booking confirmation state from the backend', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          booking: {
            id: 'TRIPLIVE123',
            dealTitle: 'Kerala Houseboat',
            travelDate: '2026-06-24',
            participants: 4,
            amount: 18999,
            status: 'confirmed',
            voucherStatus: 'released',
            voucherCode: 'VCH-TRIPLIVE123',
          },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );

    try {
      renderWithRoutes('/deals/confirmation?bookingId=TRIPLIVE123');

      expect((await screen.findAllByText(/TRIPLIVE123/i)).length).toBeGreaterThan(0);
      expect(screen.getByText(/Kerala Houseboat/i)).toBeInTheDocument();
      expect(screen.getByText(/Voucher Released/i)).toBeInTheDocument();
      expect(screen.getAllByText(/VCH-TRIPLIVE123/i).length).toBeGreaterThan(0);
      expect(fetchMock).toHaveBeenCalledWith('/api/deals/bookings/TRIPLIVE123');
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('renders admin deal management controls', () => {
    renderWithRoutes('/admin/deals');

    expect(screen.getByRole('heading', { name: /Deal Command Center/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Deal/i })).toBeInTheDocument();
    expect(screen.getByText(/Conversion Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual Payment Approvals/i)).toBeInTheDocument();
    expect(screen.getAllByText(/TRIP67845291/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Approve Payment TRIP67845291/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject Payment TRIP67845291/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Feature Deal/i }).length).toBeGreaterThan(0);
  });

  it('loads live manual payment approvals and posts admin approval actions', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            payments: [
              {
                id: 'manual_live_1',
                bookingId: 'TRIPLIVE123',
                travelerName: 'Live Traveler',
                purpose: 'Kerala Houseboat',
                reference: 'TRIPLIVE123-8999',
                amount: 8999,
                status: 'awaiting_admin_approval',
                adminApprovalStatus: 'pending',
              },
            ],
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'manual_live_1',
            bookingId: 'TRIPLIVE123',
            status: 'approved',
            adminApprovalStatus: 'approved',
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );

    try {
      renderWithRoutes('/admin/deals');

      expect(await screen.findByText(/Live Traveler/i)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /Approve Payment TRIPLIVE123/i }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/payments/manual_live_1/approve', { method: 'POST' }),
      );
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('renders provider deal campaign controls', () => {
    renderWithRoutes('/provider/deals');

    expect(screen.getByRole('heading', { name: /Provider Flash Sales/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Offer/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Set Inventory/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Track Conversions/i).length).toBeGreaterThan(0);
  });
});
