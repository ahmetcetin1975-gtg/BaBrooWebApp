import type { LocalizedString } from "@/lib/i18n/localize";

export type CardItem = {
  id: string;
  title: LocalizedString;
  subtitle: LocalizedString;
  description: LocalizedString;
  images: string[];
  badgeLeft?: string;
  badgeRight?: string;
};

export const mockServices: CardItem[] = [
  {
    id: "s1",
    title: {
      tr: "Sıla Akyol",
      en: "Sila Akyol",
      ru: "Сыла Акйол",
      es: "Sila Akyol",
      fr: "Sila Akyol",
    },
    subtitle: {
      tr: "Dijital Pazarlama Müdürü",
      en: "Digital Marketing Manager",
      ru: "Менеджер по цифровому маркетингу",
      es: "Responsable de marketing digital",
      fr: "Responsable marketing digital",
    },
    description: {
      tr:
        "Marka büyümesi, performans pazarlaması ve içerik stratejisi üzerinde çalışıyorum.\n\n" +
        "Hedef kitle analizi, kampanya optimizasyonu ve ölçümleme ile sürdürülebilir sonuçlar üretiyorum.",
      en:
        "I focus on brand growth, performance marketing, and content strategy.\n\n" +
        "With audience insights, campaign optimization, and measurement, I deliver sustainable results.",
      ru:
        "Я занимаюсь ростом бренда, performance-маркетингом и контент-стратегией.\n\n" +
        "С помощью анализа аудитории, оптимизации кампаний и измерения результатов я добиваюсь устойчивых результатов.",
      es:
        "Me centro en el crecimiento de marca, el marketing de rendimiento y la estrategia de contenidos.\n\n" +
        "Con análisis de audiencia, optimización de campañas y medición, logro resultados sostenibles.",
      fr:
        "Je travaille sur la croissance de marque, le marketing à la performance et la stratégie de contenu.\n\n" +
        "Grâce à l'analyse d'audience, l'optimisation des campagnes et la mesure, j'obtiens des résultats durables.",
    },
    images: ["/demo/person.jpg"],
    badgeLeft: "12",
    badgeRight: "9",
  },
];

export const mockProducts: CardItem[] = [
  {
    id: "p1",
    title: {
      tr: "Apple",
      en: "Apple",
      ru: "Apple",
      es: "Apple",
      fr: "Apple",
    },
    subtitle: {
      tr: "Apple Watch Ultra 3",
      en: "Apple Watch Ultra 3",
      ru: "Apple Watch Ultra 3",
      es: "Apple Watch Ultra 3",
      fr: "Apple Watch Ultra 3",
    },
    description: {
      tr:
        "Dayanıklılık ve performans için tasarlanmış akıllı saat. Gelişmiş sensörler ve güçlü pil ömrüyle uzun kullanım sağlar.\n\n" +
        "Spor, keşif ve günlük kullanım için ideal bir seçenek.",
      en:
        "A smart watch designed for durability and performance. Advanced sensors and strong battery life deliver long usage.\n\n" +
        "Ideal for sports, exploration, and everyday use.",
      ru:
        "Умные часы, созданные для надежности и высокой производительности. Продвинутые датчики и мощная батарея обеспечивают длительное использование.\n\n" +
        "Отличный вариант для спорта, путешествий и повседневного использования.",
      es:
        "Un reloj inteligente diseñado para resistencia y rendimiento. Sus sensores avanzados y su batería potente ofrecen un uso prolongado.\n\n" +
        "Una opción ideal para deporte, exploración y uso diario.",
      fr:
        "Une montre connectée conçue pour la résistance et la performance. Ses capteurs avancés et sa batterie puissante assurent une longue utilisation.\n\n" +
        "Un choix idéal pour le sport, l'exploration et l'usage quotidien.",
    },
    images: ["/demo/watch.png"],
    badgeLeft: "12",
    badgeRight: "9",
  },
];
