import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';
import { initialBooks } from './src/data/initialBooks';

// Load environment variables
dotenv.config();

// Ensure persistent directories exist
const dataDir = path.join(process.cwd(), 'data');
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const booksFilePath = path.join(dataDir, 'books.json');
const DUMMY_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

function loadServerBooks(): any[] {
  try {
    if (fs.existsSync(booksFilePath)) {
      const data = fs.readFileSync(booksFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Strip legacy dummy books if present
        const cleaned = parsed.filter((b: any) => !DUMMY_IDS.has(String(b.id)));
        if (cleaned.length !== parsed.length) {
          saveServerBooks(cleaned);
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Erro ao ler books.json:', err);
  }
  // Initialize with initialBooks without dummy books
  try {
    const cleanedInitial = initialBooks.filter((b) => !DUMMY_IDS.has(String(b.id)));
    fs.writeFileSync(booksFilePath, JSON.stringify(cleanedInitial, null, 2), 'utf-8');
    return cleanedInitial;
  } catch (err) {
    console.error('Erro ao inicializar books.json:', err);
  }
  return initialBooks.filter((b) => !DUMMY_IDS.has(String(b.id)));
}

function saveServerBooks(books: any[]) {
  try {
    const sanitized = books.filter((b: any) => !DUMMY_IDS.has(String(b.id)));
    fs.writeFileSync(booksFilePath, JSON.stringify(sanitized, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao gravar books.json:', err);
  }
}

// Helper to save a data URL (base64) to the uploads folder and return its public URL
function saveBase64File(dataUrl: string, prefix: string, originalName?: string): string {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return dataUrl;
    }
    const matches = dataUrl.match(/^data:([A-Za-z-+\/0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return dataUrl;
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'bin';
    if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('epub')) ext = 'epub';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';

    const safeName = originalName
      ? originalName.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      : `file_${Date.now()}.${ext}`;

    const fileName = `${prefix}_${Date.now()}_${safeName.endsWith('.' + ext) ? safeName : safeName + '.' + ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Erro ao gravar ficheiro no disco:', err);
    return dataUrl;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware for parsing JSON bodies with large limits for file uploads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Serve persistent uploads folder statically
  app.use('/uploads', express.static(uploadsDir));

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
      const amountInCents = plan === 'annual' ? 2999 : 399;
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

  // --- BOOKS & FILES PERSISTENT API ROUTES ---

  // Get all books
  app.get('/api/books', (req, res) => {
    try {
      const books = loadServerBooks();
      res.json(books);
    } catch (err: any) {
      console.error('Erro ao listar livros:', err);
      res.status(500).json({ error: 'Erro ao listar livros', message: err.message });
    }
  });

  // Add new book
  app.post('/api/books', (req, res) => {
    try {
      const newBook = req.body;
      if (!newBook || !newBook.title) {
        return res.status(400).json({ error: 'Dados do livro inválidos' });
      }

      const bookId = newBook.id || String(Date.now());
      newBook.id = bookId;

      // Persist cover image if base64 data URL
      if (newBook.coverUrl && newBook.coverUrl.startsWith('data:')) {
        newBook.coverUrl = saveBase64File(newBook.coverUrl, `cover_${bookId}`);
      }

      // Persist PDF if base64 data URL
      if (newBook.pdfData && newBook.pdfData.startsWith('data:')) {
        const savedPdfUrl = saveBase64File(newBook.pdfData, `pdf_${bookId}`, newBook.pdfName || 'documento.pdf');
        newBook.pdfUrl = savedPdfUrl;
      }

      // Persist EPUB if base64 data URL
      if (newBook.epubData && newBook.epubData.startsWith('data:')) {
        const savedEpubUrl = saveBase64File(newBook.epubData, `epub_${bookId}`, newBook.epubName || 'livro.epub');
        newBook.epubUrl = savedEpubUrl;
      }

      const currentBooks = loadServerBooks();
      const updatedBooks = [newBook, ...currentBooks.filter((b: any) => b.id !== bookId)];
      saveServerBooks(updatedBooks);

      res.status(201).json(newBook);
    } catch (err: any) {
      console.error('Erro ao guardar livro no servidor:', err);
      res.status(500).json({ error: 'Erro ao guardar livro no servidor', message: err.message });
    }
  });

  // Update existing book
  app.put('/api/books/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      const currentBooks = loadServerBooks();
      const index = currentBooks.findIndex((b: any) => b.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }

      // Persist updated cover image if base64 data URL
      if (updatedData.coverUrl && updatedData.coverUrl.startsWith('data:')) {
        updatedData.coverUrl = saveBase64File(updatedData.coverUrl, `cover_${id}`);
      }

      // Persist updated PDF if base64 data URL
      if (updatedData.pdfData && updatedData.pdfData.startsWith('data:')) {
        const savedPdfUrl = saveBase64File(updatedData.pdfData, `pdf_${id}`, updatedData.pdfName || 'documento.pdf');
        updatedData.pdfUrl = savedPdfUrl;
      }

      // Persist updated EPUB if base64 data URL
      if (updatedData.epubData && updatedData.epubData.startsWith('data:')) {
        const savedEpubUrl = saveBase64File(updatedData.epubData, `epub_${id}`, updatedData.epubName || 'livro.epub');
        updatedData.epubUrl = savedEpubUrl;
      }

      currentBooks[index] = { ...currentBooks[index], ...updatedData };
      saveServerBooks(currentBooks);

      res.json(currentBooks[index]);
    } catch (err: any) {
      console.error('Erro ao atualizar livro no servidor:', err);
      res.status(500).json({ error: 'Erro ao atualizar livro no servidor', message: err.message });
    }
  });

  // Clear all books endpoint
  app.delete('/api/books/clear-all', (req, res) => {
    try {
      const currentBooks = loadServerBooks();
      for (const book of currentBooks) {
        if (book.pdfUrl && book.pdfUrl.startsWith('/uploads/')) {
          try { fs.unlinkSync(path.join(process.cwd(), book.pdfUrl.replace(/^\//, ''))); } catch {}
        }
        if (book.epubUrl && book.epubUrl.startsWith('/uploads/')) {
          try { fs.unlinkSync(path.join(process.cwd(), book.epubUrl.replace(/^\//, ''))); } catch {}
        }
        if (book.coverUrl && book.coverUrl.startsWith('/uploads/')) {
          try { fs.unlinkSync(path.join(process.cwd(), book.coverUrl.replace(/^\//, ''))); } catch {}
        }
      }
      saveServerBooks([]);
      res.json({ success: true, count: 0 });
    } catch (err: any) {
      console.error('Erro ao limpar catálogo no servidor:', err);
      res.status(500).json({ error: 'Erro ao limpar catálogo', message: err.message });
    }
  });

  // Delete book
  app.delete('/api/books/:id', (req, res) => {
    try {
      const { id } = req.params;
      const currentBooks = loadServerBooks();
      const bookToDelete = currentBooks.find((b: any) => b.id === id);

      // Clean up uploaded physical files if applicable
      if (bookToDelete) {
        if (bookToDelete.pdfUrl && bookToDelete.pdfUrl.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), bookToDelete.pdfUrl.replace(/^\//, ''));
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch { /* ignore */ }
          }
        }
        if (bookToDelete.epubUrl && bookToDelete.epubUrl.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), bookToDelete.epubUrl.replace(/^\//, ''));
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch { /* ignore */ }
          }
        }
        if (bookToDelete.coverUrl && bookToDelete.coverUrl.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), bookToDelete.coverUrl.replace(/^\//, ''));
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch { /* ignore */ }
          }
        }
      }

      const filtered = currentBooks.filter((b: any) => b.id !== id);
      saveServerBooks(filtered);
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Erro ao remover livro no servidor:', err);
      res.status(500).json({ error: 'Erro ao remover livro no servidor', message: err.message });
    }
  });

  // Direct file upload endpoint
  app.post('/api/upload', (req, res) => {
    try {
      const { fileName, fileData, prefix = 'upload' } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: 'Nenhum ficheiro fornecido' });
      }
      const publicUrl = saveBase64File(fileData, prefix, fileName);
      res.json({ url: publicUrl, fileName });
    } catch (err: any) {
      console.error('Erro ao processar upload:', err);
      res.status(500).json({ error: 'Erro ao processar upload', message: err.message });
    }
  });

  // Download book file endpoint
  app.get('/api/download/:bookId/:format', (req, res) => {
    try {
      const { bookId, format } = req.params;
      const books = loadServerBooks();
      const book = books.find((b: any) => b.id === bookId);
      if (!book) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }

      const isEpub = format === 'epub';
      const fileUrl = isEpub ? book.epubUrl : book.pdfUrl;
      const fileName = isEpub 
        ? (book.epubName || `${book.title}.epub`) 
        : (book.pdfName || `${book.title}.pdf`);

      if (fileUrl && fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          return res.download(filePath, fileName);
        }
      }

      // If file is stored in memory as base64
      const fileData = isEpub ? book.epubData : book.pdfData;
      if (fileData && fileData.startsWith('data:')) {
        const matches = fileData.match(/^data:([A-Za-z-+\/0-9]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
          res.setHeader('Content-Type', matches[1] || 'application/octet-stream');
          return res.send(buffer);
        }
      }

      res.status(404).json({ error: 'Ficheiro não encontrado para este livro' });
    } catch (err: any) {
      console.error('Erro ao efetuar download:', err);
      res.status(500).json({ error: 'Erro no download', message: err.message });
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
