export async function createRazorpayOrder(amount: number, bookingId?: string, purpose?: string, travelerName?: string) {
  try {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, bookingId, purpose, travelerName }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Unable to create payment order');
    return payload;
  } catch (error) {
    console.error('Payment order error:', error);
    throw error;
  }
}

export async function verifyRazorpayPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return await response.json();
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

export const createManualPaymentIntent = createRazorpayOrder;
export const createEscrowOrder = createManualPaymentIntent;

export function openRazorpayCheckout(orderId: string, amount: number) {
  console.log(`Razorpay checkout prepared for order: ${orderId} (INR ${amount})`);
}
