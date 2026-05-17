import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type React from "react"

export type AppLanguage = "es" | "ru"

type TranslationKey =
  | "about.description"
  | "about.scope.body1"
  | "about.scope.body2"
  | "about.scope.title"
  | "about.title"
  | "about.purpose.body1"
  | "about.purpose.body2"
  | "about.purpose.title"
  | "appearance.dark"
  | "appearance.label"
  | "appearance.light"
  | "appearance.system"
  | "appearance.toggle"
  | "chat.answerSent"
  | "chat.analyze"
  | "chat.analyzing"
  | "chat.compatibleCenters"
  | "chat.disclaimer"
  | "chat.errorConnect"
  | "chat.errorHistory"
  | "chat.errorTriage"
  | "chat.historyLoading"
  | "chat.inputPlaceholder"
  | "chat.loadingHistory"
  | "chat.noSpecialty"
  | "chat.noService"
  | "chat.noType"
  | "chat.promptSubtitle"
  | "chat.promptTitle"
  | "chat.questionsSubtitle"
  | "chat.questionsTitle"
  | "chat.recommendationResult"
  | "chat.requiredQuestions"
  | "chat.retry"
  | "chat.risk"
  | "chat.send"
  | "chat.service"
  | "chat.specialty"
  | "chat.submittedTriage"
  | "chat.type"
  | "chat.voice"
  | "chat.welcome"
  | "common.no"
  | "common.private"
  | "common.public"
  | "common.yes"
  | "language.label"
  | "language.russian"
  | "language.spanish"
  | "medical.addressMissing"
  | "medical.centersFound"
  | "medical.centersLoading"
  | "medical.centersSubtitle"
  | "medical.centersTitle"
  | "medical.district"
  | "medical.districtMissing"
  | "medical.emergency"
  | "medical.hoursMissing"
  | "medical.phoneMissing"
  | "medical.site"
  | "medical.typeMissing"
  | "nav.about"
  | "nav.chat"
  | "nav.history"
  | "nav.historyEmpty"
  | "nav.historyError"
  | "nav.historyLoading"
  | "nav.localBase"
  | "nav.localData"
  | "nav.newChat"
  | "nav.services"
  | "nav.medicalCenters"
  | "nav.slogan"
  | "services.available"
  | "services.description"
  | "services.title"
  | "services.consultation.description"
  | "services.consultation.title"
  | "services.emergency.description"
  | "services.emergency.title"
  | "services.labs.description"
  | "services.labs.title"
  | "services.pharmacy.description"
  | "services.pharmacy.title"
  | "services.specialties.description"
  | "services.specialties.title"
  | "settings.label"
  | "settings.description"
  | "settings.profile"
  | "settings.password"
  | "settings.danger"
  | "sidebar.toggle"
  | "user.fallback"
  | "user.logout"
  | "user.settings"

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  es: {
    "about.description":
      "VILPU / ВИЛПУ ayuda a orientar la seleccion de centros medicos en Kursk.",
    "about.scope.body1":
      "La aplicacion trabaja con datos locales de Kursk y no reemplaza una evaluacion medica profesional.",
    "about.scope.body2":
      "El objetivo es guiar hacia el recurso adecuado, no diagnosticar enfermedades.",
    "about.scope.title": "Alcance",
    "about.title": "Acerca del sistema",
    "about.purpose.body1":
      "VILPU recibe una necesidad medica, realiza preguntas de triaje y recomienda el tipo de institucion mas adecuado segun reglas locales.",
    "about.purpose.body2":
      "El sistema orienta la decision inicial: farmacia, laboratorio, policlinico, clinica especializada u hospital/urgencias.",
    "about.purpose.title": "Proposito",
    "appearance.dark": "Oscuro",
    "appearance.label": "Apariencia",
    "appearance.light": "Claro",
    "appearance.system": "Sistema",
    "appearance.toggle": "Cambiar tema",
    "chat.answerSent": "Respuestas enviadas",
    "chat.analyze": "Analizar respuestas",
    "chat.analyzing": "Analizando...",
    "chat.compatibleCenters": "Centros medicos compatibles",
    "chat.disclaimer":
      "Este sistema no reemplaza una consulta medica profesional. En caso de sintomas graves o emergencia, acude a urgencias o llama a los servicios de emergencia.",
    "chat.errorConnect":
      "No pude conectar con el chatbot medico. Revisa que el backend este corriendo.",
    "chat.errorHistory": "No pude cargar el historial de este chat.",
    "chat.errorTriage": "No pude procesar las respuestas de triaje.",
    "chat.historyLoading": "Cargando historial...",
    "chat.inputPlaceholder": "Describe tu necesidad medica...",
    "chat.loadingHistory": "No se pudo cargar el historial",
    "chat.noSpecialty": "No definida",
    "chat.noService": "No definido",
    "chat.noType": "No definido",
    "chat.promptSubtitle":
      "VILPU ofrece orientacion general. Siempre consulta a un profesional medico.",
    "chat.promptTitle": "En que puedo ayudarte hoy?",
    "chat.questionsSubtitle":
      "Responde para obtener una recomendacion precisa",
    "chat.questionsTitle": "Preguntas de orientacion",
    "chat.recommendationResult": "Resultado de orientacion",
    "chat.requiredQuestions":
      "Responde todas las preguntas obligatorias para continuar",
    "chat.retry": "Intentar de nuevo",
    "chat.risk": "Riesgo",
    "chat.send": "Enviar mensaje",
    "chat.service": "Servicio recomendado",
    "chat.specialty": "Especialidad",
    "chat.submittedTriage": "Respuestas de triaje enviadas",
    "chat.type": "Tipo de institucion",
    "chat.voice": "Entrada de voz",
    "chat.welcome": "Hola, bienvenido a VILPU",
    "common.no": "No",
    "common.private": "Privado",
    "common.public": "Publico",
    "common.yes": "Si",
    "language.label": "Idioma",
    "language.russian": "Ruso",
    "language.spanish": "Español",
    "medical.addressMissing": "Direccion no informada",
    "medical.centersFound": "centros encontrados en Kursk",
    "medical.centersLoading": "Cargando centros...",
    "medical.centersSubtitle":
      "Catalogo local usado por VILPU para mostrar recomendaciones.",
    "medical.centersTitle": "Centros medicos en Kursk",
    "medical.district": "Distrito",
    "medical.districtMissing": "No informado",
    "medical.emergency": "Urgencias",
    "medical.hoursMissing": "Horario no informado",
    "medical.phoneMissing": "Telefono no informado",
    "medical.site": "Ver sitio web",
    "medical.typeMissing": "Tipo no informado",
    "nav.about": "Acerca del sistema",
    "nav.chat": "Chat medico",
    "nav.history": "Historial",
    "nav.historyEmpty": "Sin chats guardados",
    "nav.historyError": "No se pudo cargar el historial",
    "nav.historyLoading": "Cargando chats...",
    "nav.localBase": "Base local de Kursk",
    "nav.localData": "Datos medicos actualizados",
    "nav.newChat": "Nueva consulta",
    "nav.services": "Servicios",
    "nav.medicalCenters": "Centros medicos",
    "nav.slogan": "Elige mejor. Vive mejor.",
    "services.available": "Disponible en triaje",
    "services.description": "Tipos de orientacion disponibles en el sistema VILPU.",
    "services.title": "Servicios",
    "services.consultation.description":
      "Orientacion hacia policlinicos, clinicas y especialidades.",
    "services.consultation.title": "Consulta medica",
    "services.emergency.description":
      "Derivacion a hospital o urgencias cuando hay signos de alarma.",
    "services.emergency.title": "Atencion urgente",
    "services.labs.description":
      "Busqueda de centros para estudios basicos y pruebas clinicas.",
    "services.labs.title": "Analisis y laboratorio",
    "services.pharmacy.description":
      "Orientacion para compra de medicamentos y productos de salud.",
    "services.pharmacy.title": "Farmacia",
    "services.specialties.description":
      "Traumatologia, odontologia, oftalmologia, ginecologia y mas.",
    "services.specialties.title": "Especialidades",
    "settings.label": "Configuracion de usuario",
    "settings.description": "Gestiona la configuracion y preferencias de tu cuenta",
    "settings.profile": "Mi perfil",
    "settings.password": "Contraseña",
    "settings.danger": "Zona de riesgo",
    "sidebar.toggle": "Alternar menu lateral",
    "user.fallback": "Usuario",
    "user.logout": "Cerrar sesion",
    "user.settings": "Configuracion de usuario",
  },
  ru: {
    "about.description":
      "ВИЛПУ помогает выбрать подходящий медицинский центр в Курске.",
    "about.scope.body1":
      "Приложение использует локальные данные по Курску и не заменяет профессиональную медицинскую оценку.",
    "about.scope.body2":
      "Цель системы - направить к подходящему ресурсу, а не ставить диагноз.",
    "about.scope.title": "Область применения",
    "about.title": "О системе",
    "about.purpose.body1":
      "ВИЛПУ принимает медицинскую потребность, задает вопросы триажа и рекомендует подходящий тип учреждения по локальным правилам.",
    "about.purpose.body2":
      "Система помогает с первичным выбором: аптека, лаборатория, поликлиника, специализированная клиника или больница/неотложная помощь.",
    "about.purpose.title": "Назначение",
    "appearance.dark": "Темная",
    "appearance.label": "Оформление",
    "appearance.light": "Светлая",
    "appearance.system": "Системная",
    "appearance.toggle": "Переключить тему",
    "chat.answerSent": "Ответы отправлены",
    "chat.analyze": "Анализировать ответы",
    "chat.analyzing": "Анализ...",
    "chat.compatibleCenters": "Подходящие медицинские центры",
    "chat.disclaimer":
      "Эта система не заменяет консультацию врача. При тяжелых симптомах или экстренной ситуации обратитесь в неотложную помощь или вызовите экстренные службы.",
    "chat.errorConnect":
      "Не удалось подключиться к медицинскому чат-боту. Проверьте, что backend запущен.",
    "chat.errorHistory": "Не удалось загрузить историю этого чата.",
    "chat.errorTriage": "Не удалось обработать ответы триажа.",
    "chat.historyLoading": "Загрузка истории...",
    "chat.inputPlaceholder": "Опишите вашу медицинскую потребность...",
    "chat.loadingHistory": "Не удалось загрузить историю",
    "chat.noSpecialty": "Не указана",
    "chat.noService": "Не указан",
    "chat.noType": "Не указан",
    "chat.promptSubtitle":
      "ВИЛПУ предоставляет общую ориентацию. Всегда консультируйтесь с врачом.",
    "chat.promptTitle": "Чем я могу помочь сегодня?",
    "chat.questionsSubtitle": "Ответьте, чтобы получить точную рекомендацию",
    "chat.questionsTitle": "Уточняющие вопросы",
    "chat.recommendationResult": "Результат ориентации",
    "chat.requiredQuestions":
      "Ответьте на все обязательные вопросы, чтобы продолжить",
    "chat.retry": "Повторить",
    "chat.risk": "Риск",
    "chat.send": "Отправить сообщение",
    "chat.service": "Рекомендованная услуга",
    "chat.specialty": "Специальность",
    "chat.submittedTriage": "Ответы триажа отправлены",
    "chat.type": "Тип учреждения",
    "chat.voice": "Голосовой ввод",
    "chat.welcome": "Здравствуйте, добро пожаловать в ВИЛПУ",
    "common.no": "Нет",
    "common.private": "Частный",
    "common.public": "Государственный",
    "common.yes": "Да",
    "language.label": "Язык",
    "language.russian": "Русский",
    "language.spanish": "Испанский",
    "medical.addressMissing": "Адрес не указан",
    "medical.centersFound": "центров найдено в Курске",
    "medical.centersLoading": "Загрузка центров...",
    "medical.centersSubtitle":
      "Локальный каталог, который ВИЛПУ использует для рекомендаций.",
    "medical.centersTitle": "Медицинские центры в Курске",
    "medical.district": "Район",
    "medical.districtMissing": "Не указан",
    "medical.emergency": "Неотложная помощь",
    "medical.hoursMissing": "Расписание не указано",
    "medical.phoneMissing": "Телефон не указан",
    "medical.site": "Открыть сайт",
    "medical.typeMissing": "Тип не указан",
    "nav.about": "О системе",
    "nav.chat": "Медицинский чат",
    "nav.history": "История",
    "nav.historyEmpty": "Нет сохраненных чатов",
    "nav.historyError": "Не удалось загрузить историю",
    "nav.historyLoading": "Загрузка чатов...",
    "nav.localBase": "Локальная база Курска",
    "nav.localData": "Медицинские данные обновлены",
    "nav.newChat": "Новая консультация",
    "nav.services": "Сервисы",
    "nav.medicalCenters": "Медицинские центры",
    "nav.slogan": "Выбирай лучше. Живи лучше.",
    "services.available": "Доступно в триаже",
    "services.description": "Типы ориентации, доступные в системе ВИЛПУ.",
    "services.title": "Сервисы",
    "services.consultation.description":
      "Ориентация по поликлиникам, клиникам и специальностям.",
    "services.consultation.title": "Медицинская консультация",
    "services.emergency.description":
      "Направление в больницу или неотложную помощь при тревожных признаках.",
    "services.emergency.title": "Неотложная помощь",
    "services.labs.description":
      "Поиск центров для базовых исследований и клинических анализов.",
    "services.labs.title": "Анализы и лаборатория",
    "services.pharmacy.description":
      "Ориентация по покупке лекарств и товаров для здоровья.",
    "services.pharmacy.title": "Аптека",
    "services.specialties.description":
      "Травматология, стоматология, офтальмология, гинекология и другие направления.",
    "services.specialties.title": "Специальности",
    "settings.label": "Настройки пользователя",
    "settings.description": "Управляйте настройками и предпочтениями аккаунта",
    "settings.profile": "Мой профиль",
    "settings.password": "Пароль",
    "settings.danger": "Опасная зона",
    "sidebar.toggle": "Переключить боковое меню",
    "user.fallback": "Пользователь",
    "user.logout": "Выйти",
    "user.settings": "Настройки пользователя",
  },
}

const LANGUAGE_STORAGE_KEY = "vilpu-language"

const normalizeLanguage = (value: string | null | undefined): AppLanguage => {
  if (value?.toLowerCase().startsWith("ru")) return "ru"
  return "es"
}

const getInitialLanguage = (): AppLanguage => {
  if (typeof window === "undefined") return "es"
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored) return normalizeLanguage(stored)
  return normalizeLanguage(window.navigator.language)
}

type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key) => translations[language][key] ?? translations.es[key],
    }),
    [language],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}

export function apiLanguageHeaders(language: AppLanguage) {
  return {
    "Accept-Language": language,
  }
}
