# Hostal Verona — API de sincronización (Node.js + Express + PostgreSQL)

Backend alternativo a Google Apps Script. Usa el **mismo contrato**
que ya habla el frontend (`hostal-verona.html`), así que migrar de uno
a otro es solo cambiar una URL en **⚙ Configuración**.

- `GET  /?action=getAll` → devuelve todas las colecciones guardadas.
- `POST /` con body `{"type": "...", "data": ...}` → guarda/actualiza esa colección.

## 1. Desplegar en GitHub

```bash
cd hostal-verona-server
git init
git add .
git commit -m "Backend Hostal Verona"
```

Crea un repositorio nuevo en [github.com/new](https://github.com/new)
(puede ser privado) y luego:

```bash
git remote add origin https://github.com/TU_USUARIO/hostal-verona-api.git
git branch -M main
git push -u origin main
```

## 2. Desplegar en Railway

1. Entra a [railway.app](https://railway.app) e inicia sesión con tu cuenta de GitHub.
2. **New Project → Deploy from GitHub repo** → elige el repositorio que acabas de subir.
3. Railway detecta `package.json` automáticamente (o puede usar el `Dockerfile` incluido) y lo construye solo.
4. **Agrega la base de datos:** en el mismo proyecto, clic en **+ New → Database → Add PostgreSQL**. Railway crea la variable `DATABASE_URL` automáticamente y la conecta a tu servicio — no necesitas copiarla a mano.
5. Ve a la pestaña **Settings** del servicio → **Networking → Generate Domain**. Esto te da una URL pública como:
   `https://hostal-verona-api-production.up.railway.app`
6. Verifica que funciona abriendo esa URL en el navegador: debería responder `{"ok":true,"mensaje":"Hostal Verona API activa"}`.

## 3. Conectar el frontend

En la app, entra como **Gerente → ⚙ Configuración**, y en "URL del
script" pega tu dominio de Railway **con una barra "/" al final**:

```
https://hostal-verona-api-production.up.railway.app/
```

Clic en **Guardar y conectar**. Debería verse "en vivo ✓" en el encabezado.

> La barra final importa: el frontend arma las peticiones como
> `URL + '?action=getAll'`, y con la barra queda
> `.../?action=getAll`, que es lo que la ruta raíz (`/`) del servidor espera.

## 4. Variables de entorno (solo para correrlo en tu computadora)

```bash
cp .env.example .env
# edita .env con tu propia cadena de conexión de Postgres
npm install
npm start
```

## Alternativa: desplegar en Hostinger (hosting compartido, sin Railway)

Si tu plan de Hostinger tiene la opción **"Implementar aplicación web"**
(ícono JS, en el mismo menú de "Añadir sitio web"), puedes correr este
backend ahí mismo, sin usar Railway. La diferencia: hosting compartido
normalmente solo ofrece **MySQL** (no PostgreSQL), así que usa la
variante `server-mysql.js` incluida en este mismo repositorio.

1. **Crea la base de datos MySQL:** en hPanel → **Bases de datos → MySQL** → crea una base de datos nueva. Anota el host, usuario, contraseña y nombre de la base — los vas a necesitar.
2. **Sube este repositorio a GitHub** (mismos pasos de la sección 1 de arriba).
3. En hPanel → **Sitios web → Añadir sitio web → Implementar aplicación web** → elige **"Conectar con GitHub"** y selecciona este repositorio.
4. Si te pide un **"archivo de inicio" / "startup file"**, indica `server-mysql.js` (no `server.js`, ese es para la variante Postgres/Railway).
5. En la sección de **variables de entorno** de esa pantalla, agrega las mismas que ves en `.env.example.mysql`:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (con los datos de tu base MySQL del paso 1)
   - `PORT` (el que Hostinger te indique, o 3000 si te deja elegir)
6. Implementa/despliega. Hostinger debería darte una URL (puede ser un subdominio del tipo `algo.hostingersite.com` o una ruta bajo tu dominio).
7. Prueba esa URL en el navegador: debería responder `{"ok":true,"mensaje":"Hostal Verona API activa"}`.
8. En la app (Gerente → ⚙ Configuración) pega esa URL **con "/" al final** y "Guardar y conectar".

## Notas

- Cada vez que hagas `git push` a `main`, Railway (o Hostinger, si conectaste GitHub ahí) vuelve a desplegar automáticamente.
- Los tres backends (Apps Script, este con Postgres/Railway, y la variante MySQL/Hostinger) son **equivalentes**: guardan exactamente la misma estructura de datos y hablan el mismo idioma con el frontend. Puedes usar cualquiera, o cambiar entre ellos después con solo actualizar la URL en Configuración.
