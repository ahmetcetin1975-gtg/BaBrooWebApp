"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import {
  CUSTOMER_PROFILE_REFRESH_EVENT,
  CUSTOMER_UPDATED_EVENT,
  OPEN_COIN_PURCHASE_EVENT,
  type CustomerUpdatedDetail,
  type OpenCoinPurchaseDetail,
} from "@/lib/customer/events";
import { persistLanguagePreference } from "@/lib/i18n/client-language";
import { toLangHref } from "@/lib/i18n/routing";

type CustomerData = {
  Nr?: number;
  MusteriAdi?: string;
  MusteriSoyadi?: string;
  MusteriHakkimda?: string;
  MusteriIsaramaDurumu?: string | number | null;
  MusteriCinsiyet?: string | number | null;
  MusteriTc?: string;
  MusteriDogumTarihi?: string;
  MusteriUyruklar?: string;
  MusteriMedeniDurumu?: string | number | null;
  MusteriEmail?: string;
  MusteriEmailOnayli?: boolean;
  MusteriTel?: string;
  MusteriTelOnayli?: boolean;
  MusteriCoin?: number;
  MusteriUlkeNr?: number;
  MusteriIlNr?: number;
  MusteriLastloginat?: string;
  MusteriResimUrl?: string;
};

type CustomerMediaData = {
  Nr?: number;
  Image?: string | null;
  ImageUrl?: string | null;
  ImageThumbUrl?: string | null;
  Image2?: string | null;
  Image2Url?: string | null;
  Image2ThumbUrl?: string | null;
  Image3?: string | null;
  Image3Url?: string | null;
  Image3ThumbUrl?: string | null;
  Video?: string | null;
  VideoUrl?: string | null;
};

type CvStatusKey =
  | "photo"
  | "media"
  | "about"
  | "jobSearch"
  | "personal"
  | "license"
  | "passport"
  | "military"
  | "university"
  | "highSchool"
  | "workExperience"
  | "references"
  | "foreignLanguages"
  | "skills"
  | "preferences";

type CustomerGetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerData | null;
};

type CustomerSaveResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerData | null;
};

type CustomerSaveHakkimdaResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
};

type CustomerSaveIsAramaDurumuResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
};

type CustomerSaveCinsiyetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
};

type CustomerGetHakkimdaResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
    Hakkimda?: string | null;
  } | null;
};

type CustomerGetIsAramaDurumuResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
    IsaramaDurumu?: string | number | null;
  } | null;
};

type CustomerGetCinsiyetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
    CinsiyetNr?: number | null;
    CinsiyetAdi?: string | null;
    Tc?: string | null;
    DogumTarihi?: string | null;
    Uyruklar?: string | null;
    MedeniDurumuNr?: number | null;
    MedeniDurumuAdi?: string | null;
  } | null;
};

type MainCinsiyetItem = {
  Id?: number;
  CinsiyetAdi?: string | null;
};

type MainCinsiyetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: MainCinsiyetItem[] | null;
};

type MainMedeniHalItem = {
  Id?: number;
  MedeniHalAdi?: string | null;
};

type MainMedeniHalResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: MainMedeniHalItem[] | null;
};

type CustomerChangeImageResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
    Image?: string;
  } | null;
};

type CustomerGetMediaResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerMediaData | null;
};

type CustomerLicenseData = {
  Nr?: number;
  EhliyetVarmi?: boolean | null;
  EhliyetId?: number | null;
  EhliyetAdi?: string | null;
  EhliyetTarihi?: string | null;
};

type CustomerMilitaryData = {
  Nr?: number;
  AskerlikId?: number | null;
  AskerlikAdi?: string | null;
  AskerlikTarihi?: string | null;
};

type CustomerExpectationServiceGroupItem = {
  Id?: number;
  HizmetGrupAdi?: string | null;
  HizmetGrupDetay?: string | null;
  Resim?: string | null;
  HgAdi?: string | null;
  HgDetay?: string | null;
  HgResimUrl?: string | null;
};

type CustomerExpectationData = {
  Nr?: number;
  HizmetGrupIdList?: number[] | null;
  HizmetGruplari?: CustomerExpectationServiceGroupItem[] | null;
  UcretAciklama?: string | null;
  UcretBeklenti?: number | null;
  DovizId?: number | null;
  DovizAdi?: string | null;
  DovizKisaAdi?: string | null;
  DovizSembolu?: string | null;
};

type CustomerGetEhliyetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerLicenseData | null;
};

type CustomerSaveEhliyetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: { Nr?: number } | null;
};

type CustomerGetAskerlikResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerMilitaryData | null;
};

type CustomerSaveAskerlikResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: { Nr?: number } | null;
};

type CustomerGetUcretHizmetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerExpectationData | null;
};

const SETTINGS_INLINE_TRANSLATIONS: Partial<Record<Lang, Record<string, string>>> = {
  ru: {
    Settings: "Настройки",
    Other: "Другое",
    Profile: "Профиль",
    Resume: "Резюме",
    Missions: "Задания",
    "Complete missions and earn coins.": "Выполняйте задания и зарабатывайте coin.",
    "Loading missions...": "Задания загружаются...",
    "No active missions found.": "Активные задания не найдены.",
    "Go and Complete": "Перейти и выполнить",
    Completed: "Завершено",
    "Mission Link": "Ссылка задания",
    "Take the Coin": "Получить coin",
    "Mission Completed": "Задание выполнено",
    Store: "Магазин",
    "Plan & Pricing": "Планы и цены",
    "Loading packages...": "Пакеты загружаются...",
    "No active package found.": "Активные пакеты не найдены.",
    "Buy Now": "Купить",
    "Current Plan": "Текущий план",
    "Upgrade Plan": "Улучшить план",
    Downgrade: "Понизить",
    "/ month": "/ месяц",
    "one-time": "разово",
    "Instant activation": "Мгновенная активация",
    "Secure payment": "Безопасная оплата",
    "24/7 support": "Поддержка 24/7",
    "Order History": "История заказов",
    "Order No #": "Номер заказа #",
    Date: "Дата",
    Plan: "План",
    Amount: "Сумма",
    "Loading order history...": "История заказов загружается...",
    "No order history found.": "История заказов не найдена.",
    Language: "Язык",
    "Choose Your Language": "Выберите язык",
    "Set your language. The change applies across the whole site.": "Выберите язык. Изменение применится ко всему сайту.",
    Turkish: "Турецкий",
    English: "Английский",
    Russian: "Русский",
    Spanish: "Испанский",
    French: "Французский",
    "Contact Us": "Связаться с нами",
    "Send your support request using the form below.": "Отправьте запрос в поддержку через форму ниже.",
    "Your Message": "Ваше сообщение",
    "Send Message": "Отправить сообщение",
    "Sending...": "Отправка...",
    "Your message has been sent.": "Ваше сообщение отправлено.",
    "Support No": "Номер обращения",
    "Logged in user email is not available.": "Email вошедшего пользователя недоступен.",
    "Message is required.": "Сообщение обязательно.",
    "Message must be at least 3 characters.": "Сообщение должно содержать минимум 3 символа.",
    "Message must be at most 255 characters.": "Сообщение может содержать не более 255 символов.",
    "Sound Notification": "Звуковые уведомления",
    "Push Notifications": "Push-уведомления",
    "Control your message notifications from here.": "Здесь можно включить или отключить уведомления о сообщениях.",
    "Message Notification": "Уведомления о сообщениях",
    "You will receive notifications for new messages.": "Вы будете получать уведомления о новых сообщениях.",
    On: "Вкл.",
    Off: "Выкл.",
    "Loading notification status...": "Статус уведомлений загружается...",
    "Privacy Policy": "Политика конфиденциальности",
    "User Terms and Conditions": "Пользовательские условия",
    Policies: "Политики",
    "Privacy and compliance policy texts are listed below.": "Тексты политики конфиденциальности и соответствия перечислены ниже.",
    "User terms and conditions texts are listed below.": "Тексты пользовательских условий перечислены ниже.",
    "Account Details": "Данные аккаунта",
    "Your users will use this information to contact you.": "Пользователи будут использовать эти данные для связи с вами.",
    "Change Profile Photo": "Изменить фото профиля",
    "Select a single image and upload your new profile photo.": "Выберите одно изображение и загрузите новое фото профиля.",
    "Choose Image": "Выбрать изображение",
    "Selected Image": "Выбранное изображение",
    "Upload a single JPG, PNG, or WEBP image.": "Загрузите одно изображение JPG, PNG или WEBP.",
    Upload: "Загрузить",
    "Uploading...": "Загрузка...",
    "Please choose an image.": "Выберите изображение.",
    "Profile photo updated.": "Фото профиля обновлено.",
    "Failed to update profile photo.": "Не удалось обновить фото профиля.",
    "Driver's License": "Водительские права",
    "Add your license status and issue date.": "Добавьте статус прав и дату выдачи.",
    "Do you have a driver's license?": "У вас есть водительские права?",
    "Select license type": "Выберите тип прав",
    "License Date": "Дата выдачи прав",
    "Save License": "Сохранить права",
    "Driver's license information updated.": "Информация о правах обновлена.",
    "Failed to update driver's license information.": "Не удалось обновить информацию о правах.",
    "Military Information": "Военная информация",
    "Add your military status and date if applicable.": "Добавьте военный статус и дату, если применимо.",
    "Select military status": "Выберите военный статус",
    "Military Date": "Дата военного статуса",
    "Save Military Information": "Сохранить военную информацию",
    "Military information updated.": "Военная информация обновлена.",
    "Failed to update military information.": "Не удалось обновить военную информацию.",
    "Work Expectations": "Ожидания по работе",
    "Set your service areas and salary expectations.": "Укажите сферы услуг и ожидания по оплате.",
    "Service Groups": "Группы услуг",
    "Salary Expectation": "Ожидаемая оплата",
    "This information is only used for statistics.": "Эта информация используется только для статистики.",
    Currency: "Валюта",
    "Salary Description": "Описание оплаты",
    "Save Expectation": "Сохранить ожидания",
    "Work expectation updated.": "Ожидания по работе обновлены.",
    "Failed to update work expectation.": "Не удалось обновить ожидания по работе.",
    Yes: "Да",
    No: "Нет",
    "CV Media": "Медиа CV",
    "Add 2 extra images and 1 video to your CV.": "Добавьте в CV 2 дополнительных изображения и 1 видео.",
    "Extra Image 1": "Дополнительное изображение 1",
    "Extra Image 2": "Дополнительное изображение 2",
    Video: "Видео",
    "Nothing uploaded yet.": "Пока ничего не загружено.",
    Replace: "Заменить",
    Delete: "Удалить",
    "Deleting...": "Удаление...",
    "Change Email Address": "Изменить email",
    "New Email Address": "Новый email",
    "6-Digit Code": "6-значный код",
    Verify: "Подтвердить",
    "Sending Code...": "Код отправляется...",
    "Complete Change": "Завершить изменение",
    "Updating...": "Обновление...",
    "Code sent to": "Код отправлен",
    "Change Phone Number": "Изменить номер телефона",
    "Country Code": "Код страны",
    "New Phone Number": "Новый номер телефона",
    "Select country code": "Выберите код страны",
    "Loading countries...": "Страны загружаются...",
    "Search country": "Поиск страны",
    "No results found.": "Результаты не найдены.",
    "Failed to load countries.": "Не удалось загрузить страны.",
    "Delete Account": "Удалить аккаунт",
    "Are you sure you want to delete your account? This action cannot be undone.": "Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.",
    "Yes, Delete Account": "Да, удалить аккаунт",
    "Change Password": "Изменить пароль",
    "New Password": "Новый пароль",
    "Repeat New Password": "Повторите новый пароль",
    "At least 8 characters": "Минимум 8 символов",
    "Uppercase and lowercase letters": "Заглавные и строчные буквы",
    "At least 1 number": "Минимум 1 цифра",
    "At least 1 symbol": "Минимум 1 символ",
    "Passwords must match": "Пароли должны совпадать",
    Success: "Успешно",
    Alert: "Предупреждение",
    Close: "Закрыть",
    Name: "Имя",
    Surname: "Фамилия",
    Password: "Пароль",
    "Email Address": "Email",
    "Phone Number": "Телефон",
    Change: "Изменить",
    "Save Change": "Сохранить",
    Cancel: "Отмена",
    "Loading...": "Загрузка...",
    Saving: "Сохранение...",
    Save: "Сохранить",
    Photo: "Фото",
    About: "О себе",
    "Job Search Status": "Статус поиска работы",
    "Personal Information": "Личная информация",
    Passport: "Паспорт",
    "Military Status": "Военный статус",
    University: "Университет",
    "High School": "Школа",
    "Work Experience": "Опыт работы",
    References: "Рекомендации",
    "Foreign Languages": "Иностранные языки",
    Qualifications: "Квалификации",
    Preferences: "Предпочтения",
    "CV Completion Status": "Заполненность CV",
    "Basic Information": "Основная информация",
    "Contact and Verification": "Контакты и подтверждение",
    "Missing Information": "Недостающая информация",
    Ready: "Готово",
    Empty: "Пусто",
    "Introduce yourself briefly": "Кратко расскажите о себе",
    "About Text": "Текст о себе",
    Gender: "Пол",
    "Select Gender": "Выберите пол",
    Male: "Мужчина",
    Female: "Женщина",
    "ID Number": "Идентификационный номер",
    "Birth Date": "Дата рождения",
    Nationality: "Гражданство",
    "Select nationality": "Выберите гражданство",
    "Marital Status": "Семейное положение",
    "Select Marital Status": "Выберите семейное положение",
    Single: "Холост/не замужем",
    Married: "Женат/замужем",
    "Active Job Search": "Активный поиск работы",
    City: "Город",
    Country: "Страна",
    "Start Date": "Дата начала",
    "End Date": "Дата окончания",
    "Work Type": "Тип работы",
    "Job Title": "Должность",
    "Job Description": "Описание работы",
    Level: "Уровень",
    Department: "Отделение",
  },
  es: {
    Settings: "Ajustes", Other: "Otros", Profile: "Perfil", Resume: "Currículum", Missions: "Misiones", Store: "Tienda", "Order History": "Historial de pedidos", Language: "Idioma", "Contact Us": "Contáctanos", "Sound Notification": "Notificación sonora", "Privacy Policy": "Política de privacidad", "User Terms and Conditions": "Términos y condiciones", "Account Details": "Detalles de la cuenta", "Change Profile Photo": "Cambiar foto de perfil", "Driver's License": "Licencia de conducir", "Military Information": "Información militar", "Work Expectations": "Expectativas laborales", Yes: "Sí", No: "No", "CV Media": "Medios del CV", Upload: "Subir", Replace: "Reemplazar", Delete: "Eliminar", "Change Email Address": "Cambiar email", "Change Phone Number": "Cambiar teléfono", "Delete Account": "Eliminar cuenta", "Change Password": "Cambiar contraseña", Success: "Correcto", Alert: "Aviso", Close: "Cerrar", Name: "Nombre", Surname: "Apellido", Password: "Contraseña", "Email Address": "Email", "Phone Number": "Teléfono", Verify: "Verificar", Change: "Cambiar", "Save Change": "Guardar", Cancel: "Cancelar", "Loading...": "Cargando...", Saving: "Guardando...", Save: "Guardar", "Loading countries...": "Cargando países...", "Search country": "Buscar país", "No results found.": "No se encontraron resultados.", "Failed to load countries.": "No se pudieron cargar los países.", Photo: "Foto", About: "Sobre mí", "Job Search Status": "Estado de búsqueda de empleo", "Personal Information": "Información personal", Passport: "Pasaporte", "Military Status": "Estado militar", University: "Universidad", "High School": "Secundaria", "Work Experience": "Experiencia laboral", References: "Referencias", "Foreign Languages": "Idiomas extranjeros", Qualifications: "Cualificaciones", Preferences: "Preferencias", "CV Completion Status": "Estado de finalización del CV", "Basic Information": "Información básica", "Contact and Verification": "Contacto y verificación", "Missing Information": "Información faltante", Ready: "Listo", Empty: "Vacío", Gender: "Género", Male: "Hombre", Female: "Mujer", "Birth Date": "Fecha de nacimiento", Nationality: "Nacionalidad", "Marital Status": "Estado civil", Single: "Soltero/a", Married: "Casado/a", City: "Ciudad", Country: "País", "Start Date": "Fecha de inicio", "End Date": "Fecha de fin", "Work Type": "Tipo de trabajo", "Job Title": "Puesto", "Job Description": "Descripción del trabajo", Level: "Nivel", Department: "Departamento", "Send Message": "Enviar mensaje", "Sending...": "Enviando...", "Your Message": "Tu mensaje", On: "Activado", Off: "Desactivado", "Push Notifications": "Notificaciones push", "Message Notification": "Notificación de mensajes",
  },
  fr: {
    Settings: "Paramètres", Other: "Autre", Profile: "Profil", Resume: "CV", Missions: "Missions", Store: "Boutique", "Order History": "Historique des commandes", Language: "Langue", "Contact Us": "Nous contacter", "Sound Notification": "Notification sonore", "Privacy Policy": "Politique de confidentialité", "User Terms and Conditions": "Conditions générales", "Account Details": "Détails du compte", "Change Profile Photo": "Changer la photo de profil", "Driver's License": "Permis de conduire", "Military Information": "Informations militaires", "Work Expectations": "Attentes professionnelles", Yes: "Oui", No: "Non", "CV Media": "Médias du CV", Upload: "Téléverser", Replace: "Remplacer", Delete: "Supprimer", "Change Email Address": "Changer l'e-mail", "Change Phone Number": "Changer le téléphone", "Delete Account": "Supprimer le compte", "Change Password": "Changer le mot de passe", Success: "Succès", Alert: "Alerte", Close: "Fermer", Name: "Prénom", Surname: "Nom", Password: "Mot de passe", "Email Address": "Adresse e-mail", "Phone Number": "Téléphone", Verify: "Vérifier", Change: "Modifier", "Save Change": "Enregistrer", Cancel: "Annuler", "Loading...": "Chargement...", Saving: "Enregistrement...", Save: "Enregistrer", "Loading countries...": "Chargement des pays...", "Search country": "Rechercher un pays", "No results found.": "Aucun résultat trouvé.", "Failed to load countries.": "Impossible de charger les pays.", Photo: "Photo", About: "À propos", "Job Search Status": "Statut de recherche d'emploi", "Personal Information": "Informations personnelles", Passport: "Passeport", "Military Status": "Statut militaire", University: "Université", "High School": "Lycée", "Work Experience": "Expérience professionnelle", References: "Références", "Foreign Languages": "Langues étrangères", Qualifications: "Qualifications", Preferences: "Préférences", "CV Completion Status": "Progression du CV", "Basic Information": "Informations de base", "Contact and Verification": "Contact et vérification", "Missing Information": "Informations manquantes", Ready: "Prêt", Empty: "Vide", Gender: "Genre", Male: "Homme", Female: "Femme", "Birth Date": "Date de naissance", Nationality: "Nationalité", "Marital Status": "État civil", Single: "Célibataire", Married: "Marié(e)", City: "Ville", Country: "Pays", "Start Date": "Date de début", "End Date": "Date de fin", "Work Type": "Type de travail", "Job Title": "Poste", "Job Description": "Description du poste", Level: "Niveau", Department: "Département", "Send Message": "Envoyer un message", "Sending...": "Envoi...", "Your Message": "Votre message", On: "Activé", Off: "Désactivé", "Push Notifications": "Notifications push", "Message Notification": "Notification de message",
  },
};

Object.assign(SETTINGS_INLINE_TRANSLATIONS.ru ??= {}, {
  "Update Your CV": "Обновите CV",
  "Complete your profile to appear stronger in job applications.": "Заполните профиль, чтобы выглядеть убедительнее в откликах.",
  "Keep your details up to date so employers can discover you faster.": "Держите данные актуальными, чтобы работодатели быстрее вас находили.",
  "Complete Your Profile": "Заполните профиль",
  "Basic Information": "Основная информация",
  "Contact and Verification": "Контакты и подтверждение",
  "Missing Information": "Недостающая информация",
  "Update with one tap": "Обновить одним нажатием",
  "Update your identity and status details": "Обновите личные данные и статус",
  "Update your selections": "Обновите выбранные пункты",
  "Choose whether you are open to job opportunities here.": "Здесь укажите, открыты ли вы к предложениям работы.",
  "Write about your experience, approach, and strengths.": "Опишите свой опыт, подход и сильные стороны.",
  "Briefly share what you did.": "Кратко опишите, что вы делали.",
  "About information saved.": "Информация о себе сохранена.",
  "Failed to save about information.": "Не удалось сохранить информацию о себе.",
  "Job search status saved.": "Статус поиска работы сохранен.",
  "Job search status updated.": "Статус поиска работы обновлен.",
  "Failed to save job search status.": "Не удалось сохранить статус поиска работы.",
  "Failed to update job search status.": "Не удалось обновить статус поиска работы.",
  "Personal information saved.": "Личная информация сохранена.",
  "Failed to save personal information.": "Не удалось сохранить личную информацию.",
  "Loading profile details.": "Данные профиля загружаются.",
  "Failed to load profile details.": "Не удалось загрузить данные профиля.",
  "Loading CV media.": "Медиа CV загружаются.",
  "Failed to load CV media.": "Не удалось загрузить медиа CV.",
  "Failed to load CV details.": "Не удалось загрузить детали CV.",
  "Free {coin} Coin!": "Бесплатно {coin} Coin!",
  "Work Experiences": "Опыт работы",
  "Add Work Experience": "Добавить опыт работы",
  "Edit Work Experience": "Редактировать опыт работы",
  "Delete work experience": "Удалить опыт работы",
  "Loading work experiences...": "Опыт работы загружается...",
  "Work experience saved successfully.": "Опыт работы сохранен.",
  "Work experience updated successfully.": "Опыт работы обновлен.",
  "Work experience deleted.": "Опыт работы удален.",
  "Failed to save work experience.": "Не удалось сохранить опыт работы.",
  "Failed to delete work experience.": "Не удалось удалить опыт работы.",
  "Client / Business Name": "Клиент / Компания",
  "Client / Business name is required.": "Название клиента / компании обязательно.",
  "Job title is required.": "Должность обязательна.",
  "Job description is required.": "Описание работы обязательно.",
  "Currently working": "Работаю сейчас",
  "Select Work Type": "Выберите тип работы",
  "Search city": "Поиск города",
  "Select City": "Выберите город",
  "Select city.": "Выберите город.",
  "Last Net Salary**": "Последняя чистая зарплата**",
  "Net salary is required.": "Чистая зарплата обязательна.",
  "Net salary must be a valid number.": "Чистая зарплата должна быть числом.",
  "Select Currency": "Выберите валюту",
  "Select a currency for salary.": "Выберите валюту зарплаты.",
  "Select work type.": "Выберите тип работы.",
  "End date cannot be before start date.": "Дата окончания не может быть раньше даты начала.",
  "Passports": "Паспорта",
  "Add Passport": "Добавить паспорт",
  "Edit Passport": "Редактировать паспорт",
  "Delete passport": "Удалить паспорт",
  "Loading passports...": "Паспорта загружаются...",
  "Passport saved successfully.": "Паспорт сохранен.",
  "Passport updated successfully.": "Паспорт обновлен.",
  "Passport deleted.": "Паспорт удален.",
  "Failed to save passport.": "Не удалось сохранить паспорт.",
  "Failed to delete passport.": "Не удалось удалить паспорт.",
  "Expiry": "Срок действия",
  "Expiry Date": "Дата окончания",
  "Select Country": "Выберите страну",
  "Select country.": "Выберите страну.",
  "Select an expiry date.": "Выберите дату окончания.",
  "Foreign Language": "Иностранный язык",
  "Add Foreign Language": "Добавить язык",
  "Edit Foreign Language": "Редактировать язык",
  "Delete foreign language": "Удалить язык",
  "Loading foreign languages...": "Языки загружаются...",
  "Foreign language saved successfully.": "Язык сохранен.",
  "Foreign language updated successfully.": "Язык обновлен.",
  "Foreign language deleted.": "Язык удален.",
  "Failed to save foreign language.": "Не удалось сохранить язык.",
  "Failed to delete foreign language.": "Не удалось удалить язык.",
  "Select Foreign Language": "Выберите язык",
  "Select Level": "Выберите уровень",
  "Enter a level.": "Введите уровень.",
  "Level must be between 1 and 10.": "Уровень должен быть от 1 до 10.",
  "Search language": "Поиск языка",
  "High School Information": "Информация о школе",
  "Add High School Information": "Добавить школу",
  "Edit High School Information": "Редактировать школу",
  "Delete high school information": "Удалить школу",
  "Loading high school information...": "Информация о школе загружается...",
  "High school information saved successfully.": "Информация о школе сохранена.",
  "High school information updated successfully.": "Информация о школе обновлена.",
  "High school information deleted.": "Информация о школе удалена.",
  "Failed to save high school information.": "Не удалось сохранить школу.",
  "Failed to delete high school information.": "Не удалось удалить школу.",
  "High School Type": "Тип школы",
  "High School Name": "Название школы",
  "Select High School Type": "Выберите тип школы",
  "Select high school type.": "Выберите тип школы.",
  "High school name is required.": "Название школы обязательно.",
  "University Information": "Информация об университете",
  "Add University Information": "Добавить университет",
  "Edit University Information": "Редактировать университет",
  "Delete university information": "Удалить университет",
  "Loading university information...": "Информация об университете загружается...",
  "University information saved successfully.": "Информация об университете сохранена.",
  "University information updated successfully.": "Информация об университете обновлена.",
  "University information deleted.": "Информация об университете удалена.",
  "Failed to save university information.": "Не удалось сохранить университет.",
  "Failed to delete university information.": "Не удалось удалить университет.",
  "Select University": "Выберите университет",
  "Search university": "Поиск университета",
  "Select Department": "Выберите отделение",
  "Search department": "Поиск отделения",
  "Education Status": "Статус обучения",
  "Education Level": "Уровень образования",
  "Education Type": "Тип образования",
  "Select Education Status": "Выберите статус обучения",
  "Select Education Level": "Выберите уровень образования",
  "Select Education Type": "Выберите тип образования",
  "Select university.": "Выберите университет.",
  "Select department.": "Выберите отделение.",
  "Select education status.": "Выберите статус обучения.",
  "Select education level.": "Выберите уровень образования.",
  "Select education type.": "Выберите тип образования.",
  "References": "Рекомендации",
  "Add Reference": "Добавить рекомендацию",
  "Edit Reference": "Редактировать рекомендацию",
  "Delete reference": "Удалить рекомендацию",
  "Loading references...": "Рекомендации загружаются...",
  "Reference saved successfully.": "Рекомендация сохранена.",
  "Reference updated successfully.": "Рекомендация обновлена.",
  "Reference deleted.": "Рекомендация удалена.",
  "Failed to save reference.": "Не удалось сохранить рекомендацию.",
  "Failed to delete reference.": "Не удалось удалить рекомендацию.",
  "Company Name": "Компания",
  "Company name is required.": "Название компании обязательно.",
  "Phone": "Телефон",
  "Phone is required.": "Телефон обязателен.",
  "Email": "Email",
  "Email is required.": "Email обязателен.",
  "Enter a valid phone number.": "Введите корректный номер телефона.",
  "Enter a valid email.": "Введите корректный email.",
  "Important Information": "Важная информация",
  "Loading important information...": "Важная информация загружается...",
  "Important information updated successfully.": "Важная информация обновлена.",
  "Failed to load important information.": "Не удалось загрузить важную информацию.",
  "Failed to update important information.": "Не удалось обновить важную информацию.",
  "Multiple choice": "Несколько вариантов",
  "Yes / No": "Да / Нет",
  "If you close your account, this action cannot be undone.": "Если вы закроете аккаунт, это действие нельзя отменить.",
  "Unknown error.": "Неизвестная ошибка.",
  "Select a start date.": "Выберите дату начала.",
  "Select an end date.": "Выберите дату окончания.",
  "You can select multiple countries. The hidden value is stored as an id list.": "Можно выбрать несколько стран. Скрытое значение хранится как список id.",
  "Loading nationalities...": "Гражданства загружаются..."
});
Object.assign(SETTINGS_INLINE_TRANSLATIONS.es ??= {}, {
  "Update Your CV": "Actualiza tu CV",
  "Complete your profile to appear stronger in job applications.": "Completa tu perfil para destacar más en las postulaciones.",
  "Keep your details up to date so employers can discover you faster.": "Mantén tus datos actualizados para que los empleadores te encuentren más rápido.",
  "Complete Your Profile": "Completa tu perfil",
  "Update with one tap": "Actualiza con un toque",
  "Update your identity and status details": "Actualiza tus datos de identidad y estado",
  "Update your selections": "Actualiza tus selecciones",
  "Choose whether you are open to job opportunities here.": "Indica aquí si estás abierto/a a oportunidades laborales.",
  "Write about your experience, approach, and strengths.": "Escribe sobre tu experiencia, enfoque y fortalezas.",
  "Briefly share what you did.": "Resume brevemente lo que hiciste.",
  "About Text": "Texto sobre mí",
  "Introduce yourself briefly": "Preséntate brevemente",
  "Active Job Search": "Búsqueda activa",
  "ID Number": "Número de identidad",
  "Select Gender": "Selecciona género",
  "Select nationality": "Selecciona nacionalidad",
  "Select Marital Status": "Selecciona estado civil",
  "Ready": "Listo",
  "Empty": "Vacío",
  "Completed": "Completado",
  "About information saved.": "Información guardada.",
  "Failed to save about information.": "No se pudo guardar la información.",
  "Job search status saved.": "Estado de búsqueda guardado.",
  "Job search status updated.": "Estado de búsqueda actualizado.",
  "Failed to save job search status.": "No se pudo guardar el estado de búsqueda.",
  "Failed to update job search status.": "No se pudo actualizar el estado de búsqueda.",
  "Personal information saved.": "Información personal guardada.",
  "Failed to save personal information.": "No se pudo guardar la información personal.",
  "Failed to load profile details.": "No se pudieron cargar los datos del perfil.",
  "Failed to load CV media.": "No se pudieron cargar los medios del CV.",
  "Failed to load CV details.": "No se pudieron cargar los detalles del CV.",
  "Work Experiences": "Experiencias laborales",
  "Add Work Experience": "Agregar experiencia",
  "Edit Work Experience": "Editar experiencia",
  "Delete work experience": "Eliminar experiencia",
  "Loading work experiences...": "Cargando experiencias...",
  "Work experience saved successfully.": "Experiencia guardada.",
  "Work experience updated successfully.": "Experiencia actualizada.",
  "Work experience deleted.": "Experiencia eliminada.",
  "Failed to save work experience.": "No se pudo guardar la experiencia.",
  "Failed to delete work experience.": "No se pudo eliminar la experiencia.",
  "Client / Business Name": "Cliente / Empresa",
  "Client / Business name is required.": "El cliente / empresa es obligatorio.",
  "Job title is required.": "El puesto es obligatorio.",
  "Job description is required.": "La descripción es obligatoria.",
  "Currently working": "Trabajo actualmente",
  "Select Work Type": "Selecciona tipo de trabajo",
  "Search city": "Buscar ciudad",
  "Select City": "Selecciona ciudad",
  "Select city.": "Selecciona ciudad.",
  "Last Net Salary**": "Último salario neto**",
  "Net salary is required.": "El salario neto es obligatorio.",
  "Net salary must be a valid number.": "El salario debe ser un número válido.",
  "Select Currency": "Selecciona moneda",
  "Select a currency for salary.": "Selecciona una moneda para el salario.",
  "Select work type.": "Selecciona tipo de trabajo.",
  "End date cannot be before start date.": "La fecha final no puede ser anterior a la inicial.",
  "Passports": "Pasaportes",
  "Add Passport": "Agregar pasaporte",
  "Edit Passport": "Editar pasaporte",
  "Delete passport": "Eliminar pasaporte",
  "Loading passports...": "Cargando pasaportes...",
  "Passport saved successfully.": "Pasaporte guardado.",
  "Passport updated successfully.": "Pasaporte actualizado.",
  "Passport deleted.": "Pasaporte eliminado.",
  "Failed to save passport.": "No se pudo guardar el pasaporte.",
  "Failed to delete passport.": "No se pudo eliminar el pasaporte.",
  "Expiry": "Vencimiento",
  "Expiry Date": "Fecha de vencimiento",
  "Select Country": "Selecciona país",
  "Select country.": "Selecciona país.",
  "Select an expiry date.": "Selecciona fecha de vencimiento.",
  "Foreign Language": "Idioma extranjero",
  "Add Foreign Language": "Agregar idioma",
  "Edit Foreign Language": "Editar idioma",
  "Delete foreign language": "Eliminar idioma",
  "Loading foreign languages...": "Cargando idiomas...",
  "Foreign language saved successfully.": "Idioma guardado.",
  "Foreign language updated successfully.": "Idioma actualizado.",
  "Foreign language deleted.": "Idioma eliminado.",
  "Failed to save foreign language.": "No se pudo guardar el idioma.",
  "Failed to delete foreign language.": "No se pudo eliminar el idioma.",
  "Select Foreign Language": "Selecciona idioma",
  "Select Level": "Selecciona nivel",
  "Enter a level.": "Ingresa un nivel.",
  "Level must be between 1 and 10.": "El nivel debe estar entre 1 y 10.",
  "Search language": "Buscar idioma",
  "High School Information": "Información de secundaria",
  "Add High School Information": "Agregar secundaria",
  "Edit High School Information": "Editar secundaria",
  "Delete high school information": "Eliminar secundaria",
  "Loading high school information...": "Cargando secundaria...",
  "High school information saved successfully.": "Secundaria guardada.",
  "High school information updated successfully.": "Secundaria actualizada.",
  "High school information deleted.": "Secundaria eliminada.",
  "Failed to save high school information.": "No se pudo guardar secundaria.",
  "Failed to delete high school information.": "No se pudo eliminar secundaria.",
  "High School Type": "Tipo de secundaria",
  "High School Name": "Nombre de secundaria",
  "Select High School Type": "Selecciona tipo de secundaria",
  "Select high school type.": "Selecciona tipo de secundaria.",
  "High school name is required.": "El nombre de secundaria es obligatorio.",
  "University Information": "Información universitaria",
  "Add University Information": "Agregar universidad",
  "Edit University Information": "Editar universidad",
  "Delete university information": "Eliminar universidad",
  "Loading university information...": "Cargando universidad...",
  "University information saved successfully.": "Universidad guardada.",
  "University information updated successfully.": "Universidad actualizada.",
  "University information deleted.": "Universidad eliminada.",
  "Failed to save university information.": "No se pudo guardar universidad.",
  "Failed to delete university information.": "No se pudo eliminar universidad.",
  "Select University": "Selecciona universidad",
  "Search university": "Buscar universidad",
  "Select Department": "Selecciona departamento",
  "Search department": "Buscar departamento",
  "Education Status": "Estado educativo",
  "Education Level": "Nivel educativo",
  "Education Type": "Tipo de educación",
  "Select Education Status": "Selecciona estado educativo",
  "Select Education Level": "Selecciona nivel educativo",
  "Select Education Type": "Selecciona tipo de educación",
  "Select university.": "Selecciona universidad.",
  "Select department.": "Selecciona departamento.",
  "Select education status.": "Selecciona estado educativo.",
  "Select education level.": "Selecciona nivel educativo.",
  "Select education type.": "Selecciona tipo de educación.",
  "Add Reference": "Agregar referencia",
  "Edit Reference": "Editar referencia",
  "Delete reference": "Eliminar referencia",
  "Loading references...": "Cargando referencias...",
  "Reference saved successfully.": "Referencia guardada.",
  "Reference updated successfully.": "Referencia actualizada.",
  "Reference deleted.": "Referencia eliminada.",
  "Failed to save reference.": "No se pudo guardar la referencia.",
  "Failed to delete reference.": "No se pudo eliminar la referencia.",
  "Company Name": "Empresa",
  "Company name is required.": "La empresa es obligatoria.",
  "Phone": "Teléfono",
  "Phone is required.": "El teléfono es obligatorio.",
  "Email": "Email",
  "Email is required.": "El email es obligatorio.",
  "Enter a valid phone number.": "Ingresa un teléfono válido.",
  "Enter a valid email.": "Ingresa un email válido.",
  "Important Information": "Información importante",
  "Loading important information...": "Cargando información importante...",
  "Important information updated successfully.": "Información importante actualizada.",
  "Failed to load important information.": "No se pudo cargar la información importante.",
  "Failed to update important information.": "No se pudo actualizar la información importante.",
  "Multiple choice": "Opción múltiple",
  "Yes / No": "Sí / No",
  "If you close your account, this action cannot be undone.": "Si cierras tu cuenta, esta acción no se puede deshacer.",
  "Unknown error.": "Error desconocido.",
  "Select a start date.": "Selecciona fecha de inicio.",
  "Select an end date.": "Selecciona fecha de fin.",
  "You can select multiple countries. The hidden value is stored as an id list.": "Puedes seleccionar varios países. El valor oculto se guarda como lista de ids.",
  "Loading nationalities...": "Cargando nacionalidades...",
  "Yes": "Sí",
  "No": "No",
  "Update": "Actualizar"
});
Object.assign(SETTINGS_INLINE_TRANSLATIONS.fr ??= {}, {
  "Update Your CV": "Mettez à jour votre CV",
  "Complete your profile to appear stronger in job applications.": "Complétez votre profil pour mieux vous démarquer dans les candidatures.",
  "Keep your details up to date so employers can discover you faster.": "Gardez vos informations à jour pour que les employeurs vous trouvent plus vite.",
  "Complete Your Profile": "Compléter votre profil",
  "Update with one tap": "Mettre à jour en un geste",
  "Update your identity and status details": "Mettez à jour votre identité et votre statut",
  "Update your selections": "Mettez à jour vos choix",
  "Choose whether you are open to job opportunities here.": "Indiquez ici si vous êtes ouvert aux opportunités.",
  "Write about your experience, approach, and strengths.": "Décrivez votre expérience, votre approche et vos points forts.",
  "Briefly share what you did.": "Résumez brièvement ce que vous avez fait.",
  "About Text": "Texte à propos",
  "Introduce yourself briefly": "Présentez-vous brièvement",
  "Active Job Search": "Recherche active",
  "ID Number": "Numéro d'identité",
  "Select Gender": "Sélectionner le genre",
  "Select nationality": "Sélectionner la nationalité",
  "Select Marital Status": "Sélectionner l'état civil",
  "Ready": "Prêt",
  "Empty": "Vide",
  "Completed": "Terminé",
  "About information saved.": "Informations enregistrées.",
  "Failed to save about information.": "Impossible d'enregistrer les informations.",
  "Job search status saved.": "Statut de recherche enregistré.",
  "Job search status updated.": "Statut de recherche mis à jour.",
  "Failed to save job search status.": "Impossible d'enregistrer le statut de recherche.",
  "Failed to update job search status.": "Impossible de mettre à jour le statut de recherche.",
  "Personal information saved.": "Informations personnelles enregistrées.",
  "Failed to save personal information.": "Impossible d'enregistrer les informations personnelles.",
  "Failed to load profile details.": "Impossible de charger les détails du profil.",
  "Failed to load CV media.": "Impossible de charger les médias du CV.",
  "Failed to load CV details.": "Impossible de charger les détails du CV.",
  "Work Experiences": "Expériences professionnelles",
  "Add Work Experience": "Ajouter une expérience",
  "Edit Work Experience": "Modifier l'expérience",
  "Delete work experience": "Supprimer l'expérience",
  "Loading work experiences...": "Chargement des expériences...",
  "Work experience saved successfully.": "Expérience enregistrée.",
  "Work experience updated successfully.": "Expérience mise à jour.",
  "Work experience deleted.": "Expérience supprimée.",
  "Failed to save work experience.": "Impossible d'enregistrer l'expérience.",
  "Failed to delete work experience.": "Impossible de supprimer l'expérience.",
  "Client / Business Name": "Client / Entreprise",
  "Client / Business name is required.": "Le client / l'entreprise est obligatoire.",
  "Job title is required.": "Le poste est obligatoire.",
  "Job description is required.": "La description est obligatoire.",
  "Currently working": "J'y travaille actuellement",
  "Select Work Type": "Sélectionner le type de travail",
  "Search city": "Rechercher une ville",
  "Select City": "Sélectionner une ville",
  "Select city.": "Sélectionnez une ville.",
  "Last Net Salary**": "Dernier salaire net**",
  "Net salary is required.": "Le salaire net est obligatoire.",
  "Net salary must be a valid number.": "Le salaire doit être un nombre valide.",
  "Select Currency": "Sélectionner la devise",
  "Select a currency for salary.": "Sélectionnez une devise pour le salaire.",
  "Select work type.": "Sélectionnez un type de travail.",
  "End date cannot be before start date.": "La date de fin ne peut pas précéder la date de début.",
  "Passports": "Passeports",
  "Add Passport": "Ajouter un passeport",
  "Edit Passport": "Modifier le passeport",
  "Delete passport": "Supprimer le passeport",
  "Loading passports...": "Chargement des passeports...",
  "Passport saved successfully.": "Passeport enregistré.",
  "Passport updated successfully.": "Passeport mis à jour.",
  "Passport deleted.": "Passeport supprimé.",
  "Failed to save passport.": "Impossible d'enregistrer le passeport.",
  "Failed to delete passport.": "Impossible de supprimer le passeport.",
  "Expiry": "Expiration",
  "Expiry Date": "Date d'expiration",
  "Select Country": "Sélectionner un pays",
  "Select country.": "Sélectionnez un pays.",
  "Select an expiry date.": "Sélectionnez une date d'expiration.",
  "Foreign Language": "Langue étrangère",
  "Add Foreign Language": "Ajouter une langue",
  "Edit Foreign Language": "Modifier la langue",
  "Delete foreign language": "Supprimer la langue",
  "Loading foreign languages...": "Chargement des langues...",
  "Foreign language saved successfully.": "Langue enregistrée.",
  "Foreign language updated successfully.": "Langue mise à jour.",
  "Foreign language deleted.": "Langue supprimée.",
  "Failed to save foreign language.": "Impossible d'enregistrer la langue.",
  "Failed to delete foreign language.": "Impossible de supprimer la langue.",
  "Select Foreign Language": "Sélectionner une langue",
  "Select Level": "Sélectionner le niveau",
  "Enter a level.": "Saisissez un niveau.",
  "Level must be between 1 and 10.": "Le niveau doit être entre 1 et 10.",
  "Search language": "Rechercher une langue",
  "High School Information": "Informations lycée",
  "Add High School Information": "Ajouter un lycée",
  "Edit High School Information": "Modifier le lycée",
  "Delete high school information": "Supprimer le lycée",
  "Loading high school information...": "Chargement des informations lycée...",
  "High school information saved successfully.": "Informations lycée enregistrées.",
  "High school information updated successfully.": "Informations lycée mises à jour.",
  "High school information deleted.": "Informations lycée supprimées.",
  "Failed to save high school information.": "Impossible d'enregistrer le lycée.",
  "Failed to delete high school information.": "Impossible de supprimer le lycée.",
  "High School Type": "Type de lycée",
  "High School Name": "Nom du lycée",
  "Select High School Type": "Sélectionner le type de lycée",
  "Select high school type.": "Sélectionnez un type de lycée.",
  "High school name is required.": "Le nom du lycée est obligatoire.",
  "University Information": "Informations universitaires",
  "Add University Information": "Ajouter une université",
  "Edit University Information": "Modifier l'université",
  "Delete university information": "Supprimer l'université",
  "Loading university information...": "Chargement des informations universitaires...",
  "University information saved successfully.": "Université enregistrée.",
  "University information updated successfully.": "Université mise à jour.",
  "University information deleted.": "Université supprimée.",
  "Failed to save university information.": "Impossible d'enregistrer l'université.",
  "Failed to delete university information.": "Impossible de supprimer l'université.",
  "Select University": "Sélectionner une université",
  "Search university": "Rechercher une université",
  "Select Department": "Sélectionner un département",
  "Search department": "Rechercher un département",
  "Education Status": "Statut d'études",
  "Education Level": "Niveau d'études",
  "Education Type": "Type d'études",
  "Select Education Status": "Sélectionner le statut d'études",
  "Select Education Level": "Sélectionner le niveau d'études",
  "Select Education Type": "Sélectionner le type d'études",
  "Select university.": "Sélectionnez une université.",
  "Select department.": "Sélectionnez un département.",
  "Select education status.": "Sélectionnez un statut d'études.",
  "Select education level.": "Sélectionnez un niveau d'études.",
  "Select education type.": "Sélectionnez un type d'études.",
  "Add Reference": "Ajouter une référence",
  "Edit Reference": "Modifier la référence",
  "Delete reference": "Supprimer la référence",
  "Loading references...": "Chargement des références...",
  "Reference saved successfully.": "Référence enregistrée.",
  "Reference updated successfully.": "Référence mise à jour.",
  "Reference deleted.": "Référence supprimée.",
  "Failed to save reference.": "Impossible d'enregistrer la référence.",
  "Failed to delete reference.": "Impossible de supprimer la référence.",
  "Company Name": "Entreprise",
  "Company name is required.": "L'entreprise est obligatoire.",
  "Phone": "Téléphone",
  "Phone is required.": "Le téléphone est obligatoire.",
  "Email": "E-mail",
  "Email is required.": "L'e-mail est obligatoire.",
  "Enter a valid phone number.": "Saisissez un téléphone valide.",
  "Enter a valid email.": "Saisissez un e-mail valide.",
  "Important Information": "Informations importantes",
  "Loading important information...": "Chargement des informations importantes...",
  "Important information updated successfully.": "Informations importantes mises à jour.",
  "Failed to load important information.": "Impossible de charger les informations importantes.",
  "Failed to update important information.": "Impossible de mettre à jour les informations importantes.",
  "Multiple choice": "Choix multiple",
  "Yes / No": "Oui / Non",
  "If you close your account, this action cannot be undone.": "Si vous fermez votre compte, cette action est irréversible.",
  "Unknown error.": "Erreur inconnue.",
  "Select a start date.": "Sélectionnez une date de début.",
  "Select an end date.": "Sélectionnez une date de fin.",
  "You can select multiple countries. The hidden value is stored as an id list.": "Vous pouvez sélectionner plusieurs pays. La valeur cachée est stockée comme liste d'ids.",
  "Loading nationalities...": "Chargement des nationalités...",
  "Yes": "Oui",
  "No": "Non",
  "Update": "Mettre à jour"
});

Object.assign(SETTINGS_INLINE_TRANSLATIONS.ru ??= {}, {
  "Failed to load work experience data.": "Не удалось загрузить данные опыта работы.",
  "Failed to load foreign language data.": "Не удалось загрузить данные иностранных языков.",
  "Failed to load passports.": "Не удалось загрузить паспорта.",
  "Failed to load references.": "Не удалось загрузить рекомендации.",
  "Failed to load high school data.": "Не удалось загрузить данные школы.",
  "Failed to load university data.": "Не удалось загрузить данные университета.",
  "Photo": "Фото",
  "About": "О себе",
  "Passport": "Паспорт",
  "University": "Университет",
  "Qualifications": "Квалификации",
  "Preferences": "Предпочтения",
  "Select foreign language.": "Выберите иностранный язык.",
  "Name is required.": "Имя обязательно.",
  "Surname is required.": "Фамилия обязательна.",
  "Saving...": "Сохранение...",
  "Save": "Сохранить",
  "On": "Вкл.",
  "Off": "Выкл.",
  "Gender": "Пол",
  "Male": "Мужчина",
  "Female": "Женщина",
  "Nationality": "Гражданство",
  "Single": "Холост/не замужем",
  "Married": "Женат/замужем",
  "Edit work experience": "Редактировать опыт работы",
  "City": "Город",
  "Currency": "Валюта",
  "**Salary information is only used for statistics and will not be shown in your CV.": "**Информация о зарплате используется только для статистики и не будет отображаться в вашем CV.",
  "Cancel": "Отмена",
  "Edit passport": "Редактировать паспорт",
  "Country": "Страна",
  "Level": "Уровень",
  "Edit foreign language": "Редактировать язык",
  "Edit high school information": "Редактировать школу",
  "Edit university information": "Редактировать университет",
  "Department": "Отделение",
  "Edit reference": "Редактировать рекомендацию",
  "Name": "Имя",
  "Surname": "Фамилия"
});
Object.assign(SETTINGS_INLINE_TRANSLATIONS.es ??= {}, {
  "Failed to load work experience data.": "No se pudieron cargar los datos de experiencia.",
  "Failed to load foreign language data.": "No se pudieron cargar los idiomas.",
  "Failed to load passports.": "No se pudieron cargar los pasaportes.",
  "Failed to load references.": "No se pudieron cargar las referencias.",
  "Failed to load high school data.": "No se pudieron cargar los datos de secundaria.",
  "Failed to load university data.": "No se pudieron cargar los datos universitarios.",
  "Photo": "Foto",
  "About": "Sobre mí",
  "Passport": "Pasaporte",
  "University": "Universidad",
  "Qualifications": "Cualificaciones",
  "Preferences": "Preferencias",
  "Select foreign language.": "Selecciona idioma extranjero.",
  "Name is required.": "El nombre es obligatorio.",
  "Surname is required.": "El apellido es obligatorio.",
  "Saving...": "Guardando...",
  "Save": "Guardar",
  "On": "Activado",
  "Off": "Desactivado",
  "Gender": "Género",
  "Male": "Hombre",
  "Female": "Mujer",
  "Nationality": "Nacionalidad",
  "Single": "Soltero/a",
  "Married": "Casado/a",
  "Edit work experience": "Editar experiencia",
  "City": "Ciudad",
  "Currency": "Moneda",
  "**Salary information is only used for statistics and will not be shown in your CV.": "**La información salarial solo se usa para estadísticas y no se mostrará en tu CV.",
  "Cancel": "Cancelar",
  "Edit passport": "Editar pasaporte",
  "Country": "País",
  "Level": "Nivel",
  "Edit foreign language": "Editar idioma",
  "Edit high school information": "Editar secundaria",
  "Edit university information": "Editar universidad",
  "Department": "Departamento",
  "Edit reference": "Editar referencia",
  "Name": "Nombre",
  "Surname": "Apellido"
});
Object.assign(SETTINGS_INLINE_TRANSLATIONS.fr ??= {}, {
  "Failed to load work experience data.": "Impossible de charger les expériences.",
  "Failed to load foreign language data.": "Impossible de charger les langues.",
  "Failed to load passports.": "Impossible de charger les passeports.",
  "Failed to load references.": "Impossible de charger les références.",
  "Failed to load high school data.": "Impossible de charger les données du lycée.",
  "Failed to load university data.": "Impossible de charger les données universitaires.",
  "Photo": "Photo",
  "About": "À propos",
  "Passport": "Passeport",
  "University": "Université",
  "Qualifications": "Qualifications",
  "Preferences": "Préférences",
  "Select foreign language.": "Sélectionnez une langue étrangère.",
  "Name is required.": "Le prénom est obligatoire.",
  "Surname is required.": "Le nom est obligatoire.",
  "Saving...": "Enregistrement...",
  "Save": "Enregistrer",
  "On": "Activé",
  "Off": "Désactivé",
  "Gender": "Genre",
  "Male": "Homme",
  "Female": "Femme",
  "Nationality": "Nationalité",
  "Single": "Célibataire",
  "Married": "Marié(e)",
  "Edit work experience": "Modifier l'expérience",
  "City": "Ville",
  "Currency": "Devise",
  "**Salary information is only used for statistics and will not be shown in your CV.": "**Les informations salariales sont utilisées uniquement pour les statistiques et ne seront pas affichées dans votre CV.",
  "Cancel": "Annuler",
  "Edit passport": "Modifier le passeport",
  "Country": "Pays",
  "Level": "Niveau",
  "Edit foreign language": "Modifier la langue",
  "Edit high school information": "Modifier le lycée",
  "Edit university information": "Modifier l'université",
  "Department": "Département",
  "Edit reference": "Modifier la référence",
  "Name": "Prénom",
  "Surname": "Nom"
});

Object.assign(SETTINGS_INLINE_TRANSLATIONS.ru ??= {}, {
  "Verified": "Подтверждено",
  "Add your license status and issue date.": "Добавьте статус водительских прав и дату выдачи.",
  "Add your military status and date if applicable.": "Добавьте военный статус и дату, если применимо."
});
Object.assign(SETTINGS_INLINE_TRANSLATIONS.es ??= {}, {
  "Verified": "Verificado",
  "Add your license status and issue date.": "Agrega el estado de tu licencia y la fecha de emisión.",
  "Add your military status and date if applicable.": "Agrega tu estado militar y la fecha si corresponde."
});
Object.assign(SETTINGS_INLINE_TRANSLATIONS.fr ??= {}, {
  "Verified": "Vérifié",
  "Add your license status and issue date.": "Ajoutez le statut de votre permis et sa date d'emission.",
  "Add your military status and date if applicable.": "Ajoutez votre statut militaire et la date si applicable."
});

function translateSettingsValue(value: string, lang: Lang): string {
  if (lang === "tr" || lang === "en") return value;
  return SETTINGS_INLINE_TRANSLATIONS[lang]?.[value] ?? value;
}

type CustomerSaveUcretHizmetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: { Nr?: number } | null;
};

type CvMediaSlotKey = "image2" | "image3" | "video";

type CustomerDeleteResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: unknown;
};

type CustomerChangePasswordResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
};

type AboutFormState = {
  hakkimda: string;
};

type JobSearchFormState = {
  isaramaDurumu: string;
};

type PersonalInfoFormState = {
  cinsiyet: string;
  tc: string;
  dogumTarihi: string;
  uyruklar: string;
  medeniDurumu: string;
};

type CustomerConfirmEmailResponse = {
  message?: string;
  email?: string;
  expireSeconds?: number;
  dil?: number;
};

type CustomerConfirmEmailVerifyResponse = {
  StatusCode?: number;
  Message?: string;
  message?: string;
  Data?: unknown;
};

type CustomerNewEmailResponse = {
  message?: string;
  email?: string;
  expireSeconds?: number;
  dil?: number;
};

type CustomerNewEmailVerifyResponse = {
  StatusCode?: number;
  Message?: string;
  message?: string;
  Data?: unknown;
};

type CustomerNewPhoneNumberResponse = {
  message?: string;
  countryCode?: string;
  phone?: string;
  expireSeconds?: number;
  dil?: number;
};

type CustomerNewPhoneNumberVerifyResponse = {
  StatusCode?: number;
  Message?: string;
  message?: string;
  Data?: unknown;
};

type CustomerConfirmPhoneNumberResponse = {
  message?: string;
  countryCode?: string;
  phone?: string;
  expireSeconds?: number;
  dil?: number;
};

type CustomerConfirmPhoneNumberVerifyResponse = {
  StatusCode?: number;
  Message?: string;
  message?: string;
  Data?: unknown;
};

type SupportCreateResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
};

type NotificationStatusResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    BildirimAcikDurumu?: boolean;
  } | null;
};

type OrderHistoryItem = {
  Nr?: number;
  MuspaketPaketNr?: number;
  MuspaketCoin?: number;
  MuspaketFiyat?: number;
  OlusturmaZamani?: string;
  PaketAdi?: string;
  PaketAciklama?: string;
  PaketCoin?: number;
  PaketFiyat?: number;
  DovizAdi?: string;
  DovizKisaAdi?: string;
  DovizSembol?: string;
};

type OrderHistoryResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: OrderHistoryItem[] | null;
};

type StorePackageItem = {
  Nr?: number;
  PaketAdi?: string;
  PaketCoin?: number;
  PaketFiyat?: number;
  PaketAciklama?: string;
  DovizAdi?: string;
  DovizKisaAdi?: string;
  "DovizKısaAdi"?: string;
  DovizSembol?: string;
  DovizSembolu?: string;
};

type StorePackagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: StorePackageItem[] | null;
};

type MissionItem = {
  Nr?: number;
  GorevAdi?: string;
  GorevAciklamasi?: string;
  GorevAdres?: string;
  GorevResim?: string;
  GorevCoin?: number;
  Aktif?: boolean;
  GorevDone?: boolean;
};

type MissionsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: MissionItem[] | null;
};

type PrivacyItem = {
  Nr?: number;
  Baslik?: string;
  Detay?: string;
  Aciklama?: string;
  Aktif?: boolean;
};

type PrivacyGetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: PrivacyItem[] | null;
};

type CountryItem = {
  Id?: number;
  UlkeAdi?: string;
  TelKodu?: string;
  ResimUrl?: string;
};

type CountriesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CountryItem[] | null;
};

type WorkExperienceItem = {
  Nr?: number;
  MusisMusteriNr?: number;
  IlId?: number;
  IlAdi?: string;
  CalismaSekilId?: number;
  CalismaSekilAdi?: string;
  MusisIsyeriAdi?: string;
  MusisIsAdi?: string;
  MusisIsTanimi?: string;
  MusisBaslamaTarihi?: string;
  MusisBitisTarihi?: string;
  MusisHalenCalisiyor?: boolean;
  MusisNetMaas?: number;
  DovizId?: number;
  DovizAdi?: string;
};

type WorkExperienceResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: WorkExperienceItem[] | null;
};

type CreateWorkExperienceResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
  message?: string;
};

type WorkTypeItem = {
  Id?: number;
  CalismaSekliAdi?: string;
  Sira?: number;
};

type WorkTypesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: WorkTypeItem[] | null;
};

type CityItem = {
  Id?: number;
  UlkeId?: number;
  UlkeAdi?: string;
  IlAdi?: string;
  IlTelKodu?: string;
  IlTrafikKodu?: string;
};

type CitiesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CityItem[] | null;
};

type CurrencyItem = {
  Id?: number;
  DovizAdi?: string;
  DovizKisaAdi?: string;
  DovizSembol?: string;
  Aciklama?: string;
};

type CurrenciesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CurrencyItem[] | null;
};

type SaveWorkExperienceRequest = {
  Id: number;
  IlId: number;
  CalismaSekilId: number;
  IsyeriAdi: string;
  IsAdi: string;
  IsTanimi: string;
  BaslamaTarihi: string;
  BitisTarihi: string | null;
  HalenCalisiyor: boolean;
  NetMaas: number | null;
  DovizId: number;
};

type WorkExperienceFormState = {
  isyeriAdi: string;
  isAdi: string;
  baslamaTarihi: string;
  bitisTarihi: string;
  halenCalisiyor: boolean;
  calismaSekilId: number | null;
  ilId: number | null;
  isTanimi: string;
  netMaas: string;
  dovizId: number | null;
};

type CustomerUniversityItem = {
  Nr?: number;
  MusteriId?: number;
  UlkeId?: number;
  UlkeAdi?: string;
  UniversiteId?: number;
  UniversiteAdi?: string;
  BolumId?: number;
  BolumAdi?: string;
  YdilId?: number;
  YdilAdi?: string;
  EgitimDurumId?: number;
  EgitimDurumAdi?: string;
  EgitimId?: number;
  EgitimAdi?: string;
  EgitimTipId?: number;
  EgitimTipAdi?: string;
  MusuniBaslamaTarihi?: string;
  MusuniBitisTarihi?: string;
};

type CustomerUniversitiesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerUniversityItem[] | null;
};

type SaveCustomerUniversityResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
  message?: string;
};

type BasicLookupItem = {
  Id?: number;
  Adi?: string;
  EhliyetAdi?: string;
  AskerlikAdi?: string;
  DilAdi?: string;
  YdilAdi?: string;
  EgitimDurumAdi?: string;
  EgitimdurumAdi?: string;
  EgitimAdi?: string;
  EgitimTipAdi?: string;
  Sira?: number;
};

type UniversityOptionItem = {
  Id?: number;
  UlkeId?: number;
  UniversiteAdi?: string;
};

type DepartmentOptionItem = {
  Id?: number;
  BolumAdi?: string;
};

type BasicLookupResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: BasicLookupItem[] | null;
};

type CustomerExpectationServiceGroupsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerExpectationServiceGroupItem[] | null;
};

type UniversityOptionsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: UniversityOptionItem[] | null;
};

type DepartmentOptionsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: DepartmentOptionItem[] | null;
};

type SaveCustomerUniversityRequest = {
  Id: number;
  UlkeId: number;
  UniversiteId: number;
  BolumId: number;
  YdilId: number;
  EgitimDurumId: number;
  EgitimId: number;
  EgitimTipId: number;
  BaslamaTarihi: string;
  BitisTarihi: string;
};

type CustomerUniversityFormState = {
  ulkeId: number | null;
  universiteId: number | null;
  bolumId: number | null;
  ydilId: number | null;
  egitimDurumId: number | null;
  egitimId: number | null;
  egitimTipId: number | null;
  baslamaTarihi: string;
  bitisTarihi: string;
};

type CustomerHighSchoolItem = {
  Nr?: number;
  MusteriId?: number;
  UlkeId?: number;
  UlkeAdi?: string;
  LiseTipId?: number;
  LiseTipAdi?: string;
  MusliseLiseAdi?: string;
  MusliseBaslamaTarihi?: string;
  MusliseBitisTarihi?: string;
};

type CustomerHighSchoolsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerHighSchoolItem[] | null;
};

type SaveCustomerHighSchoolResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
  message?: string;
};

type SaveCustomerHighSchoolRequest = {
  Id: number;
  UlkeId: number;
  LiseTipId: number;
  LiseAdi: string;
  BaslamaTarihi: string;
  BitisTarihi: string;
};

type CustomerHighSchoolFormState = {
  ulkeId: number | null;
  liseTipId: number | null;
  liseAdi: string;
  baslamaTarihi: string;
  bitisTarihi: string;
};

type CustomerReferenceItem = {
  Nr?: number;
  MusteriId?: number;
  MusrefAd?: string;
  MusrefSoyad?: string;
  MusrefIsyeriAdi?: string;
  MusrefTel?: string;
  MusrefEmail?: string;
};

type CustomerReferencesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerReferenceItem[] | null;
};

type SaveCustomerReferenceResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
  message?: string;
};

type SaveCustomerReferenceRequest = {
  Id: number;
  Ad: string;
  Soyad: string;
  IsyeriAdi: string;
  Tel: string;
  Email: string;
};

type CustomerReferenceFormState = {
  ad: string;
  soyad: string;
  isyeriAdi: string;
  tel: string;
  email: string;
};

type CustomerPassportItem = {
  Nr?: number;
  MusteriId?: number;
  UlkeId?: number;
  UlkeAdi?: string;
  MuspasaportGecerlilikTarihi?: string;
};

type CustomerPassportsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerPassportItem[] | null;
};

type SaveCustomerPassportResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
  message?: string;
};

type SaveCustomerPassportRequest = {
  Id: number;
  UlkeId: number;
  GecerlilikTarihi: string;
};

type CustomerPassportFormState = {
  ulkeId: number | null;
  gecerlilikTarihi: string;
};

type CustomerLicenseFormState = {
  ehliyetVarmi: string;
  ehliyetId: number | null;
  ehliyetTarihi: string;
};

type CustomerMilitaryFormState = {
  askerlikId: number | null;
  askerlikTarihi: string;
};

type CustomerExpectationFormState = {
  hizmetGrupIdList: number[];
  ucretAciklama: string;
  ucretBeklenti: string;
  dovizId: number | null;
};

type CustomerForeignLanguageItem = {
  Nr?: number;
  MusteriId?: number;
  YdilId?: number;
  YdilAdi?: string;
  Seviye?: string | number;
};

type CustomerForeignLanguagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerForeignLanguageItem[] | null;
};

type SaveCustomerForeignLanguageResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
  message?: string;
};

type SaveCustomerForeignLanguageRequest = {
  Id: number;
  YdilId: number;
  Seviye: number;
};

type CustomerForeignLanguageFormState = {
  ydilId: number | null;
  seviye: string;
};

type CustomerFeatureItem = {
  Nr?: number;
  MusteriId?: number;
  SecenekId?: number;
  SecenekAdi?: string;
  GrupSecenekId?: number;
  GrupSecenekAdi?: string;
  Tek?: boolean;
  Eh?: boolean;
  SecenekSira?: number;
  GrupSecenekSira?: number;
};

type CustomerFeaturesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerFeatureItem[] | null;
};

type SaveCustomerFeatureResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
  message?: string;
};

type SaveCustomerFeatureRequest = {
  Id: number;
  SecenekId: number;
  Eh: boolean;
};

type FeatureGroupOptionItem = {
  Id?: number;
  GrupSecenekId?: number;
  SecenekAdi?: string;
  Sira?: number;
};

type FeatureGroupItem = {
  Id?: number;
  GrupSecenekAdi?: string;
  Sira?: number;
  Tek?: boolean;
  Secenekler?: FeatureGroupOptionItem[] | null;
};

type FeatureGroupsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: FeatureGroupItem[] | null;
};

type ProfileFormState = {
  ad: string;
  soyad: string;
  ilNr: number | null;
};

type SettingTabKey =
  | "profile"
  | "resume"
  | "missions"
  | "store"
  | "orderHistory"
  | "language"
  | "contact"
  | "sound"
  | "privacy"
  | "terms";

function isSettingTabKey(value: string | null | undefined): value is SettingTabKey {
  return (
    value === "profile" ||
    value === "resume" ||
    value === "missions" ||
    value === "store" ||
    value === "orderHistory" ||
    value === "language" ||
    value === "contact" ||
    value === "sound" ||
    value === "privacy" ||
    value === "terms"
  );
}

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_VERIFY_CODE_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_CHARS_REGEX = /^[+\d\s()-]+$/;
const FOREIGN_LANGUAGE_LEVEL_REGEX = /^(10|[1-9])$/;
const SUPPORT_MESSAGE_MIN_LENGTH = 3;
const SUPPORT_MESSAGE_MAX_LENGTH = 255;
const COUNTRY_LOAD_TIMEOUT_MS = 15000;
function getPasswordValidation(password: string, confirmPassword: string) {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasUpperAndLowerCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);
  const matches = password.length > 0 && password === confirmPassword;

  return {
    hasMinLength,
    hasUpperAndLowerCase,
    hasDigit,
    hasSymbol,
    matches,
    isValid: hasMinLength && hasUpperAndLowerCase && hasDigit && hasSymbol && matches,
  };
}

function formatCountdown(value: number): string {
  const totalSeconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatPhone(value: string | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return value;
}

function digitsOnly(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function isValidPhoneNumber(value: string | undefined): boolean {
  const phone = (value ?? "").trim();
  if (!phone || !PHONE_ALLOWED_CHARS_REGEX.test(phone)) return false;
  const digits = digitsOnly(phone);
  return digits.length >= 10 && digits.length <= 15;
}

function isValidForeignLanguageLevel(value: string | undefined): boolean {
  return FOREIGN_LANGUAGE_LEVEL_REGEX.test((value ?? "").trim());
}

function normalizeCountries(data?: CountriesResponse): CountryItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function hasCountryId(item: CountryItem): item is CountryItem & { Id: number } {
  return typeof item.Id === "number";
}

function countryDisplay(item: CountryItem): string {
  const name = (item.UlkeAdi ?? "").trim() || "-";
  const code = (item.TelKodu ?? "").trim().replace(/^\+/, "");
  return code ? `${name} (+${code})` : name;
}

function normalizeWorkTypes(data?: WorkTypesResponse): WorkTypeItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function normalizeCities(data?: CitiesResponse): CityItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function normalizeCurrencies(data?: CurrenciesResponse): CurrencyItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function normalizeBasicLookup(data?: BasicLookupResponse): BasicLookupItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function normalizeUniversityOptions(data?: UniversityOptionsResponse): UniversityOptionItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function normalizeDepartmentOptions(data?: DepartmentOptionsResponse): DepartmentOptionItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function normalizeFeatureGroups(data?: FeatureGroupsResponse): FeatureGroupItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data
    .filter((group) => typeof group?.Id === "number")
    .map((group) => ({
      ...group,
      Secenekler: Array.isArray(group?.Secenekler)
        ? group.Secenekler.filter((option) => typeof option?.Id === "number")
        : [],
    }));
}

function basicLookupLabel(item: BasicLookupItem): string {
  return (
    item.Adi ??
    item.EhliyetAdi ??
    item.AskerlikAdi ??
    item.DilAdi ??
    item.YdilAdi ??
    item.EgitimDurumAdi ??
    item.EgitimdurumAdi ??
    item.EgitimAdi ??
    item.EgitimTipAdi ??
    ""
  )
    .trim();
}

function formatDateForInput(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

{/*function formatDateForPicker(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}*/}

function formatDateForPicker(value: string | undefined): string {
  //console.log("formatDateForPicker input:", value);

  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const onlyDate = value.slice(0, 10);
    //console.log("formatDateForPicker output:", onlyDate);
    return onlyDate;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  const result = `${year}-${month}-${day}`;
  //console.log("formatDateForPicker output:", result);

  return result;
}

{/*}
function parseDateInputToIso(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  let day: number;
  let month: number;
  let year: number;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    const cleaned = raw.replace(/\//g, ".").replace(/-/g, ".");
    const match = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return null;
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  }

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date.toISOString();
}
*/}

function parseDateInputToIso(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  let day: number;
  let month: number;
  let year: number;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    const cleaned = raw.replace(/\//g, ".").replace(/-/g, ".");
    const match = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (!match) return null;

    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  }

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
const SETTINGS_DATE_PICKER_I18N: Record<
  Lang,
  {
    months: string[];
    weekdays: string[];
    today: string;
    clear: string;
    selectDate: string;
    previousMonth: string;
    nextMonth: string;
  }
> = {
  tr: {
    months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    weekdays: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    today: "Bugün",
    clear: "Temizle",
    selectDate: "Tarih seç",
    previousMonth: "Önceki ay",
    nextMonth: "Sonraki ay",
  },
  en: {
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    today: "Today",
    clear: "Clear",
    selectDate: "Select date",
    previousMonth: "Previous month",
    nextMonth: "Next month",
  },
  ru: {
    months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    today: "Сегодня",
    clear: "Очистить",
    selectDate: "Выберите дату",
    previousMonth: "Предыдущий месяц",
    nextMonth: "Следующий месяц",
  },
  es: {
    months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    today: "Hoy",
    clear: "Limpiar",
    selectDate: "Seleccionar fecha",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
  },
  fr: {
    months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    today: "Aujourd'hui",
    clear: "Effacer",
    selectDate: "Sélectionner une date",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
  },
};

function parsePickerDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function formatPickerValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthDays(viewDate: Date): Date[] {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function LocalizedDatePicker({
  value,
  onChange,
  lang,
  className,
  disabled,
  buttonRef,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  lang: Lang;
  className: string;
  disabled?: boolean;
  buttonRef?: React.MutableRefObject<HTMLButtonElement | null>;
}) {
  const locale = localeForLang(lang);
  const copy = SETTINGS_DATE_PICKER_I18N[lang] ?? SETTINGS_DATE_PICKER_I18N.en;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parsePickerDate(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate]);
  const todayValue = formatPickerValue(new Date());
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" })
    : copy.selectDate;

  const moveMonth = (amount: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  const selectDate = (date: Date) => {
    onChange(formatPickerValue(date));
    setViewDate(date);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={(node) => {
          if (buttonRef) buttonRef.current = node;
        }}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={clsx(
          className,
          "flex min-h-12 items-center justify-between gap-3 text-left",
          disabled && "cursor-not-allowed opacity-70"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={clsx("truncate", selectedDate ? "text-[#1f2937]" : "text-[#8b95a7]")}>
          {displayValue}
        </span>
        <CalendarDays size={18} className="shrink-0 text-[#66738e]" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={copy.selectDate}
          className="absolute left-0 top-[calc(100%+8px)] z-40 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-[#d7dbe3] bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-xl p-2 text-[#66738e] transition hover:bg-[#f3f4f7] hover:text-[#1f232b]"
              aria-label={copy.previousMonth}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-[15px] font-semibold text-[#1f232b]">
              {copy.months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-xl p-2 text-[#66738e] transition hover:bg-[#f3f4f7] hover:text-[#1f232b]"
              aria-label={copy.nextMonth}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {copy.weekdays.map((day) => (
              <div key={day} className="py-1 text-[11px] font-semibold uppercase text-[#8b95a7]">
                {day}
              </div>
            ))}
            {monthDays.map((date) => {
              const pickerValue = formatPickerValue(date);
              const inMonth = date.getMonth() === viewDate.getMonth();
              const selected = value === pickerValue;
              const isToday = todayValue === pickerValue;
              return (
                <button
                  key={pickerValue}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={clsx(
                    "grid h-9 place-items-center rounded-xl text-[13px] font-semibold transition",
                    selected
                      ? "bg-[var(--gtg-orange)] text-white"
                      : isToday
                      ? "bg-[#fff4dd] text-[#1f232b]"
                      : inMonth
                      ? "text-[#2a313d] hover:bg-[#f4f7fb]"
                      : "text-[#b5bdca] hover:bg-[#f8fafc]"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between gap-2 border-t border-[#edf0f5] pt-3">
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="rounded-xl px-3 py-2 text-[13px] font-semibold text-[var(--gtg-orange)] transition hover:bg-[#fff4dd]"
            >
              {copy.today}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-xl px-3 py-2 text-[13px] font-semibold text-[#66738e] transition hover:bg-[#f3f4f7]"
            >
              {copy.clear}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function parseMoneyToNumber(value: string): number | null {
  const cleaned = value.trim().replace(/\s+/g, "").replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeLooseScalar(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeSwitchState(value: unknown): string {
  const normalized = normalizeLooseScalar(value).toLocaleLowerCase("tr-TR");
  if (!normalized) return "0";
  if (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "evet" ||
    normalized === "açık" ||
    normalized === "acik" ||
    normalized === "aktif"
  ) {
    return "1";
  }
  if (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "hayır" ||
    normalized === "hayir" ||
    normalized === "kapalı" ||
    normalized === "kapali" ||
    normalized === "pasif"
  ) {
    return "0";
  }
  return normalized;
}

function normalizeLooseRequestValue(value: string): string | number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

function normalizeDelimitedValues(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveCountryIdsFromStoredValue(value: string | undefined, countries: CountryItem[]): number[] {
  const tokens = normalizeDelimitedValues(value);
  if (tokens.length === 0) return [];

  const ids = new Set<number>();
  for (const token of tokens) {
    const normalized = token.toLocaleLowerCase("tr-TR");
    const numericToken = Number(token);
    const matched = countries.find((item) => {
      if (!hasCountryId(item)) return false;
      const itemName = (item.UlkeAdi ?? "").trim().toLocaleLowerCase("tr-TR");
      return item.Id === numericToken || itemName === normalized;
    });

    if (matched?.Id) {
      ids.add(matched.Id);
    }
  }

  return Array.from(ids);
}

function serializeCountryIds(ids: number[]): string {
  return ids.join(",");
}

function validateName(value: string): "required" | "min" | "max" | null {
  const length = value.trim().length;
  if (length === 0) return "required";
  if (length < NAME_MIN_LENGTH) return "min";
  if (length > NAME_MAX_LENGTH) return "max";
  return null;
}

function validateSupportMessage(value: string): "required" | "min" | "max" | null {
  const length = value.trim().length;
  if (length === 0) return "required";
  if (length < SUPPORT_MESSAGE_MIN_LENGTH) return "min";
  if (length > SUPPORT_MESSAGE_MAX_LENGTH) return "max";
  return null;
}

function sanitizePolicyHtml(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function formatOrderDate(value: string | undefined, locale: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const EMPTY_WORK_EXPERIENCE_FORM: WorkExperienceFormState = {
  isyeriAdi: "",
  isAdi: "",
  baslamaTarihi: "",
  bitisTarihi: "",
  halenCalisiyor: false,
  calismaSekilId: null,
  ilId: null,
  isTanimi: "",
  netMaas: "",
  dovizId: null,
};

const EMPTY_CUSTOMER_UNIVERSITY_FORM: CustomerUniversityFormState = {
  ulkeId: null,
  universiteId: null,
  bolumId: null,
  ydilId: null,
  egitimDurumId: null,
  egitimId: null,
  egitimTipId: null,
  baslamaTarihi: "",
  bitisTarihi: "",
};

const EMPTY_CUSTOMER_HIGH_SCHOOL_FORM: CustomerHighSchoolFormState = {
  ulkeId: null,
  liseTipId: null,
  liseAdi: "",
  baslamaTarihi: "",
  bitisTarihi: "",
};

const EMPTY_CUSTOMER_REFERENCE_FORM: CustomerReferenceFormState = {
  ad: "",
  soyad: "",
  isyeriAdi: "",
  tel: "",
  email: "",
};

const EMPTY_CUSTOMER_PASSPORT_FORM: CustomerPassportFormState = {
  ulkeId: null,
  gecerlilikTarihi: "",
};

const EMPTY_CUSTOMER_FOREIGN_LANGUAGE_FORM: CustomerForeignLanguageFormState = {
  ydilId: null,
  seviye: "",
};

const EMPTY_CUSTOMER_LICENSE_FORM: CustomerLicenseFormState = {
  ehliyetVarmi: "0",
  ehliyetId: null,
  ehliyetTarihi: "",
};

const EMPTY_CUSTOMER_MILITARY_FORM: CustomerMilitaryFormState = {
  askerlikId: null,
  askerlikTarihi: "",
};

const EMPTY_CUSTOMER_EXPECTATION_FORM: CustomerExpectationFormState = {
  hizmetGrupIdList: [],
  ucretAciklama: "",
  ucretBeklenti: "",
  dovizId: null,
};

export default function SettingsPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { logout } = useAuth();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [activeTab, setActiveTab] = useState<SettingTabKey>("profile");
  const [form, setForm] = useState<ProfileFormState>({ ad: "", soyad: "", ilNr: null });
  const [initialForm, setInitialForm] = useState<ProfileFormState>({ ad: "", soyad: "", ilNr: null });
  const [profileCities, setProfileCities] = useState<CityItem[]>([]);
  const [profileCitiesLoading, setProfileCitiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const emailChangeInputRef = useRef<HTMLInputElement | null>(null);
  const emailChangeCodeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneChangeCountryButtonRef = useRef<HTMLButtonElement | null>(null);
  const phoneChangeCountryMenuRef = useRef<HTMLDivElement | null>(null);
  const workCityButtonRef = useRef<HTMLButtonElement | null>(null);
  const workCityMenuRef = useRef<HTMLDivElement | null>(null);
  const customerUniversityCountryButtonRef = useRef<HTMLButtonElement | null>(null);
  const customerUniversityCountryMenuRef = useRef<HTMLDivElement | null>(null);
  const customerUniversityOptionButtonRef = useRef<HTMLButtonElement | null>(null);
  const customerUniversityOptionMenuRef = useRef<HTMLDivElement | null>(null);
  const customerUniversityDepartmentButtonRef = useRef<HTMLButtonElement | null>(null);
  const customerUniversityDepartmentMenuRef = useRef<HTMLDivElement | null>(null);
  const customerUniversityLanguageButtonRef = useRef<HTMLButtonElement | null>(null);
  const customerUniversityLanguageMenuRef = useRef<HTMLDivElement | null>(null);
  const customerHighSchoolCountryButtonRef = useRef<HTMLButtonElement | null>(null);
  const customerHighSchoolCountryMenuRef = useRef<HTMLDivElement | null>(null);
  const customerHighSchoolStartDateInputRef = useRef<HTMLButtonElement | null>(null);
  const customerHighSchoolEndDateInputRef = useRef<HTMLButtonElement | null>(null);
  const customerPassportCountryButtonRef = useRef<HTMLButtonElement | null>(null);
  const customerPassportCountryMenuRef = useRef<HTMLDivElement | null>(null);
  const customerPassportDateInputRef = useRef<HTMLButtonElement | null>(null);
  const customerForeignLanguageButtonRef = useRef<HTMLButtonElement | null>(null);
  const customerForeignLanguageMenuRef = useRef<HTMLDivElement | null>(null);
  const phoneChangePhoneInputRef = useRef<HTMLInputElement | null>(null);
  const phoneChangeCodeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailVerifyCodeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneVerifyCodeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const changeImageButtonRef = useRef<HTMLButtonElement | null>(null);
  const extraImage2InputRef = useRef<HTMLInputElement | null>(null);
  const extraImage3InputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const aboutTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const jobSearchInputRef = useRef<HTMLButtonElement | null>(null);
  const personalTcInputRef = useRef<HTMLInputElement | null>(null);
  const personalBirthDateInputRef = useRef<HTMLButtonElement | null>(null);
  const personalInfoCountryButtonRef = useRef<HTMLButtonElement | null>(null);
  const personalInfoCountryMenuRef = useRef<HTMLDivElement | null>(null);
  const customerLicenseTypeInputRef = useRef<HTMLSelectElement | null>(null);
  const customerMilitaryTypeInputRef = useRef<HTMLSelectElement | null>(null);
  const customerExpectationCurrencyInputRef = useRef<HTMLSelectElement | null>(null);
  const customerLicenseDateInputRef = useRef<HTMLButtonElement | null>(null);
  const customerMilitaryDateInputRef = useRef<HTMLButtonElement | null>(null);
  const workStartDateInputRef = useRef<HTMLButtonElement | null>(null);
  const workEndDateInputRef = useRef<HTMLButtonElement | null>(null);
  const universityStartDateInputRef = useRef<HTMLButtonElement | null>(null);
  const universityEndDateInputRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveTabRef = useRef<SettingTabKey | null>(null);
  const [emailChangeModalOpen, setEmailChangeModalOpen] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState<1 | 2>(1);
  const [emailChangeSending, setEmailChangeSending] = useState(false);
  const [emailChangeVerifying, setEmailChangeVerifying] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeInfoMessage, setEmailChangeInfoMessage] = useState<string | null>(null);
  const [emailChangeValue, setEmailChangeValue] = useState("");
  const [emailChangeCode, setEmailChangeCode] = useState("");
  const [emailChangeExpireSecondsLeft, setEmailChangeExpireSecondsLeft] = useState(0);
  const [phoneChangeModalOpen, setPhoneChangeModalOpen] = useState(false);
  const [phoneChangeStep, setPhoneChangeStep] = useState<1 | 2>(1);
  const [phoneChangeSending, setPhoneChangeSending] = useState(false);
  const [phoneChangeVerifying, setPhoneChangeVerifying] = useState(false);
  const [phoneChangeError, setPhoneChangeError] = useState<string | null>(null);
  const [phoneChangeInfoMessage, setPhoneChangeInfoMessage] = useState<string | null>(null);
  const [phoneChangeCountries, setPhoneChangeCountries] = useState<CountryItem[]>([]);
  const [phoneChangeCountriesLoading, setPhoneChangeCountriesLoading] = useState(false);
  const [phoneChangeCountriesError, setPhoneChangeCountriesError] = useState<string | null>(null);
  const [phoneChangeCountryMenuOpen, setPhoneChangeCountryMenuOpen] = useState(false);
  const [phoneChangeCountrySearch, setPhoneChangeCountrySearch] = useState("");
  const [phoneChangeCountryId, setPhoneChangeCountryId] = useState<number | null>(null);
  const [phoneChangeCountryCode, setPhoneChangeCountryCode] = useState("");
  const [phoneChangePhone, setPhoneChangePhone] = useState("");
  const [phoneChangeCode, setPhoneChangeCode] = useState("");
  const [phoneChangeExpireSecondsLeft, setPhoneChangeExpireSecondsLeft] = useState(0);
  const [emailVerifyModalOpen, setEmailVerifyModalOpen] = useState(false);
  const [emailVerifySending, setEmailVerifySending] = useState(false);
  const [emailVerifyVerifying, setEmailVerifyVerifying] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState<string | null>(null);
  const [emailVerifyInfoMessage, setEmailVerifyInfoMessage] = useState<string | null>(null);
  const [emailVerifyEmail, setEmailVerifyEmail] = useState("");
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [emailVerifyExpireSecondsLeft, setEmailVerifyExpireSecondsLeft] = useState(0);
  const [phoneVerifyModalOpen, setPhoneVerifyModalOpen] = useState(false);
  const [phoneVerifySending, setPhoneVerifySending] = useState(false);
  const [phoneVerifyVerifying, setPhoneVerifyVerifying] = useState(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState<string | null>(null);
  const [phoneVerifyInfoMessage, setPhoneVerifyInfoMessage] = useState<string | null>(null);
  const [phoneVerifyCountryCode, setPhoneVerifyCountryCode] = useState("");
  const [phoneVerifyPhone, setPhoneVerifyPhone] = useState("");
  const [phoneVerifyCode, setPhoneVerifyCode] = useState("");
  const [phoneVerifyExpireSecondsLeft, setPhoneVerifyExpireSecondsLeft] = useState(0);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resultModal, setResultModal] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [shouldRefreshCustomerOnPopupClose, setShouldRefreshCustomerOnPopupClose] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const [customerMedia, setCustomerMedia] = useState<CustomerMediaData | null>(null);
  const [customerMediaLoading, setCustomerMediaLoading] = useState(false);
  const [customerMediaError, setCustomerMediaError] = useState<string | null>(null);
  const [customerMediaSuccess, setCustomerMediaSuccess] = useState<string | null>(null);
  const [customerMediaBusyKey, setCustomerMediaBusyKey] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [privacyItems, setPrivacyItems] = useState<PrivacyItem[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsItems, setTermsItems] = useState<PrivacyItem[]>([]);
  const [contactMessage, setContactMessage] = useState("");
  const [contactTouched, setContactTouched] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundSaving, setSoundSaving] = useState(false);
  const [soundError, setSoundError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [aboutForm, setAboutForm] = useState<AboutFormState>({ hakkimda: "" });
  const [initialAboutForm, setInitialAboutForm] = useState<AboutFormState>({ hakkimda: "" });
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutSaveError, setAboutSaveError] = useState<string | null>(null);
  const [aboutSaveSuccess, setAboutSaveSuccess] = useState<string | null>(null);
  const [jobSearchForm, setJobSearchForm] = useState<JobSearchFormState>({ isaramaDurumu: "" });
  const [initialJobSearchForm, setInitialJobSearchForm] = useState<JobSearchFormState>({ isaramaDurumu: "" });
  const [jobSearchSaving, setJobSearchSaving] = useState(false);
  const [jobSearchSaveError, setJobSearchSaveError] = useState<string | null>(null);
  const [jobSearchSaveSuccess, setJobSearchSaveSuccess] = useState<string | null>(null);
  const [personalInfoForm, setPersonalInfoForm] = useState<PersonalInfoFormState>({
    cinsiyet: "",
    tc: "",
    dogumTarihi: "",
    uyruklar: "",
    medeniDurumu: "",
  });
  const [initialPersonalInfoForm, setInitialPersonalInfoForm] = useState<PersonalInfoFormState>({
    cinsiyet: "",
    tc: "",
    dogumTarihi: "",
    uyruklar: "",
    medeniDurumu: "",
  });
  const [personalInfoSaving, setPersonalInfoSaving] = useState(false);
  const [personalInfoSaveError, setPersonalInfoSaveError] = useState<string | null>(null);
  const [personalInfoSaveSuccess, setPersonalInfoSaveSuccess] = useState<string | null>(null);
  const [personalInfoCountries, setPersonalInfoCountries] = useState<CountryItem[]>([]);
  const [personalInfoCountriesLoading, setPersonalInfoCountriesLoading] = useState(false);
  const [personalInfoCountriesError, setPersonalInfoCountriesError] = useState<string | null>(null);
  const [personalInfoCinsiyetler, setPersonalInfoCinsiyetler] = useState<MainCinsiyetItem[]>([]);
  const [personalInfoMedeniHaller, setPersonalInfoMedeniHaller] = useState<MainMedeniHalItem[]>([]);
  const [personalInfoCountryMenuOpen, setPersonalInfoCountryMenuOpen] = useState(false);
  const [personalInfoCountrySearch, setPersonalInfoCountrySearch] = useState("");
  const [customerLicenseForm, setCustomerLicenseForm] = useState<CustomerLicenseFormState>(
    EMPTY_CUSTOMER_LICENSE_FORM
  );
  const [initialCustomerLicenseForm, setInitialCustomerLicenseForm] = useState<CustomerLicenseFormState>(
    EMPTY_CUSTOMER_LICENSE_FORM
  );
  const [customerLicenseSaving, setCustomerLicenseSaving] = useState(false);
  const [customerLicenseSaveError, setCustomerLicenseSaveError] = useState<string | null>(null);
  const [customerLicenseSaveSuccess, setCustomerLicenseSaveSuccess] = useState<string | null>(null);
  const [customerLicenseOptions, setCustomerLicenseOptions] = useState<BasicLookupItem[]>([]);
  const [customerMilitaryForm, setCustomerMilitaryForm] = useState<CustomerMilitaryFormState>(
    EMPTY_CUSTOMER_MILITARY_FORM
  );
  const [initialCustomerMilitaryForm, setInitialCustomerMilitaryForm] = useState<CustomerMilitaryFormState>(
    EMPTY_CUSTOMER_MILITARY_FORM
  );
  const [customerMilitarySaving, setCustomerMilitarySaving] = useState(false);
  const [customerMilitarySaveError, setCustomerMilitarySaveError] = useState<string | null>(null);
  const [customerMilitarySaveSuccess, setCustomerMilitarySaveSuccess] = useState<string | null>(null);
  const [customerMilitaryOptions, setCustomerMilitaryOptions] = useState<BasicLookupItem[]>([]);
  const [customerExpectationForm, setCustomerExpectationForm] = useState<CustomerExpectationFormState>(
    EMPTY_CUSTOMER_EXPECTATION_FORM
  );
  const [initialCustomerExpectationForm, setInitialCustomerExpectationForm] = useState<CustomerExpectationFormState>(
    EMPTY_CUSTOMER_EXPECTATION_FORM
  );
  const [customerExpectationSaving, setCustomerExpectationSaving] = useState(false);
  const [customerExpectationSaveError, setCustomerExpectationSaveError] = useState<string | null>(null);
  const [customerExpectationSaveSuccess, setCustomerExpectationSaveSuccess] = useState<string | null>(null);
  const [customerExpectationServiceGroups, setCustomerExpectationServiceGroups] = useState<
    CustomerExpectationServiceGroupItem[]
  >([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState<string | null>(null);
  const [orderHistoryItems, setOrderHistoryItems] = useState<OrderHistoryItem[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storePackages, setStorePackages] = useState<StorePackageItem[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [missionSubmittingNr, setMissionSubmittingNr] = useState<number | null>(null);
  const [workExperienceLoading, setWorkExperienceLoading] = useState(false);
  const [workExperienceError, setWorkExperienceError] = useState<string | null>(null);
  const [workExperienceItems, setWorkExperienceItems] = useState<WorkExperienceItem[]>([]);
  const [workTypesLoading, setWorkTypesLoading] = useState(false);
  const [workTypesError, setWorkTypesError] = useState<string | null>(null);
  const [workTypes, setWorkTypes] = useState<WorkTypeItem[]>([]);
  const [workCities, setWorkCities] = useState<CityItem[]>([]);
  const [workCurrencies, setWorkCurrencies] = useState<CurrencyItem[]>([]);
  const [workCitySearch, setWorkCitySearch] = useState("");
  const [workCityMenuOpen, setWorkCityMenuOpen] = useState(false);
  const [workExperienceForm, setWorkExperienceForm] = useState<WorkExperienceFormState>(
    EMPTY_WORK_EXPERIENCE_FORM
  );
  const [editingWorkExperienceNr, setEditingWorkExperienceNr] = useState<number | null>(null);
  const [workExperienceSaving, setWorkExperienceSaving] = useState(false);
  const [workExperienceDeletingNr, setWorkExperienceDeletingNr] = useState<number | null>(null);
  const [workExperienceFormError, setWorkExperienceFormError] = useState<string | null>(null);
  const [workExperienceFormSuccess, setWorkExperienceFormSuccess] = useState<string | null>(null);
  const [customerUniversitiesLoading, setCustomerUniversitiesLoading] = useState(false);
  const [customerUniversitiesError, setCustomerUniversitiesError] = useState<string | null>(null);
  const [customerUniversitiesItems, setCustomerUniversitiesItems] = useState<CustomerUniversityItem[]>([]);
  const [customerUniversitiesForm, setCustomerUniversitiesForm] = useState<CustomerUniversityFormState>(
    EMPTY_CUSTOMER_UNIVERSITY_FORM
  );
  const [editingCustomerUniversityNr, setEditingCustomerUniversityNr] = useState<number | null>(null);
  const [customerUniversitiesSaving, setCustomerUniversitiesSaving] = useState(false);
  const [customerUniversitiesDeletingNr, setCustomerUniversitiesDeletingNr] = useState<number | null>(null);
  const [customerUniversitiesFormError, setCustomerUniversitiesFormError] = useState<string | null>(null);
  const [customerUniversitiesFormSuccess, setCustomerUniversitiesFormSuccess] = useState<string | null>(null);
  const [customerUniversityCountries, setCustomerUniversityCountries] = useState<CountryItem[]>([]);
  const [customerUniversityLanguages, setCustomerUniversityLanguages] = useState<BasicLookupItem[]>([]);
  const [customerUniversityEducationStatuses, setCustomerUniversityEducationStatuses] = useState<BasicLookupItem[]>([]);
  const [customerUniversityEducationLevels, setCustomerUniversityEducationLevels] = useState<BasicLookupItem[]>([]);
  const [customerUniversityEducationTypes, setCustomerUniversityEducationTypes] = useState<BasicLookupItem[]>([]);
  const [customerUniversityCountrySearch, setCustomerUniversityCountrySearch] = useState("");
  const [customerUniversityOptions, setCustomerUniversityOptions] = useState<UniversityOptionItem[]>([]);
  const [customerUniversityDepartmentOptions, setCustomerUniversityDepartmentOptions] = useState<DepartmentOptionItem[]>([]);
  const [customerUniversityOptionSearch, setCustomerUniversityOptionSearch] = useState("");
  const [customerUniversityDepartmentSearch, setCustomerUniversityDepartmentSearch] = useState("");
  const [customerUniversityLanguageSearch, setCustomerUniversityLanguageSearch] = useState("");
  const [customerUniversityCountryMenuOpen, setCustomerUniversityCountryMenuOpen] = useState(false);
  const [customerUniversityOptionMenuOpen, setCustomerUniversityOptionMenuOpen] = useState(false);
  const [customerUniversityDepartmentMenuOpen, setCustomerUniversityDepartmentMenuOpen] = useState(false);
  const [customerUniversityLanguageMenuOpen, setCustomerUniversityLanguageMenuOpen] = useState(false);
  const [customerHighSchoolsLoading, setCustomerHighSchoolsLoading] = useState(false);
  const [customerHighSchoolsError, setCustomerHighSchoolsError] = useState<string | null>(null);
  const [customerHighSchoolsItems, setCustomerHighSchoolsItems] = useState<CustomerHighSchoolItem[]>([]);
  const [customerHighSchoolsForm, setCustomerHighSchoolsForm] = useState<CustomerHighSchoolFormState>(
    EMPTY_CUSTOMER_HIGH_SCHOOL_FORM
  );
  const [editingCustomerHighSchoolNr, setEditingCustomerHighSchoolNr] = useState<number | null>(null);
  const [customerHighSchoolsSaving, setCustomerHighSchoolsSaving] = useState(false);
  const [customerHighSchoolsDeletingNr, setCustomerHighSchoolsDeletingNr] = useState<number | null>(null);
  const [customerHighSchoolsFormError, setCustomerHighSchoolsFormError] = useState<string | null>(null);
  const [customerHighSchoolsFormSuccess, setCustomerHighSchoolsFormSuccess] = useState<string | null>(null);
  const [customerHighSchoolCountries, setCustomerHighSchoolCountries] = useState<CountryItem[]>([]);
  const [customerHighSchoolTypes, setCustomerHighSchoolTypes] = useState<BasicLookupItem[]>([]);
  const [customerHighSchoolCountrySearch, setCustomerHighSchoolCountrySearch] = useState("");
  const [customerHighSchoolCountryMenuOpen, setCustomerHighSchoolCountryMenuOpen] = useState(false);
  const [customerReferencesLoading, setCustomerReferencesLoading] = useState(false);
  const [customerReferencesError, setCustomerReferencesError] = useState<string | null>(null);
  const [customerReferencesItems, setCustomerReferencesItems] = useState<CustomerReferenceItem[]>([]);
  const [customerReferencesForm, setCustomerReferencesForm] = useState<CustomerReferenceFormState>(
    EMPTY_CUSTOMER_REFERENCE_FORM
  );
  const [editingCustomerReferenceNr, setEditingCustomerReferenceNr] = useState<number | null>(null);
  const [customerReferencesSaving, setCustomerReferencesSaving] = useState(false);
  const [customerReferencesDeletingNr, setCustomerReferencesDeletingNr] = useState<number | null>(null);
  const [customerReferencesFormError, setCustomerReferencesFormError] = useState<string | null>(null);
  const [customerReferencesFormSuccess, setCustomerReferencesFormSuccess] = useState<string | null>(null);
  const [customerPassportsLoading, setCustomerPassportsLoading] = useState(false);
  const [customerPassportsError, setCustomerPassportsError] = useState<string | null>(null);
  const [customerPassportsItems, setCustomerPassportsItems] = useState<CustomerPassportItem[]>([]);
  const [customerPassportsForm, setCustomerPassportsForm] = useState<CustomerPassportFormState>(
    EMPTY_CUSTOMER_PASSPORT_FORM
  );
  const [editingCustomerPassportNr, setEditingCustomerPassportNr] = useState<number | null>(null);
  const [customerPassportsSaving, setCustomerPassportsSaving] = useState(false);
  const [customerPassportsDeletingNr, setCustomerPassportsDeletingNr] = useState<number | null>(null);
  const [customerPassportsFormError, setCustomerPassportsFormError] = useState<string | null>(null);
  const [customerPassportsFormSuccess, setCustomerPassportsFormSuccess] = useState<string | null>(null);
  const [customerPassportCountries, setCustomerPassportCountries] = useState<CountryItem[]>([]);
  const [customerPassportCountrySearch, setCustomerPassportCountrySearch] = useState("");
  const [customerPassportCountryMenuOpen, setCustomerPassportCountryMenuOpen] = useState(false);
  const [customerForeignLanguagesLoading, setCustomerForeignLanguagesLoading] = useState(false);
  const [customerForeignLanguagesError, setCustomerForeignLanguagesError] = useState<string | null>(null);
  const [customerForeignLanguagesItems, setCustomerForeignLanguagesItems] = useState<CustomerForeignLanguageItem[]>([]);
  const [customerForeignLanguagesForm, setCustomerForeignLanguagesForm] = useState<CustomerForeignLanguageFormState>(
    EMPTY_CUSTOMER_FOREIGN_LANGUAGE_FORM
  );
  const [editingCustomerForeignLanguageNr, setEditingCustomerForeignLanguageNr] = useState<number | null>(null);
  const [customerForeignLanguagesSaving, setCustomerForeignLanguagesSaving] = useState(false);
  const [customerForeignLanguagesDeletingNr, setCustomerForeignLanguagesDeletingNr] = useState<number | null>(null);
  const [customerForeignLanguagesFormError, setCustomerForeignLanguagesFormError] = useState<string | null>(null);
  const [customerForeignLanguagesFormSuccess, setCustomerForeignLanguagesFormSuccess] = useState<string | null>(null);
  const [customerForeignLanguageOptions, setCustomerForeignLanguageOptions] = useState<BasicLookupItem[]>([]);
  const [customerForeignLanguageSearch, setCustomerForeignLanguageSearch] = useState("");
  const [customerForeignLanguageMenuOpen, setCustomerForeignLanguageMenuOpen] = useState(false);
  const [customerFeaturesLoading, setCustomerFeaturesLoading] = useState(false);
  const [customerFeaturesError, setCustomerFeaturesError] = useState<string | null>(null);
  const [customerFeaturesFormError, setCustomerFeaturesFormError] = useState<string | null>(null);
  const [customerFeaturesFormSuccess, setCustomerFeaturesFormSuccess] = useState<string | null>(null);
  const [customerFeatureGroups, setCustomerFeatureGroups] = useState<FeatureGroupItem[]>([]);
  const [customerFeaturesItems, setCustomerFeaturesItems] = useState<CustomerFeatureItem[]>([]);
  const [customerFeaturesSavingSecenekIds, setCustomerFeaturesSavingSecenekIds] = useState<number[]>([]);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const fetchCustomerProfile = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const data = await api.get<CustomerGetResponse>(`/api/customer?dil=${dil}`);
        setCustomer(data?.Data ?? null);
      } catch (err: any) {
        setError(String(err?.message ?? "Failed to load account details"));
        if (showLoader) {
          setCustomer(null);
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [dil]
  );

  const fetchCustomerMedia = useCallback(async () => {
    try {
      setCustomerMediaLoading(true);
      setCustomerMediaError(null);
      const data = await api.get<CustomerGetMediaResponse>(`/api/customer/get-media?dil=${dil}`);
      setCustomerMedia(data?.Data ?? null);
    } catch (err: any) {
      setCustomerMedia(null);
      setCustomerMediaError(
        String(err?.message ?? (tx("CV medyasi yuklenemedi.", "Failed to load CV media.")))
      );
    } finally {
      setCustomerMediaLoading(false);
    }
  }, [dil, lang]);

  useEffect(() => {
    void fetchCustomerProfile(true);
  }, [fetchCustomerProfile]);

  useEffect(() => {
    if (activeTab !== "profile" && activeTab !== "resume") return;
    void fetchCustomerMedia();
  }, [activeTab, fetchCustomerMedia]);

  useEffect(() => {
    const ulkeId =
      typeof customer?.MusteriUlkeNr === "number" && customer.MusteriUlkeNr > 0
        ? customer.MusteriUlkeNr
        : null;
    if (!ulkeId) {
      setProfileCities([]);
      setForm((prev) => ({ ...prev, ilNr: null }));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setProfileCitiesLoading(true);
        const response = await api.get<CitiesResponse>(`/api/cities-public?dil=${dil}&ulkeId=${ulkeId}`);
        if (cancelled) return;
        const nextCities = normalizeCities(response);
        setProfileCities(nextCities);
        const validIds = new Set(
          nextCities.map((item) => item.Id).filter((id): id is number => typeof id === "number" && id > 0)
        );
        setForm((prev) => ({ ...prev, ilNr: prev.ilNr && validIds.has(prev.ilNr) ? prev.ilNr : null }));
      } catch {
        if (!cancelled) setProfileCities([]);
      } finally {
        if (!cancelled) setProfileCitiesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer?.MusteriUlkeNr, dil]);

  useEffect(() => {
    const ad = customer?.MusteriAdi ?? "";
    const soyad = customer?.MusteriSoyadi ?? "";
    const ilNr =
      typeof customer?.MusteriIlNr === "number" && customer.MusteriIlNr > 0
        ? customer.MusteriIlNr
        : null;
    setForm({ ad, soyad, ilNr });
    setInitialForm({ ad, soyad, ilNr });
    setSaveError(null);
    setSaveSuccess(null);
  }, [customer?.MusteriAdi, customer?.MusteriSoyadi, customer?.MusteriIlNr]);

  useEffect(() => {
    if (activeTab !== "profile" && activeTab !== "resume") return;

    let cancelled = false;

    (async () => {
      try {
        setPersonalInfoCountriesLoading(true);
        setPersonalInfoCountriesError(null);

        const [aboutRes, jobSearchRes, personalRes, countriesRes, cinsiyetlerRes, medeniHallerRes] = await Promise.all([
          api.get<CustomerGetHakkimdaResponse>(`/api/customer/get-hakkimda?dil=${dil}`),
          api.get<CustomerGetIsAramaDurumuResponse>(`/api/customer/get-is-arama-durumu?dil=${dil}`),
          api.get<CustomerGetCinsiyetResponse>(
            `/api/customer/get-cinsiyet-medeni-durum-dogum-tarihi-uyruk-tc?dil=${dil}`
          ),
          api.get<CountriesResponse>(`/api/countries?dil=${dil}`),
          api.get<MainCinsiyetResponse>(`/api/main/cinsiyetler?dil=${dil}`),
          api.get<MainMedeniHalResponse>(`/api/main/medeni-haller?dil=${dil}`),
        ]);

        if (cancelled) return;

        const nextCountries = normalizeCountries(countriesRes);
        const nextCinsiyetler = Array.isArray(cinsiyetlerRes?.Data) ? cinsiyetlerRes.Data : [];
        const nextMedeniHaller = Array.isArray(medeniHallerRes?.Data) ? medeniHallerRes.Data : [];
        setPersonalInfoCinsiyetler(nextCinsiyetler);
        setPersonalInfoMedeniHaller(nextMedeniHaller);
        const nextAbout = { hakkimda: (aboutRes?.Data?.Hakkimda ?? "").trim() };
        const nextJobSearch = {
          isaramaDurumu: normalizeSwitchState(jobSearchRes?.Data?.IsaramaDurumu),
        };
        const nextPersonal = {
          cinsiyet: normalizeLooseScalar(personalRes?.Data?.CinsiyetNr),
          tc: digitsOnly(personalRes?.Data?.Tc ?? ""),
          dogumTarihi: formatDateForPicker(personalRes?.Data?.DogumTarihi ?? undefined),
          uyruklar: (personalRes?.Data?.Uyruklar ?? "").trim(),
          medeniDurumu: normalizeLooseScalar(personalRes?.Data?.MedeniDurumuNr),
        };

        setPersonalInfoCountries(nextCountries);

        setAboutForm(nextAbout);
        setInitialAboutForm(nextAbout);
        setAboutSaveError(null);
        setAboutSaveSuccess(null);

        setJobSearchForm(nextJobSearch);
        setInitialJobSearchForm(nextJobSearch);
        setJobSearchSaveError(null);
        setJobSearchSaveSuccess(null);

        setPersonalInfoForm(nextPersonal);
        setInitialPersonalInfoForm(nextPersonal);
        setPersonalInfoSaveError(null);
        setPersonalInfoSaveSuccess(null);
      } catch (err: any) {
        if (cancelled) return;
        setPersonalInfoCountries([]);
        setPersonalInfoCountriesError(
          String(
            err?.message ??
              (tx("Profil detayları yüklenemedi.", "Failed to load profile details."))
          )
        );
      } finally {
        if (!cancelled) {
          setPersonalInfoCountriesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile" && activeTab !== "resume") return;

    let cancelled = false;

    (async () => {
      try {
        const [licenseRes, licenseOptionsRes, militaryRes, militaryOptionsRes, expectationRes, currenciesRes, serviceGroupsRes] =
          await Promise.all([
            api.get<CustomerGetEhliyetResponse>(`/api/customer/get-ehliyet?dil=${dil}`),
            api.get<BasicLookupResponse>(`/api/customer/ehliyetler?dil=${dil}`),
            api.get<CustomerGetAskerlikResponse>(`/api/customer/get-askerlik?dil=${dil}`),
            api.get<BasicLookupResponse>(`/api/customer/askerlikler?dil=${dil}`),
            api.get<CustomerGetUcretHizmetResponse>(`/api/customer/get-ucret-hizmet?dil=${dil}`),
            api.get<CurrenciesResponse>(`/api/work-experiences/currencies?dil=${dil}`),
            api.get<CustomerExpectationServiceGroupsResponse>(`/api/customer/hizmet-gruplari?dil=${dil}`),
          ]);

        if (cancelled) return;

        const nextLicense = {
          ehliyetVarmi: licenseRes?.Data?.EhliyetVarmi ? "1" : "0",
          ehliyetId: licenseRes?.Data?.EhliyetId ?? null,
          ehliyetTarihi: formatDateForPicker(licenseRes?.Data?.EhliyetTarihi ?? undefined),
        };
        const nextMilitary = {
          askerlikId: militaryRes?.Data?.AskerlikId ?? null,
          askerlikTarihi: formatDateForPicker(militaryRes?.Data?.AskerlikTarihi ?? undefined),
        };
        const nextExpectation = {
          hizmetGrupIdList: Array.isArray(expectationRes?.Data?.HizmetGrupIdList)
            ? expectationRes.Data.HizmetGrupIdList.filter((id): id is number => typeof id === "number")
            : [],
          ucretAciklama: (expectationRes?.Data?.UcretAciklama ?? "").trim(),
          ucretBeklenti:
            typeof expectationRes?.Data?.UcretBeklenti === "number" && Number.isFinite(expectationRes.Data.UcretBeklenti)
              ? String(expectationRes.Data.UcretBeklenti)
              : "",
          dovizId: expectationRes?.Data?.DovizId ?? null,
        };

        setCustomerLicenseForm(nextLicense);
        setInitialCustomerLicenseForm(nextLicense);
        setCustomerLicenseSaveError(null);
        setCustomerLicenseSaveSuccess(null);
        setCustomerLicenseOptions(normalizeBasicLookup(licenseOptionsRes));

        setCustomerMilitaryForm(nextMilitary);
        setInitialCustomerMilitaryForm(nextMilitary);
        setCustomerMilitarySaveError(null);
        setCustomerMilitarySaveSuccess(null);
        setCustomerMilitaryOptions(normalizeBasicLookup(militaryOptionsRes));

        setCustomerExpectationForm(nextExpectation);
        setInitialCustomerExpectationForm(nextExpectation);
        setCustomerExpectationSaveError(null);
        setCustomerExpectationSaveSuccess(null);
        setWorkCurrencies(normalizeCurrencies(currenciesRes));
        setCustomerExpectationServiceGroups(
          Array.isArray(serviceGroupsRes?.Data) ? serviceGroupsRes.Data.filter((item) => typeof item?.Id === "number") : []
        );
      } catch (err: any) {
        if (cancelled) return;
        const message = String(
          err?.message ??
            (tx("Ehliyet, askerlik veya beklenti bilgileri yuklenemedi.", "Failed to load CV details."))
        );
        setCustomerLicenseSaveError(message);
        setCustomerMilitarySaveError(message);
        setCustomerExpectationSaveError(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!isSettingTabKey(tabParam)) return;
    setActiveTab((prev) => (prev === tabParam ? prev : tabParam));
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== "privacy") return;

    let cancelled = false;

    (async () => {
      try {
        setPrivacyLoading(true);
        setPrivacyError(null);
        const data = await api.get<PrivacyGetResponse>(`/api/privacy?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setPrivacyItems(items.filter((item) => item?.Aktif !== false));
      } catch (err: any) {
        if (cancelled) return;
        setPrivacyError(String(err?.message ?? "Failed to load privacy policy"));
        setPrivacyItems([]);
      } finally {
        if (!cancelled) setPrivacyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "terms") return;

    let cancelled = false;

    (async () => {
      try {
        setTermsLoading(true);
        setTermsError(null);
        const data = await api.get<PrivacyGetResponse>(`/api/terms?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setTermsItems(items.filter((item) => item?.Aktif !== false));
      } catch (err: any) {
        if (cancelled) return;
        setTermsError(String(err?.message ?? "Failed to load user terms and conditions"));
        setTermsItems([]);
      } finally {
        if (!cancelled) setTermsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "sound") return;

    let cancelled = false;

    (async () => {
      try {
        setSoundLoading(true);
        setSoundError(null);
        const data = await api.get<NotificationStatusResponse>(`/api/notifications?dil=${dil}`);
        if (cancelled) return;
        setSoundEnabled(Boolean(data?.Data?.BildirimAcikDurumu));
      } catch (err: any) {
        if (cancelled) return;
        setSoundError(String(err?.message ?? "Failed to load notification status"));
      } finally {
        if (!cancelled) setSoundLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "orderHistory") return;

    let cancelled = false;

    (async () => {
      try {
        setOrderHistoryLoading(true);
        setOrderHistoryError(null);
        const data = await api.get<OrderHistoryResponse>(`/api/order-history?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setOrderHistoryItems(items);
      } catch (err: any) {
        if (cancelled) return;
        setOrderHistoryError(String(err?.message ?? "Failed to load order history"));
        setOrderHistoryItems([]);
      } finally {
        if (!cancelled) setOrderHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "missions") return;

    let cancelled = false;

    (async () => {
      try {
        setMissionsLoading(true);
        setMissionsError(null);
        const data = await api.get<MissionsResponse>(`/api/missions?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setMissions(items.filter((item) => item?.Aktif !== false));
      } catch (err: any) {
        if (cancelled) return;
        setMissionsError(String(err?.message ?? "Failed to load missions"));
        setMissions([]);
      } finally {
        if (!cancelled) setMissionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "store") return;

    let cancelled = false;

    (async () => {
      try {
        setStoreLoading(true);
        setStoreError(null);
        const data = await api.get<StorePackagesResponse>(`/api/store?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setStorePackages(items);
      } catch (err: any) {
        if (cancelled) return;
        setStoreError(String(err?.message ?? "Failed to load store packages"));
        setStorePackages([]);
      } finally {
        if (!cancelled) setStoreLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab === "contact") return;
    setContactTouched(false);
    setContactError(null);
    setContactSuccess(null);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "language") {
      setLanguageMenuOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const previousActiveTab = previousActiveTabRef.current;
    if (activeTab === "profile" && previousActiveTab && previousActiveTab !== "profile") {
      void fetchCustomerProfile(false);
    }
    previousActiveTabRef.current = activeTab;
  }, [activeTab, fetchCustomerProfile]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    const handleProfileRefresh = () => {
      void fetchCustomerProfile(false);
    };

    window.addEventListener(CUSTOMER_PROFILE_REFRESH_EVENT, handleProfileRefresh);
    return () => {
      window.removeEventListener(CUSTOMER_PROFILE_REFRESH_EVENT, handleProfileRefresh);
    };
  }, [activeTab, fetchCustomerProfile]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;

    (async () => {
      try {
        setWorkExperienceLoading(true);
        setWorkExperienceError(null);
        setWorkTypesLoading(true);
        setWorkTypesError(null);

        const [workRes, typesRes, citiesRes, currenciesRes] = await Promise.all([
          api.get<WorkExperienceResponse>(`/api/work-experiences?dil=${dil}`),
          api.get<WorkTypesResponse>(`/api/work-experiences/work-types?dil=${dil}`),
          api.get<CitiesResponse>(`/api/work-experiences/cities?dil=${dil}`),
          api.get<CurrenciesResponse>(`/api/work-experiences/currencies?dil=${dil}`),
        ]);

        if (cancelled) return;
        setWorkExperienceItems(Array.isArray(workRes?.Data) ? workRes.Data : []);
        setWorkTypes(normalizeWorkTypes(typesRes));
        setWorkCities(normalizeCities(citiesRes));
        setWorkCurrencies(normalizeCurrencies(currenciesRes));
      } catch (err: any) {
        if (cancelled) return;
        setWorkExperienceItems([]);
        setWorkTypes([]);
        setWorkCities([]);
        setWorkCurrencies([]);
        const fallback =
          tx("İş tecrübesi verileri yüklenemedi.", "Failed to load work experience data.");
        const message = String(err?.message ?? fallback);
        setWorkExperienceError(message);
        setWorkTypesError(message);
      } finally {
        if (!cancelled) {
          setWorkExperienceLoading(false);
          setWorkTypesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;

    (async () => {
      try {
        setCustomerFeaturesLoading(true);
        setCustomerFeaturesError(null);

        const [recordsRes, groupsRes] = await Promise.all([
          api.get<CustomerFeaturesResponse>(`/api/customer-features?dil=${dil}`),
          api.get<FeatureGroupsResponse>(`/api/customer-features/groups?dil=${dil}`),
        ]);

        if (cancelled) return;
        setCustomerFeaturesItems(Array.isArray(recordsRes?.Data) ? recordsRes.Data : []);
        setCustomerFeatureGroups(normalizeFeatureGroups(groupsRes));
      } catch (err: any) {
        if (cancelled) return;
        setCustomerFeaturesItems([]);
        setCustomerFeatureGroups([]);
        setCustomerFeaturesError(
          String(
            err?.message ??
              (tx("Önemli bilgiler yüklenemedi.", "Failed to load important information."))
          )
        );
      } finally {
        if (!cancelled) {
          setCustomerFeaturesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;

    (async () => {
      try {
        setCustomerForeignLanguagesLoading(true);
        setCustomerForeignLanguagesError(null);

        const [recordsRes, languagesRes] = await Promise.all([
          api.get<CustomerForeignLanguagesResponse>(`/api/customer-foreign-languages?dil=${dil}`),
          api.get<BasicLookupResponse>(`/api/customer-foreign-languages/languages?dil=${dil}`),
        ]);

        if (cancelled) return;
        setCustomerForeignLanguagesItems(Array.isArray(recordsRes?.Data) ? recordsRes.Data : []);
        setCustomerForeignLanguageOptions(normalizeBasicLookup(languagesRes));
      } catch (err: any) {
        if (cancelled) return;
        setCustomerForeignLanguagesItems([]);
        setCustomerForeignLanguageOptions([]);
        setCustomerForeignLanguagesError(
          String(
            err?.message ??
              (tx("Yabancı dil verileri yüklenemedi.", "Failed to load foreign language data."))
          )
        );
      } finally {
        if (!cancelled) {
          setCustomerForeignLanguagesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;

    (async () => {
      try {
        setCustomerPassportsLoading(true);
        setCustomerPassportsError(null);
        const [recordsRes, countriesRes] = await Promise.all([
          api.get<CustomerPassportsResponse>(`/api/customer-passports?dil=${dil}`),
          api.get<CountriesResponse>(`/api/customer-passports/countries?dil=${dil}`),
        ]);
        if (cancelled) return;
        setCustomerPassportsItems(Array.isArray(recordsRes?.Data) ? recordsRes.Data : []);
        setCustomerPassportCountries(normalizeCountries(countriesRes));
      } catch (err: any) {
        if (cancelled) return;
        setCustomerPassportsItems([]);
        setCustomerPassportCountries([]);
        setCustomerPassportsError(
          String(err?.message ?? (tx("Pasaport verileri yüklenemedi.", "Failed to load passports.")))
        );
      } finally {
        if (!cancelled) {
          setCustomerPassportsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;

    (async () => {
      try {
        setCustomerReferencesLoading(true);
        setCustomerReferencesError(null);
        const data = await api.get<CustomerReferencesResponse>(`/api/customer-references?dil=${dil}`);
        if (cancelled) return;
        setCustomerReferencesItems(Array.isArray(data?.Data) ? data.Data : []);
      } catch (err: any) {
        if (cancelled) return;
        setCustomerReferencesItems([]);
        setCustomerReferencesError(
          String(err?.message ?? (tx("Referans verileri yüklenemedi.", "Failed to load references.")))
        );
      } finally {
        if (!cancelled) {
          setCustomerReferencesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;

    (async () => {
      try {
        setCustomerHighSchoolsLoading(true);
        setCustomerHighSchoolsError(null);

        const [recordsRes, countriesRes, typesRes] = await Promise.all([
          api.get<CustomerHighSchoolsResponse>(`/api/customer-high-schools?dil=${dil}`),
          api.get<CountriesResponse>(`/api/customer-high-schools/countries?dil=${dil}`),
          api.get<BasicLookupResponse>(`/api/customer-high-schools/high-school-types?dil=${dil}`),
        ]);

        if (cancelled) return;
        setCustomerHighSchoolsItems(Array.isArray(recordsRes?.Data) ? recordsRes.Data : []);
        setCustomerHighSchoolCountries(normalizeCountries(countriesRes));
        setCustomerHighSchoolTypes(normalizeBasicLookup(typesRes));
      } catch (err: any) {
        if (cancelled) return;
        setCustomerHighSchoolsItems([]);
        setCustomerHighSchoolCountries([]);
        setCustomerHighSchoolTypes([]);
        setCustomerHighSchoolsError(
          String(err?.message ?? (tx("Lise verileri yüklenemedi.", "Failed to load high school data.")))
        );
      } finally {
        if (!cancelled) {
          setCustomerHighSchoolsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;

    (async () => {
      try {
        setCustomerUniversitiesLoading(true);
        setCustomerUniversitiesError(null);

        const [recordsRes, countriesRes, languagesRes, statusesRes, levelsRes, typesRes] = await Promise.all([
          api.get<CustomerUniversitiesResponse>(`/api/customer-universities?dil=${dil}`),
          api.get<CountriesResponse>(`/api/customer-universities/countries?dil=${dil}`),
          api.get<BasicLookupResponse>(`/api/customer-universities/languages?dil=${dil}`),
          api.get<BasicLookupResponse>(`/api/customer-universities/education-statuses?dil=${dil}`),
          api.get<BasicLookupResponse>(`/api/customer-universities/education-levels?dil=${dil}`),
          api.get<BasicLookupResponse>(`/api/customer-universities/education-types?dil=${dil}`),
        ]);

        if (cancelled) return;
        setCustomerUniversitiesItems(Array.isArray(recordsRes?.Data) ? recordsRes.Data : []);
        setCustomerUniversityCountries(normalizeCountries(countriesRes));
        setCustomerUniversityLanguages(normalizeBasicLookup(languagesRes));
        setCustomerUniversityEducationStatuses(normalizeBasicLookup(statusesRes));
        setCustomerUniversityEducationLevels(normalizeBasicLookup(levelsRes));
        setCustomerUniversityEducationTypes(normalizeBasicLookup(typesRes));
      } catch (err: any) {
        if (cancelled) return;
        setCustomerUniversitiesItems([]);
        setCustomerUniversityCountries([]);
        setCustomerUniversityLanguages([]);
        setCustomerUniversityEducationStatuses([]);
        setCustomerUniversityEducationLevels([]);
        setCustomerUniversityEducationTypes([]);
        setCustomerUniversitiesError(
          String(err?.message ?? (tx("Üniversite verileri yüklenemedi.", "Failed to load university data.")))
        );
      } finally {
        if (!cancelled) {
          setCustomerUniversitiesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil, lang]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const countryPart = customerUniversitiesForm.ulkeId ? `ulkeId=${customerUniversitiesForm.ulkeId}&` : "";
        const searchPart = customerUniversityOptionSearch.trim()
          ? `search=${encodeURIComponent(customerUniversityOptionSearch.trim())}&`
          : "";
        const data = await api.get<UniversityOptionsResponse>(
          `/api/customer-universities/universities?${countryPart}${searchPart}dil=${dil}`
        );
        if (cancelled) return;
        setCustomerUniversityOptions(normalizeUniversityOptions(data));
      } catch {
        if (cancelled) return;
        setCustomerUniversityOptions([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeTab, customerUniversitiesForm.ulkeId, customerUniversityOptionSearch, dil]);

  useEffect(() => {
    if (activeTab !== "profile") return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const searchPart = customerUniversityDepartmentSearch.trim()
          ? `search=${encodeURIComponent(customerUniversityDepartmentSearch.trim())}&`
          : "";
        const data = await api.get<DepartmentOptionsResponse>(
          `/api/customer-universities/departments?${searchPart}dil=${dil}`
        );
        if (cancelled) return;
        setCustomerUniversityDepartmentOptions(normalizeDepartmentOptions(data));
      } catch {
        if (cancelled) return;
        setCustomerUniversityDepartmentOptions([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeTab, customerUniversityDepartmentSearch, dil]);

  useEffect(() => {
    if (workCurrencies.length === 0) return;
    setWorkExperienceForm((prev) =>
      prev.dovizId ? prev : { ...prev, dovizId: workCurrencies[0]?.Id ?? null }
    );
  }, [workCurrencies]);

  useEffect(() => {
    if (!emailChangeModalOpen || emailChangeStep !== 2 || emailChangeExpireSecondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setEmailChangeExpireSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [emailChangeModalOpen, emailChangeStep, emailChangeExpireSecondsLeft]);

  useEffect(() => {
    if (!emailChangeModalOpen) return;

    const frame = window.requestAnimationFrame(() => {
      if (emailChangeStep === 1) {
        emailChangeInputRef.current?.focus();
        emailChangeInputRef.current?.select();
        return;
      }

      emailChangeCodeInputRefs.current[0]?.focus();
      emailChangeCodeInputRefs.current[0]?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [emailChangeModalOpen, emailChangeStep]);

  useEffect(() => {
    if (!phoneChangeModalOpen || phoneChangeStep !== 2 || phoneChangeExpireSecondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setPhoneChangeExpireSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phoneChangeModalOpen, phoneChangeStep, phoneChangeExpireSecondsLeft]);

  useEffect(() => {
    if (!phoneChangeModalOpen) return;

    const frame = window.requestAnimationFrame(() => {
      if (phoneChangeStep === 1) {
        phoneChangeCountryButtonRef.current?.focus();
        return;
      }

      phoneChangeCodeInputRefs.current[0]?.focus();
      phoneChangeCodeInputRefs.current[0]?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [phoneChangeModalOpen, phoneChangeStep]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!phoneChangeCountryMenuRef.current) return;
      if (phoneChangeCountryMenuRef.current.contains(event.target as Node)) return;
      setPhoneChangeCountryMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !workCityButtonRef.current?.contains(target) &&
        !workCityMenuRef.current?.contains(target)
      ) {
        setWorkCityMenuOpen(false);
      }
      if (
        !customerUniversityCountryButtonRef.current?.contains(target) &&
        !customerUniversityCountryMenuRef.current?.contains(target)
      ) {
        setCustomerUniversityCountryMenuOpen(false);
      }
      if (
        !customerUniversityOptionButtonRef.current?.contains(target) &&
        !customerUniversityOptionMenuRef.current?.contains(target)
      ) {
        setCustomerUniversityOptionMenuOpen(false);
      }
      if (
        !customerUniversityDepartmentButtonRef.current?.contains(target) &&
        !customerUniversityDepartmentMenuRef.current?.contains(target)
      ) {
        setCustomerUniversityDepartmentMenuOpen(false);
      }
      if (
        !customerUniversityLanguageButtonRef.current?.contains(target) &&
        !customerUniversityLanguageMenuRef.current?.contains(target)
      ) {
        setCustomerUniversityLanguageMenuOpen(false);
      }
      if (
        !customerHighSchoolCountryButtonRef.current?.contains(target) &&
        !customerHighSchoolCountryMenuRef.current?.contains(target)
      ) {
        setCustomerHighSchoolCountryMenuOpen(false);
      }
      if (
        !customerPassportCountryButtonRef.current?.contains(target) &&
        !customerPassportCountryMenuRef.current?.contains(target)
      ) {
        setCustomerPassportCountryMenuOpen(false);
      }
      if (
        !customerForeignLanguageButtonRef.current?.contains(target) &&
        !customerForeignLanguageMenuRef.current?.contains(target)
      ) {
        setCustomerForeignLanguageMenuOpen(false);
      }
      if (
        !personalInfoCountryButtonRef.current?.contains(target) &&
        !personalInfoCountryMenuRef.current?.contains(target)
      ) {
        setPersonalInfoCountryMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!phoneChangeCountryMenuOpen) {
      setPhoneChangeCountrySearch("");
    }
  }, [phoneChangeCountryMenuOpen]);

  useEffect(() => {
    if (!workCityMenuOpen) {
      setWorkCitySearch("");
    }
  }, [workCityMenuOpen]);

  useEffect(() => {
    if (!customerUniversityCountryMenuOpen) {
      setCustomerUniversityCountrySearch("");
    }
  }, [customerUniversityCountryMenuOpen]);

  useEffect(() => {
    if (!customerUniversityOptionMenuOpen) {
      setCustomerUniversityOptionSearch("");
    }
  }, [customerUniversityOptionMenuOpen]);

  useEffect(() => {
    if (!customerUniversityDepartmentMenuOpen) {
      setCustomerUniversityDepartmentSearch("");
    }
  }, [customerUniversityDepartmentMenuOpen]);

  useEffect(() => {
    if (!customerUniversityLanguageMenuOpen) {
      setCustomerUniversityLanguageSearch("");
    }
  }, [customerUniversityLanguageMenuOpen]);

  useEffect(() => {
    if (!customerHighSchoolCountryMenuOpen) {
      setCustomerHighSchoolCountrySearch("");
    }
  }, [customerHighSchoolCountryMenuOpen]);

  useEffect(() => {
    if (!customerPassportCountryMenuOpen) {
      setCustomerPassportCountrySearch("");
    }
  }, [customerPassportCountryMenuOpen]);

  useEffect(() => {
    if (!customerForeignLanguageMenuOpen) {
      setCustomerForeignLanguageSearch("");
    }
  }, [customerForeignLanguageMenuOpen]);

  useEffect(() => {
    if (!personalInfoCountryMenuOpen) {
      setPersonalInfoCountrySearch("");
    }
  }, [personalInfoCountryMenuOpen]);

  useEffect(() => {
    const selectedCode =
      (
        phoneChangeCountries.find((item) => item.Id === phoneChangeCountryId)?.TelKodu ?? ""
      )
        .trim()
        .replace(/^\+/, "");
    if (selectedCode && selectedCode !== phoneChangeCountryCode) {
      setPhoneChangeCountryCode(selectedCode);
    }
  }, [phoneChangeCountries, phoneChangeCountryCode, phoneChangeCountryId]);

  useEffect(() => {
    if (!emailVerifyModalOpen || emailVerifyExpireSecondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setEmailVerifyExpireSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [emailVerifyModalOpen, emailVerifyExpireSecondsLeft]);

  useEffect(() => {
    if (!emailVerifyModalOpen) return;

    const frame = window.requestAnimationFrame(() => {
      emailVerifyCodeInputRefs.current[0]?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [emailVerifyModalOpen]);

  useEffect(() => {
    if (!phoneVerifyModalOpen || phoneVerifyExpireSecondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setPhoneVerifyExpireSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phoneVerifyModalOpen, phoneVerifyExpireSecondsLeft]);

  useEffect(() => {
    if (!phoneVerifyModalOpen) return;

    const frame = window.requestAnimationFrame(() => {
      phoneVerifyCodeInputRefs.current[0]?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [phoneVerifyModalOpen]);

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  const tx = useCallback(
    (trText: string, enText: string) => (lang === "tr" ? trText : translateSettingsValue(enText, lang)),
    [lang]
  );

  const text = useMemo(
    () => {
      const base =
        lang === "tr"
        ? {
            title: "Ayarlar",
            breadcrumbParent: "Diğer",
            profile: "Profil",
            resume: "Özgeçmiş",
            missions: "Görevler",
            missionsTitle: "Görevler",
            missionsDesc: "Görevleri tamamlayın ve coin kazanın.",
            missionsLoading: "Görevler yükleniyor...",
            missionsNoData: "Aktif görev bulunamadı.",
            missionCoin: "Coin",
            missionGo: "Göreve Git ve Tamamla",
            missionDone: "Tamamlandı",
            missionLink: "Görev Linki",
            missionTakeCoin: "Coini Al",
            missionCompletedCard: "Görev Tamamlandı",
            store: "Mağaza",
            storeTitle: "Plan ve Fiyatlandırma",
            storeDesc: "Size en uygun coin paketini seçin ve kullanımınızı güncelleyin.",
            storeLoading: "Paketler yükleniyor...",
            storeNoData: "Aktif paket bulunamadı.",
            storeBuy: "Satın Al",
            storeCurrentPlan: "Mevcut Plan",
            storeUpgradePlan: "Planı Yükselt",
            storeDowngradePlan: "Düşür",
            storePerMonth: "/ ay",
            storeOneTime: "tek seferlik",
            storeFeatureCoin: "{coin} coin",
            storeFeatureFast: "Anında kullanım",
            storeFeatureSecure: "Güvenli ödeme",
            storeFeatureSupport: "7/24 destek",
            orderHistory: "Sipariş Geçmişi",
            orderHistoryTitle: "Sipariş Geçmişi",
            orderHistoryDesc: "Fatura ve paket ödemelerinizi buradan takip edebilirsiniz.",
            orderNo: "Sipariş No",
            orderDate: "Tarih",
            orderPlan: "Paket",
            orderAmount: "Tutar",
            orderHistoryLoading: "Sipariş geçmişi yükleniyor...",
            orderHistoryNoData: "Sipariş geçmişi bulunamadı.",
            language: "Dil",
            chooseLanguageTitle: "Dil Seçin",
            chooseLanguageDesc: "Dil seçiminizi yapın. Değişiklik tüm sitede uygulanır.",
            languageField: "Dil",
            languageTr: "Türkçe",
            languageEn: "İngilizce",
            contact: "İletişim",
            contactTitle: "İletişim",
            contactDesc: "Destek talebinizi aşağıdaki form ile iletebilirsiniz.",
            contactMessageLabel: "Mesajınız",
            contactSend: "Mesaj Gönder",
            contactSending: "Gönderiliyor...",
            contactSendOk: "Mesajınız gönderildi.",
            supportNo: "Destek No",
            contactEmailMissing: "Giriş yapan kullanıcı e-postası bulunamadı.",
            contactMessageRequired: "Mesaj boş olamaz.",
            contactMessageMin: "Mesaj en az 3 karakter olmalıdır.",
            contactMessageMax: "Mesaj en fazla 255 karakter olabilir.",
            sound: "Ses Bildirimleri",
            soundTitle: "Push Bildirimleri",
            soundDesc: "Mesaj bildirimlerini bu alandan açıp kapatabilirsiniz.",
            soundMessageTitle: "Mesaj Bildirimleri",
            soundMessageDesc: "Yeni mesaj aldığınızda bildirim alırsınız.",
            soundOn: "Açık",
            soundOff: "Kapalı",
            soundLoading: "Bildirim durumu yükleniyor...",
            privacy: "Gizlilik Politikası",
            terms: "Kullanıcı Şart ve Koşulları",
            policiesTitle: "Politikalar",
            policiesDesc: "Gizlilik ve KVKK metinleri aşağıda listelenmiştir.",
            termsTitle: "Kullanıcı Şart ve Koşulları",
            termsDesc: "Kullanıcı şart ve koşul metinleri aşağıda listelenmiştir.",
            accountDetails: "Hesap Detayları",
            accountDesc: "Kullanıcılar size bu bilgilerle ulaşacaktır.",
            changeImage: "Profil Resmi Değiştir",
            changeImageTitle: "Profil Resmini Değiştir",
            changeImageDesc: "Tek bir görsel seçin ve yeni profil resminizi yükleyin.",
            changeImageSelect: "Resim Seç",
            changeImageSelected: "Seçilen Resim",
            changeImageHint: "JPG, PNG veya WEBP formatında tek resim yükleyin.",
            changeImageUpload: "Yükle",
            changeImageUploading: "Yükleniyor...",
            changeImageRequired: "Lütfen bir resim seçin.",
            changeImageSuccess: "Profil resmi güncellendi.",
            changeImageFailed: "Profil resmi güncellenemedi.",
            driverLicenseTitle: "Ehliyet Bilgisi",
            driverLicenseDesc: "Ehliyet durumunuzu ve alış tarihinizi ekleyin.",
            hasDriverLicense: "Ehliyetiniz var mı?",
            selectDriverLicense: "Ehliyet tipi seçiniz",
            driverLicenseDate: "Ehliyet Tarihi",
            driverLicenseSave: "Ehliyet Bilgisini Kaydet",
            driverLicenseSaved: "Ehliyet bilgisi güncellendi.",
            driverLicenseSaveFailed: "Ehliyet bilgisi güncellenemedi.",
            militaryTitle: "Askerlik Bilgisi",
            militaryDesc: "Askerlik durumunuzu ve varsa tarihinizi ekleyin.",
            selectMilitary: "Askerlik durumu seçiniz",
            militaryDate: "Askerlik Tarihi",
            militarySave: "Askerlik Bilgisini Kaydet",
            militarySaved: "Askerlik bilgisi güncellendi.",
            militarySaveFailed: "Askerlik bilgisi güncellenemedi.",
            expectationTitle: "Çalışma Beklentisi",
            expectationDesc: "Hizmet alanlarınızı ve ücret beklentinizi belirtin.",
            expectationServices: "Hizmet Gruplari",
            expectationSalary: "Ücret Beklentisi",
            expectationSalaryNote: "Bu bilgi sadece istatistiksel amaçla kullanılır.",
            expectationCurrency: "Döviz",
            expectationDescription: "Ücret Açıklama",
            expectationSave: "Beklentiyi Kaydet",
            expectationSaved: "Çalışma beklentisi güncellendi.",
            expectationSaveFailed: "Çalışma beklentisi güncellenemedi.",
            yes: "Evet",
            no: "Hayır",
            cvMediaTitle: "CV Medyası",
            cvMediaDesc: "CV'nize 2 ek görsel ve 1 video ekleyin.",
            cvMediaHint: "Gorseller JPG, PNG veya WEBP; video ise sistemin destekledigi formatta olmalidir.",
            cvMediaImage2Title: "Ek Resim 1",
            cvMediaImage3Title: "Ek Resim 2",
            cvMediaVideoTitle: "Video",
            cvMediaEmpty: "Henuz yuklenmedi.",
            cvMediaUpload: "Yukle",
            cvMediaReplace: "Degistir",
            cvMediaDelete: "Sil",
            cvMediaUploading: "Yukleniyor...",
            cvMediaDeleting: "Siliniyor...",
            cvMediaLoadFailed: "CV medyasi yuklenemedi.",
            cvMediaUpdateSuccess: "CV medyasi guncellendi.",
            cvMediaDeleteSuccess: "CV medyasi silindi.",
            cvMediaUpdateFailed: "CV medyasi guncellenemedi.",
            cvMediaDeleteFailed: "CV medyasi silinemedi.",
            changeEmailTitle: "E-posta Adresini Değiştir",
            changeEmailStepOneDesc: "Yeni e-posta adresinizi girin.",
            changeEmailStepTwoDesc: "Yeni e-posta adresinize gönderilen 6 haneli kodu girin.",
            changeEmailLabel: "Yeni E-posta Adresi",
            changeEmailCodeLabel: "6 Haneli Kod",
            changeEmailVerify: "Doğrula",
            changeEmailSending: "Kod Gönderiliyor...",
            changeEmailComplete: "Tamam Değiştir",
            changeEmailCompleting: "Değiştiriliyor...",
            changeEmailSentTo: "Kod gönderilen adres",
            changeEmailRequired: "Lütfen yeni e-posta adresini girin.",
            changeEmailInvalid: "Geçerli bir e-posta adresi girin.",
            changeEmailSame: "Yeni e-posta adresi mevcut adresle aynı olamaz.",
            changeEmailExpired: "Kodun süresi doldu.",
            changeEmailSendFailed: "Yeni e-posta kodu gönderilemedi.",
            changeEmailVerifyFailed: "E-posta adresi değiştirilemedi.",
            changeEmailSuccess: "E-posta adresi başarıyla değiştirildi.",
            changePhoneTitle: "Telefon Numarasını Değiştir",
            changePhoneStepOneDesc: "Ülke kodu ve yeni telefon numaranızı girin.",
            changePhoneStepTwoDesc: "Yeni telefon numaranıza gönderilen 6 haneli kodu girin.",
            changePhoneCountryCodeLabel: "Ülke Kodu",
            changePhoneLabel: "Yeni Telefon Numarası",
            changePhoneCodeLabel: "6 Haneli Kod",
            changePhoneCountryPlaceholder: "Ülke kodu seçin",
            changePhoneCountryLoading: "Ülkeler yükleniyor...",
            changePhoneCountrySearchPlaceholder: "Ülke ara",
            changePhoneCountryNoResults: "Sonuç bulunamadı.",
            changePhoneCountryLoadFailed: "Ülkeler yüklenemedi.",
            changePhoneVerify: "Doğrula",
            changePhoneSending: "Kod Gönderiliyor...",
            changePhoneComplete: "Tamam Değiştir",
            changePhoneCompleting: "Değiştiriliyor...",
            changePhoneSentTo: "Kod gönderilen numara",
            changePhoneCountryCodeRequired: "Lütfen ülke kodunu girin.",
            changePhoneRequired: "Lütfen yeni telefon numarasını girin.",
            changePhoneSame: "Yeni telefon numarası mevcut numarayla aynı olamaz.",
            changePhoneExpired: "Kodun süresi doldu.",
            changePhoneSendFailed: "Yeni telefon doğrulama kodu gönderilemedi.",
            changePhoneVerifyFailed: "Telefon numarası değiştirilemedi.",
            changePhoneSuccess: "Telefon numarası başarıyla değiştirildi.",
            verifyEmailTitle: "E-posta Adresini Doğrula",
            verifyEmailDesc: "E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.",
            verifyEmailCodeLabel: "6 Haneli Kod",
            verifyEmailResend: "Kodu Tekrar Gönder",
            verifyEmailSending: "Kod Gönderiliyor...",
            verifyEmailVerify: "Doğrula",
            verifyEmailVerifying: "Doğrulanıyor...",
            verifyEmailExpired: "Kodun süresi doldu. Tekrar kod isteyin.",
            verifyEmailSendFailed: "Doğrulama kodu gönderilemedi.",
            verifyEmailVerifyFailed: "E-posta doğrulanamadı.",
            verifyEmailSentTo: "Kod gönderilen adres",
            verifyPhoneTitle: "Telefon Numarasını Doğrula",
            verifyPhoneDesc: "Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin.",
            verifyPhoneCodeLabel: "6 Haneli Kod",
            verifyPhoneSending: "Kod Gönderiliyor...",
            verifyPhoneVerify: "Doğrula",
            verifyPhoneVerifying: "Doğrulanıyor...",
            verifyPhoneExpired: "Kodun süresi doldu.",
            verifyPhoneSendFailed: "Telefon doğrulama kodu gönderilemedi.",
            verifyPhoneVerifyFailed: "Telefon numarası doğrulanamadı.",
            verifyPhoneSentTo: "Kod gönderilen numara",
            deleteAccountTitle: "Hesabı Sil",
            deleteAccountDesc: "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
            deleteAccountConfirm: "Evet, Hesabı Sil",
            deleteAccountDeleting: "Siliniyor...",
            deleteAccountFailed: "Hesap silinemedi.",
            changePassword: "Şifre Değiştir",
            changePasswordTitle: "Şifre Değiştir",
            changePasswordDesc: "Yeni şifrenizi iki kez girin.",
            newPassword: "Yeni Şifre",
            newPasswordRepeat: "Yeni Şifre Tekrar",
            changePasswordSave: "Şifreyi Değiştir",
            changePasswordSaving: "Değiştiriliyor...",
            passwordRuleMin: "En az 8 karakter",
            passwordRuleCase: "Büyük ve küçük harf",
            passwordRuleDigit: "En az 1 rakam",
            passwordRuleSymbol: "En az 1 sembol",
            passwordRuleMatch: "Şifreler aynı olmalı",
            changePasswordSuccess: "Şifre başarıyla değiştirildi.",
            changePasswordFailed: "Şifre değiştirilemedi.",
            resultSuccessTitle: "Başarılı",
            resultErrorTitle: "Uyarı",
            close: "Kapat",
            name: "Ad",
            surname: "Soyad",
            password: "Şifre",
            email: "E-posta Adresi",
            phone: "Telefon Numarası",
            deleteAccount: "Hesabı Sil",
            verify: "Onayla",
            checked: "Onaylandı",
            change: "Değiştir",
            save: "Kaydet",
            cancel: "Vazgeç",
            loading: "Yükleniyor...",
            noData: "Hesap bilgisi bulunamadı.",
            sectionSoon: "Bu bölüm yakında aktif olacak.",
            saving: "Kaydediliyor...",
            saveOk: "Bilgiler kaydedildi.",
            privacyLoading: "Gizlilik metni yükleniyor...",
            privacyNoData: "Gizlilik metni bulunamadı.",
            termsLoading: "Kullanıcı şart ve koşulları yükleniyor...",
            termsNoData: "Kullanıcı şart ve koşulları bulunamadı.",
            nameRequired: "Ad boş olamaz.",
            nameMin: "Ad en az 2 karakter olmalıdır.",
            nameMax: "Ad en fazla 100 karakter olabilir.",
            surnameRequired: "Soyad boş olamaz.",
            surnameMin: "Soyad en az 2 karakter olmalıdır.",
            surnameMax: "Soyad en fazla 100 karakter olabilir.",
          }
        : {
            title: "Settings",
            breadcrumbParent: "Other",
            profile: "Profile",
            resume: "Resume",
            missions: "Missions",
            missionsTitle: "Missions",
            missionsDesc: "Complete missions and earn coins.",
            missionsLoading: "Loading missions...",
            missionsNoData: "No active missions found.",
            missionCoin: "Coin",
            missionGo: "Go and Complete",
            missionDone: "Completed",
            missionLink: "Mission Link",
            missionTakeCoin: "Take the Coin",
            missionCompletedCard: "Mission Completed",
            store: "Store",
            storeTitle: "Plan & Pricing",
            storeDesc:
              "Manage your subscription plans. Choose a plan that best suits your needs, compare features, and adjust your subscription as needed.",
            storeLoading: "Loading packages...",
            storeNoData: "No active package found.",
            storeBuy: "Buy Now",
            storeCurrentPlan: "Current Plan",
            storeUpgradePlan: "Upgrade Plan",
            storeDowngradePlan: "Downgrade",
            storePerMonth: "/ month",
            storeOneTime: "one-time",
            storeFeatureCoin: "{coin} coin",
            storeFeatureFast: "Instant activation",
            storeFeatureSecure: "Secure payment",
            storeFeatureSupport: "24/7 support",
            orderHistory: "Order History",
            orderHistoryTitle: "Order History",
            orderHistoryDesc: "Review and update your billing information to ensure accurate and timely payments.",
            orderNo: "Order No #",
            orderDate: "Date",
            orderPlan: "Plan",
            orderAmount: "Amount",
            orderHistoryLoading: "Loading order history...",
            orderHistoryNoData: "No order history found.",
            language: "Language",
            chooseLanguageTitle: "Choose Your Language",
            chooseLanguageDesc: "Set your language. The change applies across the whole site.",
            languageField: "Language",
            languageTr: "Turkish",
            languageEn: "English",
            contact: "Contact Us",
            contactTitle: "Contact Us",
            contactDesc: "Send your support request using the form below.",
            contactMessageLabel: "Your Message",
            contactSend: "Send Message",
            contactSending: "Sending...",
            contactSendOk: "Your message has been sent.",
            supportNo: "Support No",
            contactEmailMissing: "Logged in user email is not available.",
            contactMessageRequired: "Message is required.",
            contactMessageMin: "Message must be at least 3 characters.",
            contactMessageMax: "Message must be at most 255 characters.",
            sound: "Sound Notification",
            soundTitle: "Push Notifications",
            soundDesc: "Control your message notifications from here.",
            soundMessageTitle: "Message Notification",
            soundMessageDesc: "You will receive notifications for new messages.",
            soundOn: "On",
            soundOff: "Off",
            soundLoading: "Loading notification status...",
            privacy: "Privacy Policy",
            terms: "User Terms and Conditions",
            policiesTitle: "Policies",
            policiesDesc: "Privacy and compliance policy texts are listed below.",
            termsTitle: "User Terms and Conditions",
            termsDesc: "User terms and conditions texts are listed below.",
            accountDetails: "Account Details",
            accountDesc: "Your users will use this information to contact you.",
            changeImage: "Change Profile Photo",
            changeImageTitle: "Change Profile Photo",
            changeImageDesc: "Select a single image and upload your new profile photo.",
            changeImageSelect: "Choose Image",
            changeImageSelected: "Selected Image",
            changeImageHint: "Upload a single JPG, PNG, or WEBP image.",
            changeImageUpload: "Upload",
            changeImageUploading: "Uploading...",
            changeImageRequired: "Please choose an image.",
            changeImageSuccess: "Profile photo updated.",
            changeImageFailed: "Failed to update profile photo.",
            driverLicenseTitle: "Driver's License",
            driverLicenseDesc: "Add your license status and issue date.",
            hasDriverLicense: "Do you have a driver's license?",
            selectDriverLicense: "Select license type",
            driverLicenseDate: "License Date",
            driverLicenseSave: "Save License",
            driverLicenseSaved: "Driver's license information updated.",
            driverLicenseSaveFailed: "Failed to update driver's license information.",
            militaryTitle: "Military Information",
            militaryDesc: "Add your military status and date if applicable.",
            selectMilitary: "Select military status",
            militaryDate: "Military Date",
            militarySave: "Save Military Information",
            militarySaved: "Military information updated.",
            militarySaveFailed: "Failed to update military information.",
            expectationTitle: "Work Expectations",
            expectationDesc: "Set your service areas and salary expectations.",
            expectationServices: "Service Groups",
            expectationSalary: "Salary Expectation",
            expectationSalaryNote: "This information is only used for statistics.",
            expectationCurrency: "Currency",
            expectationDescription: "Salary Description",
            expectationSave: "Save Expectation",
            expectationSaved: "Work expectation updated.",
            expectationSaveFailed: "Failed to update work expectation.",
            yes: "Yes",
            no: "No",
            cvMediaTitle: "CV Media",
            cvMediaDesc: "Add 2 extra images and 1 video to your CV.",
            cvMediaHint: "Images should be JPG, PNG, or WEBP. Video should use a supported upload format.",
            cvMediaImage2Title: "Extra Image 1",
            cvMediaImage3Title: "Extra Image 2",
            cvMediaVideoTitle: "Video",
            cvMediaEmpty: "Nothing uploaded yet.",
            cvMediaUpload: "Upload",
            cvMediaReplace: "Replace",
            cvMediaDelete: "Delete",
            cvMediaUploading: "Uploading...",
            cvMediaDeleting: "Deleting...",
            cvMediaLoadFailed: "Failed to load CV media.",
            cvMediaUpdateSuccess: "CV media updated.",
            cvMediaDeleteSuccess: "CV media deleted.",
            cvMediaUpdateFailed: "Failed to update CV media.",
            cvMediaDeleteFailed: "Failed to delete CV media.",
            changeEmailTitle: "Change Email Address",
            changeEmailStepOneDesc: "Enter your new email address.",
            changeEmailStepTwoDesc: "Enter the 6-digit code sent to your new email address.",
            changeEmailLabel: "New Email Address",
            changeEmailCodeLabel: "6-Digit Code",
            changeEmailVerify: "Verify",
            changeEmailSending: "Sending Code...",
            changeEmailComplete: "Complete Change",
            changeEmailCompleting: "Updating...",
            changeEmailSentTo: "Code sent to",
            changeEmailRequired: "Please enter a new email address.",
            changeEmailInvalid: "Enter a valid email address.",
            changeEmailSame: "The new email address must be different from the current one.",
            changeEmailExpired: "The code has expired.",
            changeEmailSendFailed: "Failed to send the new email code.",
            changeEmailVerifyFailed: "Failed to change email address.",
            changeEmailSuccess: "Email address changed successfully.",
            changePhoneTitle: "Change Phone Number",
            changePhoneStepOneDesc: "Enter the country code and your new phone number.",
            changePhoneStepTwoDesc: "Enter the 6-digit code sent to your new phone number.",
            changePhoneCountryCodeLabel: "Country Code",
            changePhoneLabel: "New Phone Number",
            changePhoneCodeLabel: "6-Digit Code",
            changePhoneCountryPlaceholder: "Select country code",
            changePhoneCountryLoading: "Loading countries...",
            changePhoneCountrySearchPlaceholder: "Search country",
            changePhoneCountryNoResults: "No results found.",
            changePhoneCountryLoadFailed: "Failed to load countries.",
            changePhoneVerify: "Verify",
            changePhoneSending: "Sending Code...",
            changePhoneComplete: "Complete Change",
            changePhoneCompleting: "Updating...",
            changePhoneSentTo: "Code sent to",
            changePhoneCountryCodeRequired: "Please enter a country code.",
            changePhoneRequired: "Please enter a new phone number.",
            changePhoneSame: "The new phone number must be different from the current one.",
            changePhoneExpired: "The code has expired.",
            changePhoneSendFailed: "Failed to send the new phone verification code.",
            changePhoneVerifyFailed: "Failed to change phone number.",
            changePhoneSuccess: "Phone number changed successfully.",
            verifyEmailTitle: "Verify Email Address",
            verifyEmailDesc: "Enter the 6-digit verification code sent to your email address.",
            verifyEmailCodeLabel: "6-Digit Code",
            verifyEmailResend: "Resend Code",
            verifyEmailSending: "Sending Code...",
            verifyEmailVerify: "Verify",
            verifyEmailVerifying: "Verifying...",
            verifyEmailExpired: "The code has expired. Request a new code.",
            verifyEmailSendFailed: "Failed to send verification code.",
            verifyEmailVerifyFailed: "Failed to verify email.",
            verifyEmailSentTo: "Code sent to",
            verifyPhoneTitle: "Verify Phone Number",
            verifyPhoneDesc: "Enter the 6-digit verification code sent to your phone number.",
            verifyPhoneCodeLabel: "6-Digit Code",
            verifyPhoneSending: "Sending Code...",
            verifyPhoneVerify: "Verify",
            verifyPhoneVerifying: "Verifying...",
            verifyPhoneExpired: "The code has expired.",
            verifyPhoneSendFailed: "Failed to send phone verification code.",
            verifyPhoneVerifyFailed: "Failed to verify phone number.",
            verifyPhoneSentTo: "Code sent to",
            deleteAccountTitle: "Delete Account",
            deleteAccountDesc: "Are you sure you want to delete your account? This action cannot be undone.",
            deleteAccountConfirm: "Yes, Delete Account",
            deleteAccountDeleting: "Deleting...",
            deleteAccountFailed: "Failed to delete account.",
            changePassword: "Change Password",
            changePasswordTitle: "Change Password",
            changePasswordDesc: "Enter your new password twice.",
            newPassword: "New Password",
            newPasswordRepeat: "Repeat New Password",
            changePasswordSave: "Change Password",
            changePasswordSaving: "Updating...",
            passwordRuleMin: "At least 8 characters",
            passwordRuleCase: "Uppercase and lowercase letters",
            passwordRuleDigit: "At least 1 number",
            passwordRuleSymbol: "At least 1 symbol",
            passwordRuleMatch: "Passwords must match",
            changePasswordSuccess: "Password changed successfully.",
            changePasswordFailed: "Failed to change password.",
            resultSuccessTitle: "Success",
            resultErrorTitle: "Alert",
            close: "Close",
            name: "Name",
            surname: "Surname",
            password: "Password",
            email: "Email Address",
            phone: "Phone Number",
            deleteAccount: "Delete Account",
            verify: "Verify",
            checked: "Verified",
            change: "Change",
            save: "Save Change",
            cancel: "Cancel",
            loading: "Loading...",
            noData: "No account information found.",
            sectionSoon: "This section will be available soon.",
            saving: "Saving...",
            saveOk: "Account details saved.",
            privacyLoading: "Loading privacy policy...",
            privacyNoData: "No privacy policy found.",
            termsLoading: "Loading user terms and conditions...",
            termsNoData: "No user terms and conditions found.",
            nameRequired: "Name is required.",
            nameMin: "Name must be at least 2 characters.",
            nameMax: "Name must be at most 100 characters.",
            surnameRequired: "Surname is required.",
            surnameMin: "Surname must be at least 2 characters.",
            surnameMax: "Surname must be at most 100 characters.",
          };

      return Object.fromEntries(
        Object.entries(base).map(([key, value]) => [
          key,
          typeof value === "string" ? translateSettingsValue(value, lang) : value,
        ])
      ) as typeof base;
    },
    [lang]
  );

  const tabItems: Array<{ key: SettingTabKey; label: string }> = [
    { key: "profile", label: text.profile },
    { key: "resume", label: text.resume },
    { key: "store", label: text.store },
    { key: "missions", label: text.missions },
    { key: "orderHistory", label: text.orderHistory },
    { key: "language", label: text.language },
    { key: "contact", label: text.contact },
    { key: "sound", label: text.sound },
    { key: "privacy", label: text.privacy },
    { key: "terms", label: text.terms },
  ];
  const activeTabLabel = tabItems.find((tab) => tab.key === activeTab)?.label ?? text.profile;

  const isProfileTab = activeTab === "profile" || activeTab === "resume";
  const isMissionsTab = activeTab === "missions";
  const isStoreTab = activeTab === "store";
  const isOrderHistoryTab = activeTab === "orderHistory";
  const isLanguageTab = activeTab === "language";
  const isContactTab = activeTab === "contact";
  const isSoundTab = activeTab === "sound";
  const isPrivacyTab = activeTab === "privacy";
  const isTermsTab = activeTab === "terms";
  const isPolicyTab = isPrivacyTab || isTermsTab;
  const languageOptions: Array<{ code: Lang; label: string; flag: string; alt: string }> = [
    { code: "tr", label: text.languageTr, flag: "/assets/images/turkey.png", alt: "Turkey" },
    { code: "en", label: text.languageEn, flag: "/assets/images/united-kingdom.png", alt: "United States" },
    { code: "ru", label: translateSettingsValue("Russian", lang), flag: "/assets/images/russia.svg", alt: "Russia" },
    { code: "es", label: translateSettingsValue("Spanish", lang), flag: "/assets/images/spain.svg", alt: "Spain" },
    { code: "fr", label: translateSettingsValue("French", lang), flag: "/assets/images/france.svg", alt: "France" },
  ];
  const selectedLanguageOption =
    languageOptions.find((option) => option.code === lang) ?? languageOptions[0];
  const policyLoading = isPrivacyTab ? privacyLoading : termsLoading;
  const policyError = isPrivacyTab ? privacyError : termsError;
  const policyItems = isPrivacyTab ? privacyItems : termsItems;
  const policyLoadingText = isPrivacyTab ? text.privacyLoading : text.termsLoading;
  const policyNoDataText = isPrivacyTab ? text.privacyNoData : text.termsNoData;
  const orderDateLocale = localeForLang(lang);
  const contactEmail = (customer?.MusteriEmail ?? "").trim();
  const trimmedContactMessage = contactMessage.trim();
  const contactMessageValidation = validateSupportMessage(contactMessage);
  const contactMessageError =
    contactMessageValidation === "required"
      ? text.contactMessageRequired
      : contactMessageValidation === "min"
      ? text.contactMessageMin
      : contactMessageValidation === "max"
      ? text.contactMessageMax
      : null;
  const contactEmailError = contactEmail ? null : text.contactEmailMissing;
  const canSendContact =
    isContactTab &&
    !loading &&
    !error &&
    !!customer &&
    !contactSending &&
    !contactEmailError &&
    !contactMessageError;
  const trimmedForm = { ad: form.ad.trim(), soyad: form.soyad.trim(), ilNr: form.ilNr };
  const trimmedInitialForm = { ad: initialForm.ad.trim(), soyad: initialForm.soyad.trim(), ilNr: initialForm.ilNr };
  const adValidation = validateName(form.ad);
  const soyadValidation = validateName(form.soyad);
  const adError =
    adValidation === "required"
      ? text.nameRequired
      : adValidation === "min"
      ? text.nameMin
      : adValidation === "max"
      ? text.nameMax
      : null;
  const soyadError =
    soyadValidation === "required"
      ? text.surnameRequired
      : soyadValidation === "min"
      ? text.surnameMin
      : soyadValidation === "max"
      ? text.surnameMax
      : null;
  const cityError = !form.ilNr ? tx("İl seçiniz.", "Select city.") : null;
  const hasValidationError = Boolean(adError || soyadError || cityError);
  const isDirty =
    trimmedForm.ad !== trimmedInitialForm.ad ||
    trimmedForm.soyad !== trimmedInitialForm.soyad ||
    trimmedForm.ilNr !== trimmedInitialForm.ilNr;
  const canSave =
    isProfileTab && !loading && !error && !!customer && isDirty && !saving && !hasValidationError;
  const canCancel = isProfileTab && isDirty && !saving;
  const isAboutDirty = aboutForm.hakkimda.trim() !== initialAboutForm.hakkimda.trim();
  const canSaveAbout = isProfileTab && !!customer && !aboutSaving && isAboutDirty;
  const isJobSearchDirty =
    jobSearchForm.isaramaDurumu.trim() !== initialJobSearchForm.isaramaDurumu.trim();
  const canSaveJobSearch = isProfileTab && !!customer && !jobSearchSaving && isJobSearchDirty;
  const isJobSearchEnabled = normalizeSwitchState(jobSearchForm.isaramaDurumu) === "1";
  const parsedPersonalBirthDate = parseDateInputToIso(personalInfoForm.dogumTarihi);
  const personalInfoCountryIds = resolveCountryIdsFromStoredValue(
    personalInfoForm.uyruklar,
    personalInfoCountries
  );
  const personalInfoSelectedCountries = personalInfoCountryIds
    .map((id) => personalInfoCountries.find((item) => item.Id === id) ?? null)
    .filter((item): item is CountryItem & { Id: number } => Boolean(item && typeof item.Id === "number"));
  const isPersonalInfoDirty =
    personalInfoForm.cinsiyet.trim() !== initialPersonalInfoForm.cinsiyet.trim() ||
    personalInfoForm.tc.trim() !== initialPersonalInfoForm.tc.trim() ||
    personalInfoForm.dogumTarihi !== initialPersonalInfoForm.dogumTarihi ||
    personalInfoForm.uyruklar.trim() !== initialPersonalInfoForm.uyruklar.trim() ||
    personalInfoForm.medeniDurumu.trim() !== initialPersonalInfoForm.medeniDurumu.trim();
  const canSavePersonalInfo =
    isProfileTab &&
    !!customer &&
    !personalInfoSaving &&
    isPersonalInfoDirty &&
    (personalInfoForm.dogumTarihi.trim().length === 0 || !!parsedPersonalBirthDate);
  const parsedWorkStartDate = parseDateInputToIso(workExperienceForm.baslamaTarihi);
  const parsedWorkEndDate = parseDateInputToIso(workExperienceForm.bitisTarihi);
  const parsedWorkNetSalary = parseMoneyToNumber(workExperienceForm.netMaas);
  const parsedUniversityStartDate = parseDateInputToIso(customerUniversitiesForm.baslamaTarihi);
  const parsedUniversityEndDate = parseDateInputToIso(customerUniversitiesForm.bitisTarihi);
  const parsedHighSchoolStartDate = parseDateInputToIso(customerHighSchoolsForm.baslamaTarihi);
  const parsedHighSchoolEndDate = parseDateInputToIso(customerHighSchoolsForm.bitisTarihi);
  const parsedPassportDate = parseDateInputToIso(customerPassportsForm.gecerlilikTarihi);
  const hasRequiredWorkFields =
    workExperienceForm.isyeriAdi.trim().length > 0 &&
    workExperienceForm.isAdi.trim().length > 0 &&
    workExperienceForm.isTanimi.trim().length > 0 &&
    !!parsedWorkStartDate &&
    !!workExperienceForm.calismaSekilId &&
    !!workExperienceForm.ilId &&
    (workExperienceForm.halenCalisiyor || !!parsedWorkEndDate) &&
    workExperienceForm.netMaas.trim().length > 0 &&
    parsedWorkNetSalary != null &&
    !!workExperienceForm.dovizId;
  const canSaveWorkExperience = !workExperienceSaving && hasRequiredWorkFields;
  const canSaveCustomerUniversity =
    !customerUniversitiesSaving &&
    !!customerUniversitiesForm.ulkeId &&
    !!customerUniversitiesForm.universiteId &&
    !!customerUniversitiesForm.bolumId &&
    !!customerUniversitiesForm.ydilId &&
    !!customerUniversitiesForm.egitimDurumId &&
    !!customerUniversitiesForm.egitimId &&
    !!customerUniversitiesForm.egitimTipId &&
    !!parsedUniversityStartDate &&
    !!parsedUniversityEndDate;
  const canSaveCustomerHighSchool =
    !customerHighSchoolsSaving &&
    !!customerHighSchoolsForm.ulkeId &&
    !!customerHighSchoolsForm.liseTipId &&
    customerHighSchoolsForm.liseAdi.trim().length > 0 &&
    !!parsedHighSchoolStartDate &&
    !!parsedHighSchoolEndDate;
  const canSaveCustomerReference =
    !customerReferencesSaving &&
    customerReferencesForm.ad.trim().length > 0 &&
    customerReferencesForm.soyad.trim().length > 0 &&
    customerReferencesForm.isyeriAdi.trim().length > 0 &&
    customerReferencesForm.tel.trim().length > 0 &&
    customerReferencesForm.email.trim().length > 0 &&
    isValidPhoneNumber(customerReferencesForm.tel) &&
    EMAIL_REGEX.test(customerReferencesForm.email.trim());
  const canSaveCustomerPassport =
    !customerPassportsSaving &&
    !!customerPassportsForm.ulkeId &&
    !!parsedPassportDate;
  const canSaveCustomerForeignLanguage =
    !customerForeignLanguagesSaving &&
    !!customerForeignLanguagesForm.ydilId &&
    isValidForeignLanguageLevel(customerForeignLanguagesForm.seviye);
  const hasReferencePhoneLiveError =
    customerReferencesForm.tel.trim().length > 0 && !isValidPhoneNumber(customerReferencesForm.tel);
  const hasReferenceEmailLiveError =
    customerReferencesForm.email.trim().length > 0 &&
    !EMAIL_REGEX.test(customerReferencesForm.email.trim());
  const normalizedEmailChangeValue = emailChangeValue.trim().toLowerCase();
  const currentEmailValue = String(customer?.MusteriEmail ?? "").trim().toLowerCase();
  const currentPhoneCountry = phoneChangeCountries.find((item) => item.Id === customer?.MusteriUlkeNr) ?? null;
  const normalizedPhoneChangeCountryCode = digitsOnly(phoneChangeCountryCode);
  const normalizedPhoneChangeValue = digitsOnly(phoneChangePhone);
  const currentPhoneCountryCode =
    (currentPhoneCountry?.TelKodu ?? (customer?.MusteriUlkeNr === 1 ? "90" : "")).trim().replace(/^\+/, "");
  const currentPhoneValue = digitsOnly(customer?.MusteriTel);
  const selectedPhoneChangeCountry =
    phoneChangeCountries.find((item) => item.Id === phoneChangeCountryId) ?? null;
  const filteredPhoneChangeCountries = useMemo(() => {
    const locale = localeForLang(lang);
    const query = phoneChangeCountrySearch.trim().toLocaleLowerCase(locale);
    const queryCode = query.replace(/^\+/, "");
    const allCountries = phoneChangeCountries.filter(hasCountryId);
    if (!query) return allCountries;
    return allCountries.filter((item) => {
      const name = (item.UlkeAdi ?? "").toLocaleLowerCase(locale);
      const code = (item.TelKodu ?? "").trim().replace(/^\+/, "");
      return name.includes(query) || code.includes(queryCode);
    });
  }, [phoneChangeCountries, phoneChangeCountrySearch, lang]);
  const filteredWorkCities = useMemo(() => {
    const locale = localeForLang(lang);
    const query = workCitySearch.trim().toLocaleLowerCase(locale);
    if (!query) return workCities;
    return workCities.filter((item) => {
      const city = (item.IlAdi ?? "").toLocaleLowerCase(locale);
      const country = (item.UlkeAdi ?? "").toLocaleLowerCase(locale);
      return city.includes(query) || country.includes(query);
    });
  }, [lang, workCities, workCitySearch]);
  const filteredCustomerUniversityCountries = useMemo(() => {
    const locale = localeForLang(lang);
    const query = customerUniversityCountrySearch.trim().toLocaleLowerCase(locale);
    if (!query) return customerUniversityCountries;
    return customerUniversityCountries.filter((item) =>
      (item.UlkeAdi ?? "").toLocaleLowerCase(locale).includes(query)
    );
  }, [customerUniversityCountries, customerUniversityCountrySearch, lang]);
  const filteredCustomerUniversityLanguages = useMemo(() => {
    const locale = localeForLang(lang);
    const query = customerUniversityLanguageSearch.trim().toLocaleLowerCase(locale);
    if (!query) return customerUniversityLanguages;
    return customerUniversityLanguages.filter((item) => basicLookupLabel(item).toLocaleLowerCase(locale).includes(query));
  }, [customerUniversityLanguages, customerUniversityLanguageSearch, lang]);
  const filteredCustomerHighSchoolCountries = useMemo(() => {
    const locale = localeForLang(lang);
    const query = customerHighSchoolCountrySearch.trim().toLocaleLowerCase(locale);
    if (!query) return customerHighSchoolCountries;
    return customerHighSchoolCountries.filter((item) =>
      (item.UlkeAdi ?? "").toLocaleLowerCase(locale).includes(query)
    );
  }, [customerHighSchoolCountries, customerHighSchoolCountrySearch, lang]);
  const filteredCustomerPassportCountries = useMemo(() => {
    const locale = localeForLang(lang);
    const query = customerPassportCountrySearch.trim().toLocaleLowerCase(locale);
    if (!query) return customerPassportCountries;
    return customerPassportCountries.filter((item) =>
      (item.UlkeAdi ?? "").toLocaleLowerCase(locale).includes(query)
    );
  }, [customerPassportCountries, customerPassportCountrySearch, lang]);
  const filteredPersonalInfoCountries = useMemo(() => {
    const locale = localeForLang(lang);
    const query = personalInfoCountrySearch.trim().toLocaleLowerCase(locale);
    const allCountries = personalInfoCountries.filter(hasCountryId);
    if (!query) return allCountries;
    return allCountries.filter((item) => (item.UlkeAdi ?? "").toLocaleLowerCase(locale).includes(query));
  }, [lang, personalInfoCountries, personalInfoCountrySearch]);
  const filteredCustomerForeignLanguageOptions = useMemo(() => {
    const locale = localeForLang(lang);
    const query = customerForeignLanguageSearch.trim().toLocaleLowerCase(locale);
    if (!query) return customerForeignLanguageOptions;
    return customerForeignLanguageOptions.filter((item) =>
      basicLookupLabel(item).toLocaleLowerCase(locale).includes(query)
    );
  }, [customerForeignLanguageOptions, customerForeignLanguageSearch, lang]);
  const selectedWorkCity = workCities.find((item) => item.Id === workExperienceForm.ilId) ?? null;
  const selectedCustomerUniversityCountry =
    customerUniversityCountries.find((item) => item.Id === customerUniversitiesForm.ulkeId) ?? null;
  const selectedCustomerUniversityLanguage =
    customerUniversityLanguages.find((item) => item.Id === customerUniversitiesForm.ydilId) ?? null;
  const selectedCustomerUniversityOption =
    customerUniversityOptions.find((item) => item.Id === customerUniversitiesForm.universiteId) ?? null;
  const selectedCustomerUniversityDepartment =
    customerUniversityDepartmentOptions.find((item) => item.Id === customerUniversitiesForm.bolumId) ?? null;
  const selectedCustomerHighSchoolCountry =
    customerHighSchoolCountries.find((item) => item.Id === customerHighSchoolsForm.ulkeId) ?? null;
  const selectedCustomerHighSchoolType =
    customerHighSchoolTypes.find((item) => item.Id === customerHighSchoolsForm.liseTipId) ?? null;
  const selectedCustomerPassportCountry =
    customerPassportCountries.find((item) => item.Id === customerPassportsForm.ulkeId) ?? null;
  const selectedCustomerForeignLanguage =
    customerForeignLanguageOptions.find((item) => item.Id === customerForeignLanguagesForm.ydilId) ?? null;
  const customerFeatureRecordBySecenekId = useMemo(() => {
    const map = new Map<number, CustomerFeatureItem>();
    for (const item of customerFeaturesItems) {
      if (typeof item.SecenekId !== "number") continue;
      map.set(item.SecenekId, item);
    }
    return map;
  }, [customerFeaturesItems]);
  const hasAnySelectedCustomerFeature = useMemo(
    () => customerFeaturesItems.some((item) => item.Eh === true),
    [customerFeaturesItems]
  );
  const emailChangeDigits = useMemo(
    () => Array.from({ length: EMAIL_VERIFY_CODE_LENGTH }, (_, index) => emailChangeCode[index] ?? ""),
    [emailChangeCode]
  );
  const canStartEmailChange = !emailChangeSending && !emailChangeVerifying;
  const canCompleteEmailChange =
    emailChangeCode.trim().length === EMAIL_VERIFY_CODE_LENGTH &&
    emailChangeExpireSecondsLeft > 0 &&
    !emailChangeSending &&
    !emailChangeVerifying;
  const phoneChangeDigits = useMemo(
    () => Array.from({ length: EMAIL_VERIFY_CODE_LENGTH }, (_, index) => phoneChangeCode[index] ?? ""),
    [phoneChangeCode]
  );
  const canStartPhoneChange =
    !phoneChangeSending && !phoneChangeVerifying && !phoneChangeCountriesLoading;
  const canCompletePhoneChange =
    phoneChangeCode.trim().length === EMAIL_VERIFY_CODE_LENGTH &&
    phoneChangeExpireSecondsLeft > 0 &&
    !phoneChangeSending &&
    !phoneChangeVerifying;
  const emailVerifyDigits = useMemo(
    () => Array.from({ length: EMAIL_VERIFY_CODE_LENGTH }, (_, index) => emailVerifyCode[index] ?? ""),
    [emailVerifyCode]
  );
  const canVerifyEmailCode =
    emailVerifyCode.trim().length === EMAIL_VERIFY_CODE_LENGTH &&
    emailVerifyExpireSecondsLeft > 0 &&
    !emailVerifySending &&
    !emailVerifyVerifying;
  const phoneVerifyDigits = useMemo(
    () => Array.from({ length: EMAIL_VERIFY_CODE_LENGTH }, (_, index) => phoneVerifyCode[index] ?? ""),
    [phoneVerifyCode]
  );
  const canVerifyPhoneCode =
    phoneVerifyCode.trim().length === EMAIL_VERIFY_CODE_LENGTH &&
    phoneVerifyExpireSecondsLeft > 0 &&
    !phoneVerifySending &&
    !phoneVerifyVerifying;
  const passwordValidation = getPasswordValidation(newPassword, confirmNewPassword);
  const canChangePassword =
    isProfileTab &&
    !loading &&
    !error &&
    !!customer &&
    !passwordSubmitting &&
    passwordValidation.isValid;
  const panelTitle = isProfileTab
    ? tx("Özgeçmişini Güncelle", "Update Your CV")
    : isMissionsTab
    ? text.missionsTitle
    : isStoreTab
    ? text.storeTitle
    : isOrderHistoryTab
    ? text.orderHistoryTitle
    : isLanguageTab
    ? text.chooseLanguageTitle
    : isContactTab
    ? text.contactTitle
    : isSoundTab
    ? text.soundTitle
    : isPrivacyTab
    ? text.policiesTitle
    : isTermsTab
    ? text.termsTitle
    : activeTabLabel;
  const panelDescription = isProfileTab
    ? tx("Profilini tamamladıkça ilan başvurularında daha güçlü görünürsün.", "Complete your profile to appear stronger in job applications.")
    : isMissionsTab
    ? text.missionsDesc
    : isStoreTab
    ? text.storeDesc
    : isOrderHistoryTab
    ? text.orderHistoryDesc
    : isLanguageTab
    ? text.chooseLanguageDesc
    : isContactTab
    ? text.contactDesc
    : isSoundTab
    ? text.soundDesc
    : isPrivacyTab
    ? text.policiesDesc
    : isTermsTab
    ? text.termsDesc
    : text.sectionSoon;

  const phonePrefix = currentPhoneCountry
    ? `${currentPhoneCountry.UlkeAdi ?? ""} +${currentPhoneCountryCode}`.trim()
    : customer?.MusteriUlkeNr === 1
    ? "TR +90"
    : "";
  const phoneText = formatPhone(customer?.MusteriTel);
  const customerPhoto = (customer?.MusteriResimUrl ?? "").trim();
  const modalPreviewPhoto = selectedImagePreviewUrl ?? customerPhoto;
  const cvImage2Url = (customerMedia?.Image2ThumbUrl ?? customerMedia?.Image2Url ?? "").trim();
  const cvImage3Url = (customerMedia?.Image3ThumbUrl ?? customerMedia?.Image3Url ?? "").trim();
  const cvVideoUrl = (customerMedia?.VideoUrl ?? "").trim();
  const hasCvExtraMedia = Boolean(cvImage2Url || cvImage3Url || cvVideoUrl);
  const cvMediaCards: Array<{
    key: CvMediaSlotKey;
    title: string;
    url: string;
    inputRef: React.MutableRefObject<HTMLInputElement | null>;
    accept: string;
    isVideo?: boolean;
  }> = [
    {
      key: "image2",
      title: text.cvMediaImage2Title,
      url: cvImage2Url,
      inputRef: extraImage2InputRef,
      accept: "image/png,image/jpeg,image/webp",
    },
    {
      key: "image3",
      title: text.cvMediaImage3Title,
      url: cvImage3Url,
      inputRef: extraImage3InputRef,
      accept: "image/png,image/jpeg,image/webp",
    },
    {
      key: "video",
      title: text.cvMediaVideoTitle,
      url: cvVideoUrl,
      inputRef: videoInputRef,
      accept: "video/*",
      isVideo: true,
    },
  ];
  const customerFullName = `${form.ad} ${form.soyad}`.trim();
  const customerInitials =
    `${form.ad.charAt(0)}${form.soyad.charAt(0)}`.toUpperCase().trim() || "?";
  const cvStatusItems = [
    {
      key: "photo" as CvStatusKey,
      label: tx("Fotoğraf", "Photo"),
      done: Boolean(customerPhoto),
    },
    {
      key: "media" as CvStatusKey,
      label: tx("CV Medyasi", "CV Media"),
      done: hasCvExtraMedia,
    },
    {
      key: "about" as CvStatusKey,
      label: tx("Hakkımda", "About"),
      done: aboutForm.hakkimda.trim().length > 0,
    },
    {
      key: "jobSearch" as CvStatusKey,
      label: tx("İş Arama Durumu", "Job Search Status"),
      done: jobSearchForm.isaramaDurumu.trim().length > 0,
    },
    {
      key: "personal" as CvStatusKey,
      label: tx("Kişisel Bilgiler", "Personal Information"),
      done:
        personalInfoForm.cinsiyet.trim().length > 0 ||
        personalInfoForm.tc.trim().length > 0 ||
        personalInfoForm.dogumTarihi.trim().length > 0 ||
        personalInfoForm.uyruklar.trim().length > 0 ||
        personalInfoForm.medeniDurumu.trim().length > 0,
    },
    {
      key: "license" as CvStatusKey,
      label: tx("Ehliyet", "Driver's License"),
      done: customerLicenseForm.ehliyetVarmi === "0" || customerLicenseForm.ehliyetId != null,
    },
    {
      key: "passport" as CvStatusKey,
      label: tx("Pasaport", "Passport"),
      done: customerPassportsItems.length > 0,
    },
    {
      key: "military" as CvStatusKey,
      label: tx("Askerlik Durumu", "Military Status"),
      done: customerMilitaryForm.askerlikId != null,
    },
    {
      key: "university" as CvStatusKey,
      label: tx("Üniversite", "University"),
      done: customerUniversitiesItems.length > 0,
    },
    {
      key: "highSchool" as CvStatusKey,
      label: tx("Lise", "High School"),
      done: customerHighSchoolsItems.length > 0,
    },
    {
      key: "workExperience" as CvStatusKey,
      label: tx("İş Tecrübesi", "Work Experience"),
      done: workExperienceItems.length > 0,
    },
    {
      key: "references" as CvStatusKey,
      label: tx("Referanslar", "References"),
      done: customerReferencesItems.length > 0,
    },
    {
      key: "foreignLanguages" as CvStatusKey,
      label: tx("Yabancı Diller", "Foreign Languages"),
      done: customerForeignLanguagesItems.length > 0,
    },
    {
      key: "skills" as CvStatusKey,
      label: tx("Nitelikler", "Qualifications"),
      done: hasAnySelectedCustomerFeature,
    },
    {
      key: "preferences" as CvStatusKey,
      label: tx("Tercih Bilgileri", "Preferences"),
      done:
        customerExpectationForm.hizmetGrupIdList.length > 0 ||
        customerExpectationForm.ucretBeklenti.trim().length > 0,
    },
  ];
  const cvMissingItems = cvStatusItems.filter((item) => !item.done);
  const cvCompletedCount = cvStatusItems.filter((item) => item.done).length;
  const cvCompletionPercent =
    cvStatusItems.length > 0 ? Math.round((cvCompletedCount / cvStatusItems.length) * 100) : 0;
  const cvIntroTitle = tx("CV Tamamlanma Durumu", "CV Completion Status");
  const cvIntroDescription =
    tx("Bilgilerini güncel tutarak işverenlerin seni daha hızlı keşfetmesini sağla.", "Keep your details up to date so employers can discover you faster.");
  const phoneChangeButtonText =
    phoneChangeStep === 1
      ? phoneChangeSending
        ? text.changePhoneSending
        : text.changePhoneVerify
      : phoneChangeVerifying
      ? text.changePhoneCompleting
      : phoneChangeExpireSecondsLeft > 0
      ? `${text.changePhoneComplete} (${formatCountdown(phoneChangeExpireSecondsLeft)})`
      : text.changePhoneComplete;
  const emailChangeButtonText =
    emailChangeStep === 1
      ? emailChangeSending
        ? text.changeEmailSending
        : text.changeEmailVerify
      : emailChangeVerifying
      ? text.changeEmailCompleting
      : emailChangeExpireSecondsLeft > 0
      ? `${text.changeEmailComplete} (${formatCountdown(emailChangeExpireSecondsLeft)})`
      : text.changeEmailComplete;
  const verifyEmailButtonText = emailVerifySending
    ? text.verifyEmailSending
    : emailVerifyVerifying
    ? text.verifyEmailVerifying
    : emailVerifyExpireSecondsLeft > 0
    ? `${text.verifyEmailVerify} (${formatCountdown(emailVerifyExpireSecondsLeft)})`
    : text.verifyEmailVerify;
  const verifyPhoneButtonText = phoneVerifySending
    ? text.verifyPhoneSending
    : phoneVerifyVerifying
    ? text.verifyPhoneVerifying
    : phoneVerifyExpireSecondsLeft > 0
    ? `${text.verifyPhoneVerify} (${formatCountdown(phoneVerifyExpireSecondsLeft)})`
    : text.verifyPhoneVerify;
  const passwordRuleItems = [
    { valid: passwordValidation.hasMinLength, label: text.passwordRuleMin },
    { valid: passwordValidation.hasUpperAndLowerCase, label: text.passwordRuleCase },
    { valid: passwordValidation.hasDigit, label: text.passwordRuleDigit },
    { valid: passwordValidation.hasSymbol, label: text.passwordRuleSymbol },
    { valid: passwordValidation.matches, label: text.passwordRuleMatch },
  ];

  const plainInputClass =
    "w-full rounded-xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-[15px] text-[#1f2937] outline-none";

  function formatOrderAmount(item: OrderHistoryItem): string {
    const amount =
      typeof item.MuspaketFiyat === "number"
        ? item.MuspaketFiyat
        : typeof item.PaketFiyat === "number"
        ? item.PaketFiyat
        : null;
    if (amount == null) return "-";
    const symbol = (item.DovizSembol ?? "").trim();
    const formatted = amount.toLocaleString(orderDateLocale, {
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return symbol ? `${symbol}${formatted}` : formatted;
  }

  function formatMissionCoin(value: number | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return value.toLocaleString(orderDateLocale, {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }

  function getStoreCurrencySymbol(item: StorePackageItem): string {
    return (item.DovizSembolu ?? item.DovizSembol ?? "").trim();
  }

  function formatStorePrice(item: StorePackageItem): string {
    if (typeof item.PaketFiyat !== "number" || !Number.isFinite(item.PaketFiyat)) return "-";
    const formatted = item.PaketFiyat.toLocaleString(orderDateLocale, {
      minimumFractionDigits: Number.isInteger(item.PaketFiyat) ? 0 : 2,
      maximumFractionDigits: 2,
    });
    const symbol = getStoreCurrencySymbol(item);
    return symbol ? `${symbol}${formatted}` : formatted;
  }

  function handleStorePackagePurchase(item: StorePackageItem) {
    const packageNr =
      typeof item.Nr === "number" && Number.isFinite(item.Nr)
        ? item.Nr
        : undefined;

    window.dispatchEvent(
      new CustomEvent<OpenCoinPurchaseDetail>(OPEN_COIN_PURCHASE_EVENT, {
        detail: packageNr != null ? { packageNr } : {},
      })
    );
  }

  function getMissionHeadline(item: MissionItem, fallbackTitle: string): string {
    const coin = formatMissionCoin(item.GorevCoin);
    if (coin === "-") return fallbackTitle;
    if (lang === "tr") return `${coin} Coin Kazan!`;
    if (lang === "ru") return `Бесплатно ${coin} Coin!`;
    if (lang === "es") return `${coin} Coin gratis!`;
    if (lang === "fr") return `${coin} Coin gratuit!`;
    return `Free ${coin} Coin!`;
  }

  async function handleSave() {
    if (adError || soyadError || cityError) {
      setSaveSuccess(null);
      setSaveError(adError ?? soyadError ?? cityError);
      return;
    }
    if (!canSave) return;

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      await api.post<CustomerSaveResponse>(`/api/customer/save?kaynak=2&dil=${dil}`, {
        ad: trimmedForm.ad,
        soyad: trimmedForm.soyad,
        ilNr: trimmedForm.ilNr,
      });

      setForm({ ad: trimmedForm.ad, soyad: trimmedForm.soyad, ilNr: trimmedForm.ilNr });
      setInitialForm({ ad: trimmedForm.ad, soyad: trimmedForm.soyad, ilNr: trimmedForm.ilNr });
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriAdi: trimmedForm.ad,
              MusteriSoyadi: trimmedForm.soyad,
              MusteriIlNr: trimmedForm.ilNr ?? undefined,
            }
          : prev
      );
      window.dispatchEvent(
        new CustomEvent<CustomerUpdatedDetail>(CUSTOMER_UPDATED_EVENT, {
          detail: { ad: trimmedForm.ad, soyad: trimmedForm.soyad },
        })
      );
      setSaveSuccess(text.saveOk);
    } catch (err: any) {
      setSaveError(String(err?.message ?? "Failed to save account details"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAbout() {
    if (!canSaveAbout) return;

    try {
      setAboutSaving(true);
      setAboutSaveError(null);
      setAboutSaveSuccess(null);

      await api.post<CustomerSaveHakkimdaResponse>(`/api/customer/save-hakkimda?kaynak=2&dil=${dil}`, {
        Hakkimda: aboutForm.hakkimda.trim(),
      });

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriHakkimda: aboutForm.hakkimda.trim(),
            }
          : prev
      );
      setInitialAboutForm({ hakkimda: aboutForm.hakkimda.trim() });
      setAboutSaveSuccess(tx("Hakkımda bilgisi kaydedildi.", "About information saved."));
    } catch (err: any) {
      setAboutSaveError(String(err?.message ?? (tx("Hakkımda kaydedilemedi.", "Failed to save about information."))));
    } finally {
      setAboutSaving(false);
    }
  }

  async function handleSaveJobSearch() {
    if (!canSaveJobSearch) return;

    try {
      setJobSearchSaving(true);
      setJobSearchSaveError(null);
      setJobSearchSaveSuccess(null);

      await api.post<CustomerSaveIsAramaDurumuResponse>(
        `/api/customer/save-is-arama-durumu?kaynak=2&dil=${dil}`,
        {
          IsaramaDurumu: normalizeLooseRequestValue(jobSearchForm.isaramaDurumu),
        }
      );

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriIsaramaDurumu: jobSearchForm.isaramaDurumu.trim(),
            }
          : prev
      );
      setInitialJobSearchForm({ isaramaDurumu: jobSearchForm.isaramaDurumu.trim() });
      setJobSearchSaveSuccess(
        tx("İş arama durumu kaydedildi.", "Job search status saved.")
      );
    } catch (err: any) {
      setJobSearchSaveError(
        String(err?.message ?? (tx("İş arama durumu kaydedilemedi.", "Failed to save job search status.")))
      );
    } finally {
      setJobSearchSaving(false);
    }
  }

  async function handleToggleJobSearch(nextValue: boolean) {
    const nextState = nextValue ? "1" : "0";
    if (jobSearchSaving || jobSearchForm.isaramaDurumu.trim() === nextState) return;

    const previousValue = jobSearchForm.isaramaDurumu;
    setJobSearchForm({ isaramaDurumu: nextState });
    setJobSearchSaveError(null);
    setJobSearchSaveSuccess(null);

    try {
      setJobSearchSaving(true);

      await api.post<CustomerSaveIsAramaDurumuResponse>(
        `/api/customer/save-is-arama-durumu?kaynak=2&dil=${dil}`,
        {
          IsaramaDurumu: Number(nextState),
        }
      );

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriIsaramaDurumu: nextState,
            }
          : prev
      );
      setInitialJobSearchForm({ isaramaDurumu: nextState });
      setJobSearchSaveSuccess(
        tx("İş arama durumu güncellendi.", "Job search status updated.")
      );
    } catch (err: any) {
      setJobSearchForm({ isaramaDurumu: previousValue });
      setJobSearchSaveError(
        String(err?.message ?? (tx("İş arama durumu güncellenemedi.", "Failed to update job search status.")))
      );
    } finally {
      setJobSearchSaving(false);
    }
  }

  async function handleSavePersonalInfo() {
    if (!canSavePersonalInfo) return;

    try {
      setPersonalInfoSaving(true);
      setPersonalInfoSaveError(null);
      setPersonalInfoSaveSuccess(null);

      await api.post<CustomerSaveCinsiyetResponse>(
        `/api/customer/save-cinsiyet-medeni-durum-dogum-tarihi-uyruk-tc?kaynak=2&dil=${dil}`,
        {
          Cinsiyet: normalizeLooseRequestValue(personalInfoForm.cinsiyet),
          Tc: digitsOnly(personalInfoForm.tc),
          DogumTarihi: parsedPersonalBirthDate,
          Uyruklar: personalInfoForm.uyruklar.trim(),
          MedeniDurumu: normalizeLooseRequestValue(personalInfoForm.medeniDurumu),
        }
      );

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriCinsiyet: personalInfoForm.cinsiyet.trim(),
              MusteriTc: digitsOnly(personalInfoForm.tc),
              MusteriDogumTarihi: parsedPersonalBirthDate ?? undefined,
              MusteriUyruklar: personalInfoForm.uyruklar.trim(),
              MusteriMedeniDurumu: personalInfoForm.medeniDurumu.trim(),
            }
          : prev
      );
      setInitialPersonalInfoForm({
        cinsiyet: personalInfoForm.cinsiyet.trim(),
        tc: digitsOnly(personalInfoForm.tc),
        dogumTarihi: personalInfoForm.dogumTarihi,
        uyruklar: personalInfoForm.uyruklar.trim(),
        medeniDurumu: personalInfoForm.medeniDurumu.trim(),
      });
      setPersonalInfoSaveSuccess(
        tx("Kişisel bilgiler kaydedildi.", "Personal information saved.")
      );
    } catch (err: any) {
      setPersonalInfoSaveError(
        String(err?.message ?? (tx("Kişisel bilgiler kaydedilemedi.", "Failed to save personal information.")))
      );
    } finally {
      setPersonalInfoSaving(false);
    }
  }

  async function handleSaveCustomerLicense() {
    try {
      setCustomerLicenseSaving(true);
      setCustomerLicenseSaveError(null);
      setCustomerLicenseSaveSuccess(null);

      await api.post<CustomerSaveEhliyetResponse>(`/api/customer/save-ehliyet?kaynak=2&dil=${dil}`, {
        EhliyetVarmi: customerLicenseForm.ehliyetVarmi === "1",
        EhliyetId: customerLicenseForm.ehliyetVarmi === "1" ? customerLicenseForm.ehliyetId : null,
        EhliyetTarihi:
          customerLicenseForm.ehliyetVarmi === "1"
            ? parseDateInputToIso(customerLicenseForm.ehliyetTarihi)
            : null,
      });

      setInitialCustomerLicenseForm(customerLicenseForm);
      setCustomerLicenseSaveSuccess(text.driverLicenseSaved);
    } catch (err: any) {
      setCustomerLicenseSaveError(String(err?.message ?? text.driverLicenseSaveFailed));
    } finally {
      setCustomerLicenseSaving(false);
    }
  }

  async function handleSaveCustomerMilitary() {
    try {
      setCustomerMilitarySaving(true);
      setCustomerMilitarySaveError(null);
      setCustomerMilitarySaveSuccess(null);

      await api.post<CustomerSaveAskerlikResponse>(`/api/customer/save-askerlik?kaynak=2&dil=${dil}`, {
        AskerlikId: customerMilitaryForm.askerlikId,
        AskerlikTarihi: parseDateInputToIso(customerMilitaryForm.askerlikTarihi),
      });

      setInitialCustomerMilitaryForm(customerMilitaryForm);
      setCustomerMilitarySaveSuccess(text.militarySaved);
    } catch (err: any) {
      setCustomerMilitarySaveError(String(err?.message ?? text.militarySaveFailed));
    } finally {
      setCustomerMilitarySaving(false);
    }
  }

  async function handleSaveCustomerExpectation() {
    try {
      setCustomerExpectationSaving(true);
      setCustomerExpectationSaveError(null);
      setCustomerExpectationSaveSuccess(null);

      await api.post<CustomerSaveUcretHizmetResponse>(`/api/customer/save-ucret-hizmet?kaynak=2&dil=${dil}`, {
        HizmetGrupIdList: customerExpectationForm.hizmetGrupIdList,
        UcretAciklama: customerExpectationForm.ucretAciklama.trim(),
        UcretBeklenti: parseMoneyToNumber(customerExpectationForm.ucretBeklenti),
        DovizId: customerExpectationForm.dovizId,
      });

      setInitialCustomerExpectationForm(customerExpectationForm);
      setCustomerExpectationSaveSuccess(text.expectationSaved);
    } catch (err: any) {
      setCustomerExpectationSaveError(String(err?.message ?? text.expectationSaveFailed));
    } finally {
      setCustomerExpectationSaving(false);
    }
  }

  function handleCancel() {
    if (!canCancel) return;
    setForm({ ad: initialForm.ad, soyad: initialForm.soyad, ilNr: initialForm.ilNr });
    setSaveError(null);
    setSaveSuccess(null);
  }

  function handleOpenEmailChangeModal() {
    setEmailChangeModalOpen(true);
    setEmailChangeStep(1);
    setEmailChangeError(null);
    setEmailChangeInfoMessage(null);
    setEmailChangeValue(String(customer?.MusteriEmail ?? ""));
    setEmailChangeCode("");
    setEmailChangeExpireSecondsLeft(0);
    setShouldRefreshCustomerOnPopupClose(false);
    setResultModal(null);
  }

  function handleCloseEmailChangeModal() {
    if (emailChangeSending || emailChangeVerifying) return;
    setEmailChangeModalOpen(false);
    setEmailChangeStep(1);
    setEmailChangeError(null);
    setEmailChangeInfoMessage(null);
    setEmailChangeValue(String(customer?.MusteriEmail ?? ""));
    setEmailChangeCode("");
    setEmailChangeExpireSecondsLeft(0);
  }

  async function handleSendEmailChangeCode() {
    if (!canStartEmailChange) return;

    const nextEmail = normalizedEmailChangeValue;
    if (!nextEmail) {
      setEmailChangeError(text.changeEmailRequired);
      return;
    }
    if (!EMAIL_REGEX.test(nextEmail)) {
      setEmailChangeError(text.changeEmailInvalid);
      return;
    }
    if (nextEmail === currentEmailValue) {
      setEmailChangeError(text.changeEmailSame);
      return;
    }

    try {
      setEmailChangeSending(true);
      setEmailChangeError(null);

      const response = await api.post<CustomerNewEmailResponse>("/api/customer/new-email", {
        email: nextEmail,
        dil,
      });

      const nextExpireSeconds = Number(response?.expireSeconds);
      setEmailChangeStep(2);
      setEmailChangeInfoMessage(String(response?.message ?? ""));
      setEmailChangeValue(String(response?.email ?? nextEmail));
      setEmailChangeCode("");
      setEmailChangeExpireSecondsLeft(
        Number.isFinite(nextExpireSeconds) && nextExpireSeconds > 0 ? nextExpireSeconds : 0
      );

      window.requestAnimationFrame(() => {
        emailChangeCodeInputRefs.current[0]?.focus();
      });
    } catch (err: any) {
      setEmailChangeError(String(err?.message ?? text.changeEmailSendFailed));
    } finally {
      setEmailChangeSending(false);
    }
  }

  async function handleCompleteEmailChange() {
    if (emailChangeExpireSecondsLeft <= 0) {
      setEmailChangeError(text.changeEmailExpired);
      return;
    }
    if (!canCompleteEmailChange) return;

    const nextEmail = normalizedEmailChangeValue;
    if (!nextEmail) {
      setEmailChangeError(text.changeEmailRequired);
      return;
    }

    try {
      setEmailChangeVerifying(true);
      setEmailChangeError(null);

      const response = await api.post<CustomerNewEmailVerifyResponse>(
        "/api/customer/new-email-verify",
        {
          email: nextEmail,
          code: emailChangeCode,
          dil,
        }
      );

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriEmail: nextEmail,
              MusteriEmailOnayli: true,
            }
          : prev
      );
      setEmailChangeModalOpen(false);
      setEmailChangeStep(1);
      setEmailChangeInfoMessage(null);
      setEmailChangeCode("");
      setEmailChangeExpireSecondsLeft(0);
      setShouldRefreshCustomerOnPopupClose(true);
      setResultModal({
        kind: "success",
        message: String(response?.Message ?? response?.message ?? text.changeEmailSuccess),
      });
    } catch (err: any) {
      const message = String(err?.message ?? text.changeEmailVerifyFailed);
      setEmailChangeError(message);
      setShouldRefreshCustomerOnPopupClose(false);
      setResultModal({
        kind: "error",
        message,
      });
    } finally {
      setEmailChangeVerifying(false);
    }
  }

  function handleEmailChangeCodeInputChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const chars = emailChangeCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
      chars[index] = " ";
      setEmailChangeCode(chars.join("").replace(/\s+$/g, ""));
      if (emailChangeError) setEmailChangeError(null);
      return;
    }

    const nextChars = emailChangeCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
    const chars = cleaned.slice(0, EMAIL_VERIFY_CODE_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      nextChars[index + offset] = char;
    });
    setEmailChangeCode(nextChars.join("").replace(/\s+$/g, ""));
    if (emailChangeError) setEmailChangeError(null);

    const focusIndex = Math.min(index + chars.length, EMAIL_VERIFY_CODE_LENGTH - 1);
    window.requestAnimationFrame(() => {
      emailChangeCodeInputRefs.current[focusIndex]?.focus();
      emailChangeCodeInputRefs.current[focusIndex]?.select();
    });
  }

  function handleEmailChangeCodeKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (emailChangeDigits[index]) {
        const chars = emailChangeCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
        chars[index] = " ";
        setEmailChangeCode(chars.join("").replace(/\s+$/g, ""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        emailChangeCodeInputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      emailChangeCodeInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < EMAIL_VERIFY_CODE_LENGTH - 1) {
      event.preventDefault();
      emailChangeCodeInputRefs.current[index + 1]?.focus();
    }
  }

  function handleEmailChangeCodePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, EMAIL_VERIFY_CODE_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    setEmailChangeCode(pasted);
    if (emailChangeError) setEmailChangeError(null);

    const focusIndex = Math.min(pasted.length, EMAIL_VERIFY_CODE_LENGTH) - 1;
    window.requestAnimationFrame(() => {
      emailChangeCodeInputRefs.current[Math.max(focusIndex, 0)]?.focus();
      emailChangeCodeInputRefs.current[Math.max(focusIndex, 0)]?.select();
    });
  }

  async function loadPhoneChangeCountries() {
    try {
      setPhoneChangeCountriesLoading(true);
      setPhoneChangeCountriesError(null);

      const data = await Promise.race<CountriesResponse>([
        api.get<CountriesResponse>(`/api/countries?dil=${dil}`),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(
              new Error(tx("Ülkeler yüklenemedi.", "Failed to load countries."))
            );
          }, COUNTRY_LOAD_TIMEOUT_MS);
        }),
      ]);
      const nextCountries = normalizeCountries(data);
      setPhoneChangeCountries(nextCountries);

      const preferredId =
        typeof customer?.MusteriUlkeNr === "number" &&
        nextCountries.some((item) => item.Id === customer.MusteriUlkeNr)
          ? customer.MusteriUlkeNr
          : nextCountries.find((item) => item.Id === 1)?.Id ?? nextCountries.find(hasCountryId)?.Id ?? null;

      setPhoneChangeCountryId(preferredId);

      const preferredCountry = nextCountries.find((item) => item.Id === preferredId) ?? null;
      if (preferredCountry) {
        setPhoneChangeCountryCode((preferredCountry.TelKodu ?? "").trim().replace(/^\+/, ""));
      }
    } catch (err: any) {
      setPhoneChangeCountries([]);
      setPhoneChangeCountriesError(
        String(err?.message ?? (tx("Ülkeler yüklenemedi.", "Failed to load countries.")))
      );
    } finally {
      setPhoneChangeCountriesLoading(false);
    }
  }

  function handleOpenPhoneChangeModal() {
    setPhoneChangeModalOpen(true);
    setPhoneChangeStep(1);
    setPhoneChangeError(null);
    setPhoneChangeInfoMessage(null);
    setPhoneChangeCountriesError(null);
    setPhoneChangeCountryMenuOpen(false);
    setPhoneChangeCountrySearch("");
    setPhoneChangeCountryId(customer?.MusteriUlkeNr ?? phoneChangeCountries.find((item) => item.Id === 1)?.Id ?? null);
    setPhoneChangeCountryCode(currentPhoneCountryCode || "90");
    setPhoneChangePhone(String(customer?.MusteriTel ?? ""));
    setPhoneChangeCode("");
    setPhoneChangeExpireSecondsLeft(0);
    setShouldRefreshCustomerOnPopupClose(false);
    setResultModal(null);
    void loadPhoneChangeCountries();
  }

  function handleClosePhoneChangeModal() {
    if (phoneChangeSending || phoneChangeVerifying) return;
    setPhoneChangeModalOpen(false);
    setPhoneChangeStep(1);
    setPhoneChangeError(null);
    setPhoneChangeInfoMessage(null);
    setPhoneChangeCountryMenuOpen(false);
    setPhoneChangeCountrySearch("");
    setPhoneChangeCountryId(customer?.MusteriUlkeNr ?? phoneChangeCountries.find((item) => item.Id === 1)?.Id ?? null);
    setPhoneChangeCountryCode(currentPhoneCountryCode || "90");
    setPhoneChangePhone(String(customer?.MusteriTel ?? ""));
    setPhoneChangeCode("");
    setPhoneChangeExpireSecondsLeft(0);
  }

  async function handleSendPhoneChangeCode() {
    if (!canStartPhoneChange) return;

    const nextCountryCode = normalizedPhoneChangeCountryCode;
    const nextPhone = normalizedPhoneChangeValue;

    if (!nextCountryCode) {
      setPhoneChangeError(text.changePhoneCountryCodeRequired);
      return;
    }
    if (!nextPhone) {
      setPhoneChangeError(text.changePhoneRequired);
      return;
    }
    if (nextCountryCode === currentPhoneCountryCode && nextPhone === currentPhoneValue) {
      setPhoneChangeError(text.changePhoneSame);
      return;
    }

    try {
      setPhoneChangeSending(true);
      setPhoneChangeError(null);

      const response = await api.post<CustomerNewPhoneNumberResponse>("/api/customer/new-phone-number", {
        countryCode: nextCountryCode,
        telefon: nextPhone,
        dil,
      });

      const nextExpireSeconds = Number(response?.expireSeconds);
      const responseCountryCode = String(response?.countryCode ?? nextCountryCode);
      const matchedCountry =
        phoneChangeCountries.find(
          (item) => (item.TelKodu ?? "").trim().replace(/^\+/, "") === responseCountryCode
        ) ?? null;
      setPhoneChangeStep(2);
      setPhoneChangeInfoMessage(String(response?.message ?? ""));
      setPhoneChangeCountryId(matchedCountry?.Id ?? phoneChangeCountryId);
      setPhoneChangeCountryCode(responseCountryCode);
      setPhoneChangePhone(String(response?.phone ?? nextPhone));
      setPhoneChangeCode("");
      setPhoneChangeCountryMenuOpen(false);
      setPhoneChangeCountrySearch("");
      setPhoneChangeExpireSecondsLeft(
        Number.isFinite(nextExpireSeconds) && nextExpireSeconds > 0 ? nextExpireSeconds : 0
      );

      window.requestAnimationFrame(() => {
        phoneChangeCodeInputRefs.current[0]?.focus();
      });
    } catch (err: any) {
      setPhoneChangeError(String(err?.message ?? text.changePhoneSendFailed));
    } finally {
      setPhoneChangeSending(false);
    }
  }

  async function handleCompletePhoneChange() {
    if (phoneChangeExpireSecondsLeft <= 0) {
      setPhoneChangeError(text.changePhoneExpired);
      return;
    }
    if (!canCompletePhoneChange) return;

    const nextCountryCode = normalizedPhoneChangeCountryCode;
    const nextPhone = normalizedPhoneChangeValue;

    if (!nextCountryCode) {
      setPhoneChangeError(text.changePhoneCountryCodeRequired);
      return;
    }
    if (!nextPhone) {
      setPhoneChangeError(text.changePhoneRequired);
      return;
    }

    try {
      setPhoneChangeVerifying(true);
      setPhoneChangeError(null);

      const matchedCountryId =
        phoneChangeCountries.find(
          (item) => (item.TelKodu ?? "").trim().replace(/^\+/, "") === nextCountryCode
        )?.Id ?? selectedPhoneChangeCountry?.Id ?? customer?.MusteriUlkeNr;

      const response = await api.post<CustomerNewPhoneNumberVerifyResponse>(
        "/api/customer/new-phone-number-verify",
        {
          countryCode: nextCountryCode,
          telefon: nextPhone,
          otpCode: phoneChangeCode,
          dil,
        }
      );

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriTel: nextPhone,
              MusteriTelOnayli: true,
              MusteriUlkeNr: matchedCountryId,
            }
          : prev
      );
      setPhoneChangeModalOpen(false);
      setPhoneChangeStep(1);
      setPhoneChangeInfoMessage(null);
      setPhoneChangeCode("");
      setPhoneChangeExpireSecondsLeft(0);
      setShouldRefreshCustomerOnPopupClose(true);
      setResultModal({
        kind: "success",
        message: String(response?.Message ?? response?.message ?? text.changePhoneSuccess),
      });
    } catch (err: any) {
      const message = String(err?.message ?? text.changePhoneVerifyFailed);
      setPhoneChangeError(message);
      setShouldRefreshCustomerOnPopupClose(false);
      setResultModal({
        kind: "error",
        message,
      });
    } finally {
      setPhoneChangeVerifying(false);
    }
  }

  function handlePhoneChangeCodeInputChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const chars = phoneChangeCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
      chars[index] = " ";
      setPhoneChangeCode(chars.join("").replace(/\s+$/g, ""));
      if (phoneChangeError) setPhoneChangeError(null);
      return;
    }

    const nextChars = phoneChangeCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
    const chars = cleaned.slice(0, EMAIL_VERIFY_CODE_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      nextChars[index + offset] = char;
    });
    setPhoneChangeCode(nextChars.join("").replace(/\s+$/g, ""));
    if (phoneChangeError) setPhoneChangeError(null);

    const focusIndex = Math.min(index + chars.length, EMAIL_VERIFY_CODE_LENGTH - 1);
    window.requestAnimationFrame(() => {
      phoneChangeCodeInputRefs.current[focusIndex]?.focus();
      phoneChangeCodeInputRefs.current[focusIndex]?.select();
    });
  }

  function handlePhoneChangeCodeKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (phoneChangeDigits[index]) {
        const chars = phoneChangeCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
        chars[index] = " ";
        setPhoneChangeCode(chars.join("").replace(/\s+$/g, ""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        phoneChangeCodeInputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      phoneChangeCodeInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < EMAIL_VERIFY_CODE_LENGTH - 1) {
      event.preventDefault();
      phoneChangeCodeInputRefs.current[index + 1]?.focus();
    }
  }

  function handlePhoneChangeCodePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, EMAIL_VERIFY_CODE_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    setPhoneChangeCode(pasted);
    if (phoneChangeError) setPhoneChangeError(null);

    const focusIndex = Math.min(pasted.length, EMAIL_VERIFY_CODE_LENGTH) - 1;
    window.requestAnimationFrame(() => {
      phoneChangeCodeInputRefs.current[Math.max(focusIndex, 0)]?.focus();
      phoneChangeCodeInputRefs.current[Math.max(focusIndex, 0)]?.select();
    });
  }

  async function sendEmailVerificationCode() {
    try {
      setEmailVerifySending(true);
      setEmailVerifyError(null);

      const response = await api.post<CustomerConfirmEmailResponse>("/api/customer/confirm-email", {
        dil,
      });

      const nextExpireSeconds = Number(response?.expireSeconds);
      setEmailVerifyInfoMessage(String(response?.message ?? ""));
      setEmailVerifyEmail(String(response?.email ?? customer?.MusteriEmail ?? ""));
      setEmailVerifyExpireSecondsLeft(
        Number.isFinite(nextExpireSeconds) && nextExpireSeconds > 0 ? nextExpireSeconds : 0
      );
      setEmailVerifyCode("");

      window.requestAnimationFrame(() => {
        emailVerifyCodeInputRefs.current[0]?.focus();
      });
    } catch (err: any) {
      setEmailVerifyError(String(err?.message ?? text.verifyEmailSendFailed));
    } finally {
      setEmailVerifySending(false);
    }
  }

  function handleOpenEmailVerifyModal() {
    setEmailVerifyModalOpen(true);
    setEmailVerifyError(null);
    setEmailVerifyInfoMessage(null);
    setEmailVerifyEmail(String(customer?.MusteriEmail ?? ""));
    setEmailVerifyCode("");
    setEmailVerifyExpireSecondsLeft(0);
    setShouldRefreshCustomerOnPopupClose(false);
    setResultModal(null);
    void sendEmailVerificationCode();
  }

  function handleCloseEmailVerifyModal() {
    if (emailVerifySending || emailVerifyVerifying) return;
    setEmailVerifyModalOpen(false);
    setEmailVerifyError(null);
    setEmailVerifyInfoMessage(null);
    setEmailVerifyCode("");
    setEmailVerifyExpireSecondsLeft(0);
  }

  async function handleVerifyEmailCode() {
    if (emailVerifyExpireSecondsLeft <= 0) {
      setEmailVerifyError(text.verifyEmailExpired);
      return;
    }
    if (!canVerifyEmailCode) return;

    try {
      setEmailVerifyVerifying(true);
      setEmailVerifyError(null);

      const response = await api.post<CustomerConfirmEmailVerifyResponse>(
        "/api/customer/confirm-email-verify",
        {
          code: emailVerifyCode,
          dil,
        }
      );

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriEmailOnayli: true,
            }
          : prev
      );
      setEmailVerifyModalOpen(false);
      setEmailVerifyCode("");
      setEmailVerifyExpireSecondsLeft(0);
      setShouldRefreshCustomerOnPopupClose(true);
      setResultModal({
        kind: "success",
        message: String(response?.Message ?? response?.message ?? text.checked),
      });
    } catch (err: any) {
      const message = String(err?.message ?? text.verifyEmailVerifyFailed);
      setEmailVerifyError(message);
      setShouldRefreshCustomerOnPopupClose(false);
      setResultModal({
        kind: "error",
        message,
      });
    } finally {
      setEmailVerifyVerifying(false);
    }
  }

  function handleEmailVerifyCodeInputChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const chars = emailVerifyCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
      chars[index] = " ";
      setEmailVerifyCode(chars.join("").replace(/\s+$/g, ""));
      if (emailVerifyError) setEmailVerifyError(null);
      return;
    }

    const nextChars = emailVerifyCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
    const chars = cleaned.slice(0, EMAIL_VERIFY_CODE_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      nextChars[index + offset] = char;
    });
    setEmailVerifyCode(nextChars.join("").replace(/\s+$/g, ""));
    if (emailVerifyError) setEmailVerifyError(null);

    const focusIndex = Math.min(index + chars.length, EMAIL_VERIFY_CODE_LENGTH - 1);
    window.requestAnimationFrame(() => {
      emailVerifyCodeInputRefs.current[focusIndex]?.focus();
      emailVerifyCodeInputRefs.current[focusIndex]?.select();
    });
  }

  function handleEmailVerifyCodeKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (emailVerifyDigits[index]) {
        const chars = emailVerifyCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
        chars[index] = " ";
        setEmailVerifyCode(chars.join("").replace(/\s+$/g, ""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        emailVerifyCodeInputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      emailVerifyCodeInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < EMAIL_VERIFY_CODE_LENGTH - 1) {
      event.preventDefault();
      emailVerifyCodeInputRefs.current[index + 1]?.focus();
    }
  }

  function handleEmailVerifyCodePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, EMAIL_VERIFY_CODE_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    setEmailVerifyCode(pasted);
    if (emailVerifyError) setEmailVerifyError(null);

    const focusIndex = Math.min(pasted.length, EMAIL_VERIFY_CODE_LENGTH) - 1;
    window.requestAnimationFrame(() => {
      emailVerifyCodeInputRefs.current[Math.max(focusIndex, 0)]?.focus();
      emailVerifyCodeInputRefs.current[Math.max(focusIndex, 0)]?.select();
    });
  }

  async function sendPhoneVerificationCode() {
    try {
      setPhoneVerifySending(true);
      setPhoneVerifyError(null);

      const response = await api.post<CustomerConfirmPhoneNumberResponse>(
        "/api/customer/confirm-phone-number",
        { dil }
      );

      const nextExpireSeconds = Number(response?.expireSeconds);
      setPhoneVerifyInfoMessage(String(response?.message ?? ""));
      setPhoneVerifyCountryCode(String(response?.countryCode ?? ""));
      setPhoneVerifyPhone(String(response?.phone ?? customer?.MusteriTel ?? ""));
      setPhoneVerifyExpireSecondsLeft(
        Number.isFinite(nextExpireSeconds) && nextExpireSeconds > 0 ? nextExpireSeconds : 0
      );
      setPhoneVerifyCode("");

      window.requestAnimationFrame(() => {
        phoneVerifyCodeInputRefs.current[0]?.focus();
      });
    } catch (err: any) {
      setPhoneVerifyError(String(err?.message ?? text.verifyPhoneSendFailed));
    } finally {
      setPhoneVerifySending(false);
    }
  }

  function handleOpenPhoneVerifyModal() {
    setPhoneVerifyModalOpen(true);
    setPhoneVerifyError(null);
    setPhoneVerifyInfoMessage(null);
    setPhoneVerifyCountryCode("");
    setPhoneVerifyPhone(String(customer?.MusteriTel ?? ""));
    setPhoneVerifyCode("");
    setPhoneVerifyExpireSecondsLeft(0);
    setShouldRefreshCustomerOnPopupClose(false);
    setResultModal(null);
    void sendPhoneVerificationCode();
  }

  function handleClosePhoneVerifyModal() {
    if (phoneVerifySending || phoneVerifyVerifying) return;
    setPhoneVerifyModalOpen(false);
    setPhoneVerifyError(null);
    setPhoneVerifyInfoMessage(null);
    setPhoneVerifyCountryCode("");
    setPhoneVerifyPhone("");
    setPhoneVerifyCode("");
    setPhoneVerifyExpireSecondsLeft(0);
  }

  async function handleVerifyPhoneCode() {
    if (phoneVerifyExpireSecondsLeft <= 0) {
      setPhoneVerifyError(text.verifyPhoneExpired);
      return;
    }
    if (!canVerifyPhoneCode) return;

    try {
      setPhoneVerifyVerifying(true);
      setPhoneVerifyError(null);

      const response = await api.post<CustomerConfirmPhoneNumberVerifyResponse>(
        "/api/customer/confirm-phone-number-verify",
        {
          otpCode: phoneVerifyCode,
          dil,
        }
      );

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriTelOnayli: true,
            }
          : prev
      );
      setPhoneVerifyModalOpen(false);
      setPhoneVerifyCode("");
      setPhoneVerifyExpireSecondsLeft(0);
      setShouldRefreshCustomerOnPopupClose(true);
      setResultModal({
        kind: "success",
        message: String(response?.Message ?? response?.message ?? text.checked),
      });
    } catch (err: any) {
      const message = String(err?.message ?? text.verifyPhoneVerifyFailed);
      setPhoneVerifyError(message);
      setShouldRefreshCustomerOnPopupClose(false);
      setResultModal({
        kind: "error",
        message,
      });
    } finally {
      setPhoneVerifyVerifying(false);
    }
  }

  function handlePhoneVerifyCodeInputChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const chars = phoneVerifyCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
      chars[index] = " ";
      setPhoneVerifyCode(chars.join("").replace(/\s+$/g, ""));
      if (phoneVerifyError) setPhoneVerifyError(null);
      return;
    }

    const nextChars = phoneVerifyCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
    const chars = cleaned.slice(0, EMAIL_VERIFY_CODE_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      nextChars[index + offset] = char;
    });
    setPhoneVerifyCode(nextChars.join("").replace(/\s+$/g, ""));
    if (phoneVerifyError) setPhoneVerifyError(null);

    const focusIndex = Math.min(index + chars.length, EMAIL_VERIFY_CODE_LENGTH - 1);
    window.requestAnimationFrame(() => {
      phoneVerifyCodeInputRefs.current[focusIndex]?.focus();
      phoneVerifyCodeInputRefs.current[focusIndex]?.select();
    });
  }

  function handlePhoneVerifyCodeKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (phoneVerifyDigits[index]) {
        const chars = phoneVerifyCode.padEnd(EMAIL_VERIFY_CODE_LENGTH, " ").split("");
        chars[index] = " ";
        setPhoneVerifyCode(chars.join("").replace(/\s+$/g, ""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        phoneVerifyCodeInputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      phoneVerifyCodeInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < EMAIL_VERIFY_CODE_LENGTH - 1) {
      event.preventDefault();
      phoneVerifyCodeInputRefs.current[index + 1]?.focus();
    }
  }

  function handlePhoneVerifyCodePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, EMAIL_VERIFY_CODE_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    setPhoneVerifyCode(pasted);
    if (phoneVerifyError) setPhoneVerifyError(null);

    const focusIndex = Math.min(pasted.length, EMAIL_VERIFY_CODE_LENGTH) - 1;
    window.requestAnimationFrame(() => {
      phoneVerifyCodeInputRefs.current[Math.max(focusIndex, 0)]?.focus();
      phoneVerifyCodeInputRefs.current[Math.max(focusIndex, 0)]?.select();
    });
  }

  function handleOpenPasswordModal() {
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setShouldRefreshCustomerOnPopupClose(false);
    setResultModal(null);
    setPasswordModalOpen(true);
  }

  function handleClosePasswordModal() {
    if (passwordSubmitting) return;
    setPasswordModalOpen(false);
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  }

  function handleCloseResultModal() {
    setResultModal(null);
    if (shouldRefreshCustomerOnPopupClose) {
      setShouldRefreshCustomerOnPopupClose(false);
      void fetchCustomerProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!canChangePassword) return;

    try {
      setPasswordSubmitting(true);

      await api.post<CustomerChangePasswordResponse>(
        `/api/customer/change-password?kaynak=2&dil=${dil}`,
        { newPassword }
      );

      setPasswordModalOpen(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setShouldRefreshCustomerOnPopupClose(true);
      setResultModal({
        kind: "success",
        message: text.changePasswordSuccess,
      });
    } catch (err: any) {
      setShouldRefreshCustomerOnPopupClose(false);
      setResultModal({
        kind: "error",
        message: String(err?.message ?? text.changePasswordFailed),
      });
    } finally {
      setPasswordSubmitting(false);
    }
  }

  function handleOpenImageModal() {
    setImageError(null);
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl(null);
    setImageModalOpen(true);
  }

  function flashProfileSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.classList.add("ring-2", "ring-[var(--gtg-orange)]", "ring-offset-2", "ring-offset-white");
    window.setTimeout(() => {
      section.classList.remove("ring-2", "ring-[var(--gtg-orange)]", "ring-offset-2", "ring-offset-white");
    }, 1600);
  }

  function focusProfileSection(key: CvStatusKey) {
    const targetMap: Record<CvStatusKey, { sectionId: string; focus?: () => void }> = {
      photo: {
        sectionId: "profile-basic-section",
        focus: () => changeImageButtonRef.current?.focus(),
      },
      media: {
        sectionId: "profile-cv-media-section",
        focus: () => extraImage2InputRef.current?.focus(),
      },
      about: {
        sectionId: "profile-about-section",
        focus: () => aboutTextareaRef.current?.focus(),
      },
      jobSearch: {
        sectionId: "profile-job-search-section",
        focus: () => jobSearchInputRef.current?.focus(),
      },
      personal: {
        sectionId: "profile-personal-info-section",
        focus: () => personalTcInputRef.current?.focus(),
      },
      license: {
        sectionId: "profile-license-section",
        focus: () => customerLicenseTypeInputRef.current?.focus(),
      },
      passport: {
        sectionId: "profile-passport-section",
        focus: () => customerPassportDateInputRef.current?.focus(),
      },
      military: {
        sectionId: "profile-military-section",
        focus: () => customerMilitaryTypeInputRef.current?.focus(),
      },
      university: {
        sectionId: "profile-university-section",
        focus: () => customerUniversityCountryButtonRef.current?.focus(),
      },
      highSchool: {
        sectionId: "profile-high-school-section",
        focus: () => customerHighSchoolCountryButtonRef.current?.focus(),
      },
      workExperience: {
        sectionId: "profile-work-experience-section",
        focus: () => workStartDateInputRef.current?.focus(),
      },
      references: {
        sectionId: "profile-references-section",
      },
      foreignLanguages: {
        sectionId: "profile-foreign-languages-section",
        focus: () => customerForeignLanguageButtonRef.current?.focus(),
      },
      skills: {
        sectionId: "profile-important-info-section",
      },
      preferences: {
        sectionId: "profile-expectation-section",
        focus: () => customerExpectationCurrencyInputRef.current?.focus(),
      },
    };

    const target = targetMap[key];
    const section = document.getElementById(target.sectionId);
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    flashProfileSection(target.sectionId);

    if (target.focus) {
      window.setTimeout(() => {
        target.focus?.();
      }, 250);
    } else {
      window.setTimeout(() => {
        section.focus();
      }, 250);
    }
  }

  function handleCloseImageModal(refreshCustomer?: boolean) {
    if (imageUploading) return;
    setImageModalOpen(false);
    setImageError(null);
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl(null);
    if (refreshCustomer === true) {
      void fetchCustomerProfile(false);
    }
  }

  function handleProfileImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setImageError(null);
    setSelectedImageFile(nextFile);
    setSelectedImagePreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function handleProfileImageUpload() {
    if (!selectedImageFile) {
      setImageError(text.changeImageRequired);
      return;
    }

    try {
      setImageUploading(true);
      setImageError(null);
      setSaveError(null);
      setSaveSuccess(null);

      const formData = new FormData();
      formData.append("File", selectedImageFile, selectedImageFile.name);

      await api.postForm<CustomerChangeImageResponse>(
        `/api/customer/change-image?kaynak=2&dil=${dil}`,
        formData
      );

      window.dispatchEvent(
        new CustomEvent<CustomerUpdatedDetail>(CUSTOMER_UPDATED_EVENT, { detail: {} })
      );

      handleCloseImageModal(true);
      setSaveSuccess(text.changeImageSuccess);
    } catch (err: any) {
      setImageError(String(err?.message ?? text.changeImageFailed));
    } finally {
      setImageUploading(false);
    }
  }

  async function handleCvMediaUpload(kind: CvMediaSlotKey, file: File | null) {
    if (!file) return;

    const route =
      kind === "image2"
        ? `/api/customer/change-image2?kaynak=2&dil=${dil}`
        : kind === "image3"
        ? `/api/customer/change-image3?kaynak=2&dil=${dil}`
        : `/api/customer/change-video?kaynak=2&dil=${dil}`;

    try {
      setCustomerMediaBusyKey(`${kind}-upload`);
      setCustomerMediaError(null);
      setCustomerMediaSuccess(null);
      setSaveError(null);
      setSaveSuccess(null);

      const formData = new FormData();
      formData.append("File", file, file.name);

      await api.postForm(route, formData);
      await fetchCustomerMedia();
      setCustomerMediaSuccess(text.cvMediaUpdateSuccess);
    } catch (err: any) {
      setCustomerMediaError(String(err?.message ?? text.cvMediaUpdateFailed));
    } finally {
      setCustomerMediaBusyKey(null);
    }
  }

  async function handleCvMediaDelete(kind: CvMediaSlotKey) {
    const route =
      kind === "image2"
        ? `/api/customer/softdelete-image?imageNo=2&kaynak=2&dil=${dil}`
        : kind === "image3"
        ? `/api/customer/softdelete-image?imageNo=3&kaynak=2&dil=${dil}`
        : `/api/customer/softdelete-video?kaynak=2&dil=${dil}`;

    try {
      setCustomerMediaBusyKey(`${kind}-delete`);
      setCustomerMediaError(null);
      setCustomerMediaSuccess(null);
      await api.post(route, {});
      await fetchCustomerMedia();
      setCustomerMediaSuccess(text.cvMediaDeleteSuccess);
    } catch (err: any) {
      setCustomerMediaError(String(err?.message ?? text.cvMediaDeleteFailed));
    } finally {
      setCustomerMediaBusyKey(null);
    }
  }

  function handleOpenDeleteModal() {
    setDeleteError(null);
    setDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    if (deleteSubmitting) return;
    setDeleteModalOpen(false);
    setDeleteError(null);
  }

  async function handleDeleteAccount() {
    try {
      setDeleteSubmitting(true);
      setDeleteError(null);

      await api.post<CustomerDeleteResponse>(`/api/customer/soft-delete?kaynak=2&dil=${dil}`, {});
      await logout();
      window.location.href = `/${lang}/login`;
    } catch (err: any) {
      setDeleteError(String(err?.message ?? text.deleteAccountFailed));
      setDeleteSubmitting(false);
    }
  }

  async function handleSendContact() {
    setContactTouched(true);
    if (contactEmailError || contactMessageError) {
      setContactSuccess(null);
      setContactError(contactEmailError ?? contactMessageError);
      return;
    }
    if (!canSendContact) return;

    try {
      setContactSending(true);
      setContactError(null);
      setContactSuccess(null);

      const response = await api.post<SupportCreateResponse>(`/api/support?kaynak=2&dil=${dil}`, {
        destekEmail: contactEmail,
        destekMetin: trimmedContactMessage,
      });

      setContactMessage("");
      setContactTouched(false);
      const supportNr = response?.Data?.Nr;
      setContactSuccess(
        typeof supportNr === "number" && Number.isFinite(supportNr)
          ? `${text.contactSendOk} (${text.supportNo}: ${supportNr})`
          : text.contactSendOk
      );
    } catch (err: any) {
      setContactError(String(err?.message ?? "Failed to send support message"));
    } finally {
      setContactSending(false);
    }
  }

  async function handleMissionComplete(item: MissionItem) {
    const gorevNr = item.Nr;
    if (!gorevNr || item.GorevDone || missionSubmittingNr === gorevNr) return;

    const missionUrl = (item.GorevAdres ?? "").trim();
    if (missionUrl) {
      window.open(missionUrl, "_blank", "noopener,noreferrer");
    }

    try {
      setMissionSubmittingNr(gorevNr);
      setMissionsError(null);
      await api.post(`/api/missions/done?gorevNr=${gorevNr}&kaynak=2&dil=${dil}`, {});
      setMissions((prev) =>
        prev.map((mission) =>
          mission.Nr === gorevNr ? { ...mission, GorevDone: true } : mission
        )
      );
      window.dispatchEvent(
        new CustomEvent<CustomerUpdatedDetail>(CUSTOMER_UPDATED_EVENT, { detail: {} })
      );
    } catch (err: any) {
      setMissionsError(String(err?.message ?? "Failed to complete mission"));
    } finally {
      setMissionSubmittingNr(null);
    }
  }

  function resetWorkExperienceForm() {
    setWorkExperienceForm(EMPTY_WORK_EXPERIENCE_FORM);
    setWorkCitySearch("");
    setWorkCityMenuOpen(false);
    setEditingWorkExperienceNr(null);
    setWorkExperienceFormError(null);
    setWorkExperienceFormSuccess(null);
  }

  function handleEditWorkExperience(item: WorkExperienceItem) {
    if (!item.Nr) return;

    setWorkCitySearch((item.IlAdi ?? "").trim());
    setWorkCityMenuOpen(false);
    setEditingWorkExperienceNr(item.Nr);
    setWorkExperienceForm({
      isyeriAdi: item.MusisIsyeriAdi?.trim() ?? "",
      isAdi: item.MusisIsAdi?.trim() ?? "",
      baslamaTarihi: formatDateForPicker(item.MusisBaslamaTarihi),
      bitisTarihi: item.MusisHalenCalisiyor ? "" : formatDateForPicker(item.MusisBitisTarihi),
      halenCalisiyor: Boolean(item.MusisHalenCalisiyor),
      calismaSekilId: item.CalismaSekilId ?? null,
      ilId: item.IlId ?? null,
      isTanimi: item.MusisIsTanimi?.trim() ?? "",
      netMaas: item.MusisNetMaas == null ? "" : String(item.MusisNetMaas),
      dovizId: item.DovizId ?? workCurrencies[0]?.Id ?? null,
    });
    setWorkExperienceFormError(null);
    setWorkExperienceFormSuccess(null);
  }

  async function handleSaveWorkExperience() {
    if (workExperienceSaving) return;

    setWorkExperienceFormError(null);
    setWorkExperienceFormSuccess(null);

    if (!workExperienceForm.isyeriAdi.trim()) {
      setWorkExperienceFormError(
        tx("Müşteri / İşletme adı zorunludur.", "Client / Business name is required.")
      );
      return;
    }
    if (!workExperienceForm.isAdi.trim()) {
      setWorkExperienceFormError(tx("Yaptığınız iş zorunludur.", "Job title is required."));
      return;
    }
    if (!workExperienceForm.isTanimi.trim()) {
      setWorkExperienceFormError(tx("İş tanımı zorunludur.", "Job description is required."));
      return;
    }
    if (!parsedWorkStartDate) {
      setWorkExperienceFormError(
        tx("Başlangıç tarihi seçiniz.", "Select a start date.")
      );
      return;
    }
    if (!workExperienceForm.halenCalisiyor && !parsedWorkEndDate) {
      setWorkExperienceFormError(
        tx("Bitiş tarihi seçiniz.", "Select an end date.")
      );
      return;
    }
    if (!workExperienceForm.calismaSekilId) {
      setWorkExperienceFormError(tx("Çalışma şekli seçiniz.", "Select work type."));
      return;
    }
    if (!workExperienceForm.ilId) {
      setWorkExperienceFormError(tx("İl seçiniz.", "Select city."));
      return;
    }
    if (!workExperienceForm.netMaas.trim()) {
      setWorkExperienceFormError(tx("Net maaş zorunludur.", "Net salary is required."));
      return;
    }
    if (parsedWorkNetSalary == null) {
      setWorkExperienceFormError(
        tx("Net maaş geçerli bir sayı olmalıdır.", "Net salary must be a valid number.")
      );
      return;
    }
    if (!workExperienceForm.dovizId) {
      setWorkExperienceFormError(
        tx("Maaş için döviz seçiniz.", "Select a currency for salary.")
      );
      return;
    }
    if (
      parsedWorkStartDate &&
      parsedWorkEndDate &&
      !workExperienceForm.halenCalisiyor &&
      new Date(parsedWorkEndDate).getTime() < new Date(parsedWorkStartDate).getTime()
    ) {
      setWorkExperienceFormError(
        tx("Bitiş tarihi başlangıç tarihinden önce olamaz.", "End date cannot be before start date.")
      );
      return;
    }

    try {
      setWorkExperienceSaving(true);

      const payload: SaveWorkExperienceRequest = {
        Id: editingWorkExperienceNr ?? 0,
        IlId: workExperienceForm.ilId,
        CalismaSekilId: workExperienceForm.calismaSekilId,
        IsyeriAdi: workExperienceForm.isyeriAdi.trim(),
        IsAdi: workExperienceForm.isAdi.trim(),
        IsTanimi: workExperienceForm.isTanimi.trim(),
        BaslamaTarihi: parsedWorkStartDate,
        BitisTarihi: workExperienceForm.halenCalisiyor ? null : parsedWorkEndDate,
        HalenCalisiyor: workExperienceForm.halenCalisiyor,
        NetMaas: parsedWorkNetSalary,
        DovizId: workExperienceForm.dovizId ?? workCurrencies[0]?.Id ?? 1,
      };

      await api.post<CreateWorkExperienceResponse>(`/api/work-experiences?kaynak=2&dil=${dil}`, payload);
      const refreshed = await api.get<WorkExperienceResponse>(`/api/work-experiences?dil=${dil}`);
      setWorkExperienceItems(Array.isArray(refreshed?.Data) ? refreshed.Data : []);
      setWorkExperienceForm(EMPTY_WORK_EXPERIENCE_FORM);
      setEditingWorkExperienceNr(null);
      setWorkExperienceFormSuccess(
        editingWorkExperienceNr
          ? tx("İş tecrübesi başarıyla güncellendi.", "Work experience updated successfully.")
          : tx("İş tecrübesi başarıyla eklendi.", "Work experience saved successfully.")
      );
    } catch (err: any) {
      setWorkExperienceFormError(
        String(err?.message ?? (tx("İş tecrübesi kaydedilemedi.", "Failed to save work experience.")))
      );
    } finally {
      setWorkExperienceSaving(false);
    }
  }

  async function handleDeleteWorkExperience(nr: number | undefined) {
    if (!nr || workExperienceDeletingNr != null) return;

    try {
      setWorkExperienceDeletingNr(nr);
      setWorkExperienceFormError(null);
      setWorkExperienceFormSuccess(null);
      await api.post(`/api/work-experiences/soft-delete?isNr=${nr}&kaynak=2&dil=${dil}`, {});
      setWorkExperienceItems((prev) => prev.filter((item) => item.Nr !== nr));
      if (editingWorkExperienceNr === nr) {
        setEditingWorkExperienceNr(null);
        setWorkExperienceForm(EMPTY_WORK_EXPERIENCE_FORM);
      }
      setWorkExperienceFormSuccess(
        tx("İş tecrübesi silindi.", "Work experience deleted.")
      );
    } catch (err: any) {
      setWorkExperienceFormError(
        String(err?.message ?? (tx("İş tecrübesi silinemedi.", "Failed to delete work experience.")))
      );
    } finally {
      setWorkExperienceDeletingNr(null);
    }
  }

  function resetCustomerUniversityForm() {
    setCustomerUniversitiesForm(EMPTY_CUSTOMER_UNIVERSITY_FORM);
    setCustomerUniversityCountrySearch("");
    setCustomerUniversityOptionSearch("");
    setCustomerUniversityDepartmentSearch("");
    setCustomerUniversityLanguageSearch("");
    setCustomerUniversityCountryMenuOpen(false);
    setCustomerUniversityOptionMenuOpen(false);
    setCustomerUniversityDepartmentMenuOpen(false);
    setCustomerUniversityLanguageMenuOpen(false);
    setEditingCustomerUniversityNr(null);
    setCustomerUniversitiesFormError(null);
    setCustomerUniversitiesFormSuccess(null);
  }

  function handleEditCustomerUniversity(item: CustomerUniversityItem) {
    if (!item.Nr) return;

    setEditingCustomerUniversityNr(item.Nr);
    setCustomerUniversityCountrySearch((item.UlkeAdi ?? "").trim());
    setCustomerUniversityOptionSearch((item.UniversiteAdi ?? "").trim());
    setCustomerUniversityDepartmentSearch((item.BolumAdi ?? "").trim());
    setCustomerUniversityLanguageSearch((item.YdilAdi ?? "").trim());
    setCustomerUniversityCountryMenuOpen(false);
    setCustomerUniversityOptionMenuOpen(false);
    setCustomerUniversityDepartmentMenuOpen(false);
    setCustomerUniversityLanguageMenuOpen(false);
    setCustomerUniversitiesForm({
      ulkeId: item.UlkeId ?? null,
      universiteId: item.UniversiteId ?? null,
      bolumId: item.BolumId ?? null,
      ydilId: item.YdilId ?? null,
      egitimDurumId: item.EgitimDurumId ?? null,
      egitimId: item.EgitimId ?? null,
      egitimTipId: item.EgitimTipId ?? null,
      baslamaTarihi: formatDateForPicker(item.MusuniBaslamaTarihi),
      bitisTarihi: formatDateForPicker(item.MusuniBitisTarihi),
    });
    setCustomerUniversitiesFormError(null);
    setCustomerUniversitiesFormSuccess(null);
  }

  async function handleSaveCustomerUniversity() {
    if (customerUniversitiesSaving) return;

    setCustomerUniversitiesFormError(null);
    setCustomerUniversitiesFormSuccess(null);

    if (!customerUniversitiesForm.ulkeId) {
      setCustomerUniversitiesFormError(tx("Ülke seçiniz.", "Select country."));
      return;
    }
    if (!customerUniversitiesForm.universiteId) {
      setCustomerUniversitiesFormError(tx("Üniversite seçiniz.", "Select university."));
      return;
    }
    if (!customerUniversitiesForm.bolumId) {
      setCustomerUniversitiesFormError(tx("Bölüm seçiniz.", "Select department."));
      return;
    }
    if (!customerUniversitiesForm.ydilId) {
      setCustomerUniversitiesFormError(tx("Yabancı dil seçiniz.", "Select foreign language."));
      return;
    }
    if (!customerUniversitiesForm.egitimDurumId) {
      setCustomerUniversitiesFormError(tx("Eğitim durumu seçiniz.", "Select education status."));
      return;
    }
    if (!customerUniversitiesForm.egitimId) {
      setCustomerUniversitiesFormError(tx("Eğitim seviyesi seçiniz.", "Select education level."));
      return;
    }
    if (!customerUniversitiesForm.egitimTipId) {
      setCustomerUniversitiesFormError(tx("Eğitim tipi seçiniz.", "Select education type."));
      return;
    }
    if (!parsedUniversityStartDate) {
      setCustomerUniversitiesFormError(tx("Başlangıç tarihi seçiniz.", "Select a start date."));
      return;
    }
    if (!parsedUniversityEndDate) {
      setCustomerUniversitiesFormError(tx("Bitiş tarihi seçiniz.", "Select an end date."));
      return;
    }
    if (new Date(parsedUniversityEndDate).getTime() < new Date(parsedUniversityStartDate).getTime()) {
      setCustomerUniversitiesFormError(
        tx("Bitiş tarihi başlangıç tarihinden önce olamaz.", "End date cannot be before start date.")
      );
      return;
    }

    try {
      setCustomerUniversitiesSaving(true);
      const payload: SaveCustomerUniversityRequest = {
        Id: editingCustomerUniversityNr ?? 0,
        UlkeId: customerUniversitiesForm.ulkeId,
        UniversiteId: customerUniversitiesForm.universiteId,
        BolumId: customerUniversitiesForm.bolumId,
        YdilId: customerUniversitiesForm.ydilId,
        EgitimDurumId: customerUniversitiesForm.egitimDurumId,
        EgitimId: customerUniversitiesForm.egitimId,
        EgitimTipId: customerUniversitiesForm.egitimTipId,
        BaslamaTarihi: parsedUniversityStartDate,
        BitisTarihi: parsedUniversityEndDate,
      };

      await api.post<SaveCustomerUniversityResponse>(`/api/customer-universities?kaynak=2&dil=${dil}`, payload);
      const refreshed = await api.get<CustomerUniversitiesResponse>(`/api/customer-universities?dil=${dil}`);
      setCustomerUniversitiesItems(Array.isArray(refreshed?.Data) ? refreshed.Data : []);
      resetCustomerUniversityForm();
      setCustomerUniversitiesFormSuccess(
        editingCustomerUniversityNr
          ? tx("Üniversite bilgisi başarıyla güncellendi.", "University information updated successfully.")
          : tx("Üniversite bilgisi başarıyla eklendi.", "University information saved successfully.")
      );
    } catch (err: any) {
      setCustomerUniversitiesFormError(
        String(err?.message ?? (tx("Üniversite bilgisi kaydedilemedi.", "Failed to save university information.")))
      );
    } finally {
      setCustomerUniversitiesSaving(false);
    }
  }

  async function handleDeleteCustomerUniversity(nr: number | undefined) {
    if (!nr || customerUniversitiesDeletingNr != null) return;

    try {
      setCustomerUniversitiesDeletingNr(nr);
      setCustomerUniversitiesFormError(null);
      setCustomerUniversitiesFormSuccess(null);
      await api.post(`/api/customer-universities/soft-delete?id=${nr}&kaynak=2&dil=${dil}`, {});
      setCustomerUniversitiesItems((prev) => prev.filter((item) => item.Nr !== nr));
      if (editingCustomerUniversityNr === nr) {
        resetCustomerUniversityForm();
      }
      setCustomerUniversitiesFormSuccess(
        tx("Üniversite bilgisi silindi.", "University information deleted.")
      );
    } catch (err: any) {
      setCustomerUniversitiesFormError(
        String(err?.message ?? (tx("Üniversite bilgisi silinemedi.", "Failed to delete university information.")))
      );
    } finally {
      setCustomerUniversitiesDeletingNr(null);
    }
  }

  function resetCustomerHighSchoolForm() {
    setCustomerHighSchoolsForm(EMPTY_CUSTOMER_HIGH_SCHOOL_FORM);
    setCustomerHighSchoolCountrySearch("");
    setCustomerHighSchoolCountryMenuOpen(false);
    setEditingCustomerHighSchoolNr(null);
    setCustomerHighSchoolsFormError(null);
    setCustomerHighSchoolsFormSuccess(null);
  }

  function handleEditCustomerHighSchool(item: CustomerHighSchoolItem) {
    if (!item.Nr) return;

    setEditingCustomerHighSchoolNr(item.Nr);
    setCustomerHighSchoolCountrySearch((item.UlkeAdi ?? "").trim());
    setCustomerHighSchoolCountryMenuOpen(false);
    setCustomerHighSchoolsForm({
      ulkeId: item.UlkeId ?? null,
      liseTipId: item.LiseTipId ?? null,
      liseAdi: item.MusliseLiseAdi?.trim() ?? "",
      baslamaTarihi: formatDateForPicker(item.MusliseBaslamaTarihi),
      bitisTarihi: formatDateForPicker(item.MusliseBitisTarihi),
    });
    setCustomerHighSchoolsFormError(null);
    setCustomerHighSchoolsFormSuccess(null);
  }

  async function handleSaveCustomerHighSchool() {
    if (customerHighSchoolsSaving) return;

    setCustomerHighSchoolsFormError(null);
    setCustomerHighSchoolsFormSuccess(null);

    if (!customerHighSchoolsForm.ulkeId) {
      setCustomerHighSchoolsFormError(tx("Ülke seçiniz.", "Select country."));
      return;
    }
    if (!customerHighSchoolsForm.liseTipId) {
      setCustomerHighSchoolsFormError(tx("Lise tipi seçiniz.", "Select high school type."));
      return;
    }
    if (!customerHighSchoolsForm.liseAdi.trim()) {
      setCustomerHighSchoolsFormError(tx("Lise adı zorunludur.", "High school name is required."));
      return;
    }
    if (!parsedHighSchoolStartDate) {
      setCustomerHighSchoolsFormError(tx("Başlangıç tarihi seçiniz.", "Select a start date."));
      return;
    }
    if (!parsedHighSchoolEndDate) {
      setCustomerHighSchoolsFormError(tx("Bitiş tarihi seçiniz.", "Select an end date."));
      return;
    }
    if (new Date(parsedHighSchoolEndDate).getTime() < new Date(parsedHighSchoolStartDate).getTime()) {
      setCustomerHighSchoolsFormError(
        tx("Bitiş tarihi başlangıç tarihinden önce olamaz.", "End date cannot be before start date.")
      );
      return;
    }

    try {
      setCustomerHighSchoolsSaving(true);
      const payload: SaveCustomerHighSchoolRequest = {
        Id: editingCustomerHighSchoolNr ?? 0,
        UlkeId: customerHighSchoolsForm.ulkeId,
        LiseTipId: customerHighSchoolsForm.liseTipId,
        LiseAdi: customerHighSchoolsForm.liseAdi.trim(),
        BaslamaTarihi: parsedHighSchoolStartDate,
        BitisTarihi: parsedHighSchoolEndDate,
      };

      await api.post<SaveCustomerHighSchoolResponse>(`/api/customer-high-schools?kaynak=2&dil=${dil}`, payload);
      const refreshed = await api.get<CustomerHighSchoolsResponse>(`/api/customer-high-schools?dil=${dil}`);
      setCustomerHighSchoolsItems(Array.isArray(refreshed?.Data) ? refreshed.Data : []);
      resetCustomerHighSchoolForm();
      setCustomerHighSchoolsFormSuccess(
        editingCustomerHighSchoolNr
          ? tx("Lise bilgisi başarıyla güncellendi.", "High school information updated successfully.")
          : tx("Lise bilgisi başarıyla eklendi.", "High school information saved successfully.")
      );
    } catch (err: any) {
      setCustomerHighSchoolsFormError(
        String(err?.message ?? (tx("Lise bilgisi kaydedilemedi.", "Failed to save high school information.")))
      );
    } finally {
      setCustomerHighSchoolsSaving(false);
    }
  }

  async function handleDeleteCustomerHighSchool(nr: number | undefined) {
    if (!nr || customerHighSchoolsDeletingNr != null) return;

    try {
      setCustomerHighSchoolsDeletingNr(nr);
      setCustomerHighSchoolsFormError(null);
      setCustomerHighSchoolsFormSuccess(null);
      await api.post(`/api/customer-high-schools/soft-delete?id=${nr}&kaynak=2&dil=${dil}`, {});
      setCustomerHighSchoolsItems((prev) => prev.filter((item) => item.Nr !== nr));
      if (editingCustomerHighSchoolNr === nr) {
        resetCustomerHighSchoolForm();
      }
      setCustomerHighSchoolsFormSuccess(
        tx("Lise bilgisi silindi.", "High school information deleted.")
      );
    } catch (err: any) {
      setCustomerHighSchoolsFormError(
        String(err?.message ?? (tx("Lise bilgisi silinemedi.", "Failed to delete high school information.")))
      );
    } finally {
      setCustomerHighSchoolsDeletingNr(null);
    }
  }

  function resetCustomerReferenceForm() {
    setCustomerReferencesForm(EMPTY_CUSTOMER_REFERENCE_FORM);
    setEditingCustomerReferenceNr(null);
    setCustomerReferencesFormError(null);
    setCustomerReferencesFormSuccess(null);
  }

  function handleEditCustomerReference(item: CustomerReferenceItem) {
    if (!item.Nr) return;

    setEditingCustomerReferenceNr(item.Nr);
    setCustomerReferencesForm({
      ad: item.MusrefAd?.trim() ?? "",
      soyad: item.MusrefSoyad?.trim() ?? "",
      isyeriAdi: item.MusrefIsyeriAdi?.trim() ?? "",
      tel: item.MusrefTel?.trim() ?? "",
      email: item.MusrefEmail?.trim() ?? "",
    });
    setCustomerReferencesFormError(null);
    setCustomerReferencesFormSuccess(null);
  }

  async function handleSaveCustomerReference() {
    if (customerReferencesSaving) return;

    setCustomerReferencesFormError(null);
    setCustomerReferencesFormSuccess(null);

    if (!customerReferencesForm.ad.trim()) {
      setCustomerReferencesFormError(tx("Ad zorunludur.", "Name is required."));
      return;
    }
    if (!customerReferencesForm.soyad.trim()) {
      setCustomerReferencesFormError(tx("Soyad zorunludur.", "Surname is required."));
      return;
    }
    if (!customerReferencesForm.isyeriAdi.trim()) {
      setCustomerReferencesFormError(tx("İşyeri adı zorunludur.", "Company name is required."));
      return;
    }
    if (!customerReferencesForm.tel.trim()) {
      setCustomerReferencesFormError(tx("Telefon zorunludur.", "Phone is required."));
      return;
    }
    if (!isValidPhoneNumber(customerReferencesForm.tel)) {
      setCustomerReferencesFormError(
        tx("Geçerli bir telefon numarası giriniz.", "Enter a valid phone number.")
      );
      return;
    }
    if (!customerReferencesForm.email.trim()) {
      setCustomerReferencesFormError(tx("E-posta zorunludur.", "Email is required."));
      return;
    }
    if (!EMAIL_REGEX.test(customerReferencesForm.email.trim())) {
      setCustomerReferencesFormError(tx("Geçerli bir e-posta giriniz.", "Enter a valid email."));
      return;
    }

    try {
      setCustomerReferencesSaving(true);
      const payload: SaveCustomerReferenceRequest = {
        Id: editingCustomerReferenceNr ?? 0,
        Ad: customerReferencesForm.ad.trim(),
        Soyad: customerReferencesForm.soyad.trim(),
        IsyeriAdi: customerReferencesForm.isyeriAdi.trim(),
        Tel: customerReferencesForm.tel.trim(),
        Email: customerReferencesForm.email.trim(),
      };

      await api.post<SaveCustomerReferenceResponse>(`/api/customer-references?kaynak=2&dil=${dil}`, payload);
      const refreshed = await api.get<CustomerReferencesResponse>(`/api/customer-references?dil=${dil}`);
      setCustomerReferencesItems(Array.isArray(refreshed?.Data) ? refreshed.Data : []);
      resetCustomerReferenceForm();
      setCustomerReferencesFormSuccess(
        editingCustomerReferenceNr
          ? tx("Referans başarıyla güncellendi.", "Reference updated successfully.")
          : tx("Referans başarıyla eklendi.", "Reference saved successfully.")
      );
    } catch (err: any) {
      setCustomerReferencesFormError(
        String(err?.message ?? (tx("Referans kaydedilemedi.", "Failed to save reference.")))
      );
    } finally {
      setCustomerReferencesSaving(false);
    }
  }

  async function handleDeleteCustomerReference(nr: number | undefined) {
    if (!nr || customerReferencesDeletingNr != null) return;

    try {
      setCustomerReferencesDeletingNr(nr);
      setCustomerReferencesFormError(null);
      setCustomerReferencesFormSuccess(null);
      await api.post(`/api/customer-references/soft-delete?id=${nr}&kaynak=2&dil=${dil}`, {});
      setCustomerReferencesItems((prev) => prev.filter((item) => item.Nr !== nr));
      if (editingCustomerReferenceNr === nr) {
        resetCustomerReferenceForm();
      }
      setCustomerReferencesFormSuccess(
        tx("Referans silindi.", "Reference deleted.")
      );
    } catch (err: any) {
      setCustomerReferencesFormError(
        String(err?.message ?? (tx("Referans silinemedi.", "Failed to delete reference.")))
      );
    } finally {
      setCustomerReferencesDeletingNr(null);
    }
  }

  function resetCustomerPassportForm() {
    setCustomerPassportsForm(EMPTY_CUSTOMER_PASSPORT_FORM);
    setCustomerPassportCountrySearch("");
    setCustomerPassportCountryMenuOpen(false);
    setEditingCustomerPassportNr(null);
    setCustomerPassportsFormError(null);
    setCustomerPassportsFormSuccess(null);
  }

  function handleEditCustomerPassport(item: CustomerPassportItem) {
    if (!item.Nr) return;

    setEditingCustomerPassportNr(item.Nr);
    setCustomerPassportCountrySearch((item.UlkeAdi ?? "").trim());
    setCustomerPassportCountryMenuOpen(false);
    setCustomerPassportsForm({
      ulkeId: item.UlkeId ?? null,
      gecerlilikTarihi: formatDateForPicker(item.MuspasaportGecerlilikTarihi),
    });
    setCustomerPassportsFormError(null);
    setCustomerPassportsFormSuccess(null);
  }

  async function handleSaveCustomerPassport() {
    if (customerPassportsSaving) return;

    setCustomerPassportsFormError(null);
    setCustomerPassportsFormSuccess(null);

    if (!customerPassportsForm.ulkeId) {
      setCustomerPassportsFormError(tx("Ülke seçiniz.", "Select country."));
      return;
    }
    if (!parsedPassportDate) {
      setCustomerPassportsFormError(
        tx("Geçerlilik tarihi seçiniz.", "Select an expiry date.")
      );
      return;
    }

    try {
      setCustomerPassportsSaving(true);
      const payload: SaveCustomerPassportRequest = {
        Id: editingCustomerPassportNr ?? 0,
        UlkeId: customerPassportsForm.ulkeId,
        GecerlilikTarihi: parsedPassportDate,
      };

      await api.post<SaveCustomerPassportResponse>(`/api/customer-passports?kaynak=2&dil=${dil}`, payload);
      const refreshed = await api.get<CustomerPassportsResponse>(`/api/customer-passports?dil=${dil}`);
      setCustomerPassportsItems(Array.isArray(refreshed?.Data) ? refreshed.Data : []);
      resetCustomerPassportForm();
      setCustomerPassportsFormSuccess(
        editingCustomerPassportNr
          ? tx("Pasaport başarıyla güncellendi.", "Passport updated successfully.")
          : tx("Pasaport başarıyla eklendi.", "Passport saved successfully.")
      );
    } catch (err: any) {
      setCustomerPassportsFormError(
        String(err?.message ?? (tx("Pasaport kaydedilemedi.", "Failed to save passport.")))
      );
    } finally {
      setCustomerPassportsSaving(false);
    }
  }

  async function handleDeleteCustomerPassport(nr: number | undefined) {
    if (!nr || customerPassportsDeletingNr != null) return;

    try {
      setCustomerPassportsDeletingNr(nr);
      setCustomerPassportsFormError(null);
      setCustomerPassportsFormSuccess(null);
      await api.post(`/api/customer-passports/soft-delete?id=${nr}&kaynak=2&dil=${dil}`, {});
      setCustomerPassportsItems((prev) => prev.filter((item) => item.Nr !== nr));
      if (editingCustomerPassportNr === nr) {
        resetCustomerPassportForm();
      }
      setCustomerPassportsFormSuccess(
        tx("Pasaport silindi.", "Passport deleted.")
      );
    } catch (err: any) {
      setCustomerPassportsFormError(
        String(err?.message ?? (tx("Pasaport silinemedi.", "Failed to delete passport.")))
      );
    } finally {
      setCustomerPassportsDeletingNr(null);
    }
  }

  function resetCustomerForeignLanguageForm() {
    setCustomerForeignLanguagesForm(EMPTY_CUSTOMER_FOREIGN_LANGUAGE_FORM);
    setCustomerForeignLanguageSearch("");
    setCustomerForeignLanguageMenuOpen(false);
    setEditingCustomerForeignLanguageNr(null);
    setCustomerForeignLanguagesFormError(null);
    setCustomerForeignLanguagesFormSuccess(null);
  }

  function handleEditCustomerForeignLanguage(item: CustomerForeignLanguageItem) {
    if (!item.Nr) return;

    setEditingCustomerForeignLanguageNr(item.Nr);
    setCustomerForeignLanguageSearch((item.YdilAdi ?? "").trim());
    setCustomerForeignLanguageMenuOpen(false);
    setCustomerForeignLanguagesForm({
      ydilId: item.YdilId ?? null,
      seviye: String(item.Seviye ?? "").trim(),
    });
    setCustomerForeignLanguagesFormError(null);
    setCustomerForeignLanguagesFormSuccess(null);
  }

  async function handleSaveCustomerForeignLanguage() {
    if (customerForeignLanguagesSaving) return;

    setCustomerForeignLanguagesFormError(null);
    setCustomerForeignLanguagesFormSuccess(null);

    if (!customerForeignLanguagesForm.ydilId) {
      setCustomerForeignLanguagesFormError(
        tx("Yabancı dil seçiniz.", "Select foreign language.")
      );
      return;
    }

    if (!customerForeignLanguagesForm.seviye.trim()) {
      setCustomerForeignLanguagesFormError(
        tx("Seviye giriniz.", "Enter a level.")
      );
      return;
    }
    if (!isValidForeignLanguageLevel(customerForeignLanguagesForm.seviye)) {
      setCustomerForeignLanguagesFormError(
        tx("Seviye 1-10 arası olmalıdır.", "Level must be between 1 and 10.")
      );
      return;
    }

    try {
      setCustomerForeignLanguagesSaving(true);
      const payload: SaveCustomerForeignLanguageRequest = {
        Id: editingCustomerForeignLanguageNr ?? 0,
        YdilId: customerForeignLanguagesForm.ydilId,
        Seviye: Number(customerForeignLanguagesForm.seviye.trim()),
      };

      await api.post<SaveCustomerForeignLanguageResponse>(
        `/api/customer-foreign-languages?kaynak=2&dil=${dil}`,
        payload
      );
      const refreshed = await api.get<CustomerForeignLanguagesResponse>(
        `/api/customer-foreign-languages?dil=${dil}`
      );
      setCustomerForeignLanguagesItems(Array.isArray(refreshed?.Data) ? refreshed.Data : []);
      resetCustomerForeignLanguageForm();
      setCustomerForeignLanguagesFormSuccess(
        editingCustomerForeignLanguageNr
          ? tx("Yabancı dil başarıyla güncellendi.", "Foreign language updated successfully.")
          : tx("Yabancı dil başarıyla eklendi.", "Foreign language saved successfully.")
      );
    } catch (err: any) {
      setCustomerForeignLanguagesFormError(
        String(
          err?.message ??
            (tx("Yabancı dil kaydedilemedi.", "Failed to save foreign language."))
        )
      );
    } finally {
      setCustomerForeignLanguagesSaving(false);
    }
  }

  async function handleDeleteCustomerForeignLanguage(nr: number | undefined) {
    if (!nr || customerForeignLanguagesDeletingNr != null) return;

    try {
      setCustomerForeignLanguagesDeletingNr(nr);
      setCustomerForeignLanguagesFormError(null);
      setCustomerForeignLanguagesFormSuccess(null);
      await api.post(`/api/customer-foreign-languages/soft-delete?id=${nr}&kaynak=2&dil=${dil}`, {});
      setCustomerForeignLanguagesItems((prev) => prev.filter((item) => item.Nr !== nr));
      if (editingCustomerForeignLanguageNr === nr) {
        resetCustomerForeignLanguageForm();
      }
      setCustomerForeignLanguagesFormSuccess(
        tx("Yabancı dil silindi.", "Foreign language deleted.")
      );
    } catch (err: any) {
      setCustomerForeignLanguagesFormError(
        String(
          err?.message ??
            (tx("Yabancı dil silinemedi.", "Failed to delete foreign language."))
        )
      );
    } finally {
      setCustomerForeignLanguagesDeletingNr(null);
    }
  }

  async function refreshCustomerFeaturesRecords() {
    const refreshed = await api.get<CustomerFeaturesResponse>(`/api/customer-features?dil=${dil}`);
    setCustomerFeaturesItems(Array.isArray(refreshed?.Data) ? refreshed.Data : []);
  }

  async function handleToggleCustomerFeature(
    group: FeatureGroupItem,
    option: FeatureGroupOptionItem,
    nextChecked: boolean
  ) {
    const secenekId = option.Id;
    const grupSecenekId = group.Id;
    if (!secenekId || !grupSecenekId) return;
    if (customerFeaturesSavingSecenekIds.includes(secenekId)) return;

    setCustomerFeaturesFormError(null);
    setCustomerFeaturesFormSuccess(null);
    setCustomerFeaturesSavingSecenekIds((prev) => Array.from(new Set([...prev, secenekId])));

    try {
      const currentRecord = customerFeatureRecordBySecenekId.get(secenekId);
      const savePayloads: SaveCustomerFeatureRequest[] = [];

      savePayloads.push({
        Id: currentRecord?.Nr ?? 0,
        SecenekId: secenekId,
        Eh: nextChecked,
      });

      for (const payload of savePayloads) {
        try {
          await api.post<SaveCustomerFeatureResponse>(
            `/api/customer-features?kaynak=2&dil=${dil}`,
            payload
          );
        } catch (postErr: any) {
          const backendMessage =
            String(
              postErr?.response?.data?.Message ??
                postErr?.response?.data?.message ??
                postErr?.message ??
                ""
            ).trim() || (tx("Bilinmeyen hata.", "Unknown error."));
          throw new Error(
            `${backendMessage} (SecenekId: ${payload.SecenekId}, Id: ${payload.Id}, Eh: ${payload.Eh})`
          );
        }
      }
      await refreshCustomerFeaturesRecords();

      setCustomerFeaturesFormSuccess(
        tx("Önemli bilgiler güncellendi.", "Important information updated successfully.")
      );
    } catch (err: any) {
      setCustomerFeaturesFormError(
        String(
          err?.message ??
            (tx("Önemli bilgiler güncellenemedi.", "Failed to update important information."))
        )
      );
    } finally {
      setCustomerFeaturesSavingSecenekIds((prev) => prev.filter((id) => id !== secenekId));
    }
  }

  function handleLanguageSelect(nextLang: Lang) {
    setLanguageMenuOpen(false);
    if (nextLang === lang) return;

    persistLanguagePreference(nextLang);
    router.push(toLangHref(pathname, nextLang));
  }

  async function handleSoundToggle(nextValue: boolean) {
    if (soundSaving) return;

    const prevValue = soundEnabled;
    setSoundEnabled(nextValue);
    setSoundSaving(true);
    setSoundError(null);

    try {
      await api.post(`/api/notifications?bildirim=${nextValue ? 1 : 0}&kaynak=2&dil=${dil}`, {});
    } catch (err: any) {
      setSoundEnabled(prevValue);
      setSoundError(String(err?.message ?? "Failed to update notification status"));
    } finally {
      setSoundSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <header className="border-b border-[#d6dae2] bg-[#f3f3f5] px-4 py-4 lg:px-7" />

      <div className="px-4 py-5 lg:px-7">
        <div className="rounded-2xl border border-[#cfd4de] bg-[#f7f7f9]">
          <div className="min-h-[640px]">
            <section
              className="p-6 lg:p-6"
              role="tabpanel"
              id={`settings-panel-${activeTab}`}
              aria-label={activeTabLabel}
            >
              <h2 className="text-[34px] font-semibold leading-tight text-[#1f232b]">
                {panelTitle}
              </h2>
              <p className="mt-1.5 text-[15px] text-[#66738e]">
                {panelDescription}
              </p>
              {activeTab === "profile" && saveError ? (
                <div className="mt-3 text-sm text-red-600">{saveError}</div>
              ) : null}
              {activeTab === "profile" && saveSuccess ? (
                <div className="mt-3 text-sm text-[#16a34a]">{saveSuccess}</div>
              ) : null}

              {activeTab === "profile" ? (
                <>
                  {loading ? <div className="mt-8 text-sm text-neutral-500">{text.loading}</div> : null}
                  {!loading && error ? <div className="mt-8 text-sm text-red-600">{error}</div> : null}
                  {!loading && !error && !customer ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.noData}</div>
                  ) : null}

                  {!loading && !error && customer ? (
                    <div className="mt-6 space-y-6">
                      <div className="rounded-[28px] border border-[#d8dde6] bg-[linear-gradient(135deg,#fff9ef_0%,#ffffff_54%,#f5f8ff_100%)] p-5 sm:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7d8799]">
                              {cvIntroTitle}
                            </p>
                            <h3 className="mt-2 text-[30px] font-semibold leading-tight text-[#1f232b]">
                              {customerFullName || (tx("Profilini Tamamla", "Complete Your Profile"))}
                            </h3>
                            <p className="mt-2 max-w-[680px] text-[15px] text-[#66738e]">{cvIntroDescription}</p>
                          </div>

                          <div className="rounded-2xl border border-[#f1ddba] bg-[#fff4dd] px-4 py-3 text-left md:min-w-[160px] md:text-right">
                            <div className="text-[34px] font-semibold leading-none text-[#1f232b]">{cvCompletionPercent}%</div>
                            <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8b95a7]">
                              {tx("Tamamlandı", "Completed")}
                            </div>
                            <div className="mt-1 text-[13px] text-[#4f5a71]">
                              {cvCompletedCount}/{cvStatusItems.length}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#ebeff6]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#ffab19_0%,#ff7c28_100%)] transition-[width]"
                            style={{ width: `${cvCompletionPercent}%` }}
                          />
                        </div>

                        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {cvStatusItems.map((item) => (
                            <button
                              type="button"
                              key={item.key}
                              onClick={() => focusProfileSection(item.key)}
                              className={clsx(
                                "flex items-center gap-2 rounded-xl border px-3 py-2 text-[14px] text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                                item.done
                                  ? "border-[#cde8d5] bg-[#eefbf2] text-[#17663a]"
                                  : "border-[#dce2eb] bg-white text-[#657089] hover:border-[#c6d0dd] hover:bg-[#f8fafc]"
                              )}
                            >
                              <CheckCircle2 size={16} className={item.done ? "text-[#16a34a]" : "text-[#9aa3b2]"} />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-5 xl:grid-cols-[1.2fr_1.2fr_0.9fr]">
                        <article id="profile-basic-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-[22px] font-semibold text-[#1f232b]">
                              {tx("Temel Bilgiler", "Basic Information")}
                            </h3>
                            <button
                              ref={changeImageButtonRef}
                              type="button"
                              onClick={handleOpenImageModal}
                              className="rounded-xl bg-[var(--gtg-orange)] px-3 py-2 text-[13px] font-semibold text-white transition hover:brightness-95"
                            >
                              {text.changeImage}
                            </button>
                          </div>

                          <div className="mb-4 flex min-w-0 items-center gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded-full bg-[#e1e4ea]">
                              {customerPhoto ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={customerPhoto} alt={customerFullName || "Customer"} className="h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-sm font-semibold text-[#6b7280]">
                                  {customerInitials}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 text-[15px] font-medium text-[#1f2937]">{customerFullName || "-"}</div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.name}</label>
                              <input
                                value={form.ad}
                                maxLength={NAME_MAX_LENGTH}
                                aria-invalid={isDirty && !!adError}
                                onChange={(event) => {
                                  const next = event.target.value;
                                  setForm((prev) => ({ ...prev, ad: next }));
                                  if (saveError) setSaveError(null);
                                  if (saveSuccess) setSaveSuccess(null);
                                }}
                                className={plainInputClass}
                              />
                              {isDirty && adError ? <p className="mt-1 text-xs text-red-600">{adError}</p> : null}
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.surname}</label>
                              <input
                                value={form.soyad}
                                maxLength={NAME_MAX_LENGTH}
                                aria-invalid={isDirty && !!soyadError}
                                onChange={(event) => {
                                  const next = event.target.value;
                                  setForm((prev) => ({ ...prev, soyad: next }));
                                  if (saveError) setSaveError(null);
                                  if (saveSuccess) setSaveSuccess(null);
                                }}
                                className={plainInputClass}
                              />
                              {isDirty && soyadError ? <p className="mt-1 text-xs text-red-600">{soyadError}</p> : null}
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[15px] text-[#66738e]">{tx("İl", "City")}</label>
                              <select
                                value={form.ilNr ?? ""}
                                onChange={(event) => {
                                  const nextValue = Number(event.target.value);
                                  setForm((prev) => ({
                                    ...prev,
                                    ilNr: Number.isInteger(nextValue) && nextValue > 0 ? nextValue : null,
                                  }));
                                  if (saveError) setSaveError(null);
                                  if (saveSuccess) setSaveSuccess(null);
                                }}
                                className={plainInputClass}
                                disabled={profileCitiesLoading || profileCities.length === 0}
                              >
                                <option value="">{profileCitiesLoading ? tx("Yükleniyor...", "Loading...") : tx("İl seçiniz", "Select city")}</option>
                                {profileCities.map((item) => (
                                  <option key={`profile-city-${item.Id}`} value={item.Id ?? ""}>
                                    {(item.IlAdi ?? "").trim() || "-"}
                                  </option>
                                ))}
                              </select>
                              {isDirty && cityError ? <p className="mt-1 text-xs text-red-600">{cityError}</p> : null}
                            </div>

                            <div>
                              <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label className="block text-[15px] text-[#66738e]">{text.password}</label>
                                <button
                                  type="button"
                                  onClick={handleOpenPasswordModal}
                                  className="text-[13px] font-semibold text-[var(--gtg-orange)] underline-offset-2 hover:underline"
                                >
                                  {text.changePassword}
                                </button>
                              </div>
                              <input value="************" readOnly className={plainInputClass} />
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#e7ebf2] pt-5">
                            <button
                              type="button"
                              onClick={handleCancel}
                              disabled={!canCancel}
                              className={clsx(
                                "rounded-xl border px-7 py-2.5 text-[15px] font-semibold transition",
                                canCancel
                                  ? "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                                  : "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                              )}
                            >
                              {text.cancel}
                            </button>
                            <button
                              type="button"
                              onClick={handleSave}
                              disabled={!canSave}
                              className={clsx(
                                "rounded-xl px-7 py-2.5 text-[15px] font-semibold shadow-sm transition",
                                canSave
                                  ? "bg-[var(--gtg-orange)] text-white"
                                  : "cursor-not-allowed bg-[#d9dde4] text-white"
                              )}
                            >
                              {saving ? text.saving : text.save}
                            </button>
                          </div>
                        </article>

                        <article className="rounded-2xl border border-[#d8dde6] bg-white p-5">
                          <h3 className="mb-4 text-[22px] font-semibold text-[#1f232b]">
                            {tx("İletişim ve Doğrulama", "Contact and Verification")}
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label className="block text-[15px] text-[#66738e]">{text.email}</label>
                                {customer.MusteriEmailOnayli ? (
                                  <span className="text-[13px] font-semibold text-[#16a34a]">{text.checked}</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleOpenEmailVerifyModal}
                                    className="text-[13px] font-semibold text-[var(--gtg-orange)] underline-offset-2 hover:underline"
                                  >
                                    {text.verify}
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                  value={customer.MusteriEmail ?? ""}
                                  readOnly
                                  className={`${plainInputClass} sm:flex-1`}
                                />
                                <button
                                  type="button"
                                  onClick={handleOpenEmailChangeModal}
                                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#d6dde8] bg-white px-5 py-3 text-[15px] font-semibold text-[#2a313d] transition hover:border-[#b8c4d8] hover:bg-[#f8fafc] sm:w-auto"
                                >
                                  {text.change}
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label className="block text-[15px] text-[#66738e]">{text.phone}</label>
                                {customer.MusteriTelOnayli ? (
                                  <span className="text-[13px] font-semibold text-[#16a34a]">{text.checked}</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleOpenPhoneVerifyModal}
                                    className="text-[13px] font-semibold text-[var(--gtg-orange)] underline-offset-2 hover:underline"
                                  >
                                    {text.verify}
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className={`${plainInputClass} flex items-center gap-2 sm:flex-1`}>
                                  <span className="inline-flex h-5 items-center rounded-sm bg-[#E30A17] px-2 text-[10px] font-semibold text-white">
                                    TR
                                  </span>
                                  <span className="text-[15px] text-[#8b95a7]">{phonePrefix}</span>
                                  <ChevronDown size={16} className="text-[#8b95a7]" />
                                  <span className="text-[15px] text-[#2a313d]">{phoneText}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleOpenPhoneChangeModal}
                                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#d6dde8] bg-white px-5 py-3 text-[15px] font-semibold text-[#2a313d] transition hover:border-[#b8c4d8] hover:bg-[#f8fafc] sm:w-auto"
                                >
                                  {text.change}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>

                        <aside className="rounded-2xl border border-[#d8dde6] bg-[#f8fbff] p-5">
                          <h3 className="text-[24px] font-semibold text-[#1f232b]">
                            {tx("Eksik Bilgileriniz", "Missing Information")}
                          </h3>
                          <div className="mt-4 grid gap-2">
                            {cvMissingItems.map((item) => (
                              <button
                                type="button"
                                key={`missing-${item.key}`}
                                onClick={() => focusProfileSection(item.key)}
                                className="flex items-center gap-2 rounded-xl border border-[#d9e6f2] bg-white px-3 py-2 text-left text-[17px] text-[#16395f] transition hover:-translate-y-0.5 hover:border-[#bfd5ea] hover:bg-[#f7fbff] hover:shadow-sm"
                              >
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#1f7ab6]" aria-hidden="true" />
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </aside>
                      </div>

                      <article
                        id="profile-cv-media-section"
                        tabIndex={-1}
                        className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-[24px] font-semibold text-[#1f232b]">{text.cvMediaTitle}</h3>
                            <p className="mt-1 text-[15px] text-[#66738e]">{text.cvMediaDesc}</p>
                          </div>
                          {customerMediaLoading ? (
                            <span className="text-[14px] font-semibold text-[#8b95a7]">{text.loading}</span>
                          ) : null}
                        </div>

                        {customerMediaError ? <div className="mt-4 text-sm text-red-600">{customerMediaError}</div> : null}
                        {customerMediaSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{customerMediaSuccess}</div>
                        ) : null}

                        <div className="mt-5 grid gap-4 lg:grid-cols-3">
                          {cvMediaCards.map((item) => {
                            const uploadBusy = customerMediaBusyKey === `${item.key}-upload`;
                            const deleteBusy = customerMediaBusyKey === `${item.key}-delete`;
                            const hasMedia = item.url.trim().length > 0;

                            return (
                              <div
                                key={item.key}
                                className="rounded-2xl border border-[#d8dde6] bg-[#fbfcfe] p-4"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-[18px] font-semibold text-[#1f232b]">{item.title}</div>
                                  <span
                                    className={clsx(
                                      "rounded-full px-3 py-1 text-[12px] font-semibold",
                                      hasMedia
                                        ? "bg-[#eefbf2] text-[#17663a]"
                                        : "bg-[#eef2f7] text-[#66738e]"
                                    )}
                                  >
                                    {hasMedia ? (tx("Hazir", "Ready")) : tx("Bos", "Empty")}
                                  </span>
                                </div>

                                <div className="mt-4 overflow-hidden rounded-2xl border border-[#e4e9f1] bg-[#eef2f7]">
                                  {hasMedia && item.isVideo ? (
                                    <video src={item.url} controls className="h-56 w-full bg-black object-cover" />
                                  ) : hasMedia ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.url} alt={item.title} className="h-56 w-full object-cover" />
                                  ) : (
                                    <div className="flex h-56 items-center justify-center px-6 text-center text-[14px] text-[#8b95a7]">
                                      {text.cvMediaEmpty}
                                    </div>
                                  )}
                                </div>

                                <p className="mt-3 text-[12px] text-[#66738e]">{text.cvMediaHint}</p>

                                <input
                                  ref={item.inputRef}
                                  type="file"
                                  accept={item.accept}
                                  className="sr-only"
                                  onChange={(event) => {
                                    const nextFile = event.target.files?.[0] ?? null;
                                    void handleCvMediaUpload(item.key, nextFile);
                                    event.currentTarget.value = "";
                                  }}
                                />

                                <div className="mt-4 flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() => item.inputRef.current?.click()}
                                    disabled={uploadBusy || deleteBusy}
                                    className={clsx(
                                      "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white transition",
                                      uploadBusy || deleteBusy
                                        ? "cursor-not-allowed bg-[#d9dde4]"
                                        : "bg-[var(--gtg-orange)] hover:brightness-95"
                                    )}
                                  >
                                    {uploadBusy
                                      ? text.cvMediaUploading
                                      : hasMedia
                                      ? text.cvMediaReplace
                                      : text.cvMediaUpload}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleCvMediaDelete(item.key)}
                                    disabled={!hasMedia || uploadBusy || deleteBusy}
                                    className={clsx(
                                      "inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-[14px] font-semibold transition",
                                      !hasMedia || uploadBusy || deleteBusy
                                        ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                                        : "border-[#f1c7c2] bg-[#fff5f4] text-[#c24135] hover:bg-[#ffefec]"
                                    )}
                                  >
                                    {deleteBusy ? text.cvMediaDeleting : text.cvMediaDelete}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </article>

                      <div className="grid gap-5 xl:grid-cols-2">
                        <article id="profile-about-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[24px] font-semibold text-[#1f232b]">
                              {tx("Hakkımda", "About")}
                            </h3>
                            <span className="text-[14px] font-semibold text-[var(--gtg-orange)]">
                              {tx("Kendinizi kısa anlatın", "Introduce yourself briefly")}
                            </span>
                          </div>

                          {aboutSaveError ? <div className="mt-4 text-sm text-red-600">{aboutSaveError}</div> : null}
                          {aboutSaveSuccess ? <div className="mt-4 text-sm text-[#16a34a]">{aboutSaveSuccess}</div> : null}

                          <div className="mt-5">
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Hakkımda Yazısı", "About Text")}
                            </label>
                            <textarea
                              ref={aboutTextareaRef}
                              value={aboutForm.hakkimda}
                              rows={6}
                              onChange={(event) => {
                                setAboutForm({ hakkimda: event.target.value });
                                if (aboutSaveError) setAboutSaveError(null);
                                if (aboutSaveSuccess) setAboutSaveSuccess(null);
                              }}
                              placeholder={
                                tx("Tecrübelerinizi, yaklaşımınızı ve sizi öne çıkaran yönleri yazın.", "Write about your experience, approach, and strengths.")
                              }
                              className={`${plainInputClass} resize-none`}
                            />
                          </div>

                          <div className="mt-5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleSaveAbout()}
                              disabled={!canSaveAbout}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                canSaveAbout
                                  ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                  : "cursor-not-allowed bg-[#d9dde4]"
                              )}
                            >
                              {aboutSaving ? (tx("Kaydediliyor...", "Saving...")) : tx("Kaydet", "Save")}
                            </button>
                          </div>
                        </article>

                        <article id="profile-job-search-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[24px] font-semibold text-[#1f232b]">
                              {tx("İş Arama Durumu", "Job Search Status")}
                            </h3>
                            <span className="text-[14px] font-semibold text-[var(--gtg-orange)]">
                              {tx("Tek dokunuşla güncelle", "Update with one tap")}
                            </span>
                          </div>

                          {jobSearchSaveError ? <div className="mt-4 text-sm text-red-600">{jobSearchSaveError}</div> : null}
                          {jobSearchSaveSuccess ? <div className="mt-4 text-sm text-[#16a34a]">{jobSearchSaveSuccess}</div> : null}

                          <div className="mt-5 rounded-2xl border border-[#d8dde6] bg-[#fbfcfe] p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-[18px] font-semibold text-[#1f232b]">
                                  {tx("Aktif İş Arayışı", "Active Job Search")}
                                </div>
                                <div className="mt-1 text-[14px] text-[#66738e]">
                                  {tx("İş tekliflerine açık olup olmadığınızı burada belirleyin.", "Choose whether you are open to job opportunities here.")}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={clsx("text-[14px] font-semibold", isJobSearchEnabled ? "text-[#16a34a]" : "text-[#8b95a7]")}>
                                  {isJobSearchEnabled
                                    ? tx("Açık", "On")
                                    : tx("Kapalı", "Off")}
                                </span>
                                <button
                                  ref={jobSearchInputRef}
                                  type="button"
                                  role="switch"
                                  aria-checked={isJobSearchEnabled}
                                  disabled={jobSearchSaving}
                                  onClick={() => void handleToggleJobSearch(!isJobSearchEnabled)}
                                  className={clsx(
                                    "relative inline-flex h-8 w-16 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none",
                                    isJobSearchEnabled
                                      ? "border-[#16a34a] bg-[#16a34a]"
                                      : "border-[#d1d7e0] bg-[#cfd6e2]",
                                    jobSearchSaving && "cursor-not-allowed opacity-70"
                                  )}
                                >
                                  <span
                                    className={clsx(
                                      "inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 mt-[3px]",
                                      isJobSearchEnabled ? "translate-x-9" : "translate-x-1"
                                    )}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      </div>

                      <article id="profile-personal-info-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[24px] font-semibold text-[#1f232b]">
                            {tx("Kişisel Bilgiler", "Personal Information")}
                          </h3>
                          <span className="text-[14px] font-semibold text-[var(--gtg-orange)]">
                            {tx("Kimlik ve durum bilgilerinizi güncelleyin", "Update your identity and status details")}
                          </span>
                        </div>

                        {personalInfoSaveError ? <div className="mt-4 text-sm text-red-600">{personalInfoSaveError}</div> : null}
                        {personalInfoSaveSuccess ? <div className="mt-4 text-sm text-[#16a34a]">{personalInfoSaveSuccess}</div> : null}
                        {personalInfoCountriesError ? (
                          <div className="mt-4 text-sm text-red-600">{personalInfoCountriesError}</div>
                        ) : null}

                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Cinsiyet", "Gender")}
                            </label>
                            <select
                              value={personalInfoForm.cinsiyet}
                              onChange={(event) => {
                                setPersonalInfoForm((prev) => ({ ...prev, cinsiyet: event.target.value }));
                                if (personalInfoSaveError) setPersonalInfoSaveError(null);
                                if (personalInfoSaveSuccess) setPersonalInfoSaveSuccess(null);
                              }}
                              className={plainInputClass}
                            >
                              <option value="">{tx("Cinsiyet Seçiniz", "Select Gender")}</option>
                              {personalInfoCinsiyetler.map((item) => (
                                <option key={`cinsiyet-${item.Id}`} value={item.Id ?? ""}>
                                  {(item.CinsiyetAdi ?? "").trim() || "-"}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("T.C. Kimlik No", "ID Number")}
                            </label>
                            <input
                              ref={personalTcInputRef}
                              value={personalInfoForm.tc}
                              onChange={(event) => {
                                setPersonalInfoForm((prev) => ({ ...prev, tc: digitsOnly(event.target.value) }));
                                if (personalInfoSaveError) setPersonalInfoSaveError(null);
                                if (personalInfoSaveSuccess) setPersonalInfoSaveSuccess(null);
                              }}
                              inputMode="numeric"
                              maxLength={11}
                              className={plainInputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Doğum Tarihi", "Birth Date")}
                            </label>
                            <LocalizedDatePicker
                              buttonRef={personalBirthDateInputRef}
                              lang={lang}
                              value={personalInfoForm.dogumTarihi}
                              onChange={(nextValue) => {
                                setPersonalInfoForm((prev) => ({ ...prev, dogumTarihi: nextValue }));
                                if (personalInfoSaveError) setPersonalInfoSaveError(null);
                                if (personalInfoSaveSuccess) setPersonalInfoSaveSuccess(null);
                              }}
                              className={plainInputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Uyruk", "Nationality")}
                            </label>
                            <input id="uyruks" name="uyruks" type="hidden" value={personalInfoForm.uyruklar} />
                            <select
                              id="uyruk"
                              name="uyruk"
                              multiple
                              value={personalInfoCountryIds.map(String)}
                              onChange={() => undefined}
                              className="sr-only"
                              aria-hidden="true"
                              tabIndex={-1}
                            >
                              {personalInfoCountries.map((country) => (
                                <option key={`personal-country-hidden-${country.Id}`} value={country.Id ?? ""}>
                                  {(country.UlkeAdi ?? "").trim() || "-"}
                                </option>
                              ))}
                            </select>
                            <div className="relative">
                              <button
                                ref={personalInfoCountryButtonRef}
                                type="button"
                                onClick={() =>
                                  !personalInfoCountriesLoading && setPersonalInfoCountryMenuOpen((prev) => !prev)
                                }
                                className={clsx(
                                  `${plainInputClass} flex min-h-12 flex-wrap items-center gap-2 text-left transition`,
                                  personalInfoCountryMenuOpen && "border-[var(--gtg-orange)]",
                                  personalInfoCountriesLoading && "cursor-not-allowed opacity-80"
                                )}
                              >
                                {personalInfoSelectedCountries.length > 0 ? (
                                  <>
                                    {personalInfoSelectedCountries.map((country, index) => (
                                      <span
                                        key={`personal-country-token-${country.Id}-${index}`}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#eef4fb] px-3 py-1 text-[12px] font-semibold text-[#1f5f97]"
                                      >
                                        <span>{(country.UlkeAdi ?? "").trim() || "-"}</span>
                                        <span
                                          role="button"
                                          tabIndex={-1}
                                          onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            const nextIds = personalInfoCountryIds.filter((id) => id !== country.Id);
                                            setPersonalInfoForm((prev) => ({
                                              ...prev,
                                              uyruklar: serializeCountryIds(nextIds),
                                            }));
                                            if (personalInfoSaveError) setPersonalInfoSaveError(null);
                                            if (personalInfoSaveSuccess) setPersonalInfoSaveSuccess(null);
                                          }}
                                          className="text-[#6c86a3]"
                                        >
                                          x
                                        </span>
                                      </span>
                                    ))}
                                    <span className="ml-auto inline-flex items-center text-[#66738e]">
                                      <ChevronDown
                                        size={18}
                                        className={clsx(
                                          "shrink-0 transition",
                                          personalInfoCountryMenuOpen ? "rotate-180" : "rotate-0"
                                        )}
                                      />
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[15px] text-[#8b95a7]">
                                      {tx("Uyruk seçiniz", "Select nationality")}
                                    </span>
                                    <ChevronDown
                                      size={18}
                                      className={clsx(
                                        "ml-auto shrink-0 text-[#66738e] transition",
                                        personalInfoCountryMenuOpen ? "rotate-180" : "rotate-0"
                                      )}
                                    />
                                  </>
                                )}
                              </button>
                              {personalInfoCountryMenuOpen ? (
                                <div
                                  ref={personalInfoCountryMenuRef}
                                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                >
                                  <div className="border-b border-[#e8edf5] p-3">
                                    <input
                                      value={personalInfoCountrySearch}
                                      onChange={(event) => setPersonalInfoCountrySearch(event.target.value)}
                                      placeholder={tx("Ülke ara", "Search country")}
                                      className={plainInputClass}
                                    />
                                  </div>
                                  <div className="max-h-64 overflow-y-auto py-2">
                                    {filteredPersonalInfoCountries.length ? (
                                      filteredPersonalInfoCountries.map((item) => {
                                        const selected = personalInfoCountryIds.includes(item.Id);
                                        return (
                                          <button
                                            key={`personal-country-${item.Id}`}
                                            type="button"
                                            onClick={() => {
                                              const nextIds = selected
                                                ? personalInfoCountryIds.filter((id) => id !== item.Id)
                                                : [...personalInfoCountryIds, item.Id];
                                              setPersonalInfoForm((prev) => ({
                                                ...prev,
                                                uyruklar: serializeCountryIds(nextIds),
                                              }));
                                              if (personalInfoSaveError) setPersonalInfoSaveError(null);
                                              if (personalInfoSaveSuccess) setPersonalInfoSaveSuccess(null);
                                            }}
                                            className={clsx(
                                              "flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                              selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                            )}
                                          >
                                            <span>{(item.UlkeAdi ?? "").trim() || "-"}</span>
                                            {selected ? <CheckCircle2 size={16} className="text-[var(--gtg-orange)]" /> : null}
                                          </button>
                                        );
                                      })
                                    ) : (
                                      <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                        {tx("Sonuç bulunamadı.", "No results found.")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            <p className="mt-1.5 text-[12px] text-[#66738e]">
                              {personalInfoCountriesLoading
                                ? tx("Uyruklar yükleniyor...", "Loading nationalities...")
                                : tx("Birden fazla ülke seçebilirsiniz. Gizli değer id listesi olarak tutulur.", "You can select multiple countries. The hidden value is stored as an id list.")}
                            </p>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Medeni Durum", "Marital Status")}
                            </label>
                            <select
                              value={personalInfoForm.medeniDurumu}
                              onChange={(event) => {
                                setPersonalInfoForm((prev) => ({ ...prev, medeniDurumu: event.target.value }));
                                if (personalInfoSaveError) setPersonalInfoSaveError(null);
                                if (personalInfoSaveSuccess) setPersonalInfoSaveSuccess(null);
                              }}
                              className={plainInputClass}
                            >
                              <option value="">{tx("Medeni Durum Seçiniz", "Select Marital Status")}</option>
                              {personalInfoMedeniHaller.map((item) => (
                                <option key={`medeni-hal-${item.Id}`} value={item.Id ?? ""}>
                                  {(item.MedeniHalAdi ?? "").trim() || "-"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleSavePersonalInfo()}
                            disabled={!canSavePersonalInfo}
                            className={clsx(
                              "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                              canSavePersonalInfo
                                ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                : "cursor-not-allowed bg-[#d9dde4]"
                            )}
                          >
                            {personalInfoSaving ? (tx("Kaydediliyor...", "Saving...")) : tx("Kaydet", "Save")}
                          </button>
                        </div>
                      </article>

                      <div className="grid gap-5 xl:grid-cols-2">
                        <article id="profile-license-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[24px] font-semibold text-[#1f232b]">{text.driverLicenseTitle}</h3>
                            <span className="text-[14px] font-semibold text-[var(--gtg-orange)]">{text.driverLicenseDesc}</span>
                          </div>
                          {customerLicenseSaveError ? <div className="mt-4 text-sm text-red-600">{customerLicenseSaveError}</div> : null}
                          {customerLicenseSaveSuccess ? <div className="mt-4 text-sm text-[#16a34a]">{customerLicenseSaveSuccess}</div> : null}
                          <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.hasDriverLicense}</label>
                              <select
                                value={customerLicenseForm.ehliyetVarmi}
                                onChange={(event) => setCustomerLicenseForm((prev) => ({ ...prev, ehliyetVarmi: event.target.value }))}
                                className={plainInputClass}
                              >
                                <option value="0">{text.no}</option>
                                <option value="1">{text.yes}</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.selectDriverLicense}</label>
                              <select
                                ref={customerLicenseTypeInputRef}
                                value={customerLicenseForm.ehliyetId ?? ""}
                                disabled={customerLicenseForm.ehliyetVarmi !== "1"}
                                onChange={(event) =>
                                  setCustomerLicenseForm((prev) => ({
                                    ...prev,
                                    ehliyetId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{text.selectDriverLicense}</option>
                                {customerLicenseOptions.map((item) => (
                                  <option key={`license-${item.Id}`} value={item.Id}>
                                    {basicLookupLabel(item) || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.driverLicenseDate}</label>
                              <LocalizedDatePicker
                                buttonRef={customerLicenseDateInputRef}
                                lang={lang}
                                value={customerLicenseForm.ehliyetTarihi}
                                disabled={customerLicenseForm.ehliyetVarmi !== "1"}
                                onChange={(nextValue) => setCustomerLicenseForm((prev) => ({ ...prev, ehliyetTarihi: nextValue }))}
                                className={plainInputClass}
                              />
                            </div>
                          </div>
                          <div className="mt-5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleSaveCustomerLicense()}
                              disabled={customerLicenseSaving}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                customerLicenseSaving ? "cursor-not-allowed bg-[#d9dde4]" : "bg-[var(--gtg-orange)] hover:brightness-95"
                              )}
                            >
                              {customerLicenseSaving ? (tx("Kaydediliyor...", "Saving...")) : text.driverLicenseSave}
                            </button>
                          </div>
                        </article>

                        <article id="profile-military-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[24px] font-semibold text-[#1f232b]">{text.militaryTitle}</h3>
                            <span className="text-[14px] font-semibold text-[var(--gtg-orange)]">{text.militaryDesc}</span>
                          </div>
                          {customerMilitarySaveError ? <div className="mt-4 text-sm text-red-600">{customerMilitarySaveError}</div> : null}
                          {customerMilitarySaveSuccess ? <div className="mt-4 text-sm text-[#16a34a]">{customerMilitarySaveSuccess}</div> : null}
                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.selectMilitary}</label>
                              <select
                                ref={customerMilitaryTypeInputRef}
                                value={customerMilitaryForm.askerlikId ?? ""}
                                onChange={(event) =>
                                  setCustomerMilitaryForm((prev) => ({
                                    ...prev,
                                    askerlikId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{text.selectMilitary}</option>
                                {customerMilitaryOptions.map((item) => (
                                  <option key={`military-${item.Id}`} value={item.Id}>
                                    {basicLookupLabel(item) || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.militaryDate}</label>
                              <LocalizedDatePicker
                                buttonRef={customerMilitaryDateInputRef}
                                lang={lang}
                                value={customerMilitaryForm.askerlikTarihi}
                                onChange={(nextValue) => setCustomerMilitaryForm((prev) => ({ ...prev, askerlikTarihi: nextValue }))}
                                className={plainInputClass}
                              />
                            </div>
                          </div>
                          <div className="mt-5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleSaveCustomerMilitary()}
                              disabled={customerMilitarySaving}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                customerMilitarySaving ? "cursor-not-allowed bg-[#d9dde4]" : "bg-[var(--gtg-orange)] hover:brightness-95"
                              )}
                            >
                              {customerMilitarySaving ? (tx("Kaydediliyor...", "Saving...")) : text.militarySave}
                            </button>
                          </div>
                        </article>
                      </div>

                      <article id="profile-expectation-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[24px] font-semibold text-[#1f232b]">{text.expectationTitle}</h3>
                          <span className="text-[14px] font-semibold text-[var(--gtg-orange)]">{text.expectationDesc}</span>
                        </div>
                        {customerExpectationSaveError ? <div className="mt-4 text-sm text-red-600">{customerExpectationSaveError}</div> : null}
                        {customerExpectationSaveSuccess ? <div className="mt-4 text-sm text-[#16a34a]">{customerExpectationSaveSuccess}</div> : null}

                        <div className="mt-5 grid gap-4">
                          <div>
                            <label className="mb-2 block text-[15px] font-medium text-[#1f232b]">{text.expectationServices}</label>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {customerExpectationServiceGroups.map((item) => {
                                const selected = customerExpectationForm.hizmetGrupIdList.includes(item.Id ?? -1);
                                return (
                                  <label
                                    key={`service-group-${item.Id}`}
                                    className={clsx(
                                      "flex items-start gap-3 rounded-xl border px-4 py-3 transition",
                                      selected ? "border-[var(--gtg-orange)] bg-[#fff8ef]" : "border-[#d9dde6] bg-[#fbfcfe]"
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={(event) => {
                                        const id = item.Id ?? 0;
                                        setCustomerExpectationForm((prev) => ({
                                          ...prev,
                                          hizmetGrupIdList: event.target.checked
                                            ? [...prev.hizmetGrupIdList, id].filter((value, index, arr) => value > 0 && arr.indexOf(value) === index)
                                            : prev.hizmetGrupIdList.filter((value) => value !== id),
                                        }));
                                      }}
                                      className="mt-1 h-4 w-4 rounded border-[#b5bece]"
                                    />
                                    <span>
                                      <span className="block text-[15px] font-semibold text-[#1f232b]">
                                        {(item.HizmetGrupAdi ?? item.HgAdi ?? "").trim() || "-"}
                                      </span>
                                      {((item.HizmetGrupDetay ?? item.HgDetay ?? "").trim()) ? (
                                        <span className="mt-1 block text-[13px] text-[#66738e]">
                                          {(item.HizmetGrupDetay ?? item.HgDetay ?? "").trim()}
                                        </span>
                                      ) : null}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.expectationSalary}</label>
                              <input
                                value={customerExpectationForm.ucretBeklenti}
                                inputMode="decimal"
                                onChange={(event) =>
                                  setCustomerExpectationForm((prev) => ({ ...prev, ucretBeklenti: event.target.value }))
                                }
                                className={plainInputClass}
                              />
                              <p className="mt-1.5 text-[12px] text-[#66738e]">{text.expectationSalaryNote}</p>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.expectationCurrency}</label>
                              <select
                                ref={customerExpectationCurrencyInputRef}
                                value={customerExpectationForm.dovizId ?? ""}
                                onChange={(event) =>
                                  setCustomerExpectationForm((prev) => ({
                                    ...prev,
                                    dovizId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{text.expectationCurrency}</option>
                                {workCurrencies.map((item) => (
                                  <option key={`expectation-currency-${item.Id}`} value={item.Id}>
                                    {(item.DovizKisaAdi ?? item.DovizAdi ?? "").trim() || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">{text.expectationDescription}</label>
                            <textarea
                              rows={4}
                              value={customerExpectationForm.ucretAciklama}
                              onChange={(event) =>
                                setCustomerExpectationForm((prev) => ({ ...prev, ucretAciklama: event.target.value }))
                              }
                              className={`${plainInputClass} resize-none`}
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleSaveCustomerExpectation()}
                            disabled={customerExpectationSaving}
                            className={clsx(
                              "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                              customerExpectationSaving ? "cursor-not-allowed bg-[#d9dde4]" : "bg-[var(--gtg-orange)] hover:brightness-95"
                            )}
                          >
                            {customerExpectationSaving ? (tx("Kaydediliyor...", "Saving...")) : text.expectationSave}
                          </button>
                        </div>
                      </article>

                      <article id="profile-work-experience-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {tx("İş Tecrübeleri", "Work Experiences")}
                          </h3>
                          <span className="text-[16px] font-semibold text-[var(--gtg-orange)]">
                            {editingWorkExperienceNr
                              ? tx("İş Tecrübesi Düzenle", "Edit Work Experience")
                              : tx("İş Tecrübesi Ekle", "Add Work Experience")}
                          </span>
                        </div>

                        {workExperienceLoading ? (
                          <div className="mt-4 text-sm text-neutral-500">
                            {tx("İş tecrübeleri yükleniyor...", "Loading work experiences...")}
                          </div>
                        ) : null}
                        {workExperienceError ? (
                          <div className="mt-4 text-sm text-red-600">{workExperienceError}</div>
                        ) : null}
                        {workTypesError && !workExperienceError ? (
                          <div className="mt-4 text-sm text-red-600">{workTypesError}</div>
                        ) : null}
                        {workExperienceFormError ? (
                          <div className="mt-4 text-sm text-red-600">{workExperienceFormError}</div>
                        ) : null}
                        {workExperienceFormSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{workExperienceFormSuccess}</div>
                        ) : null}

                        {workExperienceItems.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {workExperienceItems.map((item) => {
                              const startText = formatDateForInput(item.MusisBaslamaTarihi) || "-";
                              const endText = item.MusisHalenCalisiyor
                                ? tx("Halen çalışıyorum", "Currently working")
                                : formatDateForInput(item.MusisBitisTarihi) || "-";
                              return (
                                <div
                                  key={`work-exp-${item.Nr ?? Math.random()}`}
                                  className="rounded-xl border border-[#d9dde6] bg-[#f9fafc] px-4 py-3"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="text-[17px] font-semibold text-[#1f232b]">
                                        {(item.MusisIsyeriAdi ?? "").trim() || "-"}
                                      </div>
                                      <div className="text-[14px] text-[#4f5a71]">
                                        {(item.MusisIsAdi ?? "").trim() || "-"}
                                      </div>
                                      <div className="mt-1 text-[13px] text-[#66738e]">
                                        {startText} - {endText}
                                      </div>
                                      <div className="text-[13px] text-[#66738e]">
                                        {(item.IlAdi ?? "-").trim()} / {(item.CalismaSekilAdi ?? "-").trim()}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleEditWorkExperience(item)}
                                        disabled={workExperienceSaving || workExperienceDeletingNr === item.Nr}
                                        aria-label={tx("İş tecrübesini düzenle", "Edit work experience")}
                                        className={clsx(
                                          "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                          editingWorkExperienceNr === item.Nr
                                            ? "border-[var(--gtg-orange)] bg-[#fff2eb] text-[var(--gtg-orange)]"
                                            : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f2f5f9]",
                                          workExperienceSaving || workExperienceDeletingNr === item.Nr
                                            ? "cursor-not-allowed opacity-60"
                                            : ""
                                        )}
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteWorkExperience(item.Nr)}
                                        disabled={workExperienceDeletingNr === item.Nr}
                                        aria-label={tx("İş tecrübesini sil", "Delete work experience")}
                                        className={clsx(
                                          "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                          workExperienceDeletingNr === item.Nr
                                            ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                                            : "border-[#ef6c62] bg-[#fff5f4] text-[#d43f33] hover:bg-[#ffebe9]"
                                        )}
                                      >
                                        {workExperienceDeletingNr === item.Nr ? (
                                          <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                          <Trash2 size={16} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-4">
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Müşteri / İşletme Adı", "Client / Business Name")}
                            </label>
                            <input
                              value={workExperienceForm.isyeriAdi}
                              onChange={(event) =>
                                setWorkExperienceForm((prev) => ({ ...prev, isyeriAdi: event.target.value }))
                              }
                              className={plainInputClass}
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Yaptığınız İş", "Job Title")}
                            </label>
                            <input
                              value={workExperienceForm.isAdi}
                              onChange={(event) =>
                                setWorkExperienceForm((prev) => ({ ...prev, isAdi: event.target.value }))
                              }
                              className={plainInputClass}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Başlangıç Tarihi", "Start Date")}
                              </label>
                              <LocalizedDatePicker
                                buttonRef={workStartDateInputRef}
                                lang={lang}
                                value={workExperienceForm.baslamaTarihi}
                                onChange={(nextValue) =>
                                  setWorkExperienceForm((prev) => ({ ...prev, baslamaTarihi: nextValue }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Bitiş Tarihi", "End Date")}
                              </label>
                              <LocalizedDatePicker
                                buttonRef={workEndDateInputRef}
                                lang={lang}
                                value={workExperienceForm.bitisTarihi}
                                onChange={(nextValue) =>
                                  setWorkExperienceForm((prev) => ({ ...prev, bitisTarihi: nextValue }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                            <label className="mb-1 flex items-center gap-2 text-[15px] font-medium text-[#1f232b]">
                              <input
                                type="checkbox"
                                checked={workExperienceForm.halenCalisiyor}
                                onChange={(event) =>
                                  setWorkExperienceForm((prev) => ({
                                    ...prev,
                                    halenCalisiyor: event.target.checked,
                                  }))
                                }
                                className="h-4 w-4 rounded border-[#b5bece]"
                              />
                              <span>{tx("Halen çalışıyorum", "Currently working")}</span>
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Çalışma Şekli", "Work Type")}
                              </label>
                              <select
                                value={workExperienceForm.calismaSekilId ?? ""}
                                disabled={workTypesLoading}
                                onChange={(event) =>
                                  setWorkExperienceForm((prev) => ({
                                    ...prev,
                                    calismaSekilId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{tx("Çalışma Şekli Seçiniz", "Select Work Type")}</option>
                                {workTypes.map((item) => (
                                  <option key={`work-type-${item.Id}`} value={item.Id}>
                                    {(item.CalismaSekliAdi ?? "").trim() || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Şehir", "City")}
                              </label>
                              <div className="relative">
                                <button
                                  ref={workCityButtonRef}
                                  type="button"
                                  onClick={() => setWorkCityMenuOpen((prev) => !prev)}
                                  className={clsx(
                                    `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                    workCityMenuOpen && "border-[var(--gtg-orange)]"
                                  )}
                                >
                                  <span className="truncate text-[15px] text-[#2a313d]">
                                    {selectedWorkCity
                                      ? `${(selectedWorkCity.IlAdi ?? "").trim() || "-"}${
                                          (selectedWorkCity.UlkeAdi ?? "").trim() ? ` - ${(selectedWorkCity.UlkeAdi ?? "").trim()}` : ""
                                        }`
                                      : tx("İl Seçiniz", "Select City")}
                                  </span>
                                  <ChevronDown
                                    size={18}
                                    className={clsx("shrink-0 text-[#66738e] transition", workCityMenuOpen ? "rotate-180" : "rotate-0")}
                                  />
                                </button>
                                {workCityMenuOpen ? (
                                  <div
                                    ref={workCityMenuRef}
                                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                  >
                                    <div className="border-b border-[#e8edf5] p-3">
                                      <input
                                        value={workCitySearch}
                                        onChange={(event) => setWorkCitySearch(event.target.value)}
                                        placeholder={tx("İl ara", "Search city")}
                                        className={plainInputClass}
                                      />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-2">
                                      {filteredWorkCities.length ? (
                                        filteredWorkCities.map((item) => {
                                          const selected = item.Id === selectedWorkCity?.Id;
                                          return (
                                            <button
                                              key={`work-city-${item.Id}`}
                                              type="button"
                                              onClick={() => {
                                                setWorkExperienceForm((prev) => ({ ...prev, ilId: item.Id ?? null }));
                                                setWorkCityMenuOpen(false);
                                                setWorkCitySearch("");
                                              }}
                                              className={clsx(
                                                "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                                selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                              )}
                                            >
                                              {`${(item.IlAdi ?? "").trim() || "-"}${
                                                (item.UlkeAdi ?? "").trim() ? ` - ${(item.UlkeAdi ?? "").trim()}` : ""
                                              }`}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                          {tx("Sonuç bulunamadı.", "No results found.")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("İş Tanımı", "Job Description")}
                            </label>
                            <textarea
                              value={workExperienceForm.isTanimi}
                              placeholder={
                                tx("Kısaca neler yaptığınızı paylaşabilirsiniz.", "Briefly share what you did.")
                              }
                              rows={4}
                              onChange={(event) =>
                                setWorkExperienceForm((prev) => ({ ...prev, isTanimi: event.target.value }))
                              }
                              className={`${plainInputClass} resize-none`}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                            <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Son Aldığınız Net Maaş**", "Last Net Salary**")}
                            </label>
                            <div className="relative">
                              <input
                                value={workExperienceForm.netMaas}
                                inputMode="decimal"
                                onChange={(event) =>
                                  setWorkExperienceForm((prev) => ({ ...prev, netMaas: event.target.value }))
                                }
                                className={`${plainInputClass} pr-10`}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a7]">
                                {workCurrencies.find((item) => item.Id === workExperienceForm.dovizId)?.DovizSembol ?? ""}
                              </span>
                            </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Döviz", "Currency")}
                              </label>
                              <select
                                value={workExperienceForm.dovizId ?? ""}
                                onChange={(event) =>
                                  setWorkExperienceForm((prev) => ({
                                    ...prev,
                                    dovizId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{tx("Döviz Seçiniz", "Select Currency")}</option>
                                {workCurrencies.map((item) => (
                                  <option key={`work-currency-${item.Id}`} value={item.Id}>
                                    {(item.DovizKisaAdi ?? item.DovizAdi ?? "").trim() || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <p className="mt-2 text-[13px] text-[#66738e]">
                              {tx("**Maaş bilgisi sadece istatistiki amaçlarla kullanılmaktadır. Özgeçmişinizde gösterilmeyecektir.", "**Salary information is only used for statistics and will not be shown in your CV.")}
                            </p>
                          </div>

                          <div className="flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={resetWorkExperienceForm}
                              className="rounded-xl border border-[#cfd4de] bg-[#efeff2] px-6 py-2.5 text-[15px] font-semibold text-[#2a313d] transition hover:bg-[#e6e8ee]"
                            >
                              {tx("Vazgeç", "Cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveWorkExperience()}
                              disabled={!canSaveWorkExperience}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                canSaveWorkExperience
                                  ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                  : "cursor-not-allowed bg-[#d9dde4]"
                              )}
                            >
                              {workExperienceSaving
                                ? tx("Kaydediliyor...", "Saving...")
                                : editingWorkExperienceNr
                                ? tx("Güncelle", "Update")
                                : tx("Kaydet", "Save")}
                            </button>
                          </div>
                        </div>
                      </article>

                      <article id="profile-passport-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {tx("Pasaportlar", "Passports")}
                          </h3>
                          <span className="text-[16px] font-semibold text-[var(--gtg-orange)]">
                            {editingCustomerPassportNr
                              ? tx("Pasaport Düzenle", "Edit Passport")
                              : tx("Pasaport Ekle", "Add Passport")}
                          </span>
                        </div>

                        {customerPassportsLoading ? (
                          <div className="mt-4 text-sm text-neutral-500">
                            {tx("Pasaportlar yükleniyor...", "Loading passports...")}
                          </div>
                        ) : null}
                        {customerPassportsError ? (
                          <div className="mt-4 text-sm text-red-600">{customerPassportsError}</div>
                        ) : null}
                        {customerPassportsFormError ? (
                          <div className="mt-4 text-sm text-red-600">{customerPassportsFormError}</div>
                        ) : null}
                        {customerPassportsFormSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{customerPassportsFormSuccess}</div>
                        ) : null}

                        {customerPassportsItems.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {customerPassportsItems.map((item) => (
                              <div
                                key={`customer-passport-${item.Nr ?? Math.random()}`}
                                className="rounded-xl border border-[#d9dde6] bg-[#f9fafc] px-4 py-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[17px] font-semibold text-[#1f232b]">
                                      {(item.UlkeAdi ?? "").trim() || "-"}
                                    </div>
                                    <div className="mt-1 text-[13px] text-[#66738e]">
                                      {tx("Geçerlilik", "Expiry")}: {formatDateForInput(item.MuspasaportGecerlilikTarihi)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditCustomerPassport(item)}
                                      disabled={customerPassportsSaving || customerPassportsDeletingNr === item.Nr}
                                      aria-label={tx("Pasaportu düzenle", "Edit passport")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        editingCustomerPassportNr === item.Nr
                                          ? "border-[var(--gtg-orange)] bg-[#fff2eb] text-[var(--gtg-orange)]"
                                          : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f2f5f9]"
                                      )}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteCustomerPassport(item.Nr)}
                                      disabled={customerPassportsDeletingNr === item.Nr}
                                      aria-label={tx("Pasaportu sil", "Delete passport")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        customerPassportsDeletingNr === item.Nr
                                          ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                                          : "border-[#ef6c62] bg-[#fff5f4] text-[#d43f33] hover:bg-[#ffebe9]"
                                      )}
                                    >
                                      {customerPassportsDeletingNr === item.Nr ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-4">
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Ülke", "Country")}
                            </label>
                            <div className="relative">
                              <button
                                ref={customerPassportCountryButtonRef}
                                type="button"
                                onClick={() => setCustomerPassportCountryMenuOpen((prev) => !prev)}
                                className={clsx(
                                  `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                  customerPassportCountryMenuOpen && "border-[var(--gtg-orange)]"
                                )}
                              >
                                <span className="truncate text-[15px] text-[#2a313d]">
                                  {(selectedCustomerPassportCountry?.UlkeAdi ?? "").trim() ||
                                    (tx("Ülke Seçiniz", "Select Country"))}
                                </span>
                                <ChevronDown
                                  size={18}
                                  className={clsx(
                                    "shrink-0 text-[#66738e] transition",
                                    customerPassportCountryMenuOpen ? "rotate-180" : "rotate-0"
                                  )}
                                />
                              </button>
                              {customerPassportCountryMenuOpen ? (
                                <div
                                  ref={customerPassportCountryMenuRef}
                                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                >
                                  <div className="border-b border-[#e8edf5] p-3">
                                    <input
                                      value={customerPassportCountrySearch}
                                      onChange={(event) => setCustomerPassportCountrySearch(event.target.value)}
                                      placeholder={tx("Ülke ara", "Search country")}
                                      className={plainInputClass}
                                    />
                                  </div>
                                  <div className="max-h-64 overflow-y-auto py-2">
                                    {filteredCustomerPassportCountries.length ? (
                                      filteredCustomerPassportCountries.map((item) => {
                                        const selected = item.Id === selectedCustomerPassportCountry?.Id;
                                        return (
                                          <button
                                            key={`customer-passport-country-${item.Id}`}
                                            type="button"
                                            onClick={() => {
                                              setCustomerPassportsForm((prev) => ({
                                                ...prev,
                                                ulkeId: item.Id ?? null,
                                              }));
                                              setCustomerPassportCountryMenuOpen(false);
                                              setCustomerPassportCountrySearch("");
                                            }}
                                            className={clsx(
                                              "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                              selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                            )}
                                          >
                                            {(item.UlkeAdi ?? "").trim() || "-"}
                                          </button>
                                        );
                                      })
                                    ) : (
                                      <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                        {tx("Sonuç bulunamadı.", "No results found.")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Geçerlilik Tarihi", "Expiry Date")}
                            </label>
                            <LocalizedDatePicker
                              buttonRef={customerPassportDateInputRef}
                              lang={lang}
                              value={customerPassportsForm.gecerlilikTarihi}
                              onChange={(nextValue) =>
                                setCustomerPassportsForm((prev) => ({ ...prev, gecerlilikTarihi: nextValue }))
                              }
                              className={plainInputClass}
                            />
                          </div>

                          <div className="flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={resetCustomerPassportForm}
                              className="rounded-xl border border-[#cfd4de] bg-[#efeff2] px-6 py-2.5 text-[15px] font-semibold text-[#2a313d] transition hover:bg-[#e6e8ee]"
                            >
                              {tx("Vazgeç", "Cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveCustomerPassport()}
                              disabled={!canSaveCustomerPassport}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                canSaveCustomerPassport
                                  ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                  : "cursor-not-allowed bg-[#d9dde4]"
                              )}
                            >
                              {customerPassportsSaving
                                ? tx("Kaydediliyor...", "Saving...")
                                : editingCustomerPassportNr
                                ? tx("Güncelle", "Update")
                                : tx("Kaydet", "Save")}
                            </button>
                          </div>
                        </div>
                      </article>

                      <article id="profile-foreign-languages-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {tx("Yabancı Diller", "Foreign Languages")}
                          </h3>
                          <span className="text-[16px] font-semibold text-[var(--gtg-orange)]">
                            {editingCustomerForeignLanguageNr
                              ? tx("Yabancı Dil Düzenle", "Edit Foreign Language")
                              : tx("Yabancı Dil Ekle", "Add Foreign Language")}
                          </span>
                        </div>

                        {customerForeignLanguagesLoading ? (
                          <div className="mt-4 text-sm text-neutral-500">
                            {tx("Yabancı diller yükleniyor...", "Loading foreign languages...")}
                          </div>
                        ) : null}
                        {customerForeignLanguagesError ? (
                          <div className="mt-4 text-sm text-red-600">{customerForeignLanguagesError}</div>
                        ) : null}
                        {customerForeignLanguagesFormError ? (
                          <div className="mt-4 text-sm text-red-600">{customerForeignLanguagesFormError}</div>
                        ) : null}
                        {customerForeignLanguagesFormSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{customerForeignLanguagesFormSuccess}</div>
                        ) : null}

                        {customerForeignLanguagesItems.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {customerForeignLanguagesItems.map((item) => (
                              <div
                                key={`customer-foreign-language-${item.Nr ?? Math.random()}`}
                                className="rounded-xl border border-[#d9dde6] bg-[#f9fafc] px-4 py-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[17px] font-semibold text-[#1f232b]">
                                      {(item.YdilAdi ?? "").trim() || "-"}
                                    </div>
                                    <div className="mt-1 text-[13px] text-[#66738e]">
                                      {tx("Seviye", "Level")}: {String(item.Seviye ?? "").trim() || "-"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditCustomerForeignLanguage(item)}
                                      disabled={
                                        customerForeignLanguagesSaving ||
                                        customerForeignLanguagesDeletingNr === item.Nr
                                      }
                                      aria-label={tx("Yabancı dili düzenle", "Edit foreign language")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        editingCustomerForeignLanguageNr === item.Nr
                                          ? "border-[var(--gtg-orange)] bg-[#fff2eb] text-[var(--gtg-orange)]"
                                          : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f2f5f9]"
                                      )}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteCustomerForeignLanguage(item.Nr)}
                                      disabled={customerForeignLanguagesDeletingNr === item.Nr}
                                      aria-label={tx("Yabancı dili sil", "Delete foreign language")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        customerForeignLanguagesDeletingNr === item.Nr
                                          ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                                          : "border-[#ef6c62] bg-[#fff5f4] text-[#d43f33] hover:bg-[#ffebe9]"
                                      )}
                                    >
                                      {customerForeignLanguagesDeletingNr === item.Nr ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Yabancı Dil", "Foreign Language")}
                            </label>
                            <div className="relative">
                              <button
                                ref={customerForeignLanguageButtonRef}
                                type="button"
                                onClick={() => setCustomerForeignLanguageMenuOpen((prev) => !prev)}
                                className={clsx(
                                  `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                  customerForeignLanguageMenuOpen && "border-[var(--gtg-orange)]"
                                )}
                              >
                                <span className="truncate text-[15px] text-[#2a313d]">
                                  {basicLookupLabel(selectedCustomerForeignLanguage ?? {}) ||
                                    (tx("Yabancı Dil Seçiniz", "Select Foreign Language"))}
                                </span>
                                <ChevronDown
                                  size={18}
                                  className={clsx(
                                    "shrink-0 text-[#66738e] transition",
                                    customerForeignLanguageMenuOpen ? "rotate-180" : "rotate-0"
                                  )}
                                />
                              </button>
                              {customerForeignLanguageMenuOpen ? (
                                <div
                                  ref={customerForeignLanguageMenuRef}
                                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                >
                                  <div className="border-b border-[#e8edf5] p-3">
                                    <input
                                      value={customerForeignLanguageSearch}
                                      onChange={(event) => setCustomerForeignLanguageSearch(event.target.value)}
                                      placeholder={tx("Yabancı dil ara", "Search language")}
                                      className={plainInputClass}
                                    />
                                  </div>
                                  <div className="max-h-64 overflow-y-auto py-2">
                                    {filteredCustomerForeignLanguageOptions.length ? (
                                      filteredCustomerForeignLanguageOptions.map((item) => {
                                        const selected = item.Id === selectedCustomerForeignLanguage?.Id;
                                        return (
                                          <button
                                            key={`customer-foreign-language-option-${item.Id}`}
                                            type="button"
                                            onClick={() => {
                                              setCustomerForeignLanguagesForm((prev) => ({
                                                ...prev,
                                                ydilId: item.Id ?? null,
                                              }));
                                              setCustomerForeignLanguageMenuOpen(false);
                                              setCustomerForeignLanguageSearch("");
                                            }}
                                            className={clsx(
                                              "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                              selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                            )}
                                          >
                                            {basicLookupLabel(item) || "-"}
                                          </button>
                                        );
                                      })
                                    ) : (
                                      <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                        {tx("Sonuç bulunamadı.", "No results found.")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Seviye", "Level")}
                            </label>
                            <select
                              value={customerForeignLanguagesForm.seviye}
                              onChange={(event) =>
                                setCustomerForeignLanguagesForm((prev) => ({
                                  ...prev,
                                  seviye: event.target.value,
                                }))
                              }
                              className={plainInputClass}
                            >
                              <option value="">{tx("Seviye Seçiniz", "Select Level")}</option>
                              {Array.from({ length: 10 }, (_, index) => String(index + 1)).map((level) => (
                                <option key={`foreign-language-level-${level}`} value={level}>
                                  {level}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                          <button
                            type="button"
                            onClick={resetCustomerForeignLanguageForm}
                            className="rounded-xl border border-[#cfd4de] bg-[#efeff2] px-6 py-2.5 text-[15px] font-semibold text-[#2a313d] transition hover:bg-[#e6e8ee]"
                          >
                            {tx("Vazgeç", "Cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSaveCustomerForeignLanguage()}
                            disabled={!canSaveCustomerForeignLanguage}
                            className={clsx(
                              "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                              canSaveCustomerForeignLanguage
                                ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                : "cursor-not-allowed bg-[#d9dde4]"
                            )}
                          >
                            {customerForeignLanguagesSaving
                              ? tx("Kaydediliyor...", "Saving...")
                              : editingCustomerForeignLanguageNr
                              ? tx("Güncelle", "Update")
                              : tx("Kaydet", "Save")}
                          </button>
                        </div>
                      </article>

                      <article id="profile-high-school-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {tx("Lise Bilgileri", "High School Information")}
                          </h3>
                          <span className="text-[16px] font-semibold text-[var(--gtg-orange)]">
                            {editingCustomerHighSchoolNr
                              ? tx("Lise Bilgisi Düzenle", "Edit High School Information")
                              : tx("Lise Bilgisi Ekle", "Add High School Information")}
                          </span>
                        </div>

                        {customerHighSchoolsLoading ? (
                          <div className="mt-4 text-sm text-neutral-500">
                            {tx("Lise bilgileri yükleniyor...", "Loading high school information...")}
                          </div>
                        ) : null}
                        {customerHighSchoolsError ? (
                          <div className="mt-4 text-sm text-red-600">{customerHighSchoolsError}</div>
                        ) : null}
                        {customerHighSchoolsFormError ? (
                          <div className="mt-4 text-sm text-red-600">{customerHighSchoolsFormError}</div>
                        ) : null}
                        {customerHighSchoolsFormSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{customerHighSchoolsFormSuccess}</div>
                        ) : null}

                        {customerHighSchoolsItems.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {customerHighSchoolsItems.map((item) => (
                              <div
                                key={`customer-high-school-${item.Nr ?? Math.random()}`}
                                className="rounded-xl border border-[#d9dde6] bg-[#f9fafc] px-4 py-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[17px] font-semibold text-[#1f232b]">
                                      {(item.MusliseLiseAdi ?? "").trim() || "-"}
                                    </div>
                                    <div className="text-[14px] text-[#4f5a71]">
                                      {[(item.UlkeAdi ?? "").trim(), (item.LiseTipAdi ?? "").trim()].filter(Boolean).join(" / ") || "-"}
                                    </div>
                                    <div className="mt-1 text-[13px] text-[#66738e]">
                                      {formatDateForInput(item.MusliseBaslamaTarihi)} - {formatDateForInput(item.MusliseBitisTarihi)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditCustomerHighSchool(item)}
                                      disabled={customerHighSchoolsSaving || customerHighSchoolsDeletingNr === item.Nr}
                                      aria-label={tx("Lise bilgisini düzenle", "Edit high school information")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        editingCustomerHighSchoolNr === item.Nr
                                          ? "border-[var(--gtg-orange)] bg-[#fff2eb] text-[var(--gtg-orange)]"
                                          : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f2f5f9]"
                                      )}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteCustomerHighSchool(item.Nr)}
                                      disabled={customerHighSchoolsDeletingNr === item.Nr}
                                      aria-label={tx("Lise bilgisini sil", "Delete high school information")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        customerHighSchoolsDeletingNr === item.Nr
                                          ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                                          : "border-[#ef6c62] bg-[#fff5f4] text-[#d43f33] hover:bg-[#ffebe9]"
                                      )}
                                    >
                                      {customerHighSchoolsDeletingNr === item.Nr ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Ülke", "Country")}
                              </label>
                              <div className="relative">
                                <button
                                  ref={customerHighSchoolCountryButtonRef}
                                  type="button"
                                  onClick={() => setCustomerHighSchoolCountryMenuOpen((prev) => !prev)}
                                  className={clsx(
                                    `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                    customerHighSchoolCountryMenuOpen && "border-[var(--gtg-orange)]"
                                  )}
                                >
                                  <span className="truncate text-[15px] text-[#2a313d]">
                                    {(selectedCustomerHighSchoolCountry?.UlkeAdi ?? "").trim() ||
                                      (tx("Ülke Seçiniz", "Select Country"))}
                                  </span>
                                  <ChevronDown
                                    size={18}
                                    className={clsx(
                                      "shrink-0 text-[#66738e] transition",
                                      customerHighSchoolCountryMenuOpen ? "rotate-180" : "rotate-0"
                                    )}
                                  />
                                </button>
                                {customerHighSchoolCountryMenuOpen ? (
                                  <div
                                    ref={customerHighSchoolCountryMenuRef}
                                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                  >
                                    <div className="border-b border-[#e8edf5] p-3">
                                      <input
                                        value={customerHighSchoolCountrySearch}
                                        onChange={(event) => setCustomerHighSchoolCountrySearch(event.target.value)}
                                        placeholder={tx("Ülke ara", "Search country")}
                                        className={plainInputClass}
                                      />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-2">
                                      {filteredCustomerHighSchoolCountries.length ? (
                                        filteredCustomerHighSchoolCountries.map((item) => {
                                          const selected = item.Id === selectedCustomerHighSchoolCountry?.Id;
                                          return (
                                            <button
                                              key={`customer-high-school-country-${item.Id}`}
                                              type="button"
                                              onClick={() => {
                                                setCustomerHighSchoolsForm((prev) => ({
                                                  ...prev,
                                                  ulkeId: item.Id ?? null,
                                                }));
                                                setCustomerHighSchoolCountryMenuOpen(false);
                                                setCustomerHighSchoolCountrySearch("");
                                              }}
                                              className={clsx(
                                                "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                                selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                              )}
                                            >
                                              {(item.UlkeAdi ?? "").trim() || "-"}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                          {tx("Sonuç bulunamadı.", "No results found.")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Lise Tipi", "High School Type")}
                              </label>
                              <select
                                value={customerHighSchoolsForm.liseTipId ?? ""}
                                onChange={(event) =>
                                  setCustomerHighSchoolsForm((prev) => ({
                                    ...prev,
                                    liseTipId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{tx("Lise Tipi Seçiniz", "Select High School Type")}</option>
                                {customerHighSchoolTypes.map((item) => (
                                  <option key={`customer-high-school-type-${item.Id}`} value={item.Id}>
                                    {basicLookupLabel(item) || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("Lise Adı", "High School Name")}
                            </label>
                            <input
                              value={customerHighSchoolsForm.liseAdi}
                              onChange={(event) =>
                                setCustomerHighSchoolsForm((prev) => ({ ...prev, liseAdi: event.target.value }))
                              }
                              className={plainInputClass}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Başlangıç Tarihi", "Start Date")}
                              </label>
                              <LocalizedDatePicker
                                buttonRef={customerHighSchoolStartDateInputRef}
                                lang={lang}
                                value={customerHighSchoolsForm.baslamaTarihi}
                                onChange={(nextValue) =>
                                  setCustomerHighSchoolsForm((prev) => ({ ...prev, baslamaTarihi: nextValue }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Bitiş Tarihi", "End Date")}
                              </label>
                              <LocalizedDatePicker
                                buttonRef={customerHighSchoolEndDateInputRef}
                                lang={lang}
                                value={customerHighSchoolsForm.bitisTarihi}
                                onChange={(nextValue) =>
                                  setCustomerHighSchoolsForm((prev) => ({ ...prev, bitisTarihi: nextValue }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={resetCustomerHighSchoolForm}
                              className="rounded-xl border border-[#cfd4de] bg-[#efeff2] px-6 py-2.5 text-[15px] font-semibold text-[#2a313d] transition hover:bg-[#e6e8ee]"
                            >
                              {tx("Vazgeç", "Cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveCustomerHighSchool()}
                              disabled={!canSaveCustomerHighSchool}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                canSaveCustomerHighSchool
                                  ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                  : "cursor-not-allowed bg-[#d9dde4]"
                              )}
                            >
                              {customerHighSchoolsSaving
                                ? tx("Kaydediliyor...", "Saving...")
                                : editingCustomerHighSchoolNr
                                ? tx("Güncelle", "Update")
                                : tx("Kaydet", "Save")}
                            </button>
                          </div>
                        </div>
                      </article>

                      <article id="profile-university-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {tx("Üniversite Bilgileri", "University Information")}
                          </h3>
                          <span className="text-[16px] font-semibold text-[var(--gtg-orange)]">
                            {editingCustomerUniversityNr
                              ? tx("Üniversite Bilgisi Düzenle", "Edit University Information")
                              : tx("Üniversite Bilgisi Ekle", "Add University Information")}
                          </span>
                        </div>

                        {customerUniversitiesLoading ? (
                          <div className="mt-4 text-sm text-neutral-500">
                            {tx("Üniversite bilgileri yükleniyor...", "Loading university information...")}
                          </div>
                        ) : null}
                        {customerUniversitiesError ? (
                          <div className="mt-4 text-sm text-red-600">{customerUniversitiesError}</div>
                        ) : null}
                        {customerUniversitiesFormError ? (
                          <div className="mt-4 text-sm text-red-600">{customerUniversitiesFormError}</div>
                        ) : null}
                        {customerUniversitiesFormSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{customerUniversitiesFormSuccess}</div>
                        ) : null}

                        {customerUniversitiesItems.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {customerUniversitiesItems.map((item) => (
                              <div
                                key={`customer-uni-${item.Nr ?? Math.random()}`}
                                className="rounded-xl border border-[#d9dde6] bg-[#f9fafc] px-4 py-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[17px] font-semibold text-[#1f232b]">
                                      {(item.UniversiteAdi ?? "").trim() || "-"}
                                    </div>
                                    <div className="text-[14px] text-[#4f5a71]">
                                      {(item.BolumAdi ?? "").trim() || "-"}
                                    </div>
                                    <div className="mt-1 text-[13px] text-[#66738e]">
                                      {formatDateForInput(item.MusuniBaslamaTarihi)} - {formatDateForInput(item.MusuniBitisTarihi)}
                                    </div>
                                    <div className="text-[13px] text-[#66738e]">
                                      {[(item.UlkeAdi ?? "").trim(), (item.EgitimAdi ?? "").trim(), (item.EgitimTipAdi ?? "").trim()]
                                        .filter(Boolean)
                                        .join(" / ") || "-"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditCustomerUniversity(item)}
                                      disabled={customerUniversitiesSaving || customerUniversitiesDeletingNr === item.Nr}
                                      aria-label={tx("Üniversite bilgisini düzenle", "Edit university information")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        editingCustomerUniversityNr === item.Nr
                                          ? "border-[var(--gtg-orange)] bg-[#fff2eb] text-[var(--gtg-orange)]"
                                          : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f2f5f9]"
                                      )}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteCustomerUniversity(item.Nr)}
                                      disabled={customerUniversitiesDeletingNr === item.Nr}
                                      aria-label={tx("Üniversite bilgisini sil", "Delete university information")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        customerUniversitiesDeletingNr === item.Nr
                                          ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                                          : "border-[#ef6c62] bg-[#fff5f4] text-[#d43f33] hover:bg-[#ffebe9]"
                                      )}
                                    >
                                      {customerUniversitiesDeletingNr === item.Nr ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Ülke", "Country")}
                              </label>
                              <div className="relative">
                                <button
                                  ref={customerUniversityCountryButtonRef}
                                  type="button"
                                  onClick={() => setCustomerUniversityCountryMenuOpen((prev) => !prev)}
                                  className={clsx(
                                    `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                    customerUniversityCountryMenuOpen && "border-[var(--gtg-orange)]"
                                  )}
                                >
                                  <span className="truncate text-[15px] text-[#2a313d]">
                                    {(selectedCustomerUniversityCountry?.UlkeAdi ?? "").trim() ||
                                      (tx("Ülke Seçiniz", "Select Country"))}
                                  </span>
                                  <ChevronDown
                                    size={18}
                                    className={clsx(
                                      "shrink-0 text-[#66738e] transition",
                                      customerUniversityCountryMenuOpen ? "rotate-180" : "rotate-0"
                                    )}
                                  />
                                </button>
                                {customerUniversityCountryMenuOpen ? (
                                  <div
                                    ref={customerUniversityCountryMenuRef}
                                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                  >
                                    <div className="border-b border-[#e8edf5] p-3">
                                      <input
                                        value={customerUniversityCountrySearch}
                                        onChange={(event) => setCustomerUniversityCountrySearch(event.target.value)}
                                        placeholder={tx("Ülke ara", "Search country")}
                                        className={plainInputClass}
                                      />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-2">
                                      {filteredCustomerUniversityCountries.length ? (
                                        filteredCustomerUniversityCountries.map((item) => {
                                          const selected = item.Id === selectedCustomerUniversityCountry?.Id;
                                          return (
                                            <button
                                              key={`customer-uni-country-${item.Id}`}
                                              type="button"
                                              onClick={() => {
                                                setCustomerUniversitiesForm((prev) => ({
                                                  ...prev,
                                                  ulkeId: item.Id ?? null,
                                                  universiteId: null,
                                                }));
                                                setCustomerUniversityCountryMenuOpen(false);
                                                setCustomerUniversityCountrySearch("");
                                              }}
                                              className={clsx(
                                                "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                                selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                              )}
                                            >
                                              {(item.UlkeAdi ?? "").trim() || "-"}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                          {tx("Sonuç bulunamadı.", "No results found.")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Üniversite", "University")}
                              </label>
                              <div className="relative">
                                <button
                                  ref={customerUniversityOptionButtonRef}
                                  type="button"
                                  onClick={() => setCustomerUniversityOptionMenuOpen((prev) => !prev)}
                                  className={clsx(
                                    `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                    customerUniversityOptionMenuOpen && "border-[var(--gtg-orange)]"
                                  )}
                                >
                                  <span className="truncate text-[15px] text-[#2a313d]">
                                    {(selectedCustomerUniversityOption?.UniversiteAdi ?? "").trim() ||
                                      (tx("Üniversite Seçiniz", "Select University"))}
                                  </span>
                                  <ChevronDown
                                    size={18}
                                    className={clsx(
                                      "shrink-0 text-[#66738e] transition",
                                      customerUniversityOptionMenuOpen ? "rotate-180" : "rotate-0"
                                    )}
                                  />
                                </button>
                                {customerUniversityOptionMenuOpen ? (
                                  <div
                                    ref={customerUniversityOptionMenuRef}
                                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                  >
                                    <div className="border-b border-[#e8edf5] p-3">
                                      <input
                                        value={customerUniversityOptionSearch}
                                        onChange={(event) => setCustomerUniversityOptionSearch(event.target.value)}
                                        placeholder={tx("Üniversite ara", "Search university")}
                                        className={plainInputClass}
                                      />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-2">
                                      {customerUniversityOptions.length ? (
                                        customerUniversityOptions.map((item) => {
                                          const selected = item.Id === selectedCustomerUniversityOption?.Id;
                                          return (
                                            <button
                                              key={`customer-uni-option-${item.Id}`}
                                              type="button"
                                              onClick={() => {
                                                setCustomerUniversitiesForm((prev) => ({
                                                  ...prev,
                                                  universiteId: item.Id ?? null,
                                                }));
                                                setCustomerUniversityOptionMenuOpen(false);
                                                setCustomerUniversityOptionSearch("");
                                              }}
                                              className={clsx(
                                                "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                                selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                              )}
                                            >
                                              {(item.UniversiteAdi ?? "").trim() || "-"}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                          {tx("Sonuç bulunamadı.", "No results found.")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Bölüm", "Department")}
                              </label>
                              <div className="relative">
                                <button
                                  ref={customerUniversityDepartmentButtonRef}
                                  type="button"
                                  onClick={() => setCustomerUniversityDepartmentMenuOpen((prev) => !prev)}
                                  className={clsx(
                                    `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                    customerUniversityDepartmentMenuOpen && "border-[var(--gtg-orange)]"
                                  )}
                                >
                                  <span className="truncate text-[15px] text-[#2a313d]">
                                    {(selectedCustomerUniversityDepartment?.BolumAdi ?? "").trim() ||
                                      (tx("Bölüm Seçiniz", "Select Department"))}
                                  </span>
                                  <ChevronDown
                                    size={18}
                                    className={clsx(
                                      "shrink-0 text-[#66738e] transition",
                                      customerUniversityDepartmentMenuOpen ? "rotate-180" : "rotate-0"
                                    )}
                                  />
                                </button>
                                {customerUniversityDepartmentMenuOpen ? (
                                  <div
                                    ref={customerUniversityDepartmentMenuRef}
                                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                  >
                                    <div className="border-b border-[#e8edf5] p-3">
                                      <input
                                        value={customerUniversityDepartmentSearch}
                                        onChange={(event) => setCustomerUniversityDepartmentSearch(event.target.value)}
                                        placeholder={tx("Bölüm ara", "Search department")}
                                        className={plainInputClass}
                                      />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-2">
                                      {customerUniversityDepartmentOptions.length ? (
                                        customerUniversityDepartmentOptions.map((item) => {
                                          const selected = item.Id === selectedCustomerUniversityDepartment?.Id;
                                          return (
                                            <button
                                              key={`customer-uni-department-${item.Id}`}
                                              type="button"
                                              onClick={() => {
                                                setCustomerUniversitiesForm((prev) => ({
                                                  ...prev,
                                                  bolumId: item.Id ?? null,
                                                }));
                                                setCustomerUniversityDepartmentMenuOpen(false);
                                                setCustomerUniversityDepartmentSearch("");
                                              }}
                                              className={clsx(
                                                "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                                selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                              )}
                                            >
                                              {(item.BolumAdi ?? "").trim() || "-"}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                          {tx("Sonuç bulunamadı.", "No results found.")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Yabancı Dil", "Foreign Language")}
                              </label>
                              <div className="relative">
                                <button
                                  ref={customerUniversityLanguageButtonRef}
                                  type="button"
                                  onClick={() => setCustomerUniversityLanguageMenuOpen((prev) => !prev)}
                                  className={clsx(
                                    `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                                    customerUniversityLanguageMenuOpen && "border-[var(--gtg-orange)]"
                                  )}
                                >
                                  <span className="truncate text-[15px] text-[#2a313d]">
                                    {basicLookupLabel(selectedCustomerUniversityLanguage ?? {}) ||
                                      (tx("Yabancı Dil Seçiniz", "Select Foreign Language"))}
                                  </span>
                                  <ChevronDown
                                    size={18}
                                    className={clsx(
                                      "shrink-0 text-[#66738e] transition",
                                      customerUniversityLanguageMenuOpen ? "rotate-180" : "rotate-0"
                                    )}
                                  />
                                </button>
                                {customerUniversityLanguageMenuOpen ? (
                                  <div
                                    ref={customerUniversityLanguageMenuRef}
                                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                  >
                                    <div className="border-b border-[#e8edf5] p-3">
                                      <input
                                        value={customerUniversityLanguageSearch}
                                        onChange={(event) => setCustomerUniversityLanguageSearch(event.target.value)}
                                        placeholder={tx("Yabancı dil ara", "Search language")}
                                        className={plainInputClass}
                                      />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-2">
                                      {filteredCustomerUniversityLanguages.length ? (
                                        filteredCustomerUniversityLanguages.map((item) => {
                                          const selected = item.Id === selectedCustomerUniversityLanguage?.Id;
                                          return (
                                            <button
                                              key={`customer-uni-language-${item.Id}`}
                                              type="button"
                                              onClick={() => {
                                                setCustomerUniversitiesForm((prev) => ({
                                                  ...prev,
                                                  ydilId: item.Id ?? null,
                                                }));
                                                setCustomerUniversityLanguageMenuOpen(false);
                                                setCustomerUniversityLanguageSearch("");
                                              }}
                                              className={clsx(
                                                "flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                                selected ? "bg-[#fff4dd] text-[#1f232b]" : "text-[#4f5a71] hover:bg-[#f6f8fb]"
                                              )}
                                            >
                                              {basicLookupLabel(item) || "-"}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-4 py-3 text-[13px] text-[#8b95a7]">
                                          {tx("Sonuç bulunamadı.", "No results found.")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Eğitim Durumu", "Education Status")}
                              </label>
                              <select
                                value={customerUniversitiesForm.egitimDurumId ?? ""}
                                onChange={(event) =>
                                  setCustomerUniversitiesForm((prev) => ({
                                    ...prev,
                                    egitimDurumId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{tx("Eğitim Durumu Seçiniz", "Select Education Status")}</option>
                                {customerUniversityEducationStatuses.map((item) => (
                                  <option key={`customer-uni-status-${item.Id}`} value={item.Id}>
                                    {basicLookupLabel(item) || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Eğitim Seviyesi", "Education Level")}
                              </label>
                              <select
                                value={customerUniversitiesForm.egitimId ?? ""}
                                onChange={(event) =>
                                  setCustomerUniversitiesForm((prev) => ({
                                    ...prev,
                                    egitimId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{tx("Eğitim Seviyesi Seçiniz", "Select Education Level")}</option>
                                {customerUniversityEducationLevels.map((item) => (
                                  <option key={`customer-uni-level-${item.Id}`} value={item.Id}>
                                    {basicLookupLabel(item) || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Eğitim Tipi", "Education Type")}
                              </label>
                              <select
                                value={customerUniversitiesForm.egitimTipId ?? ""}
                                onChange={(event) =>
                                  setCustomerUniversitiesForm((prev) => ({
                                    ...prev,
                                    egitimTipId: event.target.value ? Number(event.target.value) : null,
                                  }))
                                }
                                className={plainInputClass}
                              >
                                <option value="">{tx("Eğitim Tipi Seçiniz", "Select Education Type")}</option>
                                {customerUniversityEducationTypes.map((item) => (
                                  <option key={`customer-uni-type-${item.Id}`} value={item.Id}>
                                    {basicLookupLabel(item) || "-"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Başlangıç Tarihi", "Start Date")}
                              </label>
                              <LocalizedDatePicker
                                buttonRef={universityStartDateInputRef}
                                lang={lang}
                                value={customerUniversitiesForm.baslamaTarihi}
                                onChange={(nextValue) =>
                                  setCustomerUniversitiesForm((prev) => ({ ...prev, baslamaTarihi: nextValue }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Bitiş Tarihi", "End Date")}
                              </label>
                              <LocalizedDatePicker
                                buttonRef={universityEndDateInputRef}
                                lang={lang}
                                value={customerUniversitiesForm.bitisTarihi}
                                onChange={(nextValue) =>
                                  setCustomerUniversitiesForm((prev) => ({ ...prev, bitisTarihi: nextValue }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={resetCustomerUniversityForm}
                              className="rounded-xl border border-[#cfd4de] bg-[#efeff2] px-6 py-2.5 text-[15px] font-semibold text-[#2a313d] transition hover:bg-[#e6e8ee]"
                            >
                              {tx("Vazgeç", "Cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveCustomerUniversity()}
                              disabled={!canSaveCustomerUniversity}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                canSaveCustomerUniversity
                                  ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                  : "cursor-not-allowed bg-[#d9dde4]"
                              )}
                            >
                              {customerUniversitiesSaving
                                ? tx("Kaydediliyor...", "Saving...")
                                : editingCustomerUniversityNr
                                ? tx("Güncelle", "Update")
                                : tx("Kaydet", "Save")}
                            </button>
                          </div>
                        </div>
                      </article>

                      <article id="profile-references-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {tx("Referanslar", "References")}
                          </h3>
                          <span className="text-[16px] font-semibold text-[var(--gtg-orange)]">
                            {editingCustomerReferenceNr
                              ? tx("Referans Düzenle", "Edit Reference")
                              : tx("Referans Ekle", "Add Reference")}
                          </span>
                        </div>

                        {customerReferencesLoading ? (
                          <div className="mt-4 text-sm text-neutral-500">
                            {tx("Referanslar yükleniyor...", "Loading references...")}
                          </div>
                        ) : null}
                        {customerReferencesError ? (
                          <div className="mt-4 text-sm text-red-600">{customerReferencesError}</div>
                        ) : null}
                        {customerReferencesFormError ? (
                          <div className="mt-4 text-sm text-red-600">{customerReferencesFormError}</div>
                        ) : null}
                        {customerReferencesFormSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{customerReferencesFormSuccess}</div>
                        ) : null}

                        {customerReferencesItems.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {customerReferencesItems.map((item) => (
                              <div
                                key={`customer-reference-${item.Nr ?? Math.random()}`}
                                className="rounded-xl border border-[#d9dde6] bg-[#f9fafc] px-4 py-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[17px] font-semibold text-[#1f232b]">
                                      {`${(item.MusrefAd ?? "").trim()} ${(item.MusrefSoyad ?? "").trim()}`.trim() || "-"}
                                    </div>
                                    <div className="text-[14px] text-[#4f5a71]">
                                      {(item.MusrefIsyeriAdi ?? "").trim() || "-"}
                                    </div>
                                    <div className="mt-1 text-[13px] text-[#66738e]">
                                      {[(item.MusrefTel ?? "").trim(), (item.MusrefEmail ?? "").trim()].filter(Boolean).join(" / ") || "-"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditCustomerReference(item)}
                                      disabled={customerReferencesSaving || customerReferencesDeletingNr === item.Nr}
                                      aria-label={tx("Referansı düzenle", "Edit reference")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        editingCustomerReferenceNr === item.Nr
                                          ? "border-[var(--gtg-orange)] bg-[#fff2eb] text-[var(--gtg-orange)]"
                                          : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f2f5f9]"
                                      )}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteCustomerReference(item.Nr)}
                                      disabled={customerReferencesDeletingNr === item.Nr}
                                      aria-label={tx("Referansı sil", "Delete reference")}
                                      className={clsx(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                        customerReferencesDeletingNr === item.Nr
                                          ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                                          : "border-[#ef6c62] bg-[#fff5f4] text-[#d43f33] hover:bg-[#ffebe9]"
                                      )}
                                    >
                                      {customerReferencesDeletingNr === item.Nr ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Ad", "Name")}
                              </label>
                              <input
                                value={customerReferencesForm.ad}
                                onChange={(event) =>
                                  setCustomerReferencesForm((prev) => ({ ...prev, ad: event.target.value }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Soyad", "Surname")}
                              </label>
                              <input
                                value={customerReferencesForm.soyad}
                                onChange={(event) =>
                                  setCustomerReferencesForm((prev) => ({ ...prev, soyad: event.target.value }))
                                }
                                className={plainInputClass}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                              {tx("İşyeri Adı", "Company Name")}
                            </label>
                            <input
                              value={customerReferencesForm.isyeriAdi}
                              onChange={(event) =>
                                setCustomerReferencesForm((prev) => ({ ...prev, isyeriAdi: event.target.value }))
                              }
                              className={plainInputClass}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("Telefon", "Phone")}
                              </label>
                              <input
                                value={customerReferencesForm.tel}
                                onChange={(event) =>
                                  setCustomerReferencesForm((prev) => ({ ...prev, tel: event.target.value }))
                                }
                                className={plainInputClass}
                              />
                              {hasReferencePhoneLiveError ? (
                                <div className="mt-1 text-sm text-red-600">
                                  {tx("Geçerli bir telefon numarası giriniz.", "Enter a valid phone number.")}
                                </div>
                              ) : null}
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[15px] font-medium text-[#1f232b]">
                                {tx("E-posta", "Email")}
                              </label>
                              <input
                                value={customerReferencesForm.email}
                                onChange={(event) =>
                                  setCustomerReferencesForm((prev) => ({ ...prev, email: event.target.value }))
                                }
                                className={plainInputClass}
                              />
                              {hasReferenceEmailLiveError ? (
                                <div className="mt-1 text-sm text-red-600">
                                  {tx("Geçerli bir e-posta giriniz.", "Enter a valid email.")}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={resetCustomerReferenceForm}
                              className="rounded-xl border border-[#cfd4de] bg-[#efeff2] px-6 py-2.5 text-[15px] font-semibold text-[#2a313d] transition hover:bg-[#e6e8ee]"
                            >
                              {tx("Vazgeç", "Cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveCustomerReference()}
                              disabled={!canSaveCustomerReference}
                              className={clsx(
                                "rounded-xl px-6 py-2.5 text-[15px] font-semibold text-white transition",
                                canSaveCustomerReference
                                  ? "bg-[var(--gtg-orange)] hover:brightness-95"
                                  : "cursor-not-allowed bg-[#d9dde4]"
                              )}
                            >
                              {customerReferencesSaving
                                ? tx("Kaydediliyor...", "Saving...")
                                : editingCustomerReferenceNr
                                ? tx("Güncelle", "Update")
                                : tx("Kaydet", "Save")}
                            </button>
                          </div>
                        </div>
                      </article>

                      <article id="profile-important-info-section" tabIndex={-1} className="rounded-2xl border border-[#d8dde6] bg-white p-5 transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {tx("Önemli Bilgiler", "Important Information")}
                          </h3>
                          <span className="text-[16px] font-semibold text-[var(--gtg-orange)]">
                            {tx("Seçimlerinizi güncelleyin", "Update your selections")}
                          </span>
                        </div>

                        {customerFeaturesLoading ? (
                          <div className="mt-4 text-sm text-neutral-500">
                            {tx("Önemli bilgiler yükleniyor...", "Loading important information...")}
                          </div>
                        ) : null}
                        {customerFeaturesError ? (
                          <div className="mt-4 text-sm text-red-600">{customerFeaturesError}</div>
                        ) : null}
                        {customerFeaturesFormError ? (
                          <div className="mt-4 text-sm text-red-600">{customerFeaturesFormError}</div>
                        ) : null}
                        {customerFeaturesFormSuccess ? (
                          <div className="mt-4 text-sm text-[#16a34a]">{customerFeaturesFormSuccess}</div>
                        ) : null}

                        {customerFeatureGroups.length > 0 ? (
                          <div className="mt-6 space-y-5">
                            {customerFeatureGroups.map((group) => {
                              const groupId = group.Id ?? 0;
                              const options = [...(group.Secenekler ?? [])].sort(
                                (a, b) => (a.Sira ?? 0) - (b.Sira ?? 0)
                              );
                              return (
                                <div
                                  key={`customer-feature-group-${groupId}`}
                                  className="rounded-xl border border-[#d9dde6] bg-[#f9fafc] p-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[16px] font-semibold text-[#1f232b]">
                                      {(group.GrupSecenekAdi ?? "").trim() || "-"}
                                    </div>
                                    <div className="text-[12px] text-[#66738e]">
                                      {group.Tek
                                        ? tx("Evet / Hayır", "Yes / No")
                                        : tx("Çoklu seçim", "Multiple choice")}
                                    </div>
                                  </div>

                                  <div className={clsx("mt-3", group.Tek ? "space-y-3" : "grid gap-3 md:grid-cols-4 xl:grid-cols-6")}>
                                    {options.map((option) => {
                                      const optionId = option.Id ?? 0;
                                      const currentRecord = optionId
                                        ? customerFeatureRecordBySecenekId.get(optionId)
                                        : undefined;
                                      const hasRecord = typeof currentRecord?.Nr === "number";
                                      const isSelected = currentRecord?.Eh === true;
                                      const isNoSelected = currentRecord?.Eh === false;
                                      const isSaving = optionId
                                        ? customerFeaturesSavingSecenekIds.includes(optionId)
                                        : false;
                                      const optionLabel = (option.SecenekAdi ?? "").trim() || "-";

                                      if (!group.Tek) {
                                        const nextValue = isSelected ? false : true;
                                        return (
                                          <button
                                            type="button"
                                            key={`customer-feature-option-${groupId}-${optionId}`}
                                            disabled={!optionId || isSaving}
                                            onClick={() =>
                                              void handleToggleCustomerFeature(group, option, nextValue)
                                            }
                                            className={clsx(
                                              "flex w-full rounded-[16px] border p-3 text-left shadow-sm transition",
                                              isSelected
                                                ? "border-[#7fd39d] bg-[#dcfce7]"
                                                : isNoSelected
                                                ? "border-[#f0a7a1] bg-[#fee2e2]"
                                                : "border-[#d6deea] bg-[#eef2f7] hover:border-[#c6d0dd]",
                                              !isSaving && optionId && "hover:-translate-y-0.5 hover:shadow-md",
                                              isSaving && "cursor-not-allowed opacity-70"
                                            )}
                                          >
                                            <div className="flex w-full items-start justify-between gap-3">
                                              <span className="text-[14px] font-semibold leading-5 text-[#1f232b]">
                                                {optionLabel}
                                              </span>
                                              {isSaving ? <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-[#66738e]" /> : null}
                                            </div>
                                          </button>
                                        );
                                      }

                                      return (
                                        <div
                                          key={`customer-feature-option-${groupId}-${optionId}`}
                                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d3d9e3] bg-white px-3 py-2.5"
                                        >
                                          <span className="text-[14px] font-medium text-[#1f232b]">
                                            {optionLabel}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              disabled={!optionId || isSaving}
                                              onClick={() =>
                                                void handleToggleCustomerFeature(group, option, true)
                                              }
                                              className={clsx(
                                                "min-w-20 rounded-lg border px-4 py-1.5 text-[14px] font-semibold transition",
                                                isSelected
                                                  ? "border-[#16a34a] bg-[#dcfce7] text-[#166534]"
                                                  : !hasRecord
                                                  ? "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f4f7fb]"
                                                  : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f4f7fb]",
                                                isSaving && "cursor-not-allowed opacity-70"
                                              )}
                                            >
                                              {isSaving && isSelected ? (
                                                <Loader2 size={14} className="mx-auto animate-spin" />
                                              ) : (
                                                tx("Evet", "Yes")
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              disabled={!optionId || isSaving}
                                              onClick={() =>
                                                void handleToggleCustomerFeature(group, option, false)
                                              }
                                              className={clsx(
                                                "min-w-20 rounded-lg border px-4 py-1.5 text-[14px] font-semibold transition",
                                                isNoSelected
                                                  ? "border-[#dc2626] bg-[#fee2e2] text-[#991b1b]"
                                                  : !hasRecord
                                                  ? "border-[#d1d5db] bg-[#e5e7eb] text-[#6b7280]"
                                                  : "border-[#cfd4de] bg-white text-[#4f5a71] hover:bg-[#f4f7fb]",
                                                isSaving && "cursor-not-allowed opacity-70"
                                              )}
                                            >
                                              {isSaving && !isSelected ? (
                                                <Loader2 size={14} className="mx-auto animate-spin" />
                                              ) : (
                                                tx("Hayır", "No")
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </article>

                      <div className="flex flex-col gap-3 rounded-2xl border border-[#f3d0cd] bg-[#fff6f5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[14px] text-[#7a3e39]">
                          {tx("Hesabını kapatmak istersen bu işlem geri alınamaz.", "If you close your account, this action cannot be undone.")}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenDeleteModal}
                          className="rounded-2xl border border-[#ef6c62] bg-[#fff5f4] px-5 py-3 text-[15px] font-semibold text-[#d43f33] transition hover:bg-[#ffebe9]"
                        >
                          {text.deleteAccount}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : isMissionsTab ? (
                <>
                  {missionsLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.missionsLoading}</div>
                  ) : null}
                  {!missionsLoading && missionsError ? (
                    <div className="mt-8 text-sm text-red-600">{missionsError}</div>
                  ) : null}
                  {!missionsLoading && !missionsError && missions.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.missionsNoData}</div>
                  ) : null}

                  {!missionsLoading && !missionsError && missions.length > 0 ? (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {missions.map((item, index) => {
                        const gorevNr = item.Nr ?? index + 1;
                        const missionTitle = (item.GorevAdi ?? "").trim() || `#${gorevNr}`;
                        const missionDesc = (item.GorevAciklamasi ?? "").trim() || "-";
                        const missionImg = (item.GorevResim ?? "").trim();
                        const missionHeadline = getMissionHeadline(item, missionTitle);
                        const isDone = Boolean(item.GorevDone);
                        const isSubmitting = missionSubmittingNr === item.Nr;
                        const buttonDisabled = isDone || isSubmitting;

                        return (
                          <article
                            key={item.Nr ?? `${missionTitle}-${index}`}
                            className="flex min-h-[360px] flex-col rounded-[24px] border border-[#2d3036] bg-gradient-to-br from-[#2a2b31] to-[#1f2126] p-6"
                          >
                            <div className="h-[72px] w-[72px] overflow-hidden rounded-[20px] bg-[#32353b] p-3">
                              {missionImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={missionImg}
                                  alt={missionTitle}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/80">
                                  {missionTitle.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <h3 className="mt-6 text-[20px] font-semibold leading-[1.15] text-white">
                              {missionHeadline}
                            </h3>
                            <p className="mt-2 text-[15px] leading-[1.35] text-white/65">{missionDesc}</p>

                            <button
                              type="button"
                              disabled={buttonDisabled}
                              onClick={() => handleMissionComplete(item)}
                              className={clsx(
                                "mt-auto w-full rounded-[18px] px-4 py-3 text-[18px] font-semibold transition",
                                isDone
                                  ? "cursor-not-allowed bg-[#a7a7ab] text-[#e4e4e5]"
                                  : "bg-[var(--gtg-orange)] text-white hover:brightness-95",
                                isSubmitting ? "opacity-70" : "opacity-100"
                              )}
                            >
                              {isDone ? text.missionCompletedCard : text.missionTakeCoin}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : isStoreTab ? (
                <>
                  {storeLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.storeLoading}</div>
                  ) : null}
                  {!storeLoading && storeError ? (
                    <div className="mt-8 text-sm text-red-600">{storeError}</div>
                  ) : null}
                  {!storeLoading && !storeError && storePackages.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.storeNoData}</div>
                  ) : null}

                  {!storeLoading && !storeError && storePackages.length > 0 ? (
                    <div className="mt-8 space-y-5">
                      {storePackages.map((item, index) => {
                        const packageNr = item.Nr ?? index + 1;
                        const packageTitle = (item.PaketAdi ?? "").trim() || `#${packageNr}`;
                        const packageDesc = (item.PaketAciklama ?? "").trim() || "-";
                        const packagePrice = formatStorePrice(item);
                        const coinText = formatMissionCoin(item.PaketCoin);
                        const cycleText = text.storeOneTime;
                        const coinFeatureText = text.storeFeatureCoin.replace(
                          "{coin}",
                          coinText === "-" ? "0" : coinText
                        );
                        const featureItems = [
                          coinFeatureText,
                          text.storeFeatureFast,
                          text.storeFeatureSecure,
                          text.storeFeatureSupport,
                        ];
                        return (
                          <article
                            key={item.Nr ?? `${packageTitle}-${index}`}
                            className="overflow-hidden rounded-3xl border border-[#cfd4de] bg-white/70"
                          >
                            <div className="flex items-center justify-between gap-4 border-b border-[#d9dde5] px-5 py-4">
                              <h3 className="text-[34px] font-semibold leading-tight text-[#1f232b]">
                                {packageTitle}
                              </h3>
                              <button
                                type="button"
                                onClick={() => handleStorePackagePurchase(item)}
                                className="inline-flex items-center rounded-xl border border-[#ffb020] bg-[var(--gtg-orange)] px-5 py-2 text-[15px] font-semibold text-white shadow-[0_8px_18px_rgba(245,158,11,0.35)] transition hover:brightness-95"
                              >
                                {text.storeBuy}
                              </button>
                            </div>

                            <div className="space-y-5 px-5 py-4">
                              <div>
                                <div className="flex items-end gap-2">
                                  <span className="text-[46px] font-semibold leading-none text-[#1f232b]">
                                    {packagePrice}
                                  </span>
                                  <span className="pb-1 text-[16px] font-semibold text-[var(--gtg-orange)]">
                                    {cycleText}
                                  </span>
                                </div>
                                <p className="mt-2 text-[15px] text-[#66738e]">{packageDesc}</p>
                              </div>

                              <div className="border-t border-[#dbe0e8] pt-4">
                                <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                                  {featureItems.map((featureText, featureIndex) => (
                                    <div
                                      key={`${item.Nr ?? packageNr}-feature-${featureIndex}`}
                                      className="flex items-center gap-2 text-[15px] text-[#1f232b]"
                                    >
                                      <CheckCircle2 size={18} className="shrink-0 text-[var(--gtg-orange)]" />
                                      <span>{featureText}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : isOrderHistoryTab ? (
                <>
                  {orderHistoryLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.orderHistoryLoading}</div>
                  ) : null}
                  {!orderHistoryLoading && orderHistoryError ? (
                    <div className="mt-8 text-sm text-red-600">{orderHistoryError}</div>
                  ) : null}
                  {!orderHistoryLoading && !orderHistoryError && orderHistoryItems.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.orderHistoryNoData}</div>
                  ) : null}

                  {!orderHistoryLoading && !orderHistoryError && orderHistoryItems.length > 0 ? (
                    <div className="mt-8 overflow-hidden rounded-3xl border border-[#cfd4de] bg-white/70">
                      <div className="grid grid-cols-4 border-b border-[#d9dde5] bg-[#eef1f5] px-6 py-4 text-[15px] font-semibold text-[#66738e]">
                        <div>{text.orderNo}</div>
                        <div>{text.orderDate}</div>
                        <div>{text.orderPlan}</div>
                        <div className="text-right">{text.orderAmount}</div>
                      </div>
                      {orderHistoryItems.map((item, index) => {
                        const orderNo = `#${String(item.Nr ?? index + 1).padStart(6, "0")}`;
                        const dateText = formatOrderDate(item.OlusturmaZamani, orderDateLocale);
                        const planText = (item.PaketAdi ?? "").trim() || "-";
                        const amountText = formatOrderAmount(item);
                        const key = item.Nr ?? `${item.MuspaketPaketNr ?? "pkg"}-${index}`;
                        return (
                          <div
                            key={key}
                            className={clsx(
                              "grid grid-cols-4 px-6 py-5 text-[15px] text-[#1f232b]",
                              index !== orderHistoryItems.length - 1 ? "border-b border-[#e2e6ed]" : ""
                            )}
                          >
                            <div className="font-semibold">{orderNo}</div>
                            <div className="font-semibold">{dateText}</div>
                            <div className="font-semibold">{planText}</div>
                            <div className="text-right font-semibold">{amountText}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : isLanguageTab ? (
                <div className="mt-8 border-b border-[#cfd4de] pb-8">
                  <div className="max-w-[560px] lg:ml-auto">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <label className="shrink-0 text-[15px] text-[#66738e] sm:w-[90px]">
                        {text.languageField}
                      </label>
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setLanguageMenuOpen((prev) => !prev)}
                          aria-haspopup="listbox"
                          aria-expanded={languageMenuOpen}
                          className="flex w-full items-center justify-between rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-left text-[15px] text-[#1f2937] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                        >
                          <span className="inline-flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedLanguageOption.flag}
                              alt={selectedLanguageOption.alt}
                              className="h-5 w-7 rounded-sm border border-black/10 object-cover"
                            />
                            <span>{selectedLanguageOption.label}</span>
                          </span>
                          <ChevronDown
                            size={18}
                            className={clsx(
                              "text-[#8b95a7] transition-transform",
                              languageMenuOpen ? "rotate-180" : "rotate-0"
                            )}
                          />
                        </button>

                        {languageMenuOpen ? (
                          <div
                            role="listbox"
                            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#cfd4de] bg-white shadow-lg"
                          >
                            {languageOptions.map((option) => (
                              <button
                                key={option.code}
                                type="button"
                                onClick={() => handleLanguageSelect(option.code)}
                                className={clsx(
                                  "flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] transition",
                                  option.code === selectedLanguageOption.code
                                    ? "bg-[#eef1f6] text-[#1f232b]"
                                    : "text-[#4b5567] hover:bg-[#f7f8fb]"
                                )}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={option.flag}
                                  alt={option.alt}
                                  className="h-5 w-7 rounded-sm border border-black/10 object-cover"
                                />
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : isContactTab ? (
                <>
                  {loading ? <div className="mt-8 text-sm text-neutral-500">{text.loading}</div> : null}
                  {!loading && error ? <div className="mt-8 text-sm text-red-600">{error}</div> : null}
                  {!loading && !error && !customer ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.noData}</div>
                  ) : null}

                  {!loading && !error && customer ? (
                    <div className="mt-8">
                      <div className="mb-4">
                        <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.email}</label>
                        <input
                          value={contactEmail}
                          readOnly
                          className={`${plainInputClass} bg-[#eef1f5] text-[#66738e]`}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[15px] text-[#66738e]">{text.contactMessageLabel}</label>
                        <textarea
                          value={contactMessage}
                          maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
                          rows={6}
                          aria-invalid={contactTouched && !!contactMessageError}
                          onChange={(event) => {
                            setContactMessage(event.target.value);
                            if (!contactTouched) setContactTouched(true);
                            if (contactError) setContactError(null);
                            if (contactSuccess) setContactSuccess(null);
                          }}
                          className="w-full resize-none rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-[15px] leading-8 text-[#1f2937] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                        />
                        <div className="mt-2 flex items-start justify-between gap-3">
                          <div>
                            {contactTouched && contactMessageError ? (
                              <p className="text-xs text-red-600">{contactMessageError}</p>
                            ) : null}
                            {contactEmailError ? (
                              <p className="text-xs text-red-600">{contactEmailError}</p>
                            ) : null}
                            {contactError ? <p className="text-xs text-red-600">{contactError}</p> : null}
                            {contactSuccess ? <p className="text-xs text-[#16a34a]">{contactSuccess}</p> : null}
                          </div>
                          <div className="text-[15px] text-[#8b95a7]">
                            {contactMessage.length}/{SUPPORT_MESSAGE_MAX_LENGTH}
                          </div>
                        </div>
                      </div>

                      <div className="mt-7 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSendContact}
                          disabled={!canSendContact}
                          className={clsx(
                            "rounded-2xl px-8 py-3 text-[15px] font-semibold transition",
                            canSendContact
                              ? "bg-[var(--gtg-orange)] text-white"
                              : "cursor-not-allowed bg-[#d9dde4] text-white"
                          )}
                        >
                          {contactSending ? text.contactSending : text.contactSend}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : isSoundTab ? (
                <>
                  {soundLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.soundLoading}</div>
                  ) : null}
                  {!soundLoading && soundError ? (
                    <div className="mt-8 text-sm text-red-600">{soundError}</div>
                  ) : null}

                  {!soundLoading ? (
                    <div className="mt-8">
                      <div className="flex items-start justify-between gap-6 rounded-2xl border border-[#cfd4de] bg-white/60 px-5 py-4">
                        <div>
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {text.soundMessageTitle}
                          </h3>
                          <p className="mt-1 text-[15px] text-[#66738e]">{text.soundMessageDesc}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <div className="whitespace-nowrap text-[20px] font-semibold text-[#16a34a]">
                            {soundEnabled ? text.soundOn : text.soundOff}
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={soundEnabled}
                            disabled={soundSaving}
                            onClick={() => handleSoundToggle(!soundEnabled)}
                            className={clsx(
                              "relative inline-flex h-10 w-[72px] items-center rounded-full border transition",
                              soundEnabled
                                ? "border-[var(--gtg-orange)] bg-[var(--gtg-orange)]"
                                : "border-[#d4d9e2] bg-[#e8ebf0]",
                              soundSaving ? "opacity-60" : "opacity-100"
                            )}
                          >
                            <span
                              className={clsx(
                                "inline-block h-8 w-8 transform rounded-full bg-white shadow transition",
                                soundEnabled ? "translate-x-9" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : isPolicyTab ? (
                <>
                  {policyLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{policyLoadingText}</div>
                  ) : null}
                  {!policyLoading && policyError ? (
                    <div className="mt-8 text-sm text-red-600">{policyError}</div>
                  ) : null}
                  {!policyLoading && !policyError && policyItems.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{policyNoDataText}</div>
                  ) : null}

                  {!policyLoading && !policyError && policyItems.length > 0 ? (
                    <div className="mt-8 space-y-12">
                      {policyItems.map((item, index) => {
                        const title = (item.Baslik ?? "").trim();
                        const description = (item.Aciklama ?? "").trim();
                        const html = sanitizePolicyHtml(item.Detay);
                        const key = item.Nr ?? `${title || "privacy"}-${index}`;
                        return (
                          <article key={key} className="space-y-2">
                            {title ? (
                              <h3 className="text-[22px] font-semibold leading-tight text-[#1f232b]">{title}</h3>
                            ) : null}
                            {description ? <p className="text-[15px] text-[#66738e]">{description}</p> : null}
                            <div
                              className="text-[15px] leading-8 text-[#66738e] [&_a]:text-[var(--gtg-orange)] [&_a]:underline [&_a]:underline-offset-2 [&_div]:mb-3 [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:pl-6 [&_ol]:list-decimal [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:mb-3 [&_ul]:pl-6 [&_ul]:list-disc"
                              dangerouslySetInnerHTML={{ __html: html }}
                            />
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-8 rounded-xl border border-[#cfd4de] bg-white/70 px-4 py-3 text-sm text-[#66738e]">
                  {text.sectionSoon}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {phoneChangeModalOpen ? (
        <div
          className="fixed inset-0 z-[94] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={phoneChangeSending || phoneChangeVerifying ? undefined : handleClosePhoneChangeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-phone-modal-title"
            className="w-full max-w-xl rounded-3xl border border-[#d7dbe3] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="change-phone-modal-title" className="text-[24px] font-semibold text-[#1f232b]">
                  {text.changePhoneTitle}
                </h2>
                <p className="mt-1 text-[15px] text-[#66738e]">
                  {phoneChangeStep === 1 ? text.changePhoneStepOneDesc : text.changePhoneStepTwoDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePhoneChangeModal}
                disabled={phoneChangeSending || phoneChangeVerifying}
                className={clsx(
                  "rounded-full p-2 transition",
                  phoneChangeSending || phoneChangeVerifying
                    ? "cursor-not-allowed text-[#b7bec9]"
                    : "text-[#66738e] hover:bg-[#f3f4f7] hover:text-[#1f232b]"
                )}
                aria-label={text.cancel}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {phoneChangeStep === 1 ? (
                <div className="grid gap-4 sm:grid-cols-[minmax(280px,1.2fr)_minmax(0,1fr)]">
                  <div>
                    <label className="mb-2 block text-[15px] text-[#66738e]">
                      {text.changePhoneCountryCodeLabel}
                    </label>
                    <div className="relative" ref={phoneChangeCountryMenuRef}>
                      <button
                        ref={phoneChangeCountryButtonRef}
                        type="button"
                        onClick={() =>
                          !phoneChangeCountriesLoading && setPhoneChangeCountryMenuOpen((prev) => !prev)
                        }
                        disabled={phoneChangeSending || phoneChangeVerifying || phoneChangeCountriesLoading}
                        className={clsx(
                          `${plainInputClass} flex min-h-12 items-center justify-between gap-2 text-left transition`,
                          phoneChangeCountryMenuOpen && "border-[var(--gtg-orange)]",
                          phoneChangeSending || phoneChangeVerifying || phoneChangeCountriesLoading
                            ? "cursor-not-allowed opacity-80"
                            : "hover:border-[#b8c4d8]"
                        )}
                      >
                        {selectedPhoneChangeCountry?.ResimUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedPhoneChangeCountry.ResimUrl}
                            alt={selectedPhoneChangeCountry.UlkeAdi ?? "Country"}
                            className="h-5 w-7 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="h-5 w-7 shrink-0 rounded-sm bg-[#EEF2F8]" />
                        )}
                        <span
                          className={clsx(
                            "min-w-0 flex-1 pr-2 whitespace-normal break-words text-[14px] leading-5 sm:text-[15px]",
                            selectedPhoneChangeCountry ? "text-[#1f232b]" : "text-[#8b95a7]"
                          )}
                        >
                          {selectedPhoneChangeCountry
                            ? countryDisplay(selectedPhoneChangeCountry)
                            : phoneChangeCountriesLoading
                            ? text.changePhoneCountryLoading
                            : text.changePhoneCountryPlaceholder}
                        </span>
                        <ChevronDown
                          size={18}
                          className={clsx(
                            "shrink-0 text-[#66738e] transition",
                            phoneChangeCountryMenuOpen ? "rotate-180" : "rotate-0"
                          )}
                        />
                      </button>

                      {phoneChangeCountryMenuOpen ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                          <div className="border-b border-[#e8edf5] p-3">
                            <input
                              value={phoneChangeCountrySearch}
                              onChange={(event) => setPhoneChangeCountrySearch(event.target.value)}
                              placeholder={text.changePhoneCountrySearchPlaceholder}
                              className="w-full rounded-[12px] border border-[#e1e7f0] bg-[#f8fafd] px-3 py-2.5 text-[13px] text-[#090914] outline-none placeholder:text-[#99A2B3]"
                              autoComplete="off"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-56 overflow-auto py-2">
                            {filteredPhoneChangeCountries.length ? (
                              filteredPhoneChangeCountries.map((item) => {
                                const selected = item.Id === selectedPhoneChangeCountry?.Id;
                                return (
                                  <button
                                    key={item.Id}
                                    type="button"
                                    onClick={() => {
                                      setPhoneChangeCountryId(item.Id);
                                      setPhoneChangeCountryCode(
                                        (item.TelKodu ?? "").trim().replace(/^\+/, "")
                                      );
                                      setPhoneChangeCountryMenuOpen(false);
                                      setPhoneChangeCountrySearch("");
                                      if (phoneChangeError) setPhoneChangeError(null);
                                    }}
                                    className={clsx(
                                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors duration-150",
                                      selected
                                        ? "bg-[#fff2ea] font-semibold text-[var(--gtg-orange)]"
                                        : "text-[#4B5565] hover:bg-[#F8FAFD]"
                                    )}
                                  >
                                    {item.ResimUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.ResimUrl}
                                        alt={item.UlkeAdi ?? "Country"}
                                        className="h-5 w-7 shrink-0 rounded-sm object-cover"
                                      />
                                    ) : (
                                      <span className="h-5 w-7 shrink-0 rounded-sm bg-[#EEF2F8]" />
                                    )}
                                    <span className="whitespace-normal break-words">{countryDisplay(item)}</span>
                                  </button>
                                );
                              })
                            ) : (
                              <p className="px-4 py-4 text-[14px] text-[#99A2B3]">
                                {text.changePhoneCountryNoResults}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[15px] text-[#66738e]">{text.changePhoneLabel}</label>
                    <input
                      ref={phoneChangePhoneInputRef}
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phoneChangePhone}
                      onChange={(event) => {
                        setPhoneChangePhone(event.target.value);
                        if (phoneChangeError) setPhoneChangeError(null);
                      }}
                      disabled={phoneChangeSending || phoneChangeVerifying}
                      className={plainInputClass}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {phoneChangeInfoMessage || phoneChangePhone ? (
                    <div className="rounded-2xl border border-[#d7dbe3] bg-[#f7f7f9] px-4 py-3">
                      {phoneChangeInfoMessage ? (
                        <div className="text-[14px] font-medium text-[#1f232b]">{phoneChangeInfoMessage}</div>
                      ) : null}
                      {phoneChangePhone ? (
                        <div className="mt-1 text-[14px] text-[#66738e]">
                          {text.changePhoneSentTo}: {`+${phoneChangeCountryCode} ${formatPhone(phoneChangePhone)}`.trim()}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-3 block text-[15px] text-[#66738e]">{text.changePhoneCodeLabel}</label>
                    <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePhoneChangeCodePaste}>
                      {phoneChangeDigits.map((digit, index) => (
                        <input
                          key={`phone-change-digit-${index}`}
                          ref={(node) => {
                            phoneChangeCodeInputRefs.current[index] = node;
                          }}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(event) => handlePhoneChangeCodeInputChange(index, event.target.value)}
                          onKeyDown={(event) => handlePhoneChangeCodeKeyDown(index, event)}
                          disabled={phoneChangeSending || phoneChangeVerifying}
                          className="h-12 w-full rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] text-center text-[20px] font-semibold text-[#1f232b] outline-none transition focus:border-[var(--gtg-orange)]"
                        />
                      ))}
                    </div>
                  </div>

                  {phoneChangeExpireSecondsLeft <= 0 && !phoneChangeSending && !!phoneChangeInfoMessage ? (
                    <div className="text-sm text-red-600">{text.changePhoneExpired}</div>
                  ) : null}
                </>
              )}

              {phoneChangeCountriesError ? (
                <div className="text-sm text-red-600">{phoneChangeCountriesError}</div>
              ) : null}
              {phoneChangeError ? <div className="text-sm text-red-600">{phoneChangeError}</div> : null}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClosePhoneChangeModal}
                disabled={phoneChangeSending || phoneChangeVerifying}
                className={clsx(
                  "rounded-2xl border px-6 py-3 text-[15px] font-semibold transition",
                  phoneChangeSending || phoneChangeVerifying
                    ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                    : "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                )}
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={phoneChangeStep === 1 ? handleSendPhoneChangeCode : handleCompletePhoneChange}
                disabled={phoneChangeStep === 1 ? !canStartPhoneChange : !canCompletePhoneChange}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition",
                  (phoneChangeStep === 1 ? canStartPhoneChange : canCompletePhoneChange)
                    ? "bg-[var(--gtg-orange)] hover:brightness-95"
                    : "cursor-not-allowed bg-[#d9dde4]"
                )}
              >
                {phoneChangeSending || phoneChangeVerifying ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                <span>{phoneChangeButtonText}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {emailChangeModalOpen ? (
        <div
          className="fixed inset-0 z-[93] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={emailChangeSending || emailChangeVerifying ? undefined : handleCloseEmailChangeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-email-modal-title"
            className="w-full max-w-lg rounded-3xl border border-[#d7dbe3] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="change-email-modal-title" className="text-[24px] font-semibold text-[#1f232b]">
                  {text.changeEmailTitle}
                </h2>
                <p className="mt-1 text-[15px] text-[#66738e]">
                  {emailChangeStep === 1 ? text.changeEmailStepOneDesc : text.changeEmailStepTwoDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEmailChangeModal}
                disabled={emailChangeSending || emailChangeVerifying}
                className={clsx(
                  "rounded-full p-2 transition",
                  emailChangeSending || emailChangeVerifying
                    ? "cursor-not-allowed text-[#b7bec9]"
                    : "text-[#66738e] hover:bg-[#f3f4f7] hover:text-[#1f232b]"
                )}
                aria-label={text.cancel}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {emailChangeStep === 1 ? (
                <div>
                  <label className="mb-2 block text-[15px] text-[#66738e]">{text.changeEmailLabel}</label>
                  <input
                    ref={emailChangeInputRef}
                    type="email"
                    autoComplete="email"
                    value={emailChangeValue}
                    onChange={(event) => {
                      setEmailChangeValue(event.target.value);
                      if (emailChangeError) setEmailChangeError(null);
                    }}
                    disabled={emailChangeSending || emailChangeVerifying}
                    className={plainInputClass}
                  />
                </div>
              ) : (
                <>
                  {emailChangeInfoMessage || emailChangeValue ? (
                    <div className="rounded-2xl border border-[#d7dbe3] bg-[#f7f7f9] px-4 py-3">
                      {emailChangeInfoMessage ? (
                        <div className="text-[14px] font-medium text-[#1f232b]">{emailChangeInfoMessage}</div>
                      ) : null}
                      {emailChangeValue ? (
                        <div className="mt-1 text-[14px] text-[#66738e]">
                          {text.changeEmailSentTo}: {emailChangeValue}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-3 block text-[15px] text-[#66738e]">{text.changeEmailCodeLabel}</label>
                    <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleEmailChangeCodePaste}>
                      {emailChangeDigits.map((digit, index) => (
                        <input
                          key={`email-change-digit-${index}`}
                          ref={(node) => {
                            emailChangeCodeInputRefs.current[index] = node;
                          }}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(event) => handleEmailChangeCodeInputChange(index, event.target.value)}
                          onKeyDown={(event) => handleEmailChangeCodeKeyDown(index, event)}
                          disabled={emailChangeSending || emailChangeVerifying}
                          className="h-12 w-full rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] text-center text-[20px] font-semibold text-[#1f232b] outline-none transition focus:border-[var(--gtg-orange)]"
                        />
                      ))}
                    </div>
                  </div>

                  {emailChangeExpireSecondsLeft <= 0 && !emailChangeSending && !!emailChangeInfoMessage ? (
                    <div className="text-sm text-red-600">{text.changeEmailExpired}</div>
                  ) : null}
                </>
              )}

              {emailChangeError ? <div className="text-sm text-red-600">{emailChangeError}</div> : null}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseEmailChangeModal}
                disabled={emailChangeSending || emailChangeVerifying}
                className={clsx(
                  "rounded-2xl border px-6 py-3 text-[15px] font-semibold transition",
                  emailChangeSending || emailChangeVerifying
                    ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                    : "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                )}
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={emailChangeStep === 1 ? handleSendEmailChangeCode : handleCompleteEmailChange}
                disabled={emailChangeStep === 1 ? !canStartEmailChange : !canCompleteEmailChange}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition",
                  (emailChangeStep === 1 ? canStartEmailChange : canCompleteEmailChange)
                    ? "bg-[var(--gtg-orange)] hover:brightness-95"
                    : "cursor-not-allowed bg-[#d9dde4]"
                )}
              >
                {emailChangeSending || emailChangeVerifying ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                <span>{emailChangeButtonText}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phoneVerifyModalOpen ? (
        <div
          className="fixed inset-0 z-[91] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={phoneVerifySending || phoneVerifyVerifying ? undefined : handleClosePhoneVerifyModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-phone-modal-title"
            className="w-full max-w-lg rounded-3xl border border-[#d7dbe3] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="verify-phone-modal-title" className="text-[24px] font-semibold text-[#1f232b]">
                  {text.verifyPhoneTitle}
                </h2>
                <p className="mt-1 text-[15px] text-[#66738e]">{text.verifyPhoneDesc}</p>
              </div>
              <button
                type="button"
                onClick={handleClosePhoneVerifyModal}
                disabled={phoneVerifySending || phoneVerifyVerifying}
                className={clsx(
                  "rounded-full p-2 transition",
                  phoneVerifySending || phoneVerifyVerifying
                    ? "cursor-not-allowed text-[#b7bec9]"
                    : "text-[#66738e] hover:bg-[#f3f4f7] hover:text-[#1f232b]"
                )}
                aria-label={text.cancel}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {phoneVerifyInfoMessage || phoneVerifyPhone ? (
                <div className="rounded-2xl border border-[#d7dbe3] bg-[#f7f7f9] px-4 py-3">
                  {phoneVerifyInfoMessage ? (
                    <div className="text-[14px] font-medium text-[#1f232b]">{phoneVerifyInfoMessage}</div>
                  ) : null}
                  {phoneVerifyPhone ? (
                    <div className="mt-1 text-[14px] text-[#66738e]">
                      {text.verifyPhoneSentTo}: {`${phoneVerifyCountryCode} ${phoneVerifyPhone}`.trim()}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div>
                <label className="mb-3 block text-[15px] text-[#66738e]">{text.verifyPhoneCodeLabel}</label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePhoneVerifyCodePaste}>
                  {phoneVerifyDigits.map((digit, index) => (
                    <input
                      key={`phone-verify-digit-${index}`}
                      ref={(node) => {
                        phoneVerifyCodeInputRefs.current[index] = node;
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handlePhoneVerifyCodeInputChange(index, event.target.value)}
                      onKeyDown={(event) => handlePhoneVerifyCodeKeyDown(index, event)}
                      disabled={phoneVerifySending || phoneVerifyVerifying}
                      className="h-12 w-full rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] text-center text-[20px] font-semibold text-[#1f232b] outline-none transition focus:border-[var(--gtg-orange)]"
                    />
                  ))}
                </div>
              </div>

              {phoneVerifyExpireSecondsLeft <= 0 && !phoneVerifySending && !!phoneVerifyInfoMessage ? (
                <div className="text-sm text-red-600">{text.verifyPhoneExpired}</div>
              ) : null}
              {phoneVerifyError ? <div className="text-sm text-red-600">{phoneVerifyError}</div> : null}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClosePhoneVerifyModal}
                  disabled={phoneVerifySending || phoneVerifyVerifying}
                  className={clsx(
                    "rounded-2xl border px-6 py-3 text-[15px] font-semibold transition",
                    phoneVerifySending || phoneVerifyVerifying
                      ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                      : "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                  )}
                >
                  {text.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPhoneCode}
                  disabled={!canVerifyPhoneCode}
                  className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition",
                    canVerifyPhoneCode
                      ? "bg-[var(--gtg-orange)] hover:brightness-95"
                      : "cursor-not-allowed bg-[#d9dde4]"
                  )}
                >
                  {phoneVerifyVerifying ? <Loader2 size={18} className="animate-spin" /> : null}
                  <span>{verifyPhoneButtonText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {emailVerifyModalOpen ? (
        <div
          className="fixed inset-0 z-[92] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={emailVerifySending || emailVerifyVerifying ? undefined : handleCloseEmailVerifyModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-email-modal-title"
            className="w-full max-w-lg rounded-3xl border border-[#d7dbe3] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="verify-email-modal-title" className="text-[24px] font-semibold text-[#1f232b]">
                  {text.verifyEmailTitle}
                </h2>
                <p className="mt-1 text-[15px] text-[#66738e]">{text.verifyEmailDesc}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEmailVerifyModal}
                disabled={emailVerifySending || emailVerifyVerifying}
                className={clsx(
                  "rounded-full p-2 transition",
                  emailVerifySending || emailVerifyVerifying
                    ? "cursor-not-allowed text-[#b7bec9]"
                    : "text-[#66738e] hover:bg-[#f3f4f7] hover:text-[#1f232b]"
                )}
                aria-label={text.cancel}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {emailVerifyInfoMessage || emailVerifyEmail ? (
                <div className="rounded-2xl border border-[#d7dbe3] bg-[#f7f7f9] px-4 py-3">
                  {emailVerifyInfoMessage ? (
                    <div className="text-[14px] font-medium text-[#1f232b]">{emailVerifyInfoMessage}</div>
                  ) : null}
                  {emailVerifyEmail ? (
                    <div className="mt-1 text-[14px] text-[#66738e]">
                      {text.verifyEmailSentTo}: {emailVerifyEmail}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div>
                <label className="mb-3 block text-[15px] text-[#66738e]">{text.verifyEmailCodeLabel}</label>
                <div
                  className="grid grid-cols-6 gap-2 sm:gap-3"
                  onPaste={handleEmailVerifyCodePaste}
                >
                  {emailVerifyDigits.map((digit, index) => (
                    <input
                      key={`email-verify-digit-${index}`}
                      ref={(node) => {
                        emailVerifyCodeInputRefs.current[index] = node;
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleEmailVerifyCodeInputChange(index, event.target.value)}
                      onKeyDown={(event) => handleEmailVerifyCodeKeyDown(index, event)}
                      disabled={emailVerifySending || emailVerifyVerifying}
                      className="h-12 w-full rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] text-center text-[20px] font-semibold text-[#1f232b] outline-none transition focus:border-[var(--gtg-orange)]"
                    />
                  ))}
                </div>
              </div>

              {emailVerifyExpireSecondsLeft <= 0 && !emailVerifySending && !!emailVerifyInfoMessage ? (
                <div className="text-sm text-red-600">{text.verifyEmailExpired}</div>
              ) : null}
              {emailVerifyError ? <div className="text-sm text-red-600">{emailVerifyError}</div> : null}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCloseEmailVerifyModal}
                  disabled={emailVerifySending || emailVerifyVerifying}
                  className={clsx(
                    "rounded-2xl border px-6 py-3 text-[15px] font-semibold transition",
                    emailVerifySending || emailVerifyVerifying
                      ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                      : "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                  )}
                >
                  {text.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyEmailCode}
                  disabled={!canVerifyEmailCode}
                  className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition",
                    canVerifyEmailCode
                      ? "bg-[var(--gtg-orange)] hover:brightness-95"
                      : "cursor-not-allowed bg-[#d9dde4]"
                  )}
                >
                  {emailVerifyVerifying ? <Loader2 size={18} className="animate-spin" /> : null}
                  <span>{verifyEmailButtonText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {passwordModalOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={passwordSubmitting ? undefined : handleClosePasswordModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-modal-title"
            className="w-full max-w-lg rounded-3xl border border-[#d7dbe3] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="change-password-modal-title" className="text-[24px] font-semibold text-[#1f232b]">
                  {text.changePasswordTitle}
                </h2>
                <p className="mt-1 text-[15px] text-[#66738e]">{text.changePasswordDesc}</p>
              </div>
              <button
                type="button"
                onClick={handleClosePasswordModal}
                disabled={passwordSubmitting}
                className={clsx(
                  "rounded-full p-2 transition",
                  passwordSubmitting
                    ? "cursor-not-allowed text-[#b7bec9]"
                    : "text-[#66738e] hover:bg-[#f3f4f7] hover:text-[#1f232b]"
                )}
                aria-label={text.cancel}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-[15px] text-[#66738e]">{text.newPassword}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={passwordSubmitting}
                    className={`${plainInputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    disabled={passwordSubmitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66738e] transition hover:text-[#1f232b] disabled:cursor-not-allowed disabled:text-[#b7bec9]"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[15px] text-[#66738e]">{text.newPasswordRepeat}</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    disabled={passwordSubmitting}
                    className={`${plainInputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    disabled={passwordSubmitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66738e] transition hover:text-[#1f232b] disabled:cursor-not-allowed disabled:text-[#b7bec9]"
                    aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d7dbe3] bg-[#f7f7f9] p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {passwordRuleItems.map((item) => (
                    <div
                      key={item.label}
                      className={clsx(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-medium transition",
                        item.valid ? "bg-[#ecfdf3] text-[#15803d]" : "bg-white text-[#66738e]"
                      )}
                    >
                      {item.valid ? (
                        <CheckCircle2 size={16} className="shrink-0 text-[#16a34a]" />
                      ) : (
                        <X size={16} className="shrink-0 text-[#d43f33]" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClosePasswordModal}
                disabled={passwordSubmitting}
                className={clsx(
                  "rounded-2xl border px-6 py-3 text-[15px] font-semibold transition",
                  passwordSubmitting
                    ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                    : "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                )}
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={!canChangePassword}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition",
                  canChangePassword
                    ? "bg-[var(--gtg-orange)] hover:brightness-95"
                    : "cursor-not-allowed bg-[#d9dde4]"
                )}
              >
                {passwordSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                <span>{passwordSubmitting ? text.changePasswordSaving : text.changePasswordSave}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resultModal ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={handleCloseResultModal}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="change-password-result-title"
            className="w-full max-w-md rounded-3xl border border-[#d7dbe3] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="change-password-result-title" className="text-[22px] font-semibold text-[#1f232b]">
              {resultModal.kind === "success" ? text.resultSuccessTitle : text.resultErrorTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-6 text-[#66738e]">{resultModal.message}</p>
            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={handleCloseResultModal}
                className="rounded-2xl bg-[var(--gtg-orange)] px-6 py-3 text-[15px] font-semibold text-white transition hover:brightness-95"
              >
                {text.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {imageModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={imageUploading ? undefined : () => handleCloseImageModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-image-modal-title"
            className="w-full max-w-lg rounded-3xl border border-[#d7dbe3] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="profile-image-modal-title" className="text-[24px] font-semibold text-[#1f232b]">
                  {text.changeImageTitle}
                </h2>
                <p className="mt-1 text-[15px] text-[#66738e]">{text.changeImageDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCloseImageModal()}
                disabled={imageUploading}
                className={clsx(
                  "rounded-full p-2 transition",
                  imageUploading
                    ? "cursor-not-allowed text-[#b7bec9]"
                    : "text-[#66738e] hover:bg-[#f3f4f7] hover:text-[#1f232b]"
                )}
                aria-label={text.cancel}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <div className="flex items-center gap-4 rounded-2xl border border-[#d7dbe3] bg-[#f7f7f9] p-4">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-[#e1e4ea]">
                  {modalPreviewPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={modalPreviewPhoto}
                      alt={customerFullName || "Customer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xl font-semibold text-[#6b7280]">
                      {customerInitials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold uppercase tracking-[0.12em] text-[#8b95a7]">
                    {text.changeImageSelected}
                  </div>
                  <div className="mt-1 truncate text-[16px] font-medium text-[#1f232b]">
                    {selectedImageFile?.name ?? customerFullName ?? "-"}
                  </div>
                  <p className="mt-1 text-[14px] text-[#66738e]">{text.changeImageHint}</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[15px] text-[#66738e]">{text.changeImageSelect}</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleProfileImageFileChange}
                  disabled={imageUploading}
                  className="block w-full rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-[15px] text-[#1f2937] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--gtg-orange)] file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-white hover:file:brightness-95"
                />
              </div>

              {imageError ? <div className="text-sm text-red-600">{imageError}</div> : null}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleCloseImageModal()}
                disabled={imageUploading}
                className={clsx(
                  "rounded-2xl border px-6 py-3 text-[15px] font-semibold transition",
                  imageUploading
                    ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                    : "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                )}
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={handleProfileImageUpload}
                disabled={imageUploading}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition",
                  imageUploading
                    ? "cursor-not-allowed bg-[#d9dde4]"
                    : "bg-[var(--gtg-orange)] hover:brightness-95"
                )}
              >
                {imageUploading ? <Loader2 size={18} className="animate-spin" /> : null}
                <span>{imageUploading ? text.changeImageUploading : text.changeImageUpload}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={deleteSubmitting ? undefined : handleCloseDeleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-modal-title"
            className="w-full max-w-md rounded-3xl border border-[#f2cbc6] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-account-modal-title" className="text-[24px] font-semibold text-[#1f232b]">
                  {text.deleteAccountTitle}
                </h2>
                <p className="mt-2 text-[15px] leading-6 text-[#66738e]">{text.deleteAccountDesc}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteSubmitting}
                className={clsx(
                  "rounded-full p-2 transition",
                  deleteSubmitting
                    ? "cursor-not-allowed text-[#b7bec9]"
                    : "text-[#66738e] hover:bg-[#f3f4f7] hover:text-[#1f232b]"
                )}
                aria-label={text.cancel}
              >
                <X size={20} />
              </button>
            </div>

            {deleteError ? <div className="mt-4 text-sm text-red-600">{deleteError}</div> : null}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteSubmitting}
                className={clsx(
                  "rounded-2xl border px-6 py-3 text-[15px] font-semibold transition",
                  deleteSubmitting
                    ? "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                    : "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                )}
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteSubmitting}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition",
                  deleteSubmitting
                    ? "cursor-not-allowed bg-[#d9dde4]"
                    : "bg-[#d43f33] hover:brightness-95"
                )}
              >
                {deleteSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                <span>{deleteSubmitting ? text.deleteAccountDeleting : text.deleteAccountConfirm}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
