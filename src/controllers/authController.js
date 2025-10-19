const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { validationResult } = require('express-validator');

const authController = {
  // Login básico (sin MFA por ahora)
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
          message: 'Invalid credentials'
        });
      }

      // Verificar si usuario está activo
      if (user.activo !== 'activo') {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      // Verificar contraseña
      const isValidPassword = await User.verifyContrasena(contrasena, user.contrasena);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Si tiene MFA activo, pedir código MFA
      if (user.mfa_activo) {
        return res.status(200).json({
          success: true,
          requiresMfa: true,
          message: 'MFA code required',
          tempToken: jwt.sign(
            { userId: user.id, step: 'mfa' },
            process.env.JWT_SECRET,
            { expiresIn: '10m' } // Token temporal para MFA
          )
        });
      }

      // Generar JWT final (sin MFA)
      const token = jwt.sign(
        {
          id: user.id,
          usuario: user.usuario,
          rol_id: user.rol_id,
          rol_nombre: user.rol_nombre,
          persona_id: user.persona_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      await Session.create({
        usuario_id: user.id,
        token: token // El JWT generado
    });

      // Remover contraseña del response
      const { contrasena: userPassword, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      });

    } catch (error) {
      next(error);
    }
  },

  

  // Verificar MFA (para usuarios con MFA activo)
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
          message: 'Invalid or expired MFA session'
        });
      }

      if (decoded.step !== 'mfa') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      // Buscar usuario
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // TODO: Implementar verificación real del código MFA
      // Por ahora simulamos verificación
      const isMfaValid = await verifyMfaCode(user.mfa_secreto, codigo_mfa);
      
      if (!isMfaValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid MFA code'
        });
      }

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
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      await Session.create({
        usuario_id: user.id,
        token: token
      });

      // Remover contraseña del response
      const { contrasena: userPassword, ...userWithoutPassword } = user; // Cambié el nombre aquí también

      res.json({
        success: true,
        message: 'MFA verification successful',
        data: {
          user: userWithoutPassword,
          token
        }
      });

    } catch (error) {
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

  async me(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await req.db.User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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

  // Logout (manejado principalmente en el cliente)
  async logout(req, res, next) {
    try {
      // En un sistema más avanzado, podríamos invalidar el token
      // Pero con JWT stateless, el cliente simplemente elimina el token
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
};

// Función placeholder para verificación MFA (implementar luego)
async function verifyMfaCode(mfaSecret, code) {
  // TODO: Integrar con librería de MFA (como speakeasy, otplib)
  // Por ahora retorna true para testing
  return true;
}

module.exports = authController;