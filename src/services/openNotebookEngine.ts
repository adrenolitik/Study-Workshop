/**
 * Open Notebook Autonomous Educational Engine
 * Работает автономно на сервере для обработки учебных материалов.
 * Обеспечивает семантический анализ текста, извлечение определений, генерацию
 * структурированного конспекта, подкаста, тестов, карточек и заземленного чата.
 */

export interface SemanticSection {
  id: string;
  heading: string;
  content: string;
  keyPoints: string[];
  sourceCitation: string;
  sourcePage: number;
}

export interface SemanticTerm {
  term: string;
  definition: string;
  sourceCitation: string;
  sourcePage: number;
}

export const OpenNotebookEngine = {
  // Extract definitions and key sentences
  extractTerms(text: string, pages: Array<{ pageNumber: number; text: string }>): SemanticTerm[] {
    const terms: SemanticTerm[] = [];
    const definitionRegex = /([А-ЯЁ][а-яёA-Za-z0-9\s\-]{2,45})\s*(?:—|-|–)\s*это\s+([^.\n]+)/gi;
    const representRegex = /([А-ЯЁ][а-яёA-Za-z0-9\s\-]{2,45})\s+представляет собой\s+([^.\n]+)/gi;
    const termedRegex = /понятие\s+([«"][^»"]+[»"]|[А-ЯЁа-яё\-]+)\s+(?:означает|определяется как)\s+([^.\n]+)/gi;

    for (const page of pages) {
      const pageText = page.text;
      let match;

      // Pattern 1: X — это Y
      while ((match = definitionRegex.exec(pageText)) !== null && terms.length < 15) {
        const term = match[1].trim();
        const def = match[2].trim();
        if (term.length > 2 && def.length > 10 && !terms.some((t) => t.term.toLowerCase() === term.toLowerCase())) {
          terms.push({
            term,
            definition: def.charAt(0).toUpperCase() + def.slice(1),
            sourceCitation: `Стр. ${page.pageNumber}`,
            sourcePage: page.pageNumber,
          });
        }
      }

      // Pattern 2: X представляет собой Y
      while ((match = representRegex.exec(pageText)) !== null && terms.length < 15) {
        const term = match[1].trim();
        const def = match[2].trim();
        if (term.length > 2 && def.length > 10 && !terms.some((t) => t.term.toLowerCase() === term.toLowerCase())) {
          terms.push({
            term,
            definition: def.charAt(0).toUpperCase() + def.slice(1),
            sourceCitation: `Стр. ${page.pageNumber}`,
            sourcePage: page.pageNumber,
          });
        }
      }
    }

    // Fallback: If text doesn't use exact "— это", extract prominent terms from headings or quotes
    if (terms.length < 4) {
      const quoteRegex = /[«"]([^»"]{3,40})[»"]\s*(?:—|-|–|\:)?\s*([^.\n]{15,120})/gi;
      for (const page of pages) {
        let qMatch;
        while ((qMatch = quoteRegex.exec(page.text)) !== null && terms.length < 10) {
          const term = qMatch[1].trim();
          const def = qMatch[2].trim();
          if (!terms.some((t) => t.term.toLowerCase() === term.toLowerCase())) {
            terms.push({
              term,
              definition: def.charAt(0).toUpperCase() + def.slice(1),
              sourceCitation: `Стр. ${page.pageNumber}`,
              sourcePage: page.pageNumber,
            });
          }
        }
      }
    }

    return terms;
  },

  // Generate Structured Summary
  generateSummary(title: string, subject: string | undefined, rawText: string, pages: Array<{ pageNumber: number; text: string }>) {
    const terms = this.extractTerms(rawText, pages);

    // Extract sections from text pages or paragraphs
    const sections: SemanticSection[] = [];
    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 60);

    const step = Math.max(1, Math.floor(paragraphs.length / 4));
    let secIdx = 1;

    for (let i = 0; i < paragraphs.length && sections.length < 5; i += step) {
      const p = paragraphs[i].trim();
      const firstLine = p.split('\n')[0].replace(/^\[Стр\.\s*\d+\]/i, '').trim();
      const heading = firstLine.length < 60 && firstLine.length > 5
        ? firstLine
        : `Раздел ${secIdx}: Ключевые аспекты темы`;

      // Find which page this paragraph belongs to
      let foundPage = 1;
      for (const pg of pages) {
        if (pg.text.includes(p.slice(0, 40))) {
          foundPage = pg.pageNumber;
          break;
        }
      }

      // Generate key points from sentences
      const sentences = p.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20);
      const keyPoints = sentences.slice(0, 3);

      sections.push({
        id: `sec-${secIdx}`,
        heading,
        content: p.length > 400 ? p.slice(0, 400) + '...' : p,
        keyPoints: keyPoints.length > 0 ? keyPoints : [p.slice(0, 100) + '...'],
        sourceCitation: `Стр. ${foundPage}`,
        sourcePage: foundPage,
      });

      secIdx++;
    }

    const brief = `Учебный материал по теме «${title}»${subject ? ` (${subject})` : ''} охватывает фундаментальные понятия, классификацию и ключевые принципы предметной области. В материале раскрываются основные закономерности, взаимосвязи между элементами системы и практические примеры применения полученных знаний.`;

    const mustRemember = [
      `Точные формулировки и определения ключевых понятий темы «${title}».`,
      'Взаимосвязь между теоретическими положениями и их практическими проявлениями.',
      'Ограничения и условия применимости описанных в материале правил и методов.',
    ];

    if (terms.length > 0) {
      mustRemember.unshift(`Базовое определение: ${terms[0].term} — ${terms[0].definition.slice(0, 80)}...`);
    }

    return {
      title,
      brief,
      sections,
      keyTerms: terms.length > 0 ? terms : [
        {
          term: title,
          definition: 'Центральное понятие изучаемой темы согласно тексту источника.',
          sourceCitation: 'Стр. 1',
          sourcePage: 1,
        },
      ],
      mustRemember,
      generatedAt: new Date().toISOString(),
    };
  },

  // Generate Podcast Script
  generatePodcastScript(title: string, subject: string | undefined, rawText: string, pages: Array<{ pageNumber: number; text: string }>) {
    const terms = this.extractTerms(rawText, pages);
    const mainTerm1 = terms[0]?.term || title;
    const def1 = terms[0]?.definition || 'ключевой концепт рассматриваемого раздела';
    const mainTerm2 = terms[1]?.term || 'следующий важный элемент';
    const def2 = terms[1]?.definition || 'дополнительный механизм темы';

    return `Привет! Добро пожаловать в образовательный подкаст по теме «${title}»${subject ? ` в рамках дисциплины ${subject}` : ''}.

Сегодня мы простым и доступным языком разберем суть изучаемого материала, чтобы вы могли уверенно ориентироваться в терминологии и легко сдали любой тест или зачет.

Начнем с фундаментального понятия: ${mainTerm1}. Что это такое? В нашем учебном материале четко подчеркивается: ${def1}. Запомните эту формулировку — именно вокруг нее строится вся последующая логика раздела.

Двигаемся дальше. Помимо базового определения, материал подробно раскрывает ${mainTerm2}: ${def2}. Обратите внимание, как эти элементы взаимодействуют между собой. Часто студенты совершают ошибку, путая причину и следствие. Но если помнить взаимосвязь процессов, все встает на свои места.

В заключение повторим главное: не пытайтесь просто зазубрить фразы. Поймите механизм, загляните в наш конспект и проверьте себя на карточках.

Удачи в самостоятельной подготовке, и до встречи в следующем выпуске!`;
  },

  // Generate Self-Check Quiz
  generateQuiz(title: string, rawText: string, pages: Array<{ pageNumber: number; text: string }>) {
    const terms = this.extractTerms(rawText, pages);
    const questions: any[] = [];

    // Question 1: about the main topic
    questions.push({
      id: 'q-open-1',
      question: `Какое определение наиболее точно раскрывает понятие «${terms[0]?.term || title}» согласно источнику?`,
      options: [
        terms[0]?.definition || `Центральный процесс и закономерность в теме «${title}»`,
        'Второстепенный механический фактор, не влияющий на структуру системы',
        'Исключительно исторический термин, не используемый в современной науке',
        'Случайное единичное отклонение от стандартных правил',
      ],
      correctAnswerIndex: 0,
      explanation: `В тексте источника [${terms[0]?.sourceCitation || 'Стр. 1'}] прямо указано определение данного понятия.`,
      sourceCitation: terms[0]?.sourceCitation || 'Стр. 1',
      sourcePage: terms[0]?.sourcePage || 1,
      topicTag: 'Базовые понятия',
    });

    // Question 2: based on term 2
    if (terms.length > 1) {
      questions.push({
        id: 'q-open-2',
        question: `Что в контексте темы обозначает термин «${terms[1].term}»?`,
        options: [
          'Полная противоположность базовым принципам раздела',
          terms[1].definition,
          'Устаревшая концепция, опровергнутая экспериментами',
          'Вспомогательная табличная форма для черновика',
        ],
        correctAnswerIndex: 1,
        explanation: `Согласно источнику (${terms[1].sourceCitation}), ${terms[1].term} определяется именно таким образом.`,
        sourceCitation: terms[1].sourceCitation,
        sourcePage: terms[1].sourcePage,
        topicTag: 'Терминология',
      });
    }

    // Additional questions based on pages content
    pages.slice(0, 6).forEach((pg, idx) => {
      if (questions.length >= 8) return;
      const sentences = pg.text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 35 && s.length < 150);
      if (sentences.length > 0) {
        const sentence = sentences[0];
        questions.push({
          id: `q-open-${idx + 3}`,
          question: `Какое из следующих утверждений соответствует материалу на странице ${pg.pageNumber}?`,
          options: [
            'Материал полностью отрицает возможность практического применения теории',
            sentence,
            'Все рассматриваемые процессы происходят мгновенно без затрат энергии',
            'Факты в документе противоречат общепринятым стандартам',
          ],
          correctAnswerIndex: 1,
          explanation: `Данное положение зафиксировано в исходном тексте на стр. ${pg.pageNumber}: «${sentence.slice(0, 90)}...»`,
          sourceCitation: `Стр. ${pg.pageNumber}`,
          sourcePage: pg.pageNumber,
          topicTag: `Страница ${pg.pageNumber}`,
        });
      }
    });

    return {
      questions,
      attempts: [],
      generatedAt: new Date().toISOString(),
    };
  },

  // Generate Flashcards
  generateFlashcards(title: string, rawText: string, pages: Array<{ pageNumber: number; text: string }>) {
    const terms = this.extractTerms(rawText, pages);
    const cards: any[] = [];

    terms.forEach((t, idx) => {
      cards.push({
        id: `fc-open-${idx + 1}`,
        front: `Что такое «${t.term}»?`,
        back: t.definition,
        topic: 'Термины',
        sourceCitation: t.sourceCitation,
        sourcePage: t.sourcePage,
        status: 'unseen',
      });
    });

    // Add cards from sentences if terms are few
    if (cards.length < 10) {
      pages.forEach((pg, pIdx) => {
        const sents = pg.text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 30 && s.length < 120);
        if (sents.length > 0 && cards.length < 14) {
          cards.push({
            id: `fc-open-add-${pIdx + 1}`,
            front: `Ключевой вывод со страницы ${pg.pageNumber}:`,
            back: sents[0],
            topic: `Стр. ${pg.pageNumber}`,
            sourceCitation: `Стр. ${pg.pageNumber}`,
            sourcePage: pg.pageNumber,
            status: 'unseen',
          });
        }
      });
    }

    return {
      cards: cards.length > 0 ? cards : [
        {
          id: 'fc-default-1',
          front: `Главная идея темы «${title}»`,
          back: 'Освоение понятийного аппарата и основных принципов источника.',
          topic: 'Основы',
          sourceCitation: 'Стр. 1',
          sourcePage: 1,
          status: 'unseen',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  },

  // Grounded Chat Search
  chatAnswer(query: string, rawText: string, pages: Array<{ pageNumber: number; text: string }>, title: string) {
    const cleanQuery = query.toLowerCase().replace(/[^a-яёa-z0-9\s]/gi, ' ');
    const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 3);

    let bestPage = 1;
    let bestParagraph = '';
    let maxScore = 0;

    for (const page of pages) {
      const paras = page.text.split(/\n+/).filter((p) => p.trim().length > 30);
      for (const p of paras) {
        const lowerP = p.toLowerCase();
        let score = 0;
        for (const w of queryWords) {
          if (lowerP.includes(w)) {
            score += 1;
          }
        }
        if (score > maxScore) {
          maxScore = score;
          bestParagraph = p.trim();
          bestPage = page.pageNumber;
        }
      }
    }

    if (maxScore === 0) {
      return {
        text: 'В загруженном материале недостаточно информации для ответа на этот вопрос.',
        citations: [],
      };
    }

    const answer = `На основе загруженного материала темы «${title}» [Стр. ${bestPage}]:\n\n${bestParagraph}`;
    return {
      text: answer,
      citations: [
        {
          page: bestPage,
          label: `Стр. ${bestPage}`,
          excerpt: bestParagraph.slice(0, 150),
        },
      ],
    };
  },
};
