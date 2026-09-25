# SoftCom - SnowPoint Healthcare (Consultora en Salud)

Este es el repositorio oficial de **SoftCom**, la plataforma corporativa de Gestión Documental, Trazabilidad de Proyectos y Correspondencia adaptada exclusivamente para **SnowPoint Healthcare - Consultora en Salud**.

---

## 🏥 Funcionalidades y Línea Gráfica

1. **Identidad Corporativa**: Incorporación de los logos y visuales de SnowPoint Healthcare (`MKT-3.jpg` e `image_e13e0a4c.jpg`), con una paleta de colores azul zafiro, cian corporativo y verde salud.
2. **Cuenta Única de Administrador**: El sistema inicia preconfigurado con una única cuenta maestra (`admin`), lista para dar de alta a todos los consultores médicos, auditores y especialistas.
3. **Módulo de Gestión de Consultores y Personal**: El Administrador puede crear nuevos usuarios en cualquier momento (auditores médicos, consultores de calidad hospitalaria, asesores legales, directores de proyecto), asignándoles su especialidad y departamento.
4. **Flujo de Proyectos y Dictámenes**: Recepción, derivación, dictamen técnico y archivo de proyectos de consultoría y correspondencia con clínicas, hospitales e instituciones clientes.
5. **Firma Digital en Salud**: Validación y auditoría de documentos y reportes firmados digitalmente (.bo / PAdES).

---

## 🔑 Cuenta Única de Administrador Inicial

Para ingresar por primera vez al sistema e iniciar la creación de los consultores y personal:

* **Usuario**: `admin`
* **Contraseña**: `SnowPoint2026!`
* **Nombre**: Administrador de Sistemas
* **Cargo**: Administrador General de Plataforma
* **Área**: Sistemas y Tecnologías en Salud (TI)
* **Rol**: Administrador General (`ADMIN`)

---

## 👨‍⚕️ Cómo Registrar Consultores en el Sistema

1. Inicia sesión con la cuenta de administrador (**`admin`**).
2. En el menú lateral izquierdo, haz clic en **"Gestión de Personal & Consultores"**.
3. Presiona el botón **"Crear Nuevo Consultor / Usuario"**.
4. Completa los datos:
   * **Nombre Completo** (ej. *Dr. Roberto Morales*, *Lic. Claudia Beltrán*).
   * **Cargo / Especialidad** (ej. *Auditor Médico Principal*, *Consultora en Calidad Hospitalaria*).
   * **Área / Departamento** (ej. *Consultoría y Auditoría Médica*, *Gestión de Calidad*, *Dirección Ejecutiva*).
   * **Nombre de Usuario** (ej. *rmorales*, *cbeltran*).
   * **Correo Electrónico** y **Contraseña Inicial**.
   * **Rol en el Sistema** (`PERSONAL_HOSPITALARIO`, `ADMISION_ARCHIVO`, `DIRECCION`, `ADMIN`).
5. Haz clic en **"Guardar y Activar Consultor"**.
   * El usuario quedará inmediatamente habilitado para acceder desde cualquier equipo de la red y gestionar expedientes.

---

## 🖥️ Instalación y Despliegue en Microsoft Windows Server

1. Descarga y descomprime el archivo **`SoftCom-SnowPoint-Healthcare-WindowsServer.zip`** en tu servidor.
2. Haz clic derecho sobre **`1-INSTALAR-EN-SERVIDOR.bat`** y selecciona **"Ejecutar como Administrador"**.
3. Para iniciar SoftCom:
   * **Inicio Rápido**: Haz doble clic en **`2-INICIAR-SOFTCOM.bat`** (Acceso: `http://localhost:4000`).
   * **Servicio Permanente en Segundo Plano**: Haz clic derecho en **`3-CONFIGURAR-SERVICIO-WINDOWS.bat`** y selecciona *"Ejecutar como Administrador"*.

---

## 📄 Generación de Hojas de Ruta y Dictámenes en PDF

El sistema genera dinámicamente reportes oficiales en PDF con membrete de **SnowPoint Healthcare - Consultora en Salud**, cuadrícula de derivaciones y sellos de trazabilidad listos para archivo o entrega a clientes.
