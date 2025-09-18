// routes/products.router.js
const express = require('express');
const router = express.Router();
const ProductManager = require('../managers/ProductManager');
const pm = new ProductManager('data/products.json');

// GET /api/products/ -> listar todos
router.get('/', async (req, res) => {
  try {
    const all = await pm.getAll();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo productos', details: err.message });
  }
});

// GET /api/products/:pid -> traer producto por id
router.get('/:pid', async (req, res) => {
  try {
    const p = await pm.getById(req.params.pid);
    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo producto', details: err.message });
  }
});

// POST /api/products/ -> agregar producto (id autogenera)
// IMPORTANTE: no permitir id en el body (consigna)
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (body.id !== undefined) {
      return res.status(400).json({ error: 'No enviar id en el body; el id se autogenera' });
    }

    // validaciones mínimas
    if (!body.title || body.price === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: title y price' });
    }

    const newP = await pm.add(body);
    res.status(201).json(newP);
  } catch (err) {
    res.status(500).json({ error: 'Error creando producto', details: err.message });
  }
});

// PUT /api/products/:pid -> actualizar (no tocar id)
router.put('/:pid', async (req, res) => {
  try {
    const pid = req.params.pid;
    const toUpdate = req.body;
    if (toUpdate.id !== undefined && String(toUpdate.id) !== String(pid)) {
      return res.status(400).json({ error: 'No está permitido actualizar el id' });
    }
    const updated = await pm.update(pid, toUpdate);
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando producto', details: err.message });
  }
});

// DELETE /api/products/:pid -> eliminar
router.delete('/:pid', async (req, res) => {
  try {
    const ok = await pm.delete(req.params.pid);
    if (!ok) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando producto', details: err.message });
  }
});

module.exports = router;
