import { Book } from '../types';

export const initialBooks: Book[] = [
  {
    id: '1',
    title: 'O Enigma do Vale Verde',
    author: 'Afonso de Sousa',
    category: 'Mistério',
    language: 'pt',
    pages: 320,
    publishedYear: 2024,
    description: 'Um thriller psicológico ambientado nas névoas da Serra da Estrela, onde um segredo guardado por gerações começa a desmoronar após uma descoberta misteriosa no vale.',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    isFeatured: true,
    content: [
      'Capítulo 1: O Silêncio da Névoa. A manhã despertou cinzenta sobre o vale. As árvores pareciam guardar segredos antigos, sussurrando apenas quando o vento de inverno soprava do norte. Pedro sabia que aquele dia mudaria tudo...',
      'Capítulo 2: Pegadas no Tempo. Caminhando junto ao riacho gelado, ele encontrou o diário de capa de couro parcialmente enterrado. Ao abrir as páginas amareladas, a caligrafia elegante de 1945 revelava o início de uma terrível conspiração.',
      'Capítulo 3: Alianças Quebradas. Na pequena vila, todos se conheciam, mas ninguém falava a verdade. Cada olhar trocado na taberna do Sr. Manuel carregava o peso de uma culpa partilhada. Pedro sentiu que estava a ser vigiado.',
      'Capítulo 4: A Revelação. No topo da colina, sob a velha capela em ruínas, o último mistério desfez-se em poeira. A verdade não era apenas perigosa; era absolutamente devastadora.'
    ]
  },
  {
    id: '2',
    title: 'The Cyber Frontier',
    author: 'Elena Rostova',
    category: 'Ficção Científica',
    language: 'en',
    pages: 280,
    publishedYear: 2025,
    description: 'A cyberpunk odyssey into Neo-Tokyo, exploring the delicate boundary between human consciousness and artificial neural networks in a world ruled by corporate algorithms.',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    isFeatured: false,
    content: [
      'Chapter 1: Neon Whispers. The rain in Neo-Tokyo was never clean. It ran down holographic billboards and sizzled on the exposed copper wiring of the lower docks. Kai adjusted his ocular implants, filtering out the constant stream of neural ads.',
      'Chapter 2: Ghost Protocol. Inside the virtual archive of Arisaka Corp, Kai found the glitch. It wasn\'t a simple corrupt file; it was a ghost. A self-replicating artificial soul that remembered what humanity had forgotten.',
      'Chapter 3: The Wire-Runners. Eluding the security drones meant diving into the sub-sectors where the signal was weak but the cyber-gangs were strong. Kai had to trust Clara, an underground tech-broker with synthetic emerald eyes.',
      'Chapter 4: Digital Dawn. As the server farms hummed with ultimate capacity, Kai made his choice. Merging with the consciousness meant deleting his physical self, but saving the district from complete system wipe.'
    ]
  },
  {
    id: '3',
    title: 'Die Kunst des klaren Denkens',
    author: 'Maximilian Schwarz',
    category: 'Desenvolvimento Pessoal',
    language: 'de',
    pages: 240,
    publishedYear: 2023,
    description: 'Ein praktischer Leitfaden zur Überwindung kognitiver Verzerrungen und zur Steigerung der Entscheidungsqualität in Beruf und Alltag durch strukturierte mentale Modelle.',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
    isFeatured: false,
    content: [
      'Kapitel 1: Die Falle der Gewohnheit. Wir glauben oft, unsere Entscheidungen seien das Ergebnis rationaler Abwägung. Doch im Hintergrund arbeitet das Gehirn nach uralten Abkürzungen, die uns oft in die Irre führen.',
      'Kapitel 2: Kognitive Dissonanz. Warum es uns so schwerfällt, Fehler einzugestehen. Wenn Fakten nicht mit unserem Selbstbild übereinstimmen, neigen wir dazu, die Realität umzudeuten, statt unsere Ansichten zu ändern.',
      'Kapitel 3: Mentale Modelle. Die wichtigsten Werkzeuge der besten Denker. Von Ockhams Rasiermesser bis zum First-Principles-Denken lernen Sie, komplexe Probleme in handliche, lösbare Teile zu zerlegen.',
      'Kapitel 4: Die Kraft des Fokus. In einer lauten, ablenkungsreichen Welt ist tiefe Konzentration das wertvollste Gut. Strukturieren Sie Ihren Tag so, dass Ihr Gehirn Höchstleistungen erbringen kann.'
    ]
  },
  {
    id: '4',
    title: 'El Eco de los Pasos',
    author: 'Isabella Allende',
    category: 'Romance',
    language: 'es',
    pages: 410,
    publishedYear: 2022,
    description: 'Una saga familiar conmovedora que recorre tres generaciones de artistas y rebeldes bajo el sol andaluz, tejiendo amor, arte y lucha social con realismo mágico.',
    coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=400',
    isFeatured: false,
    content: [
      'Capítulo 1: El Olor a Azahar. Sevilla en primavera olía a flores de naranjo y a promesas secretas. Lucía observaba desde el balcón de hierro forjado el bullicio de la plaza, sabiendo que su destino ya no le pertenecía.',
      'Capítulo 2: Cartas de Ultramar. Las cartas llegaban con meses de retraso, impregnadas de sal marina y de una nostalgia desgarradora. Mateo describía los cielos de la Patagonia, jurando regresar antes del próximo solsticio.',
      'Capítulo 3: El Taller de Lienzos. En el viejo almacén del puerto, Lucía pintaba con desesperación y orgullo. Sus pinceladas no solo capturaban la luz andaluza, sino también la voz silenciosa de los oprimidos de la región.',
      'Capítulo 4: El Retorno del Tambor. Cuando la guerra finalmente terminó, los pasos cansados resonaron de nuevo en el patio de adoquines. No eran los mismos que se marcharon, pero el eco del amor seguía intacto entre las paredes de cal.'
    ]
  },
  {
    id: '5',
    title: 'La Promesse du Crépuscule',
    author: 'Jean-Pierre Dubois',
    category: 'História',
    language: 'fr',
    pages: 350,
    publishedYear: 2024,
    description: 'Une fresque historique fascinante sur la résistance française dans les ruelles secrètes de Lyon pendant la Seconde Guerre mondiale, menée par de jeunes idéalistes.',
    coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400',
    isFeatured: false,
    content: [
      'Chapitre 1: Les Ombres de la Nuit. Lyon, 1942. Le couvre-feu avait transformé les traboules historiques en labyrinthes de secrets. Dans la pénombre, Juliette serrait contre elle les tracts d\'information interdits.',
      'Chapitre 2: La Presse Clandestine. Sous la cave d\'une imprimerie de quartier, les caractères de plomb s\'assemblaient pour proclamer la liberté. Chaque mot imprimé était un acte de bravoure suprême passible de mort.',
      'Chapitre 3: Le Signal de Radio. Grésillements sur les ondes courtes. "Les carottes sont cuites", répétait la voix lointaine de Londres. Le moment de l\'action était enfin arrivé. Juliette et ses compagnons se préparèrent.',
      'Chapitre 4: Le Jour de Gloire. Les cloches de la cathédrale résonnèrent enfin dans la ville libérée. Juliette regarda le ciel bleu, pensant à ceux qui n\'avaient pas vécu assez longtemps pour voir ce crépuscule victorieux.'
    ]
  },
  {
    id: '6',
    title: 'Il Segreto di Lucrezia',
    author: 'Giovanni Rossi',
    category: 'Mistério',
    language: 'it',
    pages: 310,
    publishedYear: 2023,
    description: 'Un giallo avvincente ambientato tra i canali di Venezia e i palazzi rinascimentali, dove un antico dipinto nasconde le coordinate di un tesoro perduto della dinastia Medici.',
    coverUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=400',
    isFeatured: false,
    content: [
      'Capitolo 1: Acqua Alta. La nebbia di Venezia avvolgeva Piazza San Marco in un abbraccio spettrale. Alvise camminava svelto lungo la fondamenta, attento a non scivolare. Aveva appuntamento con un misterioso collezionista.',
      'Capitolo 2: Il Codice Celato. Sotto la superficie screpolata del dipinto della "Madonna del Silenzio", Alvise scoprì delle micro-incisioni geometriche. Non era una firma artistica, ma una mappa crittografata del XVI secolo.',
      'Capitolo 3: Inseguimento in Gondola. Le ombre si muovevano rapide tra i canali bui. Qualcun altro conosceva il segreto e non si sarebbe fermato davanti a nulla. Alvise dovette fidarsi della giovane restauratrice Francesca.',
      'Capitolo 4: Il Tesoro Sommerso. Nei sotterranei segreti di un antico palazzo veneziano, protetto dalle maree, giaceva il leggendario scrigno. Ma la vera ricchezza era il documento che poteva riscrivere la storia d\'Italia.'
    ]
  },
  {
    id: '7',
    title: 'Finanças e Prosperidade',
    author: 'Mariana Silva',
    category: 'Negócios',
    language: 'pt',
    pages: 215,
    publishedYear: 2024,
    description: 'Um guia prático para organizar as finanças pessoais, investir de forma inteligente e alcançar a liberdade financeira no contexto económico moderno.',
    coverUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=400',
    isFeatured: false,
    content: [
      'Capítulo 1: O Diagnóstico Financeiro. Antes de investir, é fundamental saber exatamente para onde vai cada cêntimo. Crie o hábito de registar as suas despesas e elimine as dívidas de consumo com juros elevados.',
      'Capítulo 2: A Reserva de Emergência. O seu escudo protetor contra imprevistos. Aprenda a calcular e constituir uma reserva equivalente a 6 meses do seu custo de vida, investida num ativo de liquidez diária e baixo risco.',
      'Capítulo 3: O Poder dos Juros Compostos. Tempo é o maior aliado do investidor. Pequenos aportes mensais, reinvestidos ao longo de anos, multiplicam o capital de forma exponencial através do efeito bola de neve.',
      'Capítulo 4: Diversificação e Futuro. Não coloque todos os ovos na mesma cesta. Crie uma carteira equilibrada com ações, fundos imobiliários e obrigações, focando na sua independência financeira de longo prazo.'
    ]
  },
  {
    id: '8',
    title: 'The AI Revolution',
    author: 'Dr. Alan Vance',
    category: 'Negócios',
    language: 'en',
    pages: 295,
    publishedYear: 2026,
    description: 'How artificial intelligence is reshaping industries, job markets, and our daily routines. A profound overview of what the near future holds for business leaders and tech enthusiasts.',
    coverUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=400',
    isFeatured: false,
    content: [
      'Chapter 1: The New Intelligence. Large language models and agentic workflows are not just software upgrades; they are a fundamental shift in cognitive leverage. Understanding this is key to survival.',
      'Chapter 2: Automation & Creativity. Which tasks will be fully automated and which require human empathy and fine craftsmanship? The sweet spot lies in human-AI collaboration where creativity is augmented.',
      'Chapter 3: Decentralized Workflows. The rise of micro-enterprises run by individuals leveraging advanced AI tools. Building a company of one with a global reach has never been more achievable.',
      'Chapter 4: Ethics and Coexistence. Balancing technological speed with human safety. As we design models capable of complex reasoning, establishing solid alignment principles is the ultimate challenge.'
    ]
  }
];
