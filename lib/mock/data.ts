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
    },
    subtitle: {
      tr: "Dijital Pazarlama Müdürü",
      en: "Digital Marketing Manager",
    },
    description: {
      tr:
        "Marka büyümesi, performans pazarlaması ve içerik stratejisi üzerinde çalışıyorum.\n\n" +
        "Hedef kitle analizi, kampanya optimizasyonu ve ölçümleme ile sürdürülebilir sonuçlar üretiyorum.",
      en:
        "I focus on brand growth, performance marketing, and content strategy.\n\n" +
        "With audience insights, campaign optimization, and measurement, I deliver sustainable results.",
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
    },
    subtitle: {
      tr: "Apple Watch Ultra 3",
      en: "Apple Watch Ultra 3",
    },
    description: {
      tr:
        "Dayanıklılık ve performans için tasarlanmış akıllı saat. Gelişmiş sensörler ve güçlü pil ömrüyle uzun kullanım sağlar.\n\n" +
        "Spor, keşif ve günlük kullanım için ideal bir seçenek.",
      en:
        "A smart watch designed for durability and performance. Advanced sensors and strong battery life deliver long usage.\n\n" +
        "Ideal for sports, exploration, and everyday use.",
    },
    images: ["/demo/watch.png"],
    badgeLeft: "12",
    badgeRight: "9",
  },
];
