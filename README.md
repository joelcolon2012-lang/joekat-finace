# JOEKAT FINACE 💙
### *Together for a brighter tomorrow*

**JOEKAT FINACE** es una aplicación móvil nativa y completa de finanzas familiares compartidas, diseñada y optimizada para **Joel y Kat**. Permite administrar conjuntamente ingresos, gastos, presupuestos, gastos fijos, balances automáticos, metas de ahorro, salud financiera y reportes descargables en PDF y CSV.

---

## 🎨 Identidad Visual y Paleta Oficial

La aplicación utiliza la identidad del logotipo suministrado y su sistema cromático oficial:

| Token | Código HEX | Rol en la Interfaz |
| :--- | :--- | :--- |
| **Azul Noche Profundo** | `#001D39` | Encabezados, fondos nocturnos, navegación y elementos hero |
| **Azul Profundo** | `#0A4174` | Botones de interacción principal y enlaces |
| **Azul Medio** | `#49769F` | Elementos secundarios y series de gráficos |
| **Azul Petróleo Claro** | `#4E8EA2` | Categorías secundarias y chips informativos |
| **Azul Grisáceo** | `#6EA2B3` | Información auxiliar, bordes y separadores |
| **Azul Cielo** | `#7BBDE8` | Acentos, indicadores positivos y ahorro |
| **Azul Muy Claro** | `#BDD8E9` | Fondos de tarjetas suaves y estados activos |

---

## 🚀 Arquitectura y Tecnologías

- **Frontend Móvil**: React Native + Expo (SDK 57) + TypeScript estricto.
- **Base de Datos & Backend**: PostgreSQL mediante **Supabase** con Row Level Security (RLS).
- **Autenticación**: Supabase Auth (correo/contraseña) + Conmutador ágil de perfiles familiares.
- **Sincronización en Tiempo Real**: Supabase Realtime + Caché local persistente con AsyncStorage (modo sin conexión / offline-first).
- **Gestión de Estado**: Zustand con persistencia atómica.
- **Gráficos Financieros**: Gráficos nativos de alto rendimiento con `react-native-svg` (barras, evolución de líneas, donut de categorías, histórico de ahorro y comparativas).
- **Generación de Reportes**: `expo-print` (PDF corporativo ejecutivo) y `expo-sharing` (compartir nativo por WhatsApp, Correo, AirDrop, etc.).
- **Exportación CSV**: Descarga directa compatible con Microsoft Excel.
- **Seguridad Biométrica**: `expo-local-authentication` (Face ID en iPhone y lector de huellas en Android).

---

## 📱 Módulos y Funcionalidades

1. **Onboarding & Bienvenida**:
   - 3 pantallas de introducción con el logotipo oficial y el lema: *"Together for a brighter tomorrow"*, *"Tus finanzas. Un solo lugar."*, *"Construyan juntos el futuro que quieren."*
2. **Dashboard Hero**:
   - Saludo inteligente contextual (*"Buenos días, Joel"* / *"Buenas tardes, Kat"*).
   - Balance disponible calculado en tiempo real en Pesos Dominicanos (`RD$`).
   - 3 tarjetas dinámicas: **INGRESOS**, **GASTOS**, **AHORRO**.
   - Comparativa automática: *"Este mes gastaron un 12% menos que el mes anterior."*
3. **Botón Rápido Central (+)**:
   - Registro ultra rápido de movimientos en 1 toque.
   - Categorías preconfiguradas para ingresos y gastos.
   - Selector de persona (Joel / Kat).
   - Posibilidad de adjuntar foto del recibo físico.
   - Selector de periodicidad para movimientos recurrentes (Semanal, Quincenal, Mensual, Anual).
4. **Gastos Fijos**:
   - Monitoreo de servicios y obligaciones (Alquiler, Internet, Electricidad, Seguros, etc.).
   - Estados: `PAGADO`, `PENDIENTE`, `PRÓXIMO` según el día habitual de corte.
   - Botón de 1 toque para marcar como pagado y registrar automáticamente el gasto.
5. **Presupuestos Mensuales**:
   - Límites asignados por categoría (ej. Supermercado RD$ 18,000).
   - Barra de progreso visual con semáforo de alerta: *Dentro del presupuesto*, *Cerca del límite*, *Presupuesto superado*.
6. **Metas de Ahorro**:
   - Objetivos específicos: *Vacaciones*, *Inicial de Vivienda*, *Fondo de Emergencia*.
   - Botón de aporte directo con registro del miembro que aportó.
7. **Cuentas Financieras**:
   - Cuentas individuales y compartidas (Cuenta Conjunta, Cuenta Joel, Cuenta Kat, Efectivo, Tarjeta de Crédito, Cuenta de Ahorro).
   - Transferencias directas entre cuentas con actualización automática de balances.
8. **Balance & Analítica (5 Gráficos)**:
   - Gráfico 1: Ingresos vs Gastos con balance neto.
   - Gráfico 2: Evolución histórica mensual (Ene, Feb, Mar, Abr, May, Jun, Jul, Ago, Sep).
   - Gráfico 3: Distribución de gastos por categoría (gráfico circular Donut).
   - Gráfico 4: Ahorro generado mes a mes.
   - Gráfico 5: Comparativa visual Mes Actual vs Mes Anterior con variaciones %.
   - Diagnóstico automatizado en texto.
9. **Salud Financiera Familiar (0 a 100)**:
   - Calificación algorítmica (ej. *82/100 - MUY BUENA*) calculada sobre 4 factores clave: Tasa de ahorro, Relación ingreso/gasto, Carga de gastos fijos y Disciplina presupuestaria.
10. **Historial & Buscador Global**:
    - Agrupación cronológica (*Hoy*, *Ayer*, fechas pasadas).
    - Búsqueda por concepto, persona o monto (ej. `> 5000`).
    - Filtros por persona (Joel / Kat), tipo de movimiento y categoría.
    - Opciones de duplicar y eliminar movimientos.
11. **Reporte Mensual, PDF y CSV**:
    - Resumen del mes con cierre fotográfico (*Cerrar Mes*).
    - Descarga y compartir de reporte en PDF de diseño corporativo.
    - Exportación de la base de datos a formato CSV/Excel.
12. **Modo Claro y Modo Oscuro**:
    - Alternancia completa entre modo claro y modo noche profundo (`#001D39`).

---

## 🛠️ Instalación y Ejecución Local

### 1. Requisitos Previos
- Node.js (v18 o superior).
- Expo CLI (`npx expo`).

### 2. Configuración de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Configura tus credenciales de Supabase (opcional para pruebas locales; la app incluye modo privado con almacenamiento local persistente activo por defecto):
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key-aqui
```

### 3. Configuración de la Base de Datos en Supabase
1. Ingresa a tu panel en [Supabase](https://supabase.com).
2. Abre el **SQL Editor**.
3. Copia y ejecuta todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
4. Esto creará todas las tablas con sus índices, políticas de seguridad **Row Level Security (RLS)** y las categorías oficiales del sistema.

### 4. Iniciar la Aplicación

Para probar en el navegador web:
```bash
npm run web
```

Para probar en tu teléfono móvil (iOS o Android) mediante **Expo Go**:
```bash
npx expo start
```
- **En iPhone**: Abre la cámara del iPhone y escanea el código QR que aparecerá en la terminal para abrirlo directamente en la app **Expo Go** (disponible gratis en la App Store).
- **En Android**: Escanea el código QR desde la aplicación **Expo Go**.

---

## 📲 Compilación para iPhone y Android (Descargable)

El proyecto está 100% configurado con `eas.json` y `app.json` para compilar binarios descargables mediante **EAS Build** (Expo Application Services).

### A. Para iPhone (iOS):
1. Instala EAS CLI si aún no lo tienes:
   ```bash
   npm install -g eas-cli
   ```
2. Inicia sesión en tu cuenta de Expo:
   ```bash
   eas login
   ```
3. Genera la versión para iPhone:
   - **Opción 1 (Inmediata y gratuita)**: Abre la app **Expo Go** en tu iPhone y escanea el QR con `npx expo start`. Funciona como una app nativa en el dispositivo.
   - **Opción 2 (Instalador directo en iPhone / Ad Hoc o TestFlight)**:
     ```bash
     eas build -p ios --profile preview
     ```
     Esto generará el enlace para instalar directamente la aplicación en tu iPhone registrado.

### B. Para Android (APK descargable):
Para generar el archivo `.apk` instalable directamente en cualquier teléfono Android:
```bash
eas build -p android --profile preview
```
Al finalizar la compilación en la nube de EAS, recibirás un enlace directo para descargar el archivo `.apk` e instalarlo en el teléfono.

---

## 🔒 Privacidad y Seguridad Familiar
- Toda la base de datos cuenta con políticas **Row Level Security (RLS)** en PostgreSQL que garantizan que únicamente los miembros del hogar (`hh-joel-kat-01`) pueden leer o escribir transacciones.
- El dinero se almacena con el tipo de dato SQL `NUMERIC(14,2)` para evitar cualquier error de redondeo de punto flotante.
- Si no hay conexión o no se configuran las claves de red, la aplicación funciona de forma autónoma almacenando los datos en la memoria segura del dispositivo mediante **AsyncStorage**.

---
*JOEKAT FINACE — Desarrollado para Joel & Kat*
