const { Router } = require('express');
const passport = require('passport');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { generateToken } = require('../utils/jwt');

const router = Router();

/**
 * POST /api/sessions/register
 * Registra un nuevo usuario
 */
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body;

    // Validar campos requeridos
    if (!first_name || !last_name || !email || !age || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Todos los campos son requeridos'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'El email ya está registrado'
      });
    }

    // Crear carrito para el nuevo usuario
    const newCart = await Cart.create({ products: [] });

    // Crear usuario con contraseña hasheada
    const hashedPassword = User.createHash(password);
    const newUser = await User.create({
      first_name,
      last_name,
      email,
      age,
      password: hashedPassword,
      cart: newCart._id,
      role: 'user'
    });

    // Generar token JWT
    const token = generateToken(newUser);

    // Guardar token en cookie
    res.cookie('currentUser', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.status(201).json({
      status: 'success',
      message: 'Usuario registrado exitosamente',
      payload: {
        id: newUser._id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        age: newUser.age,
        role: newUser.role,
        cart: newUser.cart
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/sessions/login
 * Autentica un usuario y genera token JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas'
      });
    }

    // Validar contraseña
    if (!user.isValidPassword(password)) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = generateToken(user);

    // Guardar token en cookie
    res.cookie('currentUser', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.json({
      status: 'success',
      message: 'Login exitoso',
      payload: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        age: user.age,
        role: user.role,
        cart: user.cart
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/sessions/current
 * Valida el usuario logueado y devuelve sus datos asociados al JWT
 * Usa la estrategia "current" de Passport
 */
router.get('/current', passport.authenticate('current', { session: false }), (req, res) => {
  // Si llegamos aquí, el token es válido y req.user contiene el usuario
  res.json({
    status: 'success',
    payload: {
      id: req.user._id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      age: req.user.age,
      role: req.user.role,
      cart: req.user.cart
    }
  });
});

/**
 * GET /api/sessions/logout
 * Cierra la sesión del usuario eliminando la cookie
 */
router.get('/logout', (req, res) => {
  res.clearCookie('currentUser');
  res.json({
    status: 'success',
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = router;

