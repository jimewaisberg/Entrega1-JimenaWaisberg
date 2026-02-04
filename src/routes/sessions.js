/**
 * Sessions Router
 * Maneja autenticación, registro y recuperación de contraseña
 */
const { Router } = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
const emailService = require('../services/email.service');
const { generateToken } = require('../utils/jwt');
const UserDTO = require('../dto/user.dto');

const router = Router();

// Obtener configuración
const JWT_SECRET = process.env.JWT_SECRET || 'coderhouse_secret_key_jwt_2024';

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

    // Crear usuario usando el servicio
    const userDTO = await userService.createUser({
      first_name,
      last_name,
      email,
      age,
      password
    });

    // Obtener usuario completo para generar token
    const user = await userService.getUserByEmail(email);
    const token = generateToken(user);

    // Guardar token en cookie
    res.cookie('currentUser', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      status: 'success',
      message: 'Usuario registrado exitosamente',
      payload: userDTO
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Error al registrar usuario'
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

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email y contraseña son requeridos'
      });
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas'
      });
    }

    const isValid = await userService.validatePassword(user, password);
    if (!isValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas'
      });
    }

    const token = generateToken(user);

    res.cookie('currentUser', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      status: 'success',
      message: 'Login exitoso',
      payload: new UserDTO(user)
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
 * Valida el usuario logueado y devuelve DTO (sin info sensible)
 */
router.get('/current', passport.authenticate('current', { session: false }), (req, res) => {
  // Devolver DTO en lugar del usuario completo
  const userDTO = new UserDTO(req.user);
  
  res.json({
    status: 'success',
    payload: userDTO
  });
});

/**
 * GET /api/sessions/logout
 * Cierra la sesión del usuario
 */
router.get('/logout', (req, res) => {
  res.clearCookie('currentUser');
  res.json({
    status: 'success',
    message: 'Sesión cerrada exitosamente'
  });
});

/**
 * POST /api/sessions/forgot-password
 * Envía email con enlace para restablecer contraseña
 * El enlace expira en 1 hora
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'El email es requerido'
      });
    }

    const user = await userService.getUserByEmail(email);
    
    // Por seguridad, siempre respondemos lo mismo aunque el email no exista
    if (!user) {
      return res.json({
        status: 'success',
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token de reset que expira en 1 hora
    const resetToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        type: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enviar email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // En desarrollo, mostrar el token en consola
      if (process.env.NODE_ENV !== 'production') {
        console.log('Token de reset (dev):', resetToken);
      }
    }

    res.json({
      status: 'success',
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al procesar la solicitud'
    });
  }
});

/**
 * POST /api/sessions/reset-password/:token
 * Restablece la contraseña usando el token
 * Valida que no sea la misma contraseña anterior
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'La nueva contraseña es requerida'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        status: 'error',
        message: 'El enlace ha expirado o es inválido. Solicita uno nuevo.'
      });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        status: 'error',
        message: 'Token inválido'
      });
    }

    // Obtener usuario
    const user = await userService.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar contraseña (el servicio valida que no sea la misma)
    try {
      await userService.updatePassword(user._id, password, user.password);
    } catch (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    res.json({
      status: 'success',
      message: 'Contraseña actualizada exitosamente. Redirigiendo al login...'
    });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al restablecer la contraseña'
    });
  }
});

module.exports = router;
