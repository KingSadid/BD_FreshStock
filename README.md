#  FreshStock - Sistema de Gestión de Inventarios con PEPS y Pipeline ETL

FreshStock es una aplicación web inteligente diseñada para la gestión optimizada de inventarios, optimizando el control de stock y de caducidades a través del método **PEPS (Primero en Entrar, Primero en Salir / FIFO)** y un motor analítico en tiempo real. 

El sistema recolecta datos analíticos interactivos y de auditoría en la nube utilizando **Firebase Firestore (NoSQL)** y, mediante un panel de control administrativo, ejecuta un **proceso ETL (Extracción, Transformación y Carga)** robusto y seguro que sincroniza la información consolidada en una base de datos relacional **MySQL**.

---

##  Instrucciones de Configuración de Firebase 

De acuerdo con las **buenas prácticas de ciberseguridad en la industria de desarrollo de software**, las credenciales de conexión y llaves privadas no se suben a repositorios públicos o privados de Git (configuración aplicada en el archivo `.gitignore` para omitir `env/freshstock_key.json`).

Para evaluar y ejecutar el proceso ETL de forma exitosa,  tiene **dos alternativas simples** de configuración:

### Opción A: Configuración Local mediante Archivo JSON (Recomendada)
Para correr la aplicación en tu entorno de desarrollo local con tu propia base de datos de Firebase:

1. Ve a la **[Consola de Firebase](https://console.firebase.google.com/)** y crea o selecciona tu proyecto.
2. Ve a la **Configuración del proyecto (Project Settings)** haciendo clic en el engranaje `⚙️` al lado de *Project Overview*.
3. Accede a la pestaña **Cuentas de servicio (Service Accounts)**.
4. Selecciona **Node.js** y haz clic en **Generar nueva clave privada (Generate new private key)**. Esto descargará un archivo `.json` con tus credenciales.
5. En la raíz del proyecto FreshStock local, crea una carpeta llamada `env` (si no existe aún).
6. Guarda tu archivo descargado dentro de esta carpeta con el nombre exacto de **`freshstock_key.json`** (`env/freshstock_key.json`).
7. ¡Listo! El backend detectará el archivo de manera automática y transparente al iniciar.

### Opción B: Configuración mediante Variable de Entorno
Ideal si deseas desplegar la aplicación en la nube (Render, Heroku, Vercel, etc.) o si prefieres no crear archivos locales:

1. Crea una variable de entorno en tu sistema operativo o plataforma de hosting:
   - **Nombre**: `FIREBASE_SERVICE_ACCOUNT`
   - **Valor**: *(Pega todo el contenido de tu archivo JSON descargado en una sola línea de texto plano)*.
2. El backend de FreshStock leerá esta variable con prioridad antes de buscar el archivo local, permitiendo un despliegue seguro sin exponer claves en el código.

---

##  Guía de Instalación y Ejecución Local

Sigue estos sencillos pasos para levantar el entorno completo del proyecto en tu máquina:

### 1. Prerrequisitos
* Tener instalado **Node.js** (versión 18 o superior recomendada).
* Tener un servidor local de **MySQL** activo (como XAMPP, Laragon o MySQL Installer).

### 2. Configurar la Base de Datos MySQL
1. Entra a tu cliente de base de datos MySQL favorito (phpMyAdmin, DBeaver, MySQL Workbench, etc.).
2. Crea una base de datos limpia ejecutando:
   ```sql
   CREATE DATABASE IF NOT EXISTS freshstock;
   ```
3. Importa o ejecuta el script de base de datos completo que se encuentra en la raíz del proyecto:
   [freshstock_schema.sql](file:///c:/dev/BD_FreshStock/freshstock_schema.sql). Esto creará las tablas necesarias (usuarios, lotes, movimientos, alertas de caducidad, auditorías) y poblará las tablas maestras.
4. Configura tus datos de conexión a MySQL (host, usuario, contraseña) en el archivo de configuración ubicado en:
   [env/mysqlConfig.js](file:///c:/dev/BD_FreshStock/env/mysqlConfig.js).

### 3. Instalar Dependencias
Abre tu terminal en la carpeta raíz del proyecto y ejecuta:
```bash
npm install
```

### 4. Iniciar la Aplicación
Arranca el servidor de desarrollo:
```bash
node server.js
```
El servidor backend iniciará y mostrará los siguientes enlaces:
```text
 FreshStock Server running in http://localhost:5000
 Dashboard: http://localhost:5000
 API Endpoint: http://localhost:5000/api
```

### 5. Acceso para Evaluación
Abre tu navegador e ingresa a `http://localhost:5000`. Puedes ingresar utilizando las siguientes credenciales de administrador pre-sembradas en MySQL:
* **Correo electrónico**: `sadid@freshstock.com` (o `admin@freshstock.com`)
* **Contraseña**: `123456` (o la contraseña configurada al registrarte en la pantalla de registro).

Una vez dentro como **Administrador**, verás el botón **"Ejecutar ETL"** en la esquina superior derecha de la pantalla principal. Al hacer clic, se activará el pipeline de integración real extrayendo los eventos analíticos desde Firebase y migrándolos de forma robusta e inteligente a tus tablas locales de MySQL.

---

##  Arquitectura y Tecnologías
* **Backend**: Node.js, Express.
* **Base de Datos Relacional**: MySQL (para control de inventarios inmutables, compras, ventas y auditoría).
* **Base de Datos NoSQL**: Firebase Firestore (para almacenamiento rápido de eventos analíticos del frontend y auditoría de accesos).
* **Frontend**: Single Page Application (SPA) responsiva con HTML5 semántico, CSS3 moderno y Javascript de alta velocidad.
* **Seguridad**: Autenticación mediante JSON Web Tokens (JWT) y encriptación de contraseñas con bcryptjs.
