Tienda - Entrega 2 (Handlebars + Socket.IO)
-------------------------------------------

Instalación y ejecución:
1. Instalar dependencias:
   npm install

2. Levantar servidor:
   npm start
   (o npm run dev con nodemon)

3. Abrir en el navegador:
   http://localhost:8080/realtimeproducts

Qué hace:
- Interfaz en /realtimeproducts que actualiza la lista de productos en tiempo real usando WebSockets.
- También existen endpoints HTTP (/api/products) que mantienen la sincronía (emiten eventos).
- Se agregaron validaciones en la creación/edición de productos (title obligatorio; price >= 0; stock entero >= 0).
- Se muestran notificaciones (toasts) en la UI para acciones exitosas o errores.

Endpoints principales:
- GET  /api/products           -> listar productos (opcional ?limit=N)
- GET  /api/products/:pid     -> obtener producto por id
- POST /api/products          -> crear producto (JSON)
- PUT  /api/products/:pid     -> actualizar producto (JSON)
- DELETE /api/products/:pid   -> eliminar producto

Formato ejemplo para POST /api/products (Content-Type: application/json):
{
  "title": "remera",
  "description": "remera azul",
  "code": "C1",
  "price": 45.0,
  "status": true,
  "stock": 10,
  "category": "ropa",
  "thumbnails": "http://a.jpg, http://b.jpg"
}

Notas de validación:
- "title" es obligatorio.
- "price" debe ser número >= 0.
- "stock" debe ser entero >= 0.
- Si un POST o PUT no cumple validación, el servidor responde 400 con un mensaje explicativo.

Pruebas rápidas:
- Crear desde UI: completar formulario en /realtimeproducts -> "Crear producto"
- Crear vía HTTP:
  curl -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d '{"title":"remera","price":45,"stock":10,"category":"ropa"}'
- Borrar:
  curl -X DELETE http://localhost:8080/api/products/<ID>

Fin.
