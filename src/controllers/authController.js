const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { validationResult } = require('express-validator');

const authController = {
  // 🔥 Login mejorado con MFA y contraseña temporal
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { usuario, contrasena } = req.body;

      // Buscar usuario
      const user = await User.findByUsername(usuario);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // Verificar si usuario está activo
      if (user.activo !== 'activo') {
        return res.status(401).json({
          success: false,
          message: 'Cuenta de usuario inactiva'
        });
      }

      // 🔥 Verificar si el usuario está bloqueado temporalmente
      if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
        const minutosRestantes = Math.ceil(
          (new Date(user.bloqueado_hasta) - new Date()) / 60000
        );
        return res.status(403).json({
          success: false,
          message: `Usuario bloqueado temporalmente. Intenta en ${minutosRestantes} minuto(s)`
        });
      }

      // Verificar contraseña
      const isValidPassword = await User.verifyContrasena(contrasena, user.contrasena);
      
      if (!isValidPassword) {
        // Incrementar intentos fallidos
        await User.incrementFailedAttempts(user.id);
        
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // 🔥 Resetear intentos fallidos en login exitoso
      await User.resetFailedAttempts(user.id);

      // Remover campos sensibles
      const { contrasena: userPassword, mfa_secreto, ...userWithoutSensitive } = user;

      // 🔥 FLUJO 1: Verificar si tiene contraseña temporal
      if (user.es_temporal) {
        const tempToken = jwt.sign(
          { 
            userId: user.id, 
            step: 'change-password',
            usuario: user.usuario 
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' } // Token temporal para cambio de contraseña
        );

        return res.status(200).json({
          success: true,
          message: 'Debe cambiar su contraseña temporal',
          data: {
            requiresPasswordChange: true,
            userId: user.id,
            token: tempToken,
            user: userWithoutSensitive
          }
        });
      }

      // 🔥 FLUJO 2: Verificar si tiene MFA activo
      if (user.mfa_activo) {
        const tempToken = jwt.sign(
          { 
            userId: user.id, 
            step: 'mfa',
            usuario: user.usuario 
          },
          process.env.JWT_SECRET,
          { expiresIn: '10m' } // Token temporal para MFA
        );

        return res.status(200).json({
          success: true,
          message: 'Código MFA requerido',
          data: {
            requiresMFA: true,
            userId: user.id,
            token: tempToken,
            user: userWithoutSensitive
          }
        });
      }

      // 🔥 FLUJO 3: Login normal (sin MFA ni contraseña temporal)
      const token = jwt.sign(
        {
          id: user.id,
          usuario: user.usuario,
          rol_id: user.rol_id,
          rol_nombre: user.rol_nombre,
          persona_id: user.persona_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Crear sesión
      await Session.create({
        usuario_id: user.id,
        token: token
      });

      // Actualizar último login
      await User.updateLastLogin(user.id);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: userWithoutSensitive,
          token
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      next(error);
    }
  },

  // 🔥 Verificar MFA (ya NO se usa - ahora lo hace el microservicio)
  // Este endpoint se mantiene por compatibilidad pero delega al microservicio
  async verifyMfa(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { tempToken, codigo_mfa } = req.body;

      // Verificar token temporal
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Sesión MFA inválida o expirada'
        });
      }

      if (decoded.step !== 'mfa') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      // Buscar usuario
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // 🔥 NOTA: La verificación MFA real se hace en el microservicio
      // Flutter llama directamente al microservicio MFA
      // Este endpoint genera el token final DESPUÉS de que el microservicio verifica

      // Generar JWT final
      const token = jwt.sign(
        {
          id: user.id,
          usuario: user.usuario,
          rol_id: user.rol_id,
          rol_nombre: user.rol_nombre,
          persona_id: user.persona_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      // Crear sesión
      await Session.create({
        usuario_id: user.id,
        token: token
      });

      // Actualizar último login
      await User.updateLastLogin(user.id);

      // Remover contraseña del response
      const { contrasena: userPassword, mfa_secreto, ...userWithoutSensitive } = user;

      res.json({
        success: true,
        message: 'Verificación MFA exitosa',
        data: {
          user: userWithoutSensitive,
          token
        }
      });

    } catch (error) {
      console.error('Error en verifyMfa:', error);
      next(error);
    }
  },

  // Verificar token actual
  async verify(req, res, next) {
    try {
      // Si llegó aquí, el middleware de auth ya verificó el token
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener información del usuario actual
  async me(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const { contrasena, mfa_secreto, ...userWithoutSensitive } = user;
      
      res.json({
        success: true,
        data: userWithoutSensitive
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout
  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        // Cerrar sesión en la base de datos
        await Session.closeSession(token);
      }
      
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      next(error);
    }
  }
};

module.exports = authController;