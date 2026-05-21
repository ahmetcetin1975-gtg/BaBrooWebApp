import Link from "next/link";
import { ArrowRight, CheckCircle2, Flower2, ShieldCheck } from "lucide-react";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { getCareCategoryDefinition } from "@/lib/gtg/care-categories";
import { getCareCategoryIcon } from "@/lib/gtg/care-category-icons";
import type { Lang } from "@/lib/gtg/config";
import type { CareCategory } from "@/lib/gtg/models";

type PageCopy = {
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  categoryCountLabel: string;
  selectedTitle: string;
  selectedDescription: string;
  listTitle: string;
  processTitle: string;
  processSteps: string[];
  supportTitle: string;
  supportText: string;
  helperPoints: string[];
  activeLabel: string;
  focusLabel: string;
  imageAltSuffix: string;
};

const PAGE_COPY: Record<Lang, PageCopy> = {
  tr: {
    badge: "Bakım Kategorileri",
    title: "Kime ihtiyacınız var?",
    description:
      "Aşağıdaki kategoriler Babroo yönetim panelindeki hizmet gruplarından canlı olarak çekilir. İhtiyacınıza uygun başlığı seçerek doğru bakım akışına daha hızlı geçebilirsiniz.",
    primaryCta: "Ücretsiz Kayıt Ol",
    secondaryCta: "İletişime Geç",
    categoryCountLabel: "kategori",
    selectedTitle: "Seçili kategori",
    selectedDescription:
      "Bu başlık için başlangıç, profil keşfi ve sonraki adım planı aynı ekranda sade biçimde kurgulanabilir.",
    listTitle: "Tüm kategoriler",
    processTitle: "Nasıl ilerlersiniz?",
    processSteps: [
      "İhtiyacınıza en yakın kategoriyi seçin.",
      "Beklentinizi netleştirip uygun kullanıcı akışına geçin.",
      "Kayıt, iletişim ve değerlendirme adımlarına ilerleyin.",
    ],
    supportTitle: "Babroo bu sayfayı nasıl kullanır?",
    supportText:
      "Bu sayfa, kategori seçimini tek ekranda sadeleştirir. Bakım arayanlar için hızlı yönlendirme sağlar; bakım verenler için de hangi talep başlıklarının öne çıktığını net gösterir.",
    helperPoints: [
      "Kategori listesi API'den canlı gelir",
      "Dil bazlı içerik endpoint parametresiyle yüklenir",
      "URL üzerinden ?f= ile seçim vurgusu korunur",
    ],
    activeLabel: "Seçili",
    focusLabel: "Kategoriye odaklan",
    imageAltSuffix: "kategori görseli",
  },
  en: {
    badge: "Care Categories",
    title: "Who do you need?",
    description:
      "The categories below are pulled live from Babroo's service-group management panel. Choose the right title for your need and move into the correct care flow faster.",
    primaryCta: "Create Free Account",
    secondaryCta: "Contact Us",
    categoryCountLabel: "categories",
    selectedTitle: "Selected category",
    selectedDescription:
      "For this title, onboarding, profile discovery, and next-step planning can be structured in one clear screen.",
    listTitle: "All categories",
    processTitle: "How do you move forward?",
    processSteps: [
      "Choose the category that best matches your need.",
      "Clarify expectations and continue into the right user flow.",
      "Move forward into registration, contact, and evaluation steps.",
    ],
    supportTitle: "How Babroo uses this page",
    supportText:
      "This page simplifies category selection into one screen. It gives care seekers a fast route and shows caregivers which need areas are emphasized.",
    helperPoints: [
      "The category list is loaded live from the API",
      "Language-specific content is loaded through the endpoint parameter",
      "Selection highlighting still works with ?f= in the URL",
    ],
    activeLabel: "Active",
    focusLabel: "Focus on this category",
    imageAltSuffix: "category image",
  },
  ru: {
    badge: "Категории ухода",
    title: "Кто вам нужен?",
    description:
      "Категории ниже загружаются напрямую из панели управления группами услуг Babroo. Выберите подходящее направление и быстрее перейдите к нужному сценарию ухода.",
    primaryCta: "Зарегистрироваться бесплатно",
    secondaryCta: "Связаться с нами",
    categoryCountLabel: "категорий",
    selectedTitle: "Выбранная категория",
    selectedDescription:
      "Для этого направления можно понятно выстроить старт, просмотр профилей и план следующего шага на одном экране.",
    listTitle: "Все категории",
    processTitle: "Как двигаться дальше?",
    processSteps: [
      "Выберите категорию, которая ближе всего к вашей потребности.",
      "Уточните ожидания и перейдите в подходящий пользовательский сценарий.",
      "Продолжайте к регистрации, общению и оценке.",
    ],
    supportTitle: "Как Babroo использует эту страницу?",
    supportText:
      "Эта страница упрощает выбор категории на одном экране. Она дает быстрый маршрут тем, кто ищет уход, и показывает специалистам, какие направления спроса выделены.",
    helperPoints: [
      "Список категорий загружается из API в реальном времени",
      "Контент для выбранного языка загружается через параметр endpoint",
      "Выбор по ?f= в URL остается выделенным",
    ],
    activeLabel: "Выбрано",
    focusLabel: "Перейти к категории",
    imageAltSuffix: "изображение категории",
  },
  es: {
    badge: "Categorías de cuidado",
    title: "¿A quién necesitas?",
    description:
      "Las categorías siguientes se cargan en vivo desde el panel de gestión de grupos de servicio de Babroo. Elige el título adecuado para tu necesidad y entra más rápido en el flujo correcto de cuidado.",
    primaryCta: "Crear cuenta gratis",
    secondaryCta: "Contáctanos",
    categoryCountLabel: "categorías",
    selectedTitle: "Categoría seleccionada",
    selectedDescription:
      "Para este tema, el inicio, el descubrimiento de perfiles y el plan del siguiente paso pueden organizarse en una pantalla clara.",
    listTitle: "Todas las categorías",
    processTitle: "¿Cómo avanzar?",
    processSteps: [
      "Elige la categoría que más se acerque a tu necesidad.",
      "Aclara tus expectativas y continúa hacia el flujo adecuado.",
      "Avanza hacia registro, contacto y evaluación.",
    ],
    supportTitle: "Cómo usa Babroo esta página",
    supportText:
      "Esta página simplifica la selección de categorías en una sola pantalla. Da a quienes buscan cuidado una ruta rápida y muestra a los cuidadores qué áreas de necesidad se destacan.",
    helperPoints: [
      "La lista de categorías se carga en vivo desde la API",
      "El contenido por idioma se carga mediante el parámetro del endpoint",
      "El resaltado de selección funciona con ?f= en la URL",
    ],
    activeLabel: "Seleccionada",
    focusLabel: "Enfocar esta categoría",
    imageAltSuffix: "imagen de categoría",
  },
  fr: {
    badge: "Catégories de soins",
    title: "De qui avez-vous besoin ?",
    description:
      "Les catégories ci-dessous sont chargées en direct depuis le panneau de gestion des groupes de services Babroo. Choisissez le bon intitulé pour votre besoin et avancez plus vite dans le bon parcours de soins.",
    primaryCta: "Créer un compte gratuit",
    secondaryCta: "Nous contacter",
    categoryCountLabel: "catégories",
    selectedTitle: "Catégorie sélectionnée",
    selectedDescription:
      "Pour ce thème, l'accueil, la découverte de profils et le plan de prochaine étape peuvent être structurés clairement sur un même écran.",
    listTitle: "Toutes les catégories",
    processTitle: "Comment avancer ?",
    processSteps: [
      "Choisissez la catégorie la plus proche de votre besoin.",
      "Clarifiez vos attentes et poursuivez dans le bon parcours utilisateur.",
      "Avancez vers l'inscription, le contact et l'évaluation.",
    ],
    supportTitle: "Comment Babroo utilise cette page",
    supportText:
      "Cette page simplifie le choix de catégorie sur un seul écran. Elle offre un accès rapide aux familles et montre aux aidants les besoins mis en avant.",
    helperPoints: [
      "La liste des catégories est chargée en direct depuis l'API",
      "Le contenu par langue est chargé via le paramètre de l'endpoint",
      "La sélection reste mise en avant avec ?f= dans l'URL",
    ],
    activeLabel: "Sélectionnée",
    focusLabel: "Voir cette catégorie",
    imageAltSuffix: "image de catégorie",
  },
};

function getPageCopy(lang: Lang) {
  return PAGE_COPY[lang];
}

export function CaregiverFindPage({
  lang,
  activeFilter,
  careCategories,
}: {
  lang: Lang;
  activeFilter?: string;
  careCategories: CareCategory[];
}) {
  const copy = getPageCopy(lang);
  const categories = careCategories.map((category) => {
    const definition = getCareCategoryDefinition(category.id);

    return {
      ...category,
      icon: getCareCategoryIcon(definition?.iconName),
    };
  });
  const activeCategory = categories.find((item) => item.slug === activeFilter) ?? categories[0];

  if (!activeCategory) {
    return null;
  }

  const ActiveIcon = activeCategory.icon;

  return (
    <div className="overflow-hidden bg-[#fffaf3] text-slate-900">
      <section className="relative overflow-hidden border-b border-[#f1e4cf] bg-[radial-gradient(circle_at_top_left,_rgba(255,118,1,0.16),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(3,8,194,0.10),_transparent_36%),linear-gradient(180deg,#fffaf3_0%,#ffffff_100%)]">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#ff7601]/12 blur-3xl" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#0308C2]/10 blur-3xl" />
        <div className="container relative pb-14 pt-28 sm:pb-16 sm:pt-32 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd5b3] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b85b00] shadow-sm">
                <ShieldCheck size={14} />
                {copy.badge}
              </span>
              <h1 className="mt-6 max-w-[12ch] text-[40px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#111827] sm:text-[52px] lg:text-[64px]">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-[60ch] text-base leading-8 text-slate-600 sm:text-lg">{copy.description}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/${lang}/register`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#111827] px-6 text-sm font-semibold text-white transition hover:bg-[#1f2937]"
                >
                  {copy.primaryCta}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/${lang}/contact`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8cbb4] bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-[#111827] hover:text-[#111827]"
                >
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-[#eadfce] bg-white p-6 shadow-[0_28px_90px_rgba(17,24,39,0.07)] sm:p-8">
              <div className="absolute -right-12 -top-12 opacity-[0.08]">
                <BrandHeader height={72} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{copy.selectedTitle}</span>
                  <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-semibold text-[#ff7601]">
                    {categories.length} {copy.categoryCountLabel}
                  </span>
                </div>
                <div className="mt-6 grid gap-5 rounded-[28px] border border-[#ece1cf] bg-[linear-gradient(180deg,#fff9f1_0%,#ffffff_100%)] p-6 sm:grid-cols-[1fr_210px] sm:items-center">
                  <div>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#111827] text-white shadow-lg shadow-[#111827]/10">
                      <ActiveIcon size={24} />
                    </div>
                    <h2 className="mt-5 text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">{activeCategory.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{activeCategory.detail}</p>
                    <p className="mt-5 text-sm leading-7 text-slate-600">{copy.selectedDescription}</p>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-[#ece1cf] bg-white">
                    {activeCategory.imageUrl ? (
                      <img
                        src={activeCategory.imageUrl}
                        alt={`${activeCategory.title} ${copy.imageAltSuffix}`}
                        className="mx-auto h-[170px] w-full object-contain p-4"
                      />
                    ) : (
                      <div className="grid h-[220px] place-items-center bg-[linear-gradient(135deg,#fff3e8_0%,#ffffff_100%)] text-[#111827]">
                        <ActiveIcon size={42} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container relative">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7601]">Babroo</p>
              <h2 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#111827] sm:text-[44px]">
                {copy.listTitle}
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const isActive = category.slug === activeCategory.slug;
              const Icon = category.icon;

              return (
                <Link
                  key={category.slug}
                  href={`/${lang}/bakici-bul?f=${category.slug}`}
                  className={`group rounded-[28px] border p-6 transition duration-300 ${
                    isActive
                      ? "border-[#ff7601] bg-[#fff5ea] shadow-[0_24px_70px_rgba(255,118,1,0.12)]"
                      : "border-[#ece1cf] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.05)] hover:-translate-y-1 hover:border-[#ff7601] hover:shadow-[0_24px_70px_rgba(17,24,39,0.09)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${isActive ? "bg-[#ff7601] text-white" : "bg-[#111827] text-white"}`}>
                      <Icon size={20} />
                    </div>
                    {isActive ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff7601]">
                        {copy.activeLabel}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-[#111827]">{category.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{category.detail}</p>

                  <div className="mt-6 overflow-hidden rounded-[22px] border border-[#ece1cf] bg-white">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={`${category.title} ${copy.imageAltSuffix}`}
                        className="mx-auto h-28 w-full object-contain p-3 transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-40 place-items-center bg-[linear-gradient(135deg,#fff3e8_0%,#ffffff_100%)] text-[#111827]">
                        <Icon size={36} />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#111827] transition group-hover:text-[#ff7601]">
                    {copy.focusLabel}
                    <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="container relative">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[32px] border border-[#eadfce] bg-[#111827] p-7 text-white shadow-[0_28px_90px_rgba(17,24,39,0.12)] sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                <CheckCircle2 size={14} />
                {copy.processTitle}
              </span>
              <div className="mt-6 space-y-3">
                {copy.processSteps.map((step) => (
                  <div key={step} className="rounded-2xl bg-white/8 px-4 py-4 text-sm leading-7 text-white/80">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-[#ece1cf] bg-white p-7 shadow-[0_18px_50px_rgba(17,24,39,0.05)] sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fff3e8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7601]">
                <Flower2 size={14} />
                Babroo
              </span>
              <h2 className="mt-5 text-[30px] font-semibold leading-[1.04] tracking-[-0.04em] text-[#111827]">
                {copy.supportTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{copy.supportText}</p>

              <div className="mt-6 grid gap-3">
                {copy.helperPoints.map((point) => (
                  <div key={point} className="flex items-center gap-3 rounded-2xl border border-[#ece1cf] bg-[#fffaf4] px-4 py-3 text-sm text-slate-700">
                    <CheckCircle2 size={16} className="shrink-0 text-[#ff7601]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
