export async function createManualPaymentIntent(amount: number, bookingId?: string, purpose?: string) {
  try {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, bookingId, purpose }),
    });
    if (!response.ok) throw new Error('Unable to create manual payment intent');
    return await response.json();
  } catch (error) {
    console.error('Manual payment error:', error);
    throw error;
  }
}

export const createEscrowOrder = createManualPaymentIntent;

export function openRazorpayCheckout(orderId: string, amount: number) {
  console.log(`Manual barcode payment prepared for reference: ${orderId} (INR ${amount})`);
}
