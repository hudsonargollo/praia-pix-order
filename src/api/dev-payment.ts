// Development-only payment endpoint
// This runs locally via Vite's proxy
export async function POST(request: Request) {
  try {
    const paymentData = await request.json();
    
    // Mock payment response for local development
    const mockResponse = {
      id: `dev_${Date.now()}`,
      status: 'pending',
      qrCode: `00020126580014br.gov.bcb.pix0136dev_${Date.now()}520400005303986540${paymentData.amount.toFixed(2)}5802BR5913COCOLOKO6009SAO PAULO62070503***6304`,
      qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      pixCopyPaste: `00020126580014br.gov.bcb.pix0136dev_${Date.now()}520400005303986540${paymentData.amount.toFixed(2)}5802BR5913COCOLOKO6009SAO PAULO62070503***6304`,
      expirationDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      transactionAmount: paymentData.amount,
      _isDev: true
    };

    return new Response(JSON.stringify(mockResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Payment creation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
