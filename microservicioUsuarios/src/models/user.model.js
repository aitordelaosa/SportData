const mongoose = require('mongoose');
const { USER_ROLES, DEFAULT_USER_ROLE } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    direccion: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    rol: {
      type: String,
      enum: USER_ROLES,
      default: DEFAULT_USER_ROLE,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'fechaRegistro',
      updatedAt: 'fechaActualizacion',
    },
    versionKey: false,
  },
);

const User = mongoose.model('Usuario', userSchema);

module.exports = User;
