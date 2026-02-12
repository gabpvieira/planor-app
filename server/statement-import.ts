import type { Express } from "express";
import multer from "multer";
import OpenAI from "openai";
import { isAuthenticated, getUserId } from "./auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'text/csv',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, CSV ou imagem.'));
    }
  },
});

const SYSTEM_PROMPT = `Você é um assistente financeiro especializado em extratos bancários brasileiros.
Analise o texto do extrato bancário e extraia TODAS as transações encontradas.

REGRAS:
- Remova códigos bancários irrelevantes (DOC, TED, PIX códigos, números de referência)
- Mantenha apenas o nome comercial do estabelecimento ou descrição limpa
- Classifique cada transação em uma das categorias: alimentacao, transporte, moradia, saude, educacao, lazer, compras, servicos, assinaturas, investimentos, salario, freelance, outros
- Valores negativos ou débitos são "expense", valores positivos ou créditos são "income"
- Datas devem estar no formato YYYY-MM-DD
- Valores devem ser float (positivos sempre, o type indica se é entrada ou saída)

Responda APENAS com JSON válido no formato:
{
  "transactions": [
    {
      "date": "2026-02-10",
      "description": "Nome limpo do estabelecimento",
      "amount": 54.90,
      "category": "alimentacao",
      "type": "expense"
    }
  ]
}`;

export function registerStatementRoutes(app: Express) {
  app.post("/api/finance/import-statement", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your-openai-api-key') {
        return res.status(500).json({ message: "OPENAI_API_KEY não configurada no servidor" });
      }

      const openai = new OpenAI({ apiKey });
      let extractedText = '';

      // Extract text based on file type
      if (file.mimetype === 'application/pdf') {
        // Dynamic import for CommonJS module
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
      } else if (file.mimetype === 'text/csv' || file.mimetype === 'text/plain') {
        extractedText = file.buffer.toString('utf-8');
      } else if (file.mimetype.startsWith('image/')) {
        // For images, use GPT-4 Vision
        const base64Image = file.buffer.toString('base64');
        const imageResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: "Extraia todas as transações desta imagem de extrato bancário:" },
                { type: "image_url", image_url: { url: `data:${file.mimetype};base64,${base64Image}` } },
              ],
            },
          ],
          max_tokens: 4096,
          temperature: 0.1,
        });

        const content = imageResponse.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return res.status(422).json({ message: "Não foi possível extrair transações da imagem" });
        }
        return res.json(JSON.parse(jsonMatch[0]));
      }

      if (!extractedText.trim()) {
        return res.status(422).json({ message: "Não foi possível extrair texto do arquivo" });
      }

      // Send text to OpenAI for parsing
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extraia as transações deste extrato bancário:\n\n${extractedText.slice(0, 15000)}` },
        ],
        max_tokens: 4096,
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        return res.status(422).json({ message: "Nenhuma transação encontrada no extrato" });
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("[Statement Import] Error:", error);
      if (error.message?.includes('Tipo de arquivo')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Erro ao processar extrato: " + (error.message || 'Erro desconhecido') });
    }
  });
}
