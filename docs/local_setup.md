# Configuracion local de Chatia

Fecha de preparacion: 2026-05-12.

## Resumen

Chatia es un monorepo con:

- Backend: FastAPI, SQLModel, Alembic y PostgreSQL.
- Frontend: React, TypeScript, Vite, Tailwind y cliente OpenAPI generado.
- Servicios opcionales de desarrollo: Docker Compose, Adminer, Mailcatcher y Traefik.

El flujo recomendado por la plantilla original es Docker Compose, pero en esta PC Docker no estaba disponible y WSL tampoco estaba instalado. Se dejo funcionando una configuracion nativa local con PostgreSQL instalado en Windows, backend en `.venv` y frontend con Bun.

## Herramientas detectadas o instaladas

- Python `3.13.13`: ya estaba instalado. Lo usa el entorno virtual del backend.
- Node.js `24.15.0`: ya estaba instalado. Sirve como runtime auxiliar para herramientas JS.
- `uv` `0.11.13`: instalado con `winget`. Gestiona dependencias Python del backend segun `uv.lock`.
- Bun `1.3.13`: instalado con `winget`. Gestiona dependencias y scripts del frontend segun `bun.lock`.
- PostgreSQL `17.9-3`: instalado con `winget`. Es la base de datos requerida por el backend.

Docker Desktop se intento instalar con `winget`, pero el instalador termino con codigo `4294967291` despues de solicitar permisos de administrador. Ademas, `wsl --status` indico que WSL no esta instalado. Por eso se configuro PostgreSQL nativo en vez de depender de contenedores.

## Configuracion aplicada

### Dependencias Python

Se sincronizo el workspace Python con:

```powershell
uv sync --frozen --package app
```

Esto creo el entorno virtual en:

```text
.venv/
```

Nota: `uv run` tuvo problemas de permisos con la cache de usuario en esta sesion. El entorno esta listo y los comandos verificados usan directamente los binarios de `.venv`.

### Dependencias frontend

Se instalaron las dependencias JS con:

```powershell
bun install --frozen-lockfile
```

El frontend ya tenia `frontend/.env` apuntando al backend local:

```dotenv
VITE_API_URL=http://localhost:8000
MAILCATCHER_HOST=http://localhost:1080
```

### PostgreSQL

Se instalo y quedo corriendo el servicio:

```text
postgresql-x64-17
```

Se configuro para coincidir con el `.env` del proyecto:

```dotenv
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis
```

Acciones realizadas:

- Se cambio la clave del usuario `postgres` a `changethis`.
- Se creo la base de datos `app`.
- Se aplicaron todas las migraciones Alembic.
- Se ejecuto la carga inicial de datos.

Usuario inicial de la aplicacion:

```text
Email: admin@example.com
Password: changethis
```

Estos valores son aceptables solo para desarrollo local. Para staging o produccion deben cambiarse `SECRET_KEY`, `POSTGRES_PASSWORD` y `FIRST_SUPERUSER_PASSWORD`.

## Como correr la aplicacion

Usa dos terminales desde la raiz del repo:

```text
C:\Users\Trabajo\Desktop\diploma-t\proyecto-practico\chatia-fullstack
```

### Terminal 1: backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

Health-check:

```text
http://localhost:8000/api/v1/utils/health-check/
```

### Terminal 2: frontend

```powershell
cd frontend
bun run dev --host 127.0.0.1 --port 5173
```

Frontend:

```text
http://localhost:5173
```

## Verificaciones realizadas

- PostgreSQL responde en `127.0.0.1:5432`.
- La base `app` existe y acepta login con `postgres/changethis`.
- `backend_pre_start.py` pudo conectarse a la base.
- `alembic upgrade head` aplico las migraciones.
- `initial_data.py` creo los datos iniciales.
- El backend respondio `200` con cuerpo `true` en `/api/v1/utils/health-check/`.
- El frontend compilo con `bun run build`.
- El servidor Vite respondio `200` en `http://127.0.0.1:5173/`.

## Funcionalidades externas opcionales

### Yandex Maps

El archivo `.env` no contiene `YANDEX_API_KEY`. Sin esa clave, el backend no puede consultar la API real de Yandex Maps. Para activar busquedas reales, agrega:

```dotenv
YANDEX_API_KEY=tu_api_key
```

Despues reinicia el backend.

### Email local

En Docker Compose el proyecto usa Mailcatcher. En la configuracion nativa no se instalo Mailcatcher. El envio real de email queda desactivado porque `SMTP_HOST` esta vacio en `.env`.

Si luego se completa Docker Desktop + WSL2, el stack completo puede levantarse con:

```powershell
docker compose watch
```

Eso agregaria Adminer, Mailcatcher, Traefik y contenedores para backend/frontend/base de datos.
