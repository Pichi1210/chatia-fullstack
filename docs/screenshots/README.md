# Screenshots and project evidence

Esta carpeta organiza las capturas de pantalla y evidencias visuales del chatbot medico funcionando. Los archivos listados son una guia sugerida para documentar el frontend, backend, Rasa NLU, base de datos y despliegue del sistema.

No se deben incluir credenciales, tokens, claves API, contrasenas, archivos `.env` ni datos personales reales en las capturas.

| Nº | Nombre del archivo | Descripcion | Parte del sistema | Uso recomendado en el informe |
|---:|---|---|---|---|
| 1 | `01-home-page.png` | Captura de la interfaz principal del sistema, donde se observa el punto de entrada del usuario al chatbot medico. | Frontend / chatbot | Presentar la vista inicial del sistema y su acceso principal. |
| 2 | `02-chat-initial-message.png` | Evidencia del mensaje inicial del chatbot, mostrando el inicio formal de la interaccion con el usuario. | Frontend / chatbot | Explicar el comienzo del flujo conversacional. |
| 3 | `03-symptom-input.png` | Captura del usuario introduciendo un sintoma o necesidad de salud en lenguaje natural. | Frontend / chatbot | Ilustrar la entrada de datos clinicos por parte del usuario. |
| 4 | `04-rasa-intent-entity-detection.png` | Evidencia de la integracion con Rasa NLU, mostrando la deteccion de intencion, entidades y necesidad medica asociada. | Rasa NLU | Documentar el procesamiento semantico del mensaje del usuario. |
| 5 | `05-triage-questions.png` | Captura de las preguntas de triaje generadas por el sistema para obtener informacion adicional sobre el caso. | Chatbot / backend | Describir la etapa de recopilacion estructurada de datos clinicos. |
| 6 | `06-final-recommendation.png` | Resultado final del proceso de recomendacion, donde el sistema propone una institucion medica segun los datos introducidos por el usuario. | Chatbot / recomendacion | Mostrar la salida principal del sistema y el resultado esperado para el usuario. |
| 7 | `07-medical-center-card.png` | Captura de una tarjeta de centro medico con datos como nombre, direccion, horario, servicios y especialidades. | Frontend / catalogo medico | Evidenciar la presentacion de instituciones medicas recomendadas. |
| 8 | `08-admin-or-database-view.png` | Vista administrativa o de base de datos donde se observan registros relacionados con centros medicos, servicios o sesiones. | Backend / base de datos | Apoyar la descripcion del almacenamiento y gestion de datos del sistema. |
| 9 | `09-backend-api-response.png` | Respuesta de un endpoint del backend en navegador, Postman o Swagger, mostrando datos estructurados devueltos por la API. | Backend / API | Validar la comunicacion entre frontend, backend y servicios de recomendacion. |
| 10 | `10-docker-containers-running.png` | Evidencia de los contenedores Docker activos necesarios para ejecutar el sistema. | Infraestructura / Docker | Documentar el entorno de ejecucion y la composicion de servicios. |
| 11 | `11-rasa-server-logs.png` | Captura de logs del servidor Rasa donde se observa el procesamiento de mensajes o el estado del servicio NLU. | Rasa NLU / logs | Demostrar la operacion del componente de comprension de lenguaje natural. |
| 12 | `12-coolify-deployment.png` | Captura del despliegue en Coolify, si aplica, mostrando el estado del servicio desplegado. | Deployment / Coolify | Evidenciar la publicacion o preparacion del sistema en entorno de despliegue. |

## Suggested folders

- `chatbot/`: capturas del frontend y del flujo conversacional.
- `backend/`: capturas de API, Swagger, logs y base de datos.
- `rasa/`: capturas de Rasa NLU, deteccion de intenciones, entidades y logs.
- `deployment/`: capturas de Docker, Coolify y estado del despliegue.
