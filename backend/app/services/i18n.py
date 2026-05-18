import re
from typing import Any

from app.schemas.chat import ChatResponse
from app.schemas.medical_center import MedicalCenterPublic, MedicalCentersPublic

SUPPORTED_LANGUAGES = {"es", "ru"}


def get_locale(accept_language: str | None) -> str:
    if not accept_language:
        return "es"
    language = accept_language.split(",", 1)[0].split("-", 1)[0].strip().lower()
    return language if language in SUPPORTED_LANGUAGES else "es"


RU_TRANSLATIONS = {
    "Necesito hacer unas preguntas basicas para recomendarte el tipo de institucion adecuado.": "Нужно задать несколько базовых вопросов, чтобы рекомендовать подходящий тип учреждения.",
    "No pude identificar la necesidad con suficiente seguridad. Puedes describir el sintoma principal, duracion, intensidad y si estas en Kursk.": "Не удалось достаточно надежно определить потребность. Опишите основной симптом, длительность, интенсивность и находитесь ли вы в Курске.",
    "Puedo recomendarte una institucion medica segun tu necesidad.": "Могу рекомендовать медицинское учреждение с учетом вашей потребности.",
    "Para analisis de sangre, te recomiendo un laboratorio.": "Для анализа крови рекомендую лабораторию.",
    "Para análisis de sangre, te recomiendo un laboratorio.": "Для анализа крови рекомендую лабораторию.",
    "Los analisis de sangre se realizan en laboratorios o centros diagnosticos.": "Анализы крови выполняются в лабораториях или диагностических центрах.",
    "Los análisis de sangre se realizan en laboratorios o centros diagnósticos.": "Анализы крови выполняются в лабораториях или диагностических центрах.",
    "Parece que describes un sangrado menstrual prolongado. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, вы описываете длительное менструальное кровотечение. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes fiebre acompanada de dolor de rodilla. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, у вас температура вместе с болью в колене. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes fiebre acompañada de dolor de rodilla. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, у вас температура вместе с болью в колене. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes fiebre acompanada de dolor articular. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, у вас температура вместе с болью в суставе. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que hay fiebre con inflamacion articular. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, есть температура и воспаление сустава. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes fiebre con debilidad. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, у вас температура и слабость. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes dolor de cabeza acompanado de fiebre. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, головная боль сопровождается температурой. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes dolor corporal acompanado de fiebre. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, боль в теле сопровождается температурой. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes fiebre y dolor de garganta. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, у вас температура и боль в горле. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Parece que tienes dolor corporal y predominio de dolor de cabeza. Para orientarte mejor necesito hacer unas preguntas.": "Похоже, у вас боль в теле и выраженная головная боль. Чтобы лучше сориентировать, нужно задать несколько вопросов.",
    "Dolor de rodilla con fiebre, inflamacion importante o incapacidad para apoyar requiere urgencias.": "Боль в колене с температурой, выраженным воспалением или невозможностью опираться требует неотложной помощи.",
    "Dolor de rodilla con fiebre, lesion fuerte o incapacidad para caminar requiere urgencias.": "Боль в колене с температурой, серьезной травмой или невозможностью ходить требует неотложной помощи.",
    "Dolor de rodilla con fiebre, deformidad, golpe fuerte o imposibilidad para caminar requiere evaluacion urgente.": "Боль в колене с температурой, деформацией, сильным ударом или невозможностью ходить требует срочной оценки.",
    "Dolor de rodilla con fiebre, deformidad, golpe fuerte o imposibilidad para caminar requiere evaluación urgente.": "Боль в колене с температурой, деформацией, сильным ударом или невозможностью ходить требует срочной оценки.",
    "Inflamacion articular con fiebre o dolor intenso requiere urgencias.": "Воспаление сустава с температурой или сильной болью требует неотложной помощи.",
    "Dolor articular sin fiebre puede valorarse en policlinico.": "Боль в суставе без температуры можно оценить в поликлинике.",
    "Dolor articular con fiebre o inflamacion importante requiere urgencias.": "Боль в суставе с температурой или выраженным воспалением требует неотложной помощи.",
    "Parece fiebre sin signos graves. Te recomiendo medicina general en policlinico.": "Похоже на температуру без тяжелых признаков. Рекомендую терапевта в поликлинике.",
    "La fiebre tiene signos de alarma. Te recomiendo hospital o urgencias.": "При температуре есть тревожные признаки. Рекомендую больницу или неотложную помощь.",
    "Debilidad intensa con fiebre requiere evaluacion urgente.": "Сильная слабость с температурой требует срочной оценки.",
    "Dolor corporal con o sin fiebre leve: consulta medicina general.": "Боль в теле с легкой температурой или без нее: обратитесь к терапевту.",
    "Dolor corporal con fiebre alta o debilidad intensa requiere urgencias.": "Боль в теле с высокой температурой или сильной слабостью требует неотложной помощи.",
    "Dolor de cabeza con fiebre sin signos de alarma puede iniciar por medicina general.": "Головная боль с температурой без тревожных признаков может начаться с консультации терапевта.",
    "Dolor de cabeza con fiebre alta, confusion o rigidez de cuello requiere urgencias.": "Головная боль с высокой температурой, спутанностью или ригидностью шеи требует неотложной помощи.",
    "Dolor de cabeza con fiebre sin signos neurologicos: consulta medicina general.": "Головная боль с температурой без неврологических признаков: обратитесь к терапевту.",
    "Dolor de cabeza con fiebre y signos de alarma requiere urgencias.": "Головная боль с температурой и тревожными признаками требует неотложной помощи.",
    "Te recomiendo consulta con traumatologia en policlinico.": "Рекомендую консультацию травматолога в поликлинике.",
    "Te recomiendo consulta con traumatologia en policlínico.": "Рекомендую консультацию травматолога в поликлинике.",
    "Te recomiendo consulta con traumatología en policlinico.": "Рекомендую консультацию травматолога в поликлинике.",
    "Te recomiendo consulta con traumatología en policlínico.": "Рекомендую консультацию травматолога в поликлинике.",
    "Te recomiendo consulta c traumatologia в policlinico.": "Рекомендую консультацию травматолога в поликлинике.",
    "Te recomiendo consulta с traumatologia в policlinico.": "Рекомендую консультацию травматолога в поликлинике.",
    "Dolor de rodilla sin signos graves: consulta traumatologia/policlinico.": "Боль в колене без тяжелых признаков: консультация травматолога в поликлинике.",
    "Dolor de rodilla sin signos graves: consulta traumatologia/policlínico.": "Боль в колене без тяжелых признаков: консультация травматолога в поликлинике.",
    "Dolor de rodilla": "Боль в колене",
    "Knee pain": "Боль в колене",
    "Joint pain": "Боль в суставе",
    "Dolor articular": "Боль в суставе",
    "Tooth pain": "Зубная боль",
    "Dolor dental": "Зубная боль",
    "Chest pain": "Боль в груди",
    "Dolor en el pecho": "Боль в груди",
    "General fever": "Температура",
    "Fiebre general": "Температура",
    "Fiebre con debilidad": "Температура со слабостью",
    "Child fever": "Температура у ребенка",
    "Fiebre infantil": "Температура у ребенка",
    "Child vaccination": "Вакцинация ребенка",
    "Vacunacion infantil": "Вакцинация ребенка",
    "Blood analysis": "Анализ крови",
    "Analisis de sangre": "Анализ крови",
    "Análisis de sangre": "Анализ крови",
    "Vision problems": "Проблемы со зрением",
    "Problemas de vision": "Проблемы со зрением",
    "Prolonged menstrual bleeding": "Длительное менструальное кровотечение",
    "Abdominal pain": "Боль в животе",
    "Dolor abdominal": "Боль в животе",
    "Pharmacy need": "Потребность в аптеке",
    "Necesidad de farmacia": "Потребность в аптеке",
    "Emergency care": "Экстренная помощь",
    "General malaise": "Общее недомогание",
    "Wound or trauma": "Рана или травма",
    "Back pain": "Боль в спине",
    "Dermatological problem": "Дерматологическая проблема",
    "Ear pain": "Боль в ухе",
    "Blood pressure control": "Контроль артериального давления",
    "Diabetes control": "Контроль диабета",
    "Pediatric consultation": "Консультация педиатра",
    "Gynecological consultation": "Консультация гинеколога",
    "Cardiology consultation": "Консультация кардиолога",
    "Ophthalmology consultation": "Консультация офтальмолога",
    "Irregular menstruation": "Нерегулярная менструация",
    "Severe menstrual pain": "Сильная менструальная боль",
    "Abnormal vaginal bleeding": "Аномальное вагинальное кровотечение",
    "Pelvic pain": "Боль в тазу",
    "Possible pregnancy": "Возможная беременность",
    "Pregnancy control": "Ведение беременности",
    "Weakness": "Слабость",
    "Dolor de cabeza con fiebre": "Головная боль с температурой",
    "Headache with fever": "Головная боль с температурой",
    "Body pain": "Боль в теле",
    "Headache": "Головная боль",
    "Hospital": "Больница",
    "Hospital publico": "Государственная больница",
    "Hospital público": "Государственная больница",
    "Policlinico": "Поликлиника",
    "Policlínico": "Поликлиника",
    "Clinica privada": "Частная клиника",
    "Clínica privada": "Частная клиника",
    "Clinica especializada": "Специализированная клиника",
    "Clínica especializada": "Специализированная клиника",
    "Farmacia": "Аптека",
    "Laboratorio": "Лаборатория",
    "Atencion urgente": "Неотложная помощь",
    "Atención urgente": "Неотложная помощь",
    "Urgencias": "Неотложная помощь",
    "Medicina general": "Терапия",
    "Traumatologia": "Травматология",
    "Traumatología": "Травматология",
    "Odontologia": "Стоматология",
    "Odontología": "Стоматология",
    "Oftalmologia": "Офтальмология",
    "Oftalmología": "Офтальмология",
    "Ginecologia": "Гинекология",
    "Ginecología": "Гинекология",
    "Pediatria": "Педиатрия",
    "Pediatría": "Педиатрия",
    "Rehabilitacion": "Реабилитация",
    "Rehabilitación": "Реабилитация",
    "Consulta medica": "Медицинская консультация",
    "Consulta médica": "Медицинская консультация",
    "Servicio de urgencias": "Неотложная помощь",
    "Radiografia": "Рентгенография",
    "Radiografía": "Рентгенография",
    "Ecografia": "УЗИ",
    "Ecografía": "УЗИ",
    "Diagnostico por imagen": "Визуальная диагностика",
    "Diagnóstico por imagen": "Визуальная диагностика",
    "Técnico de laboratorio": "Лаборант",
    "Tecnico de laboratorio": "Лаборант",
    "Médico general": "Терапевт",
    "Medico general": "Терапевт",
    "Cardiología": "Кардиология",
    "Cardiologia": "Кардиология",
    "Cardiólogo": "Кардиолог",
    "Cardiologo": "Кардиолог",
    "Neurología": "Неврология",
    "Neurologia": "Неврология",
    "Neurólogo": "Невролог",
    "Neurologo": "Невролог",
    "Dermatología": "Дерматология",
    "Dermatologia": "Дерматология",
    "Dermatólogo": "Дерматолог",
    "Dermatologo": "Дерматолог",
    "Dentista": "Стоматолог",
    "Farmacéutico": "Фармацевт",
    "Farmaceutico": "Фармацевт",
    "Ginecólogo": "Гинеколог",
    "Ginecologo": "Гинеколог",
    "Oftalmólogo": "Офтальмолог",
    "Oftalmologo": "Офтальмолог",
    "Traumatólogo": "Травматолог",
    "Traumatologo": "Травматолог",
    "Enfermería": "Медсестринская помощь",
    "Enfermeria": "Медсестринская помощь",
    "Vacunación": "Вакцинация",
    "Vacunacion": "Вакцинация",
    "Consulta ginecológica": "Гинекологическая консультация",
    "Consulta ginecologica": "Гинекологическая консультация",
    "Centro de urgencias": "Травмпункт",
    "Centro diagnóstico": "Диагностический центр",
    "Centro diagnostico": "Диагностический центр",
    "Centro oftalmológico": "Офтальмологический центр",
    "Centro oftalmologico": "Офтальмологический центр",
    "Centro pediátrico": "Детская поликлиника",
    "Centro pediatrico": "Детская поликлиника",
    "Clínica dental": "Стоматологическая клиника",
    "Clinica dental": "Стоматологическая клиника",
    "Clínica ginecológica": "Гинекологическая клиника",
    "Clinica ginecologica": "Гинекологическая клиника",
    "Invitro Kursk Lenin": "ИНВИТРО Курск, Ленина",
    "INVITRO Kursk": "ИНВИТРО Курск",
    "Gemotest Kursk": "Гемотест Курск",
    "KDL Kursk Laboratory": "KDL, медицинская лаборатория Курск",
    "KDL Medical Laboratory Kursk": "KDL, медицинская лаборатория Курск",
    "Kursk Regional Clinical Hospital": "ОБУЗ «Курская областная многопрофильная клиническая больница»",
    "Kursk City Clinical Hospital No. 1": "ОБУЗ «Курская городская больница №1 им. Н.С. Короткова»",
    "Kursk Emergency Care Center": "Курский центр неотложной помощи",
    "City Polyclinic No. 1 Kursk": "Поликлиника №1, Курск",
    "City Polyclinic No. 2 Kursk": "Поликлиника №2, Курск",
    "City Polyclinic No. 5 Kursk": "ОБУЗ «Курская городская поликлиника №5»",
    "Medassist Kursk": "Медицинский центр «Медассист»",
    "Medassist Medical Center Kursk": "Медицинский центр «Медассист»",
    "Expert Clinic Kursk": "Клиника Эксперт Курск",
    "Healthy Family Kursk": "МЦ «Здоровая семья»",
    "Healthy Family Medical Center Kursk": "МЦ «Здоровая семья»",
    "Kursk Dental Clinic No. 1": "Курская областная стоматологическая поликлиника",
    "Kursk Regional Dental Polyclinic": "ОБУЗ «Курская областная стоматологическая поликлиника»",
    "Dental Lux Kursk": "Дента-Люкс Курск",
    "Denta-Lux Kursk": "Дента-Люкс Курск",
    "Smile Studio Kursk": "Стоматологическая клиника «Смайл»",
    "Smile Dental Center Kursk": "Стоматологическая клиника «Смайл»",
    "Children Polyclinic No. 1 Kursk": "Детская поликлиника №1, Курск",
    "Children Polyclinic No. 2 Kursk": "Детская поликлиника №2, Курск",
    "Kursk City Children Polyclinic": "Курская городская детская поликлиника",
    "Pediatric Center Zdorovie Detey": "Педиатрический центр «Здоровье детей»",
    "MRT Expert Kursk": "МРТ Эксперт Курск",
    "Diagnostic Center Kursk": "Диагностический центр Курск",
    "Nadezhda Diagnostic Center Kursk": "Клиника «Надежда», диагностический центр",
    "Ophthalmology Center Kursk": "Офтальмологический центр Курск",
    "Kursk Ophthalmology Clinical Hospital": "Офтальмологическая клиническая больница",
    "Vision Plus Kursk": "Центр охраны зрения Курск",
    "Vision Protection Center Kursk": "Центр охраны зрения Курск",
    "Women's Health Kursk": "Новые медицинские технологии Курск",
    "New Medical Technologies Kursk, Lenina 90/2": "Новые медицинские технологии, Курск, Ленина 90/2",
    "Perinatal Consultation Kursk": "Курский городской клинический родильный дом",
    "Kursk City Clinical Maternity Hospital": "Курский городской клинический родильный дом",
    "Apteka 36.6 Kursk Center": "Аптека 36,6 Курск",
    "Rigla Pharmacy Kursk": "Аптека «Ригла» Курск",
    "April Pharmacy Kursk": "Аптека «Апрель» Курск",
    "April Pharmacy Kursk, Kulakova 3G": "Аптека «Апрель», Курск, Кулакова 3Г",
    "Rehabilitation Center Kursk": "Реабилитационный центр Курск",
    "ReaMed+ Rehabilitation Center Kursk": "РеаМед+ Курск",
    "Dermatology Clinic Kursk": "Дерматологическая клиника Курск",
    "Medial Medical Center Kursk": "Медицинский центр «Медиал»",
    "Neurology Center Kursk": "Неврологический центр Курск",
    "Cardio Center Kursk": "Кардиоцентр Курск",
    "Hospital regional multidisciplinario para atencion especializada y urgencias.": "Региональная многопрофильная больница для специализированной и неотложной помощи.",
    "Hospital regional multidisciplinario para atención especializada y urgencias.": "Региональная многопрофильная больница для специализированной и неотложной помощи.",
    "Hospital municipal con servicios de urgencias y especialistas.": "Городская больница со службой неотложной помощи и специалистами.",
    "¿La rodilla está hinchada?": "Колено опухло?",
    "?¿La rodilla está hinchada?": "Колено опухло?",
    "La rodilla esta hinchada o caliente?": "Колено опухло или горячее?",
    "¿Puedes caminar normalmente?": "Вы можете нормально ходить?",
    "?¿Puedes caminar normalmente?": "Вы можете нормально ходить?",
    "Puedes caminar normalmente o hubo golpe/lesion?": "Вы можете нормально ходить или была травма?",
    "¿Hubo golpe o lesión?": "Был удар или травма?",
    "?¿Hubo golpe o lesión?": "Был удар или травма?",
    "¿También tienes fiebre?": "Есть ли также температура?",
    "?¿También tienes fiebre?": "Есть ли также температура?",
    "Tambien tienes fiebre?": "Есть ли также температура?",
    "No": "Нет",
    "Si": "Да",
    "Sí": "Да",
    "Sí, algo hinchada": "Да, немного опухло",
    "Si, algo hinchada": "Да, немного опухло",
    "Sí, muy hinchada o caliente": "Да, сильно опухло или горячее",
    "Si, muy hinchada o caliente": "Да, сильно опухло или горячее",
    "Sí, hinchada": "Да, опухло",
    "Si, hinchada": "Да, опухло",
    "Sí, caliente y muy dolorosa": "Да, горячее и очень болезненное",
    "Si, caliente y muy dolorosa": "Да, горячее и очень болезненное",
    "Camino normalmente": "Хожу нормально",
    "Me cuesta caminar": "Трудно ходить",
    "Camino con dificultad": "Хожу с трудом",
    "No puedo caminar": "Не могу ходить",
    "Hubo golpe fuerte o no puedo apoyar": "Был сильный удар или не могу опираться",
    "Sí, golpe leve": "Да, легкий удар",
    "Si, golpe leve": "Да, легкий удар",
    "Sí, golpe fuerte o deformidad": "Да, сильный удар или деформация",
    "Si, golpe fuerte o deformidad": "Да, сильный удар или деформация",
    "Sí, fiebre baja": "Да, невысокая температура",
    "Si, fiebre baja": "Да, невысокая температура",
    "Sí, fiebre alta o escalofrios": "Да, высокая температура или озноб",
    "Si, fiebre alta o escalofrios": "Да, высокая температура или озноб",
}

RU_REPLACEMENTS = (
    ("Te recomiendo consulta con traumatologia en policlinico.", "Рекомендую консультацию травматолога в поликлинике."),
    ("Te recomiendo consulta con traumatologia en policlínico.", "Рекомендую консультацию травматолога в поликлинике."),
    ("Te recomiendo consulta con traumatología en policlinico.", "Рекомендую консультацию травматолога в поликлинике."),
    ("Te recomiendo consulta con traumatología en policlínico.", "Рекомендую консультацию травматолога в поликлинике."),
    ("Te recomiendo consulta c traumatologia в policlinico.", "Рекомендую консультацию травматолога в поликлинике."),
    ("Te recomiendo consulta с traumatologia в policlinico.", "Рекомендую консультацию травматолога в поликлинике."),
    (
        "Segun tus respuestas, el caso parece de riesgo bajo.",
        "По вашим ответам случай похож на низкий риск.",
    ),
    (
        "Segun tus respuestas, el caso parece de riesgo medio.",
        "По вашим ответам случай похож на средний риск.",
    ),
    (
        "Segun tus respuestas, el caso parece de riesgo alto.",
        "По вашим ответам случай похож на высокий риск.",
    ),
    (
        "Según tus respuestas, el caso parece de riesgo bajo.",
        "По вашим ответам случай похож на низкий риск.",
    ),
    (
        "Según tus respuestas, el caso parece de riesgo medio.",
        "По вашим ответам случай похож на средний риск.",
    ),
    (
        "Según tus respuestas, el caso parece de riesgo alto.",
        "По вашим ответам случай похож на высокий риск.",
    ),
    ("Se recomienda", "Рекомендуется"),
    (
        "Si los sintomas aumentan, aparece fiebre, dolor intenso, dificultad para respirar, sangrado abundante o empeoramiento rapido, acude a urgencias.",
        "Если симптомы усиливаются, появляется температура, сильная боль, затруднение дыхания, обильное кровотечение или быстрое ухудшение, обратитесь в неотложную помощь.",
    ),
    (
        "Si los síntomas aumentan, aparece fiebre, dolor intenso, dificultad para respirar, sangrado abundante o empeoramiento rápido, acude a urgencias.",
        "Если симптомы усиливаются, появляется температура, сильная боль, затруднение дыхания, обильное кровотечение или быстрое ухудшение, обратитесь в неотложную помощь.",
    ),
    ("Institución verificada para Kursk.", "Проверенное учреждение для Курска."),
    ("Servicios confirmados en el informe:", "Услуги, подтвержденные в отчете:"),
    (
        "coincide con el tipo de atencion recomendado",
        "соответствует рекомендованному типу помощи",
    ),
    (
        "coincide con el tipo de atención recomendado",
        "соответствует рекомендованному типу помощи",
    ),
    ("tipo ", "тип: "),
    ("servicio ", "услуга: "),
    ("especialidad ", "специальность: "),
    ("cuenta con urgencias", "есть неотложная помощь"),
)

RU_WORD_REPLACEMENTS = (
    (r"\bTe recomiendo\b", "Рекомендую"),
    (r"\bte recomiendo\b", "рекомендую"),
    (r"\bconsulta [cс] traumatolog[ií]a\b", "консультацию травматолога"),
    (r"\bconsulta con traumatolog[ií]a\b", "консультацию травматолога"),
    (r"\bconsulta traumatolog[ií]a\b", "консультация травматолога"),
    (r"\bconsulta con ginecolog[ií]a\b", "консультацию гинеколога"),
    (r"\bconsulta ginecolog[ií]a\b", "гинекологическая консультация"),
    (r"\bconsulta con cardiolog[ií]a\b", "консультацию кардиолога"),
    (r"\bconsulta cardiolog[ií]a\b", "консультация кардиолога"),
    (r"\bconsulta con oftalmolog[ií]a\b", "консультацию офтальмолога"),
    (r"\bconsulta oftalmolog[ií]a\b", "консультация офтальмолога"),
    (r"\bconsulta con pediatr[ií]a\b", "консультацию педиатра"),
    (r"\bconsulta pediatr[ií]a\b", "консультация педиатра"),
    (r"\bconsulta medicina general\b", "консультация терапевта"),
    (r"\bmedicina general\b", "терапевт"),
    (r"\btraumatolog[ií]a\b", "травматология"),
    (r"\bginecolog[ií]a\b", "гинекология"),
    (r"\bcardiolog[ií]a\b", "кардиология"),
    (r"\boftalmolog[ií]a\b", "офтальмология"),
    (r"\bpediatr[ií]a\b", "педиатрия"),
    (r"\bpolicl[ií]nico\b", "поликлиника"),
    (r"\bhospital\b", "больница"),
    (r"\burgencias\b", "неотложная помощь"),
    (r"\bfarmacia\b", "аптека"),
    (r"\blaboratorio\b", "лаборатория"),
)

RU_CONNECTOR_REPLACEMENTS = (
    (" con ", " с "),
    (" en ", " в "),
    (" o ", " или "),
)

RU_GRAMMAR_REPLACEMENTS = (
    (
        "Рекомендуется Анализ крови с Лаборант в Лаборатория.",
        "Рекомендуется анализ крови у лаборанта в лаборатории.",
    ),
    ("тип Лаборатория", "тип: Лаборатория"),
    ("услуга Анализ крови", "услуга: Анализ крови"),
    ("специальность Лаборант", "специальность: Лаборант"),
)


def translate_text(value: str | None, locale: str) -> str | None:
    if value is None or locale != "ru":
        return value

    translated = RU_TRANSLATIONS.get(value)
    if translated:
        return translated

    translated = value
    for source, replacement in RU_REPLACEMENTS:
        translated = translated.replace(source, replacement)
    for source, replacement in sorted(
        RU_TRANSLATIONS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        translated = translated.replace(source, replacement)
    for source, replacement in RU_WORD_REPLACEMENTS:
        translated = re.sub(source, replacement, translated, flags=re.IGNORECASE)
    for source, replacement in RU_CONNECTOR_REPLACEMENTS:
        translated = translated.replace(source, replacement)
    for source, replacement in RU_GRAMMAR_REPLACEMENTS:
        translated = translated.replace(source, replacement)
    return translated


def has_cyrillic_text(value: str) -> bool:
    return any("а" <= char.lower() <= "я" or char == "ё" for char in value)


def extract_russian_official_name(raw_data: dict[str, Any] | None) -> str | None:
    if not raw_data:
        return None

    official_name = raw_data.get("official_name")
    if not isinstance(official_name, str) or not has_cyrillic_text(official_name):
        return None

    return official_name.split(" / ", 1)[0].strip()


def localize_working_hours(value: str | None, locale: str) -> str | None:
    if value is None or locale != "ru":
        return value

    replacements = (
        ("Mo-Su", "Пн-Вс"),
        ("Mo-Sa", "Пн-Сб"),
        ("Mo-Fr", "Пн-Пт"),
        ("24/7", "Круглосуточно"),
    )
    localized = value
    for source, replacement in replacements:
        localized = localized.replace(source, replacement)
    return localized


def localize_chat_response(response: ChatResponse, locale: str) -> ChatResponse:
    if locale == "es":
        return response

    localized = response.model_copy(deep=True)
    localized.message = translate_text(localized.message, locale) or localized.message
    localized.health_need_name = translate_text(localized.health_need_name, locale)
    localized.recommended_service = translate_text(
        localized.recommended_service,
        locale,
    )
    localized.recommended_specialty = translate_text(
        localized.recommended_specialty,
        locale,
    )
    localized.recommended_institution_type = translate_text(
        localized.recommended_institution_type,
        locale,
    )
    localized.explanation = translate_text(localized.explanation, locale)
    localized.supported_needs = [
        translate_text(need, locale) or need for need in localized.supported_needs
    ]

    for question in localized.questions:
        question.question_text = (
            translate_text(question.question_text, locale) or question.question_text
        )
        for option in question.answer_options:
            option.option_text = (
                translate_text(option.option_text, locale) or option.option_text
            )

    localized.recommendations = [
        localize_medical_center_public(center, locale)
        for center in localized.recommendations
    ]
    return localized


def localize_chat_payload(
    payload: dict[str, Any] | None, locale: str
) -> dict[str, Any] | None:
    if not payload or locale == "es":
        return payload

    try:
        response = ChatResponse.model_validate(payload)
    except Exception:
        return payload
    return localize_chat_response(response, locale).model_dump(mode="json")


def localize_medical_center_public(
    center: MedicalCenterPublic,
    locale: str,
) -> MedicalCenterPublic:
    if locale == "es":
        return center

    localized = center.model_copy(deep=True)
    localized.name = (
        extract_russian_official_name(localized.raw_data)
        or translate_text(localized.name, locale)
        or localized.name
    )
    localized.institution_type_name = translate_text(
        localized.institution_type_name,
        locale,
    )
    localized.description = translate_text(localized.description, locale)
    localized.working_hours = localize_working_hours(
        localized.working_hours,
        locale,
    )
    localized.price_level = translate_text(localized.price_level, locale)
    localized.main_services = [
        translate_text(service, locale) or service
        for service in localized.main_services
    ]
    localized.main_specialties = [
        translate_text(specialty, locale) or specialty
        for specialty in localized.main_specialties
    ]
    localized.recommendation_reason = translate_text(
        localized.recommendation_reason,
        locale,
    )
    return localized


def localize_medical_centers_public(
    centers: MedicalCentersPublic,
    locale: str,
) -> MedicalCentersPublic:
    if locale == "es":
        return centers
    return MedicalCentersPublic(
        data=[
            localize_medical_center_public(center, locale) for center in centers.data
        ],
        count=centers.count,
    )
