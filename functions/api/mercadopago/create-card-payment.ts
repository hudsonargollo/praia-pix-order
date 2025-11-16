// Cloudflare Pages Function to create Mercado Pago card payment
// This processes credit card payments using tokenized card data

// Cloudflare Pages Function types
type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
}) => Response | Promise<Response>;

interface Env {
  VITE_MERCADOPAGO_ACCESS_TOKEN: string;
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Request interface
interface CardPaymentRequest {
  orderId: string;
  token: string;
  amount: number;
  paymentMethodId: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

// Response interface
interface CardPaymentResponse {
  success: boolean;
  paymentId?: string;
  status: 'approved' | 'rejected' | 'in_process';
  statusDetail?: string;
  error?: string;
}

// MercadoPago status detail to user-friendly message mapping
const STATUS_DETAIL_MESSAGES: Record<string, string> = {
  'cc_rejected_insufficient_amount': 'Fundos insuficientes',
  'cc_rejected_bad_filled_card_number': 'Número de cartão inválido',
  'cc_rejected_bad_filled_date': 'Data de validade inválida',
  'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
  'cc_rejected_call_for_authorize': 'Entre em contato com seu banco',
  'cc_rejected_card_disabled': 'Cartão desabilitado',
  'cc_rejected_duplicated_payment': 'Pagamento duplicado',
  'cc_rejected_high_risk': 'Pagamento recusado por segurança',
  'cc_rejected_max_attempts': 'Número máximo de tentativas excedido',
  'cc_rejected_other_reason': 'Pagamento recusado pelo banco',
  'accredited': 'Pagamento aprovado',
  'pending_contingency': 'Pagamento em análise',
  'pending_review_manual': 'Pagamento em revisão manual',
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

// HTTP status codes that should trigger a retry
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Check if error is retryable
 */
function isRetryableError(statusCode: number): boolean {
  return RETRYABLE_STATUS_CODES.includes(statusCode);
}

/**
 * Comprehensive error logger
 */
function logError(context: string, error: any, additionalData?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    context,
    error: {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
    },
    ...additionalData,
  };
  
  console.error(`[${timestamp}] ${context}:`, JSON.stringify(errorLog, null, 2));
}

/**
 * Make HTTP request with exponential backoff retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  context: string
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      logError(`${context} - Attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}`, 
        { info: 'Making request' }, 
        { url, method: options.method }
      );
      
      const response = await fetch(url, options);
      
      // If response is successful or non-retryable error, return it
      if (response.ok || !isRetryableError(response.status)) {
        if (!response.ok) {
          logError(`${context} - Non-retryable error`, 
            { info: `Status ${response.status}` },
            { url, status: response.status }
          );
        }
        return response;
      }
      
      // Log retryable error
      logError(`${context} - Retryable error`, 
        { info: `Status ${response.status}, will retry` },
        { url, status: response.status, attempt: attempt + 1 }
      );
      
      // If this was the last attempt, return the response
      if (attempt === RETRY_CONFIG.maxRetries) {
        logError(`${context} - Max retries reached`, 
          { info: 'Returning last response' },
          { url, status: response.status }
        );
        return response;
      }
      
      // Calculate delay and wait before retry
      const delay = calculateBackoffDelay(attempt);
      console.log(`Retrying after ${delay}ms...`);
      await sleep(delay);
      
    } catch (error) {
      lastError = error as Error;
      logError(`${context} - Network error`, error, { 
        url, 
        attempt: attempt + 1,
        willRetry: attempt < RETRY_CONFIG.maxRetries 
      });
      
      // If this was the last attempt, throw the error
      if (attempt === RETRY_CONFIG.maxRetries) {
        throw error;
      }
      
      // Calculate delay and wait before retry
      const delay = calculateBackoffDelay(attempt);
      console.log(`Retrying after ${delay}ms due to network error...`);
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Validate request data
 */
function validateRequest(data: any): { valid: boolean; error?: string } {
  if (!data.orderId || typeof data.orderId !== 'string') {
    return { valid: false, error: 'Order ID é obrigatório' };
  }

  if (!data.token || typeof data.token !== 'string') {
    return { valid: false, error: 'Token do cartão é obrigatório' };
  }

  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    return { valid: false, error: 'Valor inválido' };
  }

  if (!data.paymentMethodId || typeof data.paymentMethodId !== 'string') {
    return { valid: false, error: 'Método de pagamento é obrigatório' };
  }

  if (!data.payer || typeof data.payer !== 'object') {
    return { valid: false, error: 'Dados do pagador são obrigatórios' };
  }

  if (!data.payer.email || typeof data.payer.email !== 'string') {
    return { valid: false, error: 'Email do pagador é obrigatório' };
  }

  if (!data.payer.identification || typeof data.payer.identification !== 'object') {
    return { valid: false, error: 'Identificação do pagador é obrigatória' };
  }

  if (!data.payer.identification.type || !data.payer.identification.number) {
    return { valid: false, error: 'Tipo e número de documento são obrigatórios' };
  }

  return { valid: true };
}

/**
 * Get user-friendly error message from status detail
 */
function getUserFriendlyMessage(statusDetail: string): string {
  return STATUS_DETAIL_MESSAGES[statusDetail] || 'Erro ao processar pagamento';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse request body
    const requestData = await context.request.json();

    // Validate request
    const validation = validateRequest(requestData);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.error
      } as CardPaymentResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { orderId, token, amount, paymentMethodId, payer } = requestData as CardPaymentRequest;

    // Get MercadoPago access token
    const accessToken = context.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuração de pagamento não disponível'
      } as CardPaymentResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }



    // Prepare payment payload for MercadoPago API
    const paymentPayload = {
      transaction_amount: amount,
      token: token,
      description: `Pedido #${orderId}`,
      installments: 1, // No installments - single payment only
      payment_method_id: paymentMethodId,
      payer: {
        email: payer.email,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number
        }
      },
      metadata: {
        order_id: orderId
      },
      external_reference: orderId,
      notification_url: `https://${context.request.headers.get('host')}/api/mercadopago/webhook`
    };

    // Make request to MercadoPago API with retry logic
    let response: Response;
    try {
      response = await fetchWithRetry(
        'https://api.mercadopago.com/v1/payments',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `card-${orderId}-${Date.now()}`
          },
          body: JSON.stringify(paymentPayload)
        },
        'MercadoPago Payment API'
      );
    } catch (error) {
      logError('MercadoPago API request failed after retries', error, {
        orderId,
        amount,
        paymentMethodId
      });
      
      return new Response(JSON.stringify({
        success: false,
        status: 'rejected',
        error: 'Erro de conexão ao processar pagamento. Tente novamente.'
      } as CardPaymentResponse), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError('MercadoPago API returned error', 
        { info: `Status ${response.status}` },
        { 
          orderId, 
          status: response.status,
          errorData,
          paymentMethodId 
        }
      );
      
      // Provide specific error messages based on status code
      let errorMessage = 'Erro ao processar pagamento com cartão';
      if (response.status === 400) {
        errorMessage = 'Dados do cartão inválidos. Verifique as informações.';
      } else if (response.status === 401) {
        errorMessage = 'Erro de autenticação. Entre em contato com o suporte.';
      } else if (response.status === 429) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      } else if (response.status >= 500) {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
      }
      
      return new Response(JSON.stringify({
        success: false,
        status: 'rejected',
        error: errorMessage
      } as CardPaymentResponse), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payment = await response.json();

    // Map MercadoPago status to our response
    const status = payment.status as 'approved' | 'rejected' | 'in_process';
    const statusDetail = payment.status_detail || '';

    // Update order in database
    const supabaseUrl = context.env.VITE_SUPABASE_URL;
    const serviceRoleKey = context.env.SUPABASE_SERVICE_KEY;

    let orderStatus = 'pending_payment';
    let paymentConfirmedAt: string | null = null;

    if (status === 'approved') {
      orderStatus = 'paid';
      paymentConfirmedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      orderStatus = 'cancelled';
    }

    // Update order status with retry logic
    try {
      const updateResponse = await fetchWithRetry(
        `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: orderStatus,
            payment_confirmed_at: paymentConfirmedAt,
            mercadopago_payment_id: String(payment.id)
          })
        },
        'Supabase Order Update'
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        logError('Failed to update order in database', 
          { info: error },
          { 
            orderId, 
            orderStatus,
            paymentId: payment.id,
            status: updateResponse.status 
          }
        );
        // Don't fail the payment response if DB update fails
        // The webhook will handle it as a fallback
      }
    } catch (error) {
      logError('Database update failed after retries', error, {
        orderId,
        orderStatus,
        paymentId: payment.id
      });
      // Continue - webhook will handle the update as fallback
    }

    // Return response to frontend
    const responseData: CardPaymentResponse = {
      success: status === 'approved',
      paymentId: String(payment.id),
      status: status,
      statusDetail: getUserFriendlyMessage(statusDetail)
    };

    if (status === 'rejected') {
      responseData.error = getUserFriendlyMessage(statusDetail);
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('Unexpected error in create-card-payment function', error, {
      orderId: (error as any)?.orderId,
      requestUrl: context.request.url,
      method: context.request.method
    });
    
    // Provide user-friendly error message
    let errorMessage = 'Erro inesperado ao processar pagamento';
    
    // Check for specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
    } else if (error instanceof SyntaxError) {
      errorMessage = 'Erro ao processar resposta do servidor. Tente novamente.';
    }
    
    return new Response(JSON.stringify({
      success: false,
      status: 'rejected',
      error: errorMessage
    } as CardPaymentResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
