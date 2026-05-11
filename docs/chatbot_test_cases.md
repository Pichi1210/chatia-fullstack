# Casos de prueba del chatbot medico

Estos casos validan identificacion de necesidad, preguntas de triaje y recomendacion final con base local de Kursk.

| Caso | Mensaje de prueba | Necesidad esperada | Preguntas esperadas | Servicio esperado | Institucion esperada | Resultado esperado |
| --- | --- | --- | --- | --- | --- | --- |
| Dolor dental | Me duele mucho una muela desde ayer y tengo la encia inflamada. | Dolor dental | Intensidad del dolor o hinchazon facial; fiebre; dificultad para abrir la boca o tragar. | Odontologia o Atencion urgente si el riesgo es alto | Clinica dental o hospital/urgencias si hay signos de alarma | Devuelve preguntas de triaje; al analizar respuestas muestra riesgo bajo/medio/alto, dentista, clinica dental y centros dentales de Kursk. |
| Dolor de rodilla | Me duele la rodilla y esta un poco hinchada, puedo caminar. | Knee pain | Rodilla hinchada; capacidad para caminar; golpe o lesion; fiebre. | Traumatologia | Policlinico o hospital si el riesgo es alto | Recomienda traumatologo; para riesgo medio explica acudir a policlinico y urgencias si no puede caminar, aparece fiebre o empeora. |
| Fiebre y debilidad | Tengo fiebre, debilidad y mucho cansancio desde la noche. | Weakness o General fever | Temperatura alta; duracion; dificultad para respirar; dolor intenso u otros signos de alarma. | Medicina general o Atencion urgente segun riesgo | Policlinico u hospital/urgencias | Identifica fiebre con debilidad, pregunta signos de gravedad y recomienda institucion acorde al riesgo. |
| Dolor en el pecho | Tengo dolor en el pecho y me cuesta respirar. | Dolor en el pecho | Signos de alarma como falta de aire, sudor frio, mareo o dolor hacia brazo/mandibula; duracion; intensidad. | Atencion urgente | Hospital o urgencias | Debe clasificar como riesgo alto o derivar a atencion urgente con explicacion clara de alarma. |
| Vacunacion infantil / tetanos | Mi hijo necesita vacuna y quiero revisar si toca tetanos. | Child vaccination o Tetanus vaccination | Edad; tipo de vacuna; herida reciente si aplica; fiebre o reaccion previa. | Vacunacion | Policlinico o centro de vacunacion | Recomienda vacunacion en institucion publica/local, indicando que tetanos con herida reciente puede requerir atencion prioritaria. |
| Analisis de sangre | Necesito hacerme un analisis de sangre general. | Analisis de laboratorio o necesidad equivalente | Ayuno; indicacion medica; urgencia; tipo de analisis si estan configuradas. | Laboratorio | Laboratorio o policlinico | Devuelve recomendacion de laboratorio con centros que ofrezcan analisis y horario/direccion. |
| Problemas de vision | Veo borroso y me duelen los ojos al leer. | Vision problems | Vision borrosa; dolor ocular; ojo rojo; perdida repentina de vision. | Oftalmologia | Centro oftalmologico | Recomienda oftalmologo en centro oftalmologico; riesgo alto si hay perdida repentina de vision o dolor intenso. |
| Sangrado menstrual prolongado | Llevo muchos dias con sangrado menstrual y me siento debil. | Prolonged menstrual bleeding | Sangrado abundante; mareos/debilidad/palidez; dolor bajo abdominal; posibilidad de embarazo; coagulos grandes. | Ginecologia o Atencion urgente si riesgo alto | Policlinico, clinica ginecologica u hospital/urgencias | Debe mostrar triaje completo y explicar que sangrado abundante con debilidad o embarazo posible requiere urgencias. |
| Dolor abdominal | Me duele el abdomen desde esta manana y tengo nauseas. | Abdominal pain | Intensidad; localizacion; fiebre; vomitos; embarazo posible; duracion. | Medicina general o Atencion urgente segun riesgo | Policlinico u hospital/urgencias | Recomienda evaluacion medica; riesgo alto si dolor fuerte, fiebre, vomitos persistentes o empeoramiento. |
| Compra de medicamentos | Necesito comprar medicamentos para la gripe cerca de Kursk. | Pharmacy need | Medicamento requerido; receta si aplica; signos de alarma si se describe enfermedad. | Farmacia | Farmacia | Recomienda farmacias locales, muestra publico/privado, direccion, telefono, horario, rating y urgencias no si no aplica. |

## Validacion comun

Para cada respuesta final debe verificarse que el JSON incluya:

```json
{
  "message": "string",
  "risk_level": "low | medium | high",
  "risk_score": 0,
  "recommended_service": "string",
  "recommended_specialty": "string",
  "recommended_institution_type": "string",
  "explanation": "string",
  "questions": [],
  "recommendations": []
}
```

Cada tarjeta de centro medico debe mostrar nombre, tipo de institucion, servicios principales, direccion, distrito, telefono, horario, rating, publico/privado y urgencias si/no.
