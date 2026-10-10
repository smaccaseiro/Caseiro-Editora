import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON bodies
  app.use(express.json());

  // Safe lazy-initialization helper for Stripe
  let stripeClient: Stripe | null = null;
  function getStripeClient(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is missing. Please configure it in your environment/Secrets panel.');
    }
    if (!stripeClient) {
      stripeClient = new Stripe(key, {
        apiVersion: '2025-01-27.acacia' as any, // use current stable api
      });
    }
    return stripeClient;
  }

  // --- API ROUTES ---

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', stripeConfigured: !!process.env.STRIPE_SECRET_KEY });
  });

  // Stripe Checkout Session Creation Endpoint
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { plan, email } = req.body;

      if (!plan || (plan !== 'monthly' && plan !== 'annual')) {
        return res.status(400).json({ error: 'Plano inválido selecionado. Escolha "monthly" ou "annual".' });
      }

      // Check if Stripe is configured and valid
      const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
      if (!stripeSecret) {
        return res.status(400).json({ 
          error: 'Stripe não está configurado.',
          code: 'STRIPE_NOT_CONFIGURED',
          message: 'Por favor, adicione a sua STRIPE_SECRET_KEY no painel de segredos (Secrets) para ativar pagamentos reais.'
        });
      }

      if (!stripeSecret.startsWith('sk_') && !stripeSecret.startsWith('rk_')) {
        return res.status(400).json({
          error: 'Chave API do Stripe inválida.',
          code: 'STRIPE_INVALID_KEY',
          message: `A chave inserida (${stripeSecret.substring(0, 6)}...) não é uma Chave Secreta (Secret Key) válida do Stripe. As Chaves Secretas devem começar por 'sk_test_...' (teste) ou 'sk_live_...' (produção). Por favor, corrija no painel de Segredos.`
        });
      }

      const stripe = getStripeClient();

      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = req.get('host');
      const origin = req.headers.origin || (host ? `${protocol}://${host}` : process.env.APP_URL || 'http://localhost:3000');
      
      const planName = plan === 'annual' ? 'Caseiro Editora - Plano Anual Premium' : 'Caseiro Editora - Plano Mensal Premium';
      const planDescription = plan === 'annual' 
        ? 'Acesso anual ilimitado à totalidade do catálogo de e-books em 6 idiomas.' 
        : 'Acesso mensal ilimitado à totalidade do catálogo de e-books em 6 idiomas.';
      const amountInCents = plan === 'annual' ? 5999 : 699;
      const interval = plan === 'annual' ? 'year' : 'month';

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email || undefined,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: planName,
                description: planDescription,
                images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300'],
              },
              unit_amount: amountInCents,
              recurring: {
                interval: interval,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/?payment=success&plan=${plan}`,
        cancel_url: `${origin}/?payment=cancel`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Erro ao criar sessão de checkout Stripe:', err);
      if (err.type === 'StripeAuthenticationError' || err.name === 'StripeAuthenticationError' || err.message?.includes('Invalid API Key')) {
        return res.status(400).json({
          error: 'Autenticação no Stripe falhou.',
          code: 'STRIPE_INVALID_KEY',
          message: 'A chave API fornecida para o Stripe é inválida. Certifique-se de que a STRIPE_SECRET_KEY começa por "sk_test_..." ou "sk_live_..." no painel de Segredos.'
        });
      }
      res.status(500).json({ 
        error: 'Erro interno ao processar o pagamento.',
        message: err.message 
      });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for all non-API paths (SPA routing)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Caseiro Editora rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Falha catastrófica ao iniciar o servidor:', err);
});
