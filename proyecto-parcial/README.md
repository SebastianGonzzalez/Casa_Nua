# Casa Nua

Sistema web de catálogo, gestión de usuarios y compras para una tienda de productos físicos. La aplicación permite a los clientes navegar productos, agregarlos al carrito, confirmar compras y consultar su historial, mientras que el administrador puede gestionar usuarios, productos y ventas desde un panel central.

La aplicación está construida con HTML, CSS y JavaScript puro, sin dependencias externas ni backend real. La persistencia se maneja con `localStorage`, por lo que funciona como una demostración funcional de un sistema de comercio digital en frontend.

## Características principales

- Autenticación y registro de usuarios.
- Roles de administrador y cliente.
- Activación de cuentas pendientes.
- Gestión de productos con creación, edición y eliminación.
- Control de inventario y precios.
- Carrito de compras con cantidades y validaciones.
- Confirmación de compras con actualización de stock.
- Historial de compras por cliente y administrador.
- Vista de detalle de cada compra.
- Validaciones del lado del cliente para mejorar la integridad de los datos.
- Interfaz responsive para desktop y móvil.

## Tecnologías usadas

- HTML5
- CSS3
- JavaScript ES Modules
- LocalStorage para persistencia
- SVG inline para iconos
- Live Server para ejecución local

## Estructura del proyecto

```text
proyecto-parcial/
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── clients.js
│   ├── config.js
│   ├── dashboard.js
│   ├── details.js
│   ├── icons.js
│   ├── products.js
│   ├── profile.js
│   ├── purchase.js
│   ├── purchases.js
│   ├── shell.js
│   ├── storage.js
│   ├── users.js
│   ├── utils.js
│   └── validators.js
├── index.html
├── register.html
├── dashboard.html
├── profile.html
├── users.html
├── clients.html
├── products.html
├── purchase.html
├── purchases.html
├── details.html
├── ENTREGA.md
└── README.md
```

## Flujos principales

### 1. Registro e inicio de sesión

La aplicación inicia en `index.html`, donde el usuario puede iniciar sesión o dirigirse al registro.

En `register.html`, el cliente crea una cuenta con:

- nombre
- apellido
- correo
- contraseña
- confirmación de contraseña

La cuenta se crea con estado pendiente y rol cliente. El administrador luego valida la cuenta desde la vista de usuarios para habilitar el acceso.

### 2. Panel de administración

El administrador entra al dashboard y puede:

- ver estadísticas generales,
- gestionar usuarios,
- revisar solicitudes pendientes,
- crear y editar productos,
- consultar compras registradas,
- revisar inventario y ventas totales.

### 3. Gestión de productos

Desde `products.html` el administrador puede:

- crear un producto,
- editar su nombre, descripción, precio y stock,
- eliminarlo del catálogo si corresponde,
- revisar el inventario disponible.

Cada producto tiene:

- nombre
- descripción
- valor unitario
- stock actual

### 4. Compra por parte del cliente

Desde `purchase.html`, el cliente puede ver el catálogo completo y seleccionar la cantidad de cada producto. Luego el sistema:

- valida que la cantidad sea válida,
- valida que no supere el stock,
- agrega productos al carrito,
- permite cambiar cantidades,
- recalcula el total final.

### 5. Confirmación de la compra

Cuando el cliente confirma la compra, el sistema valida de nuevo los datos y genera:

- un encabezado de compra con fecha y total,
- uno o varios detalles por cada producto agregado,
- un descuento del stock real disponible.

Esto permite que la compra quede registrada con su historial y que el inventario se actualice automáticamente.

### 6. Historial y detalle

Desde `purchases.html` el usuario puede consultar sus compras. En `details.html` se puede ver el detalle de cada compra con:

- cliente
- correo
- fecha
- total
- productos incluidos
- cantidades
- valor unitario histórico
- subtotal por línea

Esto garantiza que el detalle de una compra permanezca consistente aunque el producto cambie de precio o sea eliminado después.

## Roles y permisos

### Administrador

Puede acceder a:

- dashboard
- clientes
- solicitudes de usuarios
- productos
- compras

Tiene permisos para:

- activar o desactivar cuentas,
- asignar roles,
- crear productos,
- editar el inventario,
- revisar todas las ventas.

### Cliente

Puede acceder a:

- dashboard
- perfil
- compra
- historial de compras

No puede acceder a las pantallas administrativas ni manipular datos de otros usuarios.

## Usuarios de demostración

### Administrador

```text
Correo: admin@tienda.local
Contraseña: Admin123!
```

### Cliente

```text
Correo: cliente@tienda.local
Contraseña: Cliente123!
```

## Modelo de datos

La aplicación trabaja con estas entidades principales:

- `login`: credenciales, rol y estado de la cuenta.
- `cliente`: datos personales del cliente.
- `producto`: catálogo con nombre, descripción, precio y stock.
- `encabezado`: cabecera de una compra.
- `detalles`: líneas de cada compra.

### Relaciones

- Un usuario de login puede tener asociado un cliente.
- Un cliente puede tener muchas compras.
- Una compra tiene varios detalles.
- Un producto puede estar presente en varios detalles.

## Persistencia

La aplicación usa `localStorage` para guardar:

- la base de datos de la tienda,
- la sesión del usuario actual,
- los datos generados en demo.

Esto permite que el sistema mantenga su estado al recargar la página sin backend real.

## Validaciones que incluye el sistema

El proyecto valida datos importantes para evitar errores de negocio:

- nombres vacíos
- caracteres inválidos en nombres
- correos inválidos
- contraseñas débiles
- cantidades negativas o fuera de rango
- precios inválidos
- stock insuficiente
- productos duplicados
- compra sin carrito
- compra con cantidades mayores al stock disponible
- acceso no autorizado a páginas
- usuarios pendientes sin acceso

## Reglas del negocio

- Un cliente no puede iniciar sesión si su cuenta está pendiente.
- Un usuario cliente no puede entrar a vistas de administrador.
- Un carrito no puede exceder el stock disponible.
- La compra se confirma solo si todos los datos son válidos.
- El stock se descuenta al confirmar la compra.
- El historial de compra conserva el valor unitario histórico.

## Cómo ejecutar el proyecto

### Opción recomendada

1. Abrir la carpeta del proyecto en VS Code.
2. Instalar la extensión Live Server.
3. Abrir `index.html` con Live Server.

### Requisito importante

Como el proyecto usa módulos ES (`import` / `export`), conviene servirlo como sitio web local y no abrirlo directamente con `file://`.

## Reiniciar la demo

Si quieres volver a un estado limpio, elimina el `localStorage` del sitio desde las herramientas del navegador.

Las claves principales son:

- `parcialCompraDB_v2`
- `parcialCompraSession_v2`

## Alcance del proyecto

Este es un proyecto de demostración académica de frontend. No sustituye un backend real ni un sistema de autenticación segura para producción.

Su objetivo principal es mostrar un flujo completo de ecommerce académico con:

- registro,
- autenticación,
- permisos,
- inventario,
- carrito,
- pagos simulados,
- historial y detalle de compras.

## Conclusión

Casa Nua es una aplicación demo de gestión de tienda en la que el usuario puede interactuar con un catálogo, comprar productos y manejar su historial, mientras el administrador administra usuarios e inventario. El sistema está diseñado para mostrar claramente el funcionamiento de un ecommerce básico con validaciones, control de permisos y persistencia local.
