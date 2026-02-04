# 🛒 E-commerce API - Backend CoderHouse

API REST de e-commerce desarrollada con Node.js, Express y MongoDB. Implementa arquitectura profesional con patrones de diseño DAO, Repository y Services.

## 📋 Características

- ✅ **Autenticación JWT** con Passport
- ✅ **Patrón Repository** (DAO → Repository → Service)
- ✅ **DTOs** para transferencia segura de datos
- ✅ **Autorización por roles** (admin/user)
- ✅ **Sistema de recuperación de contraseña** con email
- ✅ **Lógica de compra** con tickets y verificación de stock
- ✅ **Paginación, filtros y ordenamiento** de productos
- ✅ **Socket.IO** para actualizaciones en tiempo real

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/jimewaisberg/EntregaFinal-JimenaWaisberg.git
cd EntregaFinal-JimenaWaisberg
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copiar el archivo `.env` y configurar las variables:
```bash
cp .env .env.local  # opcional, para personalizar
```

### 4. Ejecutar la aplicación

**Modo desarrollo (con nodemon):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

**Con base de datos en memoria (para pruebas):**
```bash
USE_IN_MEMORY_DB=true npm start
```

## 🔧 Variables de Entorno

El archivo `.env` contiene las siguientes variables:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `8080` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/ecommerce` |
| `USE_IN_MEMORY_DB` | Usar BD en memoria | `false` |
| `JWT_SECRET` | Clave secreta para JWT | (requerido) |
| `EMAIL_USER` | Email para envío de correos | (requerido para mailing) |
| `EMAIL_PASS` | Contraseña de app de Gmail | (requerido para mailing) |
| `BASE_URL` | URL base de la aplicación | `http://localhost:8080` |

## 📚 Arquitectura

```
src/
├── config/          # Configuraciones (DB, Passport, env)
├── dao/             # Data Access Objects (acceso a MongoDB)
├── dto/             # Data Transfer Objects
├── middlewares/     # Middlewares (autorización)
├── models/          # Modelos de Mongoose
├── repositories/    # Capa Repository
├── routes/          # Rutas de la API
├── services/        # Lógica de negocio
├── utils/           # Utilidades (JWT, etc.)
└── views/           # Vistas Handlebars
```

## 🔐 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin** | Crear, actualizar y eliminar productos |
| **user** | Agregar productos al carrito, realizar compras |

## 📡 Endpoints API

### Sesiones (`/api/sessions`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/register` | Registrar usuario | No |
| POST | `/login` | Iniciar sesión | No |
| GET | `/current` | Obtener usuario actual (DTO) | Sí |
| GET | `/logout` | Cerrar sesión | No |
| POST | `/forgot-password` | Solicitar recuperación | No |
| POST | `/reset-password/:token` | Cambiar contraseña | No |

### Productos (`/api/products`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Listar productos (paginado) | No |
| GET | `/:pid` | Obtener producto | No |
| POST | `/` | Crear producto | Admin |
| PUT | `/:pid` | Actualizar producto | Admin |
| DELETE | `/:pid` | Eliminar producto | Admin |

**Parámetros de consulta para GET /:**
- `limit` - Productos por página (default: 10)
- `page` - Número de página (default: 1)
- `sort` - Ordenar por precio (`asc` o `desc`)
- `query` - Filtrar por categoría (`category:nombre`) o disponibilidad (`status:true`)

### Carritos (`/api/carts`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/` | Crear carrito | No |
| GET | `/:cid` | Obtener carrito | No |
| POST | `/:cid/product/:pid` | Agregar producto | User |
| PUT | `/:cid` | Actualizar carrito completo | User |
| PUT | `/:cid/products/:pid` | Actualizar cantidad | User |
| DELETE | `/:cid/products/:pid` | Eliminar producto | User |
| DELETE | `/:cid` | Vaciar carrito | User |
| POST | `/:cid/purchase` | Finalizar compra | User |

## 🛍️ Lógica de Compra

El endpoint `POST /api/carts/:cid/purchase`:

1. Verifica el stock de cada producto
2. Productos con stock → se descuentan y se agregan al ticket
3. Productos sin stock → permanecen en el carrito
4. Genera un ticket con código único
5. Envía email de confirmación
6. Devuelve el ticket y productos no comprados (si los hay)

**Respuesta exitosa:**
```json
{
  "status": "success",
  "message": "Compra realizada exitosamente",
  "ticket": {
    "code": "uuid-único",
    "purchase_datetime": "2024-01-01T00:00:00.000Z",
    "amount": 150.00,
    "purchaser": "email@ejemplo.com",
    "products": [...]
  },
  "productsNotPurchased": null
}
```

## 🖥️ Vistas

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/register` | Registro de usuario |
| `/forgot-password` | Recuperar contraseña |
| `/reset-password/:token` | Nueva contraseña |
| `/profile` | Perfil del usuario |
| `/products` | Listado de productos |
| `/products/:pid` | Detalle de producto |
| `/carts/:cid` | Detalle del carrito |
| `/realtimeproducts` | Productos en tiempo real (Socket.IO) |

## 🧪 Probar la API

### Con cURL:

```bash
# Registrar usuario
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@test.com","age":25,"password":"123456"}'

# Login
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Obtener usuario actual
curl -b cookies.txt http://localhost:8080/api/sessions/current

# Listar productos
curl http://localhost:8080/api/products

# Listar productos con filtros
curl "http://localhost:8080/api/products?limit=5&page=1&sort=asc&query=category:electronics"
```

## 📧 Configuración de Email (Gmail)

Para habilitar el envío de emails:

1. Activar verificación en 2 pasos en tu cuenta de Google
2. Ir a [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords)
3. Generar una contraseña para "Correo"
4. Usar esa contraseña en `EMAIL_PASS`

## 👩‍💻 Autor

**Jimena Waisberg** - Proyecto Final Backend - CoderHouse

## 📄 Licencia

ISC

