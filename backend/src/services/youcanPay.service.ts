import crypto from 'crypto';

interface CreateOrderParams {
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
}

interface CreateOrderResult {
  orderId: string;
  checkoutUrl: string;
}

/**
 * Service d'intégration YouCan Pay.
 */
export const youcanPayService = {
  /**
   * Crée une commande de paiement YouCan Pay et retourne l'URL de checkout.
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const baseUrl = process.env.YOUCAN_PAY_BASE_URL ?? 'https://pay.youcan.shop';
    const token = process.env.YOUCAN_PAY_TOKEN ?? '';

    const response = await fetch(`${baseUrl}/store/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100),
        currency: params.currency,
        order_id: params.orderId,
        customer_name: params.customerName,
        success_url: process.env.YOUCAN_PAY_SUCCESS_URL,
        failure_url: process.env.YOUCAN_PAY_FAILURE_URL,
      }),
    });

    if (!response.ok) {
      throw new Error(`YouCan Pay erreur : ${response.statusText}`);
    }

    const data = (await response.json()) as { id: string; checkout_url: string };
    return { orderId: data.id, checkoutUrl: data.checkout_url };
  },

  /**
   * Rembourse une commande YouCan Pay.
   */
  async refundOrder(orderId: string, amount: number): Promise<void> {
    const baseUrl = process.env.YOUCAN_PAY_BASE_URL ?? 'https://pay.youcan.shop';
    const token   = process.env.YOUCAN_PAY_TOKEN    ?? '';
    const res = await fetch(`${baseUrl}/store/orders/${orderId}/refund`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ amount: Math.round(amount * 100) }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`YouCan Pay refund error: ${text}`);
    }
  },

  /**
   * Vérifie la signature HMAC du webhook YouCan Pay.
   */
  verifyWebhook(payload: Record<string, unknown>, signature: string): boolean {
    const privateKey = process.env.YOUCAN_PAY_PRIVATE_KEY ?? '';
    const body = JSON.stringify(payload);
    const expected = crypto.createHmac('sha256', privateKey).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  },
};
