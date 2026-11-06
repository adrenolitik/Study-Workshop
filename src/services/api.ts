import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
try {
  // Use unpkg or cdnjs worker or standard worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF worker configuration note:', e);
}

export interface ExtractedResult {
  charCount: number;
  pageCount: number;
  rawText: string;
  pages: Array<{ pageNumber: number; text: string }>;
  warnings: string[];
}

export const ApiService = {
  // Extract text from file or raw string
  async extractText(file?: File, pastedText?: string): Promise<ExtractedResult> {
    if (file) {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        return this.extractFromPdf(file);
      } else {
        // TXT or text-based file
        const text = await file.text();
        return this.processRawText(text, file.name);
      }
    }

    if (pastedText) {
      return this.processRawText(pastedText, 'Вставленный текст');
    }

    throw new Error('Файл или текст не предоставлены');
  },

  async extractFromPdf(file: File): Promise<ExtractedResult> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pages: Array<{ pageNumber: number; text: string }> = [];
    let fullText = '';
    const warnings: string[] = [];

    const numPages = Math.min(pdf.numPages, 50); // Up to 50 pages
    if (pdf.numPages > 50) {
      warnings.push(`Файл содержит ${pdf.numPages} страниц. Извлечены первые 50 страниц согласно установленному лимиту.`);
    }

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter((str: string) => str.trim().length > 0);
      
      const pageText = pageStrings.join(' ').replace(/\s+/g, ' ').trim();
      if (!pageText) {
        warnings.push(`Страница ${pageNum} не содержит извлекаемого текста (возможно, скан или графический элемент).`);
      }
      
      pages.push({
        pageNumber: pageNum,
        text: pageText,
      });

      fullText += `[Стр. ${pageNum}]\n${pageText}\n\n`;
    }

    const cleanRaw = fullText.trim();
    if (cleanRaw.length < 500) {
      warnings.push('Внимание: извлечено крайне мало текста. Убедитесь, что PDF содержит текстовый слой, а не отсканированные изображения.');
    }

    return {
      charCount: cleanRaw.length,
      pageCount: pages.length,
      rawText: cleanRaw,
      pages,
      warnings,
    };
  },

  async processRawText(text: string, fileName?: string): Promise<ExtractedResult> {
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fileName }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Ошибка обработки текста');
    }

    return await response.json();
  },

  // Generate complete study kit
  async generateAll(payload: {
    title: string;
    subject?: string;
    section?: string;
    rawText: string;
    pages: Array<{ pageNumber: number; text: string }>;
    engine?: 'auto' | 'open_notebook';
  }) {
    const response = await fetch('/api/generate/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Ошибка вызова генерации материалов');
    }

    return await response.json();
  },

  // Regenerate single component
  async regenerateComponent(payload: {
    component: 'summary' | 'podcast' | 'quiz' | 'flashcards';
    title: string;
    subject?: string;
    section?: string;
    rawText: string;
    pages?: Array<{ pageNumber: number; text: string }>;
    engine?: 'auto' | 'open_notebook';
  }) {
    const response = await fetch('/api/generate/component', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Не удалось пересоздать ${payload.component}`);
    }

    return await response.json();
  },

  // Generate TTS Audio via server Gemini TTS with Web Speech API audio synthesis fallback
  async generateAudio(scriptText: string): Promise<{ audioUrl?: string; durationSeconds: number; isWebSpeechFallback?: boolean }> {
    try {
      const response = await fetch('/api/generate/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioUrl) {
          return {
            audioUrl: data.audioUrl,
            durationSeconds: data.durationEstimateSeconds || Math.round(scriptText.length / 15),
            isWebSpeechFallback: false,
          };
        }
      }
    } catch (e) {
      console.warn('Server TTS unavailable, using browser speech fallback', e);
    }

    // Return indicator for Web Speech API playback (autonomous in-browser speech)
    return {
      durationSeconds: Math.round(scriptText.length / 15),
      isWebSpeechFallback: true,
    };
  },

  // Chat grounded in study kit
  async sendChatMessage(payload: {
    message: string;
    history: Array<{ sender: string; text: string }>;
    rawText: string;
    title: string;
    pages?: Array<{ pageNumber: number; text: string }>;
    engine?: 'auto' | 'open_notebook';
  }) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Ошибка чата');
    }

    return await response.json();
  },
};
