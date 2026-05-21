import type { Lang } from "@/lib/gtg/config";
import type { CareCategory } from "@/lib/gtg/models";

export type CareCategoryIconName =
  | "baby"
  | "house"
  | "users"
  | "heartPulse"
  | "gamepad2"
  | "sparkles"
  | "graduationCap"
  | "notebookPen"
  | "bookOpen"
  | "stethoscope"
  | "dog"
  | "trees"
  | "carFront"
  | "userRound"
  | "briefcaseMedical";

export type CareCategoryDefinition = {
  id: number;
  slug: string;
  iconName: CareCategoryIconName;
  surfaceClassName: string;
  fallbackTitleTr: string;
  fallbackTitleEn: string;
  fallbackDetailTr: string;
  fallbackDetailEn: string;
};

export const CARE_CATEGORY_DEFINITIONS: CareCategoryDefinition[] = [
  {
    id: 1,
    slug: "bebek-cocuk-bakicisi",
    iconName: "baby",
    surfaceClassName: "from-[#fff2e3] via-white to-[#fff7ef]",
    fallbackTitleTr: "Bebek Bakıcısı",
    fallbackTitleEn: "Baby Caregiver",
    fallbackDetailTr: "Yeni doğan, gündüzlü ya da rutin destek arayanlar için sıcak bir başlangıç alanı.",
    fallbackDetailEn: "A warm starting point for people looking for newborn, daytime, or routine baby support.",
  },
  {
    id: 2,
    slug: "ev-yardimcisi",
    iconName: "house",
    surfaceClassName: "from-[#eef6ff] via-white to-[#f7fbff]",
    fallbackTitleTr: "Ev Yardımcısı",
    fallbackTitleEn: "House Helper",
    fallbackDetailTr: "Ev düzenini, günlük işleri ve yaşam temposunu destekleyen yardımcı profiller için.",
    fallbackDetailEn: "For support profiles that help with home organization, daily tasks, and household rhythm.",
  },
  {
    id: 3,
    slug: "yasli-bakicisi",
    iconName: "users",
    surfaceClassName: "from-[#edfced] via-white to-[#f6fff6]",
    fallbackTitleTr: "Yaşlı Bakımı",
    fallbackTitleEn: "Elder Care",
    fallbackDetailTr: "Daha sakin, açıklayıcı ve güven veren bir eşleşme diliyle yaşlı bakım talepleri için.",
    fallbackDetailEn: "For elder care needs with a calmer, more explanatory, and trust-oriented matching tone.",
  },
  {
    id: 4,
    slug: "refakatci-ve-hasta-bakicisi",
    iconName: "heartPulse",
    surfaceClassName: "from-[#fff0f0] via-white to-[#fff8f8]",
    fallbackTitleTr: "Hasta Desteği",
    fallbackTitleEn: "Patient Support",
    fallbackDetailTr: "Hassas ihtiyaçlarda daha anlaşılır süreç adımları ve net görev beklentileri öne çıkar.",
    fallbackDetailEn: "For sensitive needs, the flow prioritizes clearer process steps and more explicit expectations.",
  },
  {
    id: 5,
    slug: "oyun-ablasi",
    iconName: "gamepad2",
    surfaceClassName: "from-[#f2efff] via-white to-[#faf8ff]",
    fallbackTitleTr: "Oyun Ablası",
    fallbackTitleEn: "Play Companion",
    fallbackDetailTr: "Çocuklarla kaliteli zaman, gelişim odaklı eşlik ve güvenli günlük ritim arayanlar için.",
    fallbackDetailEn: "For people seeking quality time, developmental companionship, and a safe daily rhythm for children.",
  },
  {
    id: 6,
    slug: "temizlikci",
    iconName: "sparkles",
    surfaceClassName: "from-[#fff7e8] via-white to-[#fffdf7]",
    fallbackTitleTr: "Temizlik",
    fallbackTitleEn: "Cleaning Support",
    fallbackDetailTr: "Günlük, yarım günlük ya da düzenli ev desteği için daha hızlı karar veren kart yapısı.",
    fallbackDetailEn: "A faster-scanning card structure for daily, half-day, or regular home cleaning support.",
  },
  {
    id: 7,
    slug: "golge-ogretmen",
    iconName: "graduationCap",
    surfaceClassName: "from-[#eff7ff] via-white to-[#f8fbff]",
    fallbackTitleTr: "Gölge Öğretmen",
    fallbackTitleEn: "Shadow Teacher",
    fallbackDetailTr: "Öğrenciye birebir eşlik ve yönlendirme gerektiren destekler için.",
    fallbackDetailEn: "For one-to-one educational guidance and in-class support.",
  },
  {
    id: 8,
    slug: "ev-odevlerine-yardimci",
    iconName: "notebookPen",
    surfaceClassName: "from-[#fff7f0] via-white to-[#fffdfa]",
    fallbackTitleTr: "Ev Ödevlerine Yardımcı",
    fallbackTitleEn: "Homework Helper",
    fallbackDetailTr: "Okul sonrası akademik eşlik ve ödev desteği için.",
    fallbackDetailEn: "For after-school support with homework and study routines.",
  },
  {
    id: 9,
    slug: "ozel-ders-ogretmeni",
    iconName: "bookOpen",
    surfaceClassName: "from-[#f4f7ff] via-white to-[#fbfcff]",
    fallbackTitleTr: "Özel Ders Öğretmeni",
    fallbackTitleEn: "Private Tutor",
    fallbackDetailTr: "Birebir ders ve akademik gelişim desteği arayanlar için.",
    fallbackDetailEn: "For one-to-one tutoring and academic development support.",
  },
  {
    id: 10,
    slug: "hemsire",
    iconName: "stethoscope",
    surfaceClassName: "from-[#eefaf7] via-white to-[#fbfffe]",
    fallbackTitleTr: "Hemşire",
    fallbackTitleEn: "Nurse",
    fallbackDetailTr: "Profesyonel sağlık ve bakım deneyimi gerektiren durumlara uygun.",
    fallbackDetailEn: "Suitable for situations that require professional care and health experience.",
  },
  {
    id: 11,
    slug: "kopek-bakim-dog-walker",
    iconName: "dog",
    surfaceClassName: "from-[#fff5ec] via-white to-[#fffdf9]",
    fallbackTitleTr: "Köpek Bakım (Köpek Gezdirme)",
    fallbackTitleEn: "Dog Care (Dog Walker)",
    fallbackDetailTr: "Evcil hayvan gezdirme ve günlük köpek bakım ihtiyaçları için.",
    fallbackDetailEn: "For dog walking and everyday pet care routines.",
  },
  {
    id: 12,
    slug: "bahcivan",
    iconName: "trees",
    surfaceClassName: "from-[#eef9ef] via-white to-[#fafffb]",
    fallbackTitleTr: "Bahçıvan",
    fallbackTitleEn: "Gardener",
    fallbackDetailTr: "Bahçe düzeni, bakım ve dış alan desteği arayanlar için.",
    fallbackDetailEn: "For garden upkeep, maintenance, and outdoor support needs.",
  },
  {
    id: 13,
    slug: "ozel-sofor",
    iconName: "carFront",
    surfaceClassName: "from-[#f3f5ff] via-white to-[#fbfbff]",
    fallbackTitleTr: "Özel Şoför",
    fallbackTitleEn: "Private Driver",
    fallbackDetailTr: "Güvenli ulaşım ve düzenli sürüş desteği gereken durumlarda.",
    fallbackDetailEn: "For safe transport and regular driving support needs.",
  },
  {
    id: 14,
    slug: "oyun-abisi",
    iconName: "userRound",
    surfaceClassName: "from-[#fff2f7] via-white to-[#fffafe]",
    fallbackTitleTr: "Oyun Abisi",
    fallbackTitleEn: "Play Brother",
    fallbackDetailTr: "Çocuklarla hareketli, güvenli ve eğitici eşlik arayanlar için.",
    fallbackDetailEn: "For people seeking active, safe, and engaging companionship for children.",
  },
  {
    id: 15,
    slug: "fizyoterapist",
    iconName: "briefcaseMedical",
    surfaceClassName: "from-[#f1f8ff] via-white to-[#fafcff]",
    fallbackTitleTr: "Fizyoterapist",
    fallbackTitleEn: "Physiotherapist",
    fallbackDetailTr: "Fiziksel destek ve terapi odaklı bakım ihtiyaçları için.",
    fallbackDetailEn: "For care needs focused on physical support and therapy.",
  },
];

const careCategoryDefinitionMap = new Map(CARE_CATEGORY_DEFINITIONS.map((definition) => [definition.id, definition]));

export function getCareCategoryDefinition(id: number): CareCategoryDefinition | undefined {
  return careCategoryDefinitionMap.get(id);
}

export function getFallbackCareCategories(lang: Lang): CareCategory[] {
  const isTr = lang === "tr";

  return CARE_CATEGORY_DEFINITIONS.map((definition) => ({
    id: definition.id,
    slug: definition.slug,
    title: isTr ? definition.fallbackTitleTr : definition.fallbackTitleEn,
    detail: isTr ? definition.fallbackDetailTr : definition.fallbackDetailEn,
  }));
}
