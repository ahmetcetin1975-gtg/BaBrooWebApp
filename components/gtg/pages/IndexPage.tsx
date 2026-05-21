"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  ListFilter,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { getCareCategoryDefinition } from "@/lib/gtg/care-categories";
import { getCareCategoryIcon } from "@/lib/gtg/care-category-icons";
import type { Lang } from "@/lib/gtg/config";
import type { CareCategory } from "@/lib/gtg/models";

type FeatureCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type StepCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type FAQItem = {
  question: string;
  answer: string;
};

type MetricCard = {
  value: string;
  label: string;
};

type ShowcaseActionCopy = {
  label: string;
  detail: string;
};

type PageCopy = {
  badge: string;
  heroTitle: string;
  heroDescription: string;
  primaryCta: string;
  secondaryCta: string;
  quickLabel: string;
  metrics: (categoryCount: number) => MetricCard[];
  showcaseTitle: string;
  brandTagline: string;
  showcaseDescription: string;
  showcaseActions: ShowcaseActionCopy[];
  miniHighlights: Array<{ icon: LucideIcon; title: string }>;
  categoriesEyebrow: string;
  categoriesTitle: string;
  categoriesDescription: (categoryCount: number) => string;
  categoriesCta: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresDescription: string;
  features: FeatureCard[];
  decisionFlowTitle: string;
  decisionFlowDescription: string;
  decisionFlowSteps: string[];
  processEyebrow: string;
  processTitle: string;
  processDescription: string;
  processSteps: StepCard[];
  processCardEyebrow: string;
  faqEyebrow: string;
  faqTitle: string;
  faqDescription: string;
  choiceHelperTitle: string;
  choiceHelperDescription: string;
  faqItems: FAQItem[];
  finalTitle: string;
  finalDescription: string;
  finalPrimary: string;
  finalSecondary: string;
  imageAltSuffix: string;
};

const PAGE_COPY: Record<Lang, PageCopy> = {
  tr: {
    badge: "Babroo Bakım Platformu",
    heroTitle: "Bakım arayışınızı daha sakin ve güvenilir bir başlangıca dönüştürün.",
    heroDescription:
      "Babroo, bebek bakımından ev yardımına kadar farklı ihtiyaçları aynı akışta toplayan; bakım arayanlar ve bakım verenler için düzenli, anlaşılır ve sıcak bir ana sayfa deneyimi sunar.",
    primaryCta: "Ücretsiz Kayıt Ol",
    secondaryCta: "Giriş Yap",
    quickLabel: "En çok aranan başlıklar",
    metrics: (categoryCount) => [
      { value: String(categoryCount), label: "bakım kategorisi" },
      { value: "3", label: "adımda hızlı başlangıç" },
      { value: "2", label: "farklı kullanıcı yolu" },
    ],
    showcaseTitle: "İhtiyaca göre hızlı başlangıç",
    brandTagline: "En sevdikleriniz, En değer verdikleriniz için - Babroo",
    showcaseDescription:
      "Bakım arayanlar için ihtiyaç odaklı, bakım verenler için profil odaklı iki net akış hazırladık. Önce ihtiyacınızı seçin, sonra uygun adımla devam edin.",
    showcaseActions: [
      { label: "İhtiyacını paylaş", detail: "Kayıtla devam et" },
      { label: "Bakım veren olarak katıl", detail: "Profilinizi oluşturun" },
    ],
    miniHighlights: [
      { icon: ShieldCheck, title: "Sade ve güven odaklı deneyim" },
      { icon: ListFilter, title: "Kategori bazlı net yönlendirme" },
      { icon: MessageCircle, title: "İletişim adımına hazırlayan yapı" },
    ],
    categoriesEyebrow: "Bakım Kategorileri",
    categoriesTitle: "Tek Sayfada Tüm Bakım Başlıkları",
    categoriesDescription: (categoryCount) =>
      `${categoryCount} bakım başlığı, yönetim panelindeki hizmet gruplarından canlı olarak listelenir.`,
    categoriesCta: "Bu akışla ilerle",
    featuresEyebrow: "Babroo yaklaşımı",
    featuresTitle: "Babroo Neden Daha Net Hissettiriyor?",
    featuresDescription:
      "Buradaki hedef, kullanıcıyı kalabalık bir landing yerine doğru eyleme daha hızlı taşıyan bir akış kurmak.",
    features: [
      {
        icon: ShieldCheck,
        title: "Güven hissi veren dil",
        description: "Tüm ana mesajlar bakım sürecinde rahatlatıcı ve açıklayıcı bir tonla yeniden kurgulandı.",
      },
      {
        icon: BadgeCheck,
        title: "Rol bazlı başlangıç",
        description: "Bakım arayanlar ve bakım verenler aynı sayfada kaybolmadan kendilerine uygun kapıdan ilerliyor.",
      },
      {
        icon: ListFilter,
        title: "Kategorik yönlendirme",
        description: "Bebek, yaşlı, hasta, ev yardımı ve günlük destek gibi ihtiyaçlar daha hızlı taranabiliyor.",
      },
      {
        icon: Clock3,
        title: "Kısa karar akışı",
        description: "Hero alanı, kategori kartları ve süreç bölümü tek bir hikaye içinde birbirini tamamlıyor.",
      },
    ],
    decisionFlowTitle: "Daha sakin karar deneyimi",
    decisionFlowDescription:
      "Kullanıcıyı önce kategoriye, sonra eyleme götüren daha anlaşılır bir yapı.",
    decisionFlowSteps: ["İhtiyacı seç", "Beklentiyi yaz", "İletişime geç"],
    processEyebrow: "Nasıl Çalışır",
    processTitle: "Babroo ile Başlamak Çok Daha Kolay",
    processDescription:
      "Bakım arayışını kolaylaştıran akışı, daha temiz görsel hiyerarşi ve daha güncel kart diliyle yeniden ele aldık.",
    processSteps: [
      { icon: Search, title: "1. İhtiyacınızı seçin", description: "Önce hangi destek başlığına ihtiyacınız olduğunu netleştirin ve size uygun kategoriye geçin." },
      { icon: FileText, title: "2. Beklentiyi paylaşın", description: "Çalışma şekli, zaman planı ve temel beklentileri yazarak daha anlaşılır bir başlangıç yapın." },
      { icon: PhoneCall, title: "3. İlerleyin ve görüşün", description: "Uygun eşleşme adımına geçip iletişim, değerlendirme ve karar sürecini tek akışta yönetin." },
    ],
    processCardEyebrow: "Babroo Akışı",
    faqEyebrow: "SSS",
    faqTitle: "Sık Sorulan Sorular",
    faqDescription:
      "Yeni ana sayfa yapısı, kullanıcıların ilk bakışta sorduğu temel sorulara net yanıt vermek için tasarlandı.",
    choiceHelperTitle: "Karar vermeyi kolaylaştıran yapı",
    choiceHelperDescription:
      "Ana sayfada önce ne aradığınızı görür, sonra hangi adımı atmanız gerektiğini anlarsınız. Bu da özellikle bakım gibi hassas alanlarda belirsizliği azaltır.",
    faqItems: [
      { question: "Babroo ana sayfasında hangi bakım başlıkları öne çıkıyor?", answer: "Kart alanında yönetim panelindeki tüm hizmet grupları gösterilir; en üstteki hızlı erişim bölümünde ise en sık öne çıkan başlıklar yer alır." },
      { question: "Nasıl başlayabilirim?", answer: "Ücretsiz kayıt adımına geçip ihtiyacınızı seçerek size uygun başlangıç akışına yönlenebilirsiniz." },
      { question: "Bakım veren olarak Babroo'ya katılabilir miyim?", answer: "Evet. Kayıt akışı bakım verenlerin de profil oluşturarak uygun fırsatları takip edebileceği şekilde kurgulanıyor." },
      { question: "Bu yeni tasarım mobilde de çalışıyor mu?", answer: "Evet. Bölümler tek sütuna kırılarak mobilde de okunabilir, rahat ve çağdaş bir deneyim verecek şekilde düzenlendi." },
      { question: "Kategori içerikleri nasıl güncelleniyor?", answer: "Ana sayfa ve kategori sayfası, hizmet gruplarını `GetHizmetGruplari` endpoint'inden dil bazlı çekerek güncel içerikle açılır." },
    ],
    finalTitle: "Babroo ile daha sıcak, daha net bir bakım ana sayfasına geçin.",
    finalDescription:
      "Yeni konsept; kategori odaklı giriş, güven vurgusu ve sade karar akışıyla bakım platformu hissini çok daha görünür hale getiriyor.",
    finalPrimary: "Hemen Başla",
    finalSecondary: "Bize Ulaşın",
    imageAltSuffix: "kategori görseli",
  },
  en: {
    badge: "Babroo Care Platform",
    heroTitle: "Turn your care search into a calmer, more trusted start.",
    heroDescription:
      "Babroo brings baby care, elder support, household help, and daily assistance into one flow with a clear, warm homepage experience for both care seekers and caregivers.",
    primaryCta: "Create Free Account",
    secondaryCta: "Sign In",
    quickLabel: "Most searched categories",
    metrics: (categoryCount) => [
      { value: String(categoryCount), label: "care categories" },
      { value: "3", label: "steps to get started" },
      { value: "2", label: "clear user journeys" },
    ],
    showcaseTitle: "Start quickly by need",
    brandTagline: "For your dearest ones, for those you cherish most - Babroo",
    showcaseDescription:
      "We designed two clear journeys: need-led for care seekers and profile-led for caregivers. First choose your need, then continue with the right next step.",
    showcaseActions: [
      { label: "Share your need", detail: "Continue with registration" },
      { label: "Join as a caregiver", detail: "Create your profile" },
    ],
    miniHighlights: [
      { icon: ShieldCheck, title: "Simple, trust-led experience" },
      { icon: ListFilter, title: "Clear category-driven paths" },
      { icon: MessageCircle, title: "Built for smoother communication" },
    ],
    categoriesEyebrow: "Care Categories",
    categoriesTitle: "All Care Categories in One Place",
    categoriesDescription: (categoryCount) =>
      `${categoryCount} care categories are listed here live from the service-group management API.`,
    categoriesCta: "Continue with this flow",
    featuresEyebrow: "Babroo approach",
    featuresTitle: "Why Babroo Feels Clearer",
    featuresDescription:
      "The goal here is a flow that moves people toward the right action faster instead of dropping them into a crowded landing page.",
    features: [
      {
        icon: ShieldCheck,
        title: "Trust-first language",
        description: "The primary messaging now uses a calmer, clearer tone that fits care-related decisions.",
      },
      {
        icon: BadgeCheck,
        title: "Role-based entry",
        description: "Care seekers and caregivers can move forward without getting lost in the same homepage flow.",
      },
      {
        icon: ListFilter,
        title: "Category-led navigation",
        description: "Baby care, elder care, patient support, house help, and daily assistance are easier to scan.",
      },
      {
        icon: Clock3,
        title: "Short decision journey",
        description: "The hero, category grid, and process section now tell one consistent story from top to bottom.",
      },
    ],
    decisionFlowTitle: "A calmer decision flow",
    decisionFlowDescription: "A clearer structure that leads users to category first, then action.",
    decisionFlowSteps: ["Choose the need", "Write expectations", "Reach out"],
    processEyebrow: "How It Works",
    processTitle: "Getting Started with Babroo Is Much Easier",
    processDescription:
      "We reworked the familiar 'finding care is easy' idea with cleaner visual hierarchy and a more modern card language.",
    processSteps: [
      { icon: Search, title: "1. Choose your need", description: "Start by clarifying the type of support you need and move into the right category." },
      { icon: FileText, title: "2. Share your expectations", description: "Describe schedule, work style, and key expectations for a clearer first step." },
      { icon: PhoneCall, title: "3. Connect and move forward", description: "Continue into communication, review, and decision-making in one consistent flow." },
    ],
    processCardEyebrow: "Babroo Flow",
    faqEyebrow: "FAQ",
    faqTitle: "Frequently Asked Questions",
    faqDescription: "The new homepage structure is designed to answer the most common first-look questions immediately.",
    choiceHelperTitle: "A structure that makes choosing easier",
    choiceHelperDescription:
      "You first recognize what you need, then clearly see the next step. That reduces uncertainty, especially in sensitive care-related decisions.",
    faqItems: [
      { question: "Which care categories are highlighted on the Babroo homepage?", answer: "The category grid shows all service groups from the management panel, while the quick-access pills surface the most searched titles." },
      { question: "How can I get started?", answer: "You can move into the free registration flow and choose the path that fits your need or support request." },
      { question: "Can I join Babroo as a caregiver?", answer: "Yes. The registration flow is structured so caregivers can create a profile and continue toward relevant opportunities." },
      { question: "Does the new layout work well on mobile too?", answer: "Yes. The sections collapse into a more compact single-column flow to stay readable and calm on smaller screens." },
      { question: "How are category details kept up to date?", answer: "Both the homepage and the category page load their category copy per language from the `GetHizmetGruplari` endpoint." },
    ],
    finalTitle: "Move to a warmer, clearer care homepage with Babroo.",
    finalDescription:
      "The new concept makes the care-platform feeling much more visible through category-led entry, trust cues, and a simpler decision flow.",
    finalPrimary: "Get Started",
    finalSecondary: "Contact Us",
    imageAltSuffix: "category image",
  },
  ru: {
    badge: "Платформа ухода Babroo",
    heroTitle: "Сделайте поиск ухода более спокойным и надежным с самого начала.",
    heroDescription:
      "Babroo объединяет уход за детьми, поддержку пожилых, помощь по дому и ежедневную поддержку в одном понятном и теплом сценарии для тех, кто ищет уход, и для специалистов.",
    primaryCta: "Зарегистрироваться бесплатно",
    secondaryCta: "Войти",
    quickLabel: "Самые популярные категории",
    metrics: (categoryCount) => [
      { value: String(categoryCount), label: "категорий ухода" },
      { value: "3", label: "шага для быстрого старта" },
      { value: "2", label: "понятных пути пользователя" },
    ],
    showcaseTitle: "Быстрый старт по потребности",
    brandTagline: "Для самых дорогих и важных для вас людей - Babroo",
    showcaseDescription:
      "Мы подготовили два понятных пути: по потребности для тех, кто ищет уход, и по профилю для специалистов. Сначала выберите потребность, затем продолжайте с правильного шага.",
    showcaseActions: [
      { label: "Поделиться потребностью", detail: "Продолжить регистрацию" },
      { label: "Стать специалистом по уходу", detail: "Создайте свой профиль" },
    ],
    miniHighlights: [
      { icon: ShieldCheck, title: "Простой опыт с акцентом на доверие" },
      { icon: ListFilter, title: "Понятная навигация по категориям" },
      { icon: MessageCircle, title: "Структура для более легкого общения" },
    ],
    categoriesEyebrow: "Категории ухода",
    categoriesTitle: "Все категории ухода в одном месте",
    categoriesDescription: (categoryCount) =>
      `${categoryCount} категорий ухода загружаются здесь напрямую из API управления группами услуг.`,
    categoriesCta: "Продолжить с этим сценарием",
    featuresEyebrow: "Подход Babroo",
    featuresTitle: "Почему Babroo кажется понятнее",
    featuresDescription:
      "Цель этого сценария - быстрее привести пользователя к нужному действию, не перегружая его насыщенной landing-страницей.",
    features: [
      {
        icon: ShieldCheck,
        title: "Язык, который создает доверие",
        description: "Ключевые сообщения стали спокойнее, понятнее и лучше подходят для решений, связанных с уходом.",
      },
      {
        icon: BadgeCheck,
        title: "Старт по роли пользователя",
        description: "Те, кто ищет уход, и специалисты по уходу переходят к своему сценарию без лишней путаницы.",
      },
      {
        icon: ListFilter,
        title: "Навигация по категориям",
        description: "Уход за детьми, пожилыми, пациентами, помощь по дому и ежедневная поддержка легче просматриваются.",
      },
      {
        icon: Clock3,
        title: "Короткий путь к решению",
        description: "Hero-блок, карточки категорий и раздел процесса складываются в одну последовательную историю.",
      },
    ],
    decisionFlowTitle: "Более спокойный путь к решению",
    decisionFlowDescription: "Более понятная структура сначала ведет к категории, а затем к действию.",
    decisionFlowSteps: ["Выберите потребность", "Опишите ожидания", "Свяжитесь"],
    processEyebrow: "Как это работает",
    processTitle: "Начать с Babroo стало намного проще",
    processDescription:
      "Мы обновили привычную идею легкого поиска ухода с более чистой визуальной иерархией и современным языком карточек.",
    processSteps: [
      { icon: Search, title: "1. Выберите потребность", description: "Сначала уточните, какой тип поддержки вам нужен, и перейдите в подходящую категорию." },
      { icon: FileText, title: "2. Поделитесь ожиданиями", description: "Опишите график, формат работы и основные ожидания, чтобы начать понятнее." },
      { icon: PhoneCall, title: "3. Свяжитесь и двигайтесь дальше", description: "Переходите к общению, оценке и принятию решения в едином сценарии." },
    ],
    processCardEyebrow: "Сценарий Babroo",
    faqEyebrow: "FAQ",
    faqTitle: "Частые вопросы",
    faqDescription:
      "Новая структура главной страницы сразу отвечает на основные вопросы, которые возникают при первом просмотре.",
    choiceHelperTitle: "Структура, которая упрощает выбор",
    choiceHelperDescription:
      "Сначала вы понимаете, что именно ищете, а затем видите следующий шаг. Это снижает неопределенность, особенно в чувствительных вопросах ухода.",
    faqItems: [
      { question: "Какие категории ухода выделены на главной странице Babroo?", answer: "В сетке категорий показываются все группы услуг из панели управления, а быстрый доступ выделяет самые востребованные направления." },
      { question: "Как начать?", answer: "Перейдите к бесплатной регистрации и выберите путь, который подходит вашей потребности или запросу на поддержку." },
      { question: "Могу ли я присоединиться к Babroo как специалист по уходу?", answer: "Да. Регистрация устроена так, чтобы специалисты могли создать профиль и продолжить к подходящим возможностям." },
      { question: "Хорошо ли новый дизайн работает на мобильных устройствах?", answer: "Да. Разделы перестраиваются в компактную одну колонку, чтобы оставаться читаемыми и спокойными на небольших экранах." },
      { question: "Как обновляются данные категорий?", answer: "Главная страница и страница категорий загружают тексты по языку из endpoint `GetHizmetGruplari`." },
    ],
    finalTitle: "Перейдите к более теплой и понятной главной странице ухода с Babroo.",
    finalDescription:
      "Новая концепция делает ощущение платформы ухода заметнее благодаря входу через категории, сигналам доверия и более простому пути к решению.",
    finalPrimary: "Начать",
    finalSecondary: "Связаться с нами",
    imageAltSuffix: "изображение категории",
  },
  es: {
    badge: "Plataforma de cuidados Babroo",
    heroTitle: "Convierte tu búsqueda de cuidados en un comienzo más tranquilo y confiable.",
    heroDescription:
      "Babroo reúne cuidado infantil, apoyo para mayores, ayuda en el hogar y asistencia diaria en un flujo claro y cercano para quienes buscan cuidado y para cuidadores.",
    primaryCta: "Crear cuenta gratis",
    secondaryCta: "Iniciar sesión",
    quickLabel: "Categorías más buscadas",
    metrics: (categoryCount) => [
      { value: String(categoryCount), label: "categorías de cuidado" },
      { value: "3", label: "pasos para empezar" },
      { value: "2", label: "rutas claras de usuario" },
    ],
    showcaseTitle: "Empieza rápido según tu necesidad",
    brandTagline: "Para tus seres más queridos y quienes más valoras - Babroo",
    showcaseDescription:
      "Diseñamos dos recorridos claros: uno basado en la necesidad para quienes buscan cuidado y otro basado en el perfil para cuidadores. Primero elige tu necesidad y luego continúa con el paso adecuado.",
    showcaseActions: [
      { label: "Comparte tu necesidad", detail: "Continúa con el registro" },
      { label: "Únete como cuidador", detail: "Crea tu perfil" },
    ],
    miniHighlights: [
      { icon: ShieldCheck, title: "Experiencia simple y centrada en la confianza" },
      { icon: ListFilter, title: "Rutas claras por categoría" },
      { icon: MessageCircle, title: "Preparado para una comunicación más fluida" },
    ],
    categoriesEyebrow: "Categorías de cuidado",
    categoriesTitle: "Todas las categorías de cuidado en un solo lugar",
    categoriesDescription: (categoryCount) =>
      `${categoryCount} categorías de cuidado se muestran aquí en vivo desde la API de gestión de grupos de servicio.`,
    categoriesCta: "Continuar con este flujo",
    featuresEyebrow: "Enfoque Babroo",
    featuresTitle: "Por qué Babroo se siente más claro",
    featuresDescription:
      "El objetivo es un flujo que lleve a las personas a la acción correcta con más rapidez, sin dejarlas en una página de entrada saturada.",
    features: [
      {
        icon: ShieldCheck,
        title: "Lenguaje centrado en la confianza",
        description: "Los mensajes principales usan ahora un tono más tranquilo y claro, adecuado para decisiones de cuidado.",
      },
      {
        icon: BadgeCheck,
        title: "Entrada por rol",
        description: "Quienes buscan cuidado y los cuidadores pueden avanzar sin perderse en el mismo flujo de inicio.",
      },
      {
        icon: ListFilter,
        title: "Navegación por categorías",
        description: "El cuidado infantil, de mayores, de pacientes, la ayuda en casa y la asistencia diaria son más fáciles de revisar.",
      },
      {
        icon: Clock3,
        title: "Recorrido de decisión corto",
        description: "El hero, la cuadrícula de categorías y el proceso cuentan una historia coherente de arriba abajo.",
      },
    ],
    decisionFlowTitle: "Un flujo de decisión más tranquilo",
    decisionFlowDescription: "Una estructura más clara que guía primero a la categoría y después a la acción.",
    decisionFlowSteps: ["Elige la necesidad", "Escribe expectativas", "Contacta"],
    processEyebrow: "Cómo funciona",
    processTitle: "Empezar con Babroo es mucho más fácil",
    processDescription:
      "Replanteamos la idea de encontrar cuidado fácilmente con una jerarquía visual más limpia y un lenguaje de tarjetas más moderno.",
    processSteps: [
      { icon: Search, title: "1. Elige tu necesidad", description: "Empieza aclarando qué tipo de apoyo necesitas y entra en la categoría adecuada." },
      { icon: FileText, title: "2. Comparte tus expectativas", description: "Describe horario, forma de trabajo y expectativas clave para un primer paso más claro." },
      { icon: PhoneCall, title: "3. Conecta y avanza", description: "Continúa hacia comunicación, evaluación y decisión en un flujo coherente." },
    ],
    processCardEyebrow: "Flujo Babroo",
    faqEyebrow: "FAQ",
    faqTitle: "Preguntas frecuentes",
    faqDescription:
      "La nueva estructura de la página principal está diseñada para responder de inmediato las preguntas más comunes del primer vistazo.",
    choiceHelperTitle: "Una estructura que facilita elegir",
    choiceHelperDescription:
      "Primero reconoces lo que necesitas y después ves con claridad el siguiente paso. Esto reduce la incertidumbre, especialmente en decisiones sensibles relacionadas con el cuidado.",
    faqItems: [
      { question: "¿Qué categorías de cuidado se destacan en la página principal de Babroo?", answer: "La cuadrícula de categorías muestra todos los grupos de servicio del panel de gestión, mientras que los accesos rápidos destacan los temas más buscados." },
      { question: "¿Cómo puedo empezar?", answer: "Puedes entrar en el flujo de registro gratuito y elegir el camino que mejor se adapte a tu necesidad o solicitud de apoyo." },
      { question: "¿Puedo unirme a Babroo como cuidador?", answer: "Sí. El registro está estructurado para que los cuidadores creen un perfil y avancen hacia oportunidades relevantes." },
      { question: "¿El nuevo diseño funciona bien en móvil?", answer: "Sí. Las secciones se adaptan a una columna más compacta para mantenerse legibles y tranquilas en pantallas pequeñas." },
      { question: "¿Cómo se mantienen actualizados los detalles de las categorías?", answer: "La página principal y la página de categorías cargan los textos por idioma desde el endpoint `GetHizmetGruplari`." },
    ],
    finalTitle: "Pasa a una página de cuidados más cálida y clara con Babroo.",
    finalDescription:
      "El nuevo concepto hace más visible la sensación de plataforma de cuidados mediante entrada por categorías, señales de confianza y un flujo de decisión más simple.",
    finalPrimary: "Empezar",
    finalSecondary: "Contáctanos",
    imageAltSuffix: "imagen de categoría",
  },
  fr: {
    badge: "Plateforme de soins Babroo",
    heroTitle: "Transformez votre recherche de soins en un départ plus serein et plus fiable.",
    heroDescription:
      "Babroo réunit garde d'enfants, soutien aux personnes âgées, aide à domicile et assistance quotidienne dans un parcours clair et chaleureux pour les familles comme pour les aidants.",
    primaryCta: "Créer un compte gratuit",
    secondaryCta: "Se connecter",
    quickLabel: "Catégories les plus recherchées",
    metrics: (categoryCount) => [
      { value: String(categoryCount), label: "catégories de soins" },
      { value: "3", label: "étapes pour démarrer" },
      { value: "2", label: "parcours utilisateur clairs" },
    ],
    showcaseTitle: "Démarrez vite selon le besoin",
    brandTagline: "Pour vos êtres les plus chers et ceux qui comptent le plus - Babroo",
    showcaseDescription:
      "Nous avons conçu deux parcours clairs : un parcours guidé par le besoin pour les familles et un parcours guidé par le profil pour les aidants. Choisissez d'abord votre besoin, puis avancez vers la bonne étape.",
    showcaseActions: [
      { label: "Partager votre besoin", detail: "Continuer l'inscription" },
      { label: "Rejoindre comme aidant", detail: "Créer votre profil" },
    ],
    miniHighlights: [
      { icon: ShieldCheck, title: "Expérience simple et axée sur la confiance" },
      { icon: ListFilter, title: "Parcours clairs par catégorie" },
      { icon: MessageCircle, title: "Pensé pour une communication plus fluide" },
    ],
    categoriesEyebrow: "Catégories de soins",
    categoriesTitle: "Toutes les catégories de soins au même endroit",
    categoriesDescription: (categoryCount) =>
      `${categoryCount} catégories de soins sont listées ici en direct depuis l'API de gestion des groupes de services.`,
    categoriesCta: "Continuer avec ce parcours",
    featuresEyebrow: "Approche Babroo",
    featuresTitle: "Pourquoi Babroo paraît plus clair",
    featuresDescription:
      "L'objectif est de guider les utilisateurs plus rapidement vers la bonne action, sans les perdre dans une page d'accueil trop chargée.",
    features: [
      {
        icon: ShieldCheck,
        title: "Un langage orienté confiance",
        description: "Les messages principaux adoptent un ton plus calme et plus clair, adapté aux décisions liées aux soins.",
      },
      {
        icon: BadgeCheck,
        title: "Entrée par rôle",
        description: "Les familles et les aidants avancent chacun par le bon accès, sans se perdre dans le même parcours.",
      },
      {
        icon: ListFilter,
        title: "Navigation par catégorie",
        description: "Garde d'enfants, aide aux personnes âgées, soutien aux patients, aide à domicile et assistance quotidienne se parcourent plus facilement.",
      },
      {
        icon: Clock3,
        title: "Parcours de décision court",
        description: "Le hero, la grille de catégories et le processus racontent une histoire cohérente du haut vers le bas.",
      },
    ],
    decisionFlowTitle: "Un parcours de décision plus serein",
    decisionFlowDescription: "Une structure plus claire qui guide d'abord vers la catégorie, puis vers l'action.",
    decisionFlowSteps: ["Choisir le besoin", "Décrire les attentes", "Prendre contact"],
    processEyebrow: "Fonctionnement",
    processTitle: "Commencer avec Babroo est beaucoup plus simple",
    processDescription:
      "Nous avons retravaillé l'idée de recherche de soins facile avec une hiérarchie visuelle plus nette et un langage de cartes plus moderne.",
    processSteps: [
      { icon: Search, title: "1. Choisissez votre besoin", description: "Commencez par préciser le type de soutien recherché, puis avancez vers la bonne catégorie." },
      { icon: FileText, title: "2. Partagez vos attentes", description: "Décrivez le planning, le mode de travail et les attentes clés pour un premier pas plus clair." },
      { icon: PhoneCall, title: "3. Échangez et avancez", description: "Poursuivez vers la communication, l'évaluation et la décision dans un parcours cohérent." },
    ],
    processCardEyebrow: "Parcours Babroo",
    faqEyebrow: "FAQ",
    faqTitle: "Questions fréquentes",
    faqDescription:
      "La nouvelle structure de la page d'accueil répond immédiatement aux questions les plus courantes du premier regard.",
    choiceHelperTitle: "Une structure qui facilite le choix",
    choiceHelperDescription:
      "Vous identifiez d'abord ce dont vous avez besoin, puis vous voyez clairement la prochaine étape. Cela réduit l'incertitude, surtout dans les décisions sensibles liées aux soins.",
    faqItems: [
      { question: "Quelles catégories de soins sont mises en avant sur la page d'accueil Babroo ?", answer: "La grille affiche tous les groupes de services du panneau de gestion, tandis que les accès rapides mettent en avant les sujets les plus recherchés." },
      { question: "Comment commencer ?", answer: "Vous pouvez entrer dans le parcours d'inscription gratuit et choisir la voie qui correspond à votre besoin ou demande de soutien." },
      { question: "Puis-je rejoindre Babroo comme aidant ?", answer: "Oui. Le parcours d'inscription permet aux aidants de créer un profil et d'accéder ensuite aux opportunités pertinentes." },
      { question: "La nouvelle mise en page fonctionne-t-elle bien sur mobile ?", answer: "Oui. Les sections se replient en une colonne plus compacte pour rester lisibles et sereines sur les petits écrans." },
      { question: "Comment les détails des catégories restent-ils à jour ?", answer: "La page d'accueil et la page des catégories chargent les textes par langue depuis l'endpoint `GetHizmetGruplari`." },
    ],
    finalTitle: "Passez à une page de soins plus chaleureuse et plus claire avec Babroo.",
    finalDescription:
      "Le nouveau concept rend l'identité de plateforme de soins plus visible grâce à l'entrée par catégories, aux repères de confiance et à un parcours de décision plus simple.",
    finalPrimary: "Commencer",
    finalSecondary: "Nous contacter",
    imageAltSuffix: "image de catégorie",
  },
};

function getPageContent(lang: Lang, categoryCount: number) {
  const copy = PAGE_COPY[lang];

  return {
    ...copy,
    primaryHref: `/${lang}/register`,
    secondaryHref: `/${lang}/login`,
    metrics: copy.metrics(categoryCount),
    showcaseActions: copy.showcaseActions.map((action) => ({ ...action, href: `/${lang}/register` })),
    categoriesDescription: copy.categoriesDescription(categoryCount),
    finalSecondaryHref: `/${lang}/contact`,
  };
}

export function IndexPage({
  lang,
  careCategories,
}: {
  lang: Lang;
  careCategories: CareCategory[];
}) {
  const content = useMemo(() => getPageContent(lang, careCategories.length), [lang, careCategories.length]);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const serviceCards = useMemo(
    () =>
      careCategories.map((category) => {
        const definition = getCareCategoryDefinition(category.id);

        return {
          ...category,
          icon: getCareCategoryIcon(definition?.iconName),
          surfaceClassName: definition?.surfaceClassName ?? "from-[#fff4ea] via-white to-[#fffdf8]",
        };
      }),
    [careCategories]
  );

  const quickLinks = useMemo(
    () => serviceCards.slice(0, 6).map((card) => ({ label: card.title, slug: card.slug })),
    [serviceCards]
  );
  const featureCards: FeatureCard[] = useMemo(() => content.features, [content.features]);
  const stepCards: StepCard[] = useMemo(() => content.processSteps, [content.processSteps]);
  const faqItems: FAQItem[] = useMemo(() => content.faqItems, [content.faqItems]);

  return (
    <div className="overflow-hidden bg-[#fffaf3] text-slate-900 [--brand-blue:#0308C2] [--brand-cyan:#3bc7ff] [--brand-orange:#FF7601] [--brand-lime:#85d300]">
      <section
        id="overview"
        className="relative overflow-hidden border-b border-[#f1e4cf] bg-[radial-gradient(circle_at_top_left,_rgba(255,118,1,0.16),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(3,8,194,0.12),_transparent_34%),linear-gradient(180deg,#fffaf3_0%,#ffffff_100%)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#ff7601]/12 blur-3xl" />
        <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-[#0308C2]/10 blur-3xl" />
        <div className="container relative pb-14 pt-28 sm:pb-16 sm:pt-32 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd5b3] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b85b00] shadow-sm">
                <BadgeCheck size={14} />
                {content.badge}
              </span>

              <h1 className="mt-6 max-w-[14ch] text-[42px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#111827] sm:text-[52px] lg:text-[68px]">
                {content.heroTitle}
              </h1>

              <p className="mt-5 max-w-[62ch] text-base leading-8 text-slate-600 sm:text-lg">{content.heroDescription}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={content.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#111827] px-6 text-sm font-semibold text-white transition hover:bg-[#1f2937]">
                  {content.primaryCta}
                  <ArrowRight size={16} />
                </Link>
                <Link href={content.secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8cbb4] bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-[#111827] hover:text-[#111827]">
                  {content.secondaryCta}
                </Link>
              </div>

              <div className="mt-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{content.quickLabel}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {quickLinks.map((item) => (
                    <Link key={item.slug} href={`/${lang}/bakici-bul?f=${item.slug}`} className="rounded-full border border-[#e7dcc8] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#ff7601] hover:text-[#ff7601]">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {content.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[24px] border border-[#ece1cf] bg-white/85 px-5 py-4 shadow-[0_20px_60px_rgba(17,24,39,0.04)]">
                    <div className="text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">{metric.value}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-12 top-8 h-64 rounded-full bg-[linear-gradient(135deg,rgba(255,118,1,0.18),rgba(3,8,194,0.12))] blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-[#eadfce] bg-[#fffdf9] p-6 shadow-[0_30px_100px_rgba(17,24,39,0.08)] sm:p-8">
                <div className="absolute -right-8 -top-8 opacity-[0.11]">
                  <Image src="/assets/images/babroo/logo-mark.png" alt="" width={220} height={165} className="h-auto w-[180px]" />
                </div>

                <div className="relative">
                  <BrandHeader height={28} />
                  <p className="mt-3 max-w-[34ch] text-sm font-medium leading-6 text-slate-500">{content.brandTagline}</p>
                  <h2 className="mt-6 max-w-[12ch] text-[30px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#111827]">{content.showcaseTitle}</h2>
                  <p className="mt-3 max-w-[42ch] text-sm leading-7 text-slate-600">{content.showcaseDescription}</p>

                  <div className="mt-6 space-y-3">
                    {content.showcaseActions.map((action) => (
                      <Link key={action.label} href={action.href} className="flex items-center justify-between rounded-[24px] border border-[#eee3d4] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[#ff7601] hover:shadow-[0_18px_40px_rgba(255,118,1,0.12)]">
                        <div>
                          <div className="text-base font-semibold text-[#111827]">{action.label}</div>
                          <div className="mt-1 text-sm text-slate-500">{action.detail}</div>
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff3e8] text-[#ff7601]">
                          <ArrowRight size={18} />
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {content.miniHighlights.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-[22px] bg-[#111827] px-4 py-4 text-white">
                          <Icon size={18} className="text-[#ffd3a8]" />
                          <p className="mt-3 text-sm leading-6 text-white/86">{item.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="py-16 md:py-20">
        <div className="container relative">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7601]">
                {content.categoriesEyebrow}
              </p>
              <h2 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#111827] sm:text-[44px]">
                {content.categoriesTitle}
              </h2>
            </div>
            <p className="max-w-[58ch] text-sm leading-7 text-slate-600 sm:text-base">{content.categoriesDescription}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.slug}
                  href={`/${lang}/bakici-bul?f=${card.slug}`}
                  className={`group overflow-hidden rounded-[30px] border border-[#ece1cf] bg-gradient-to-br ${card.surfaceClassName} p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(17,24,39,0.10)]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#111827] text-white shadow-lg shadow-[#111827]/15">
                      <Icon size={24} />
                    </div>
                    <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Babroo
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-[#111827]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.detail}</p>

                  <div className="mt-6 overflow-hidden rounded-[24px] border border-white/70 bg-white/90">
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={`${card.title} ${content.imageAltSuffix}`}
                        className="mx-auto h-28 w-full object-contain p-3 transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-40 place-items-center bg-[linear-gradient(135deg,#fff3e8_0%,#ffffff_100%)] text-[#111827]">
                        <Icon size={36} />
                      </div>
                    )}
                  </div>

                  <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#111827] transition group-hover:text-[#ff7601]">
                    {content.categoriesCta}
                    <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-20">
        <div className="container relative">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="overflow-hidden rounded-[34px] border border-[#e6dac8] bg-[#111827] p-7 text-white shadow-[0_30px_80px_rgba(17,24,39,0.16)] sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/78">
                <ShieldCheck size={14} />
                {content.featuresEyebrow}
              </span>
              <h2 className="mt-6 text-[32px] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[42px]">
                {content.featuresTitle}
              </h2>
              <p className="mt-4 max-w-[34ch] text-sm leading-7 text-white/72 sm:text-base">{content.featuresDescription}</p>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                    <Image src="/assets/images/babroo/logo-mark.png" alt="" width={34} height={26} className="h-auto w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{content.decisionFlowTitle}</p>
                    <p className="mt-1 text-sm text-white/60">{content.decisionFlowDescription}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[Search, FileText, PhoneCall].map((Icon, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-2xl bg-black/18 px-4 py-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                        <Icon size={18} className="text-[#ffd3a8]" />
                      </div>
                      <div className="text-sm text-white/78">
                        {content.decisionFlowSteps[index]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-[30px] border border-[#ece1cf] bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff3e7] text-[#ff7601]">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#111827]">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="py-16 md:py-20">
        <div className="container relative">
          <div className="rounded-[36px] border border-[#eadfce] bg-[linear-gradient(180deg,#ffffff_0%,#fff8ef_100%)] p-7 shadow-[0_25px_70px_rgba(17,24,39,0.06)] sm:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7601]">
                  {content.processEyebrow}
                </p>
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#111827] sm:text-[44px]">
                  {content.processTitle}
                </h2>
              </div>
              <p className="max-w-[56ch] text-sm leading-7 text-slate-600 sm:text-base">{content.processDescription}</p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {stepCards.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-[28px] border border-[#ece1cf] bg-white p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#111827] text-white">
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                        {content.processCardEyebrow}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-[#111827]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 md:py-20">
        <div className="container relative">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff7601]">
                {content.faqEyebrow}
              </p>
              <h2 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#111827] sm:text-[44px]">
                {content.faqTitle}
              </h2>
              <p className="mt-4 max-w-[50ch] text-sm leading-7 text-slate-600 sm:text-base">{content.faqDescription}</p>

              <div className="mt-8 rounded-[32px] border border-[#ece1cf] bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff3e7] text-[#ff7601]">
                    <CircleHelp size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#111827]">{content.choiceHelperTitle}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{content.choiceHelperDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={item.question} className="overflow-hidden rounded-[28px] border border-[#ece1cf] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.04)]">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      onClick={() => setOpenFaqIndex((current) => (current === index ? -1 : index))}
                    >
                      <span className="text-base font-semibold text-[#111827] sm:text-lg">{item.question}</span>
                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <p className="px-6 pb-6 text-sm leading-7 text-slate-600">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-4 md:pb-24">
        <div className="container relative">
          <div className="overflow-hidden rounded-[40px] border border-[#1f2531] bg-[linear-gradient(135deg,#111827_0%,#1d2430_55%,#24243f_100%)] px-7 py-8 text-white shadow-[0_35px_120px_rgba(17,24,39,0.16)] sm:px-10 sm:py-10">
            <div className="absolute -right-10 top-0 h-52 w-52 rounded-full bg-[#ff7601]/18 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-[#3bc7ff]/12 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <BrandHeader height={30} />
                <h2 className="mt-6 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-[46px]">
                  {content.finalTitle}
                </h2>
                <p className="mt-4 max-w-[58ch] text-sm leading-7 text-white/72 sm:text-base">{content.finalDescription}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={content.primaryHref} className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#ff7601] px-6 text-sm font-semibold text-white transition hover:brightness-95">
                  {content.finalPrimary}
                </Link>
                <Link href={content.finalSecondaryHref} className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/14 bg-white/8 px-6 text-sm font-semibold text-white transition hover:bg-white/12">
                  {content.finalSecondary}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
