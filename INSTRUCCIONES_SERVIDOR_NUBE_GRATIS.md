# Guía Oficial: JOEKAT FINACE en la Nube 24/7 Gratis (Sin depender de la PC)

Esta guía resuelve definitivamente el problema de que la aplicación se caiga al apagar la computadora. Al colocarla en **Render.com** (Plan Gratuito), el sistema permanecerá encendido **las 24 horas del día, los 365 días del año**, con enlace seguro HTTPS y sincronización en tiempo real entre los iPhones de Joel y Kath.

---

## 🚀 Pasos para Activarlo en 3 Minutos (100% Gratis)

### Paso 1: Crear el repositorio en GitHub
1. Abre tu navegador y entra a: [https://github.com/new](https://github.com/new)
2. En **Repository name**, escribe exactamente: `joekat-finace`
3. Selecciona **Public** (Público).
4. No marques ninguna otra casilla y haz clic en el botón verde **"Create repository"**.

---

### Paso 2: Subir el Proyecto a GitHub (Elige la opción más fácil para ti)

#### Opción A (La más rápida - 1 Clic):
En tu Escritorio hemos colocado un archivo llamado:
👉 **`PUBLICAR_A_GITHUB.bat`**
Haz doble clic sobre él. Subirá automáticamente todo el proyecto compilado y la base de datos a tu GitHub.

#### Opción B (Manual o Web):
Si prefieres hacerlo por la página web de GitHub:
1. En la página de tu repositorio recién creado, haz clic en **"uploading an existing file"**.
2. Descomprime el archivo **`SUBIR_A_GITHUB_JOEKAT_FINACE.zip`** que te dejamos en tu Escritorio y arrastra todos sus archivos a GitHub.
3. Haz clic en **"Commit changes"**.

---

### Paso 3: Activar el Servidor en Render.com ($0/mes)
1. Entra a tu cuenta en: [https://dashboard.render.com/](https://dashboard.render.com/)
2. Haz clic en el botón azul **"New +"** (arriba a la derecha) y selecciona **"Web Service"**.
3. Selecciona la opción **"Build and deploy from a Git repository"**.
4. Verás en la lista tu repositorio **`joekat-finace`**; haz clic en **"Connect"**.
5. Render detectará automáticamente el archivo `render.yaml` que te dejamos configurado:
   - **Name:** `joekat-finace`
   - **Region:** US East (Ohio) o la más cercana
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `echo "Pre-built dist ready"`
   - **Start Command:** `node server.mjs`
   - **Instance Type:** `Free` ($0/month)
6. Haz clic abajo en **"Create Web Service"**.

---

### Paso 4: ¡Tu Aplicación está Viva en la Nube!
En menos de 1 minuto, Render te dará tu enlace permanente de por vida:
👉 **`https://joekat-finace.onrender.com`**

1. Abre ese enlace desde Safari en el iPhone de **Joel** y en el de **Kath**.
2. En Safari, toca el botón de **Compartir** (el cuadro con la flecha hacia arriba ⬆️).
3. Selecciona **"Agregar a pantalla de inicio"** (Add to Home Screen).
4. Tendrás el ícono elegante de **JOEKAT FINACE** como una aplicación nativa en ambos teléfonos.
5. **¡Listo!** Ya puedes apagar tu computadora por completo. Cualquier gasto, ingreso o meta que registre Joel o Kath se sincronizará al instante en el teléfono del otro.

---

## 🛡️ ¿Cómo se Protegen tus Datos? (Auto-Healing)
- La base de datos actual con todos tus movimientos reales ya está guardada en la nube.
- Además, cada iPhone guarda una copia exacta en su memoria interna (`AsyncStorage`).
- Si el servidor en la nube se llega a reiniciar o actualizar, en el instante en que Joel o Kath abren la aplicación, el iPhone detecta el estado y restaura automáticamente la base de datos completa a la nube sin perder un solo centavo.
- También puedes descargar una copia de seguridad en cualquier momento entrando a:
  `https://joekat-finace.onrender.com/api/sync/backup`

---

## ⚡ Opcional: Evitar que el servidor gratuito se duerma (24/7 Activo)
Los servidores gratuitos de Render se suspenden tras 15 minutos de inactividad para ahorrar energía (y tardan ~30 segundos en despertar cuando alguien entra).
Si quieres que responda **al instante en 1 segundo siempre**:
1. Entra a [https://cron-job.org/](https://cron-job.org/) (Gratis).
2. Crea una cuenta gratuita.
3. Agrega un cron job con tu URL de salud: `https://joekat-finace.onrender.com/api/health`
4. Configúralo cada **10 minutos**.
Con esto, el servidor nunca se dormirá y estará siempre caliente y activo las 24 horas.
