const { Schema, model } = require('mongoose');

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imagen_url: { type: String },
  },
  { _id: false },
);

const shippingSchema = new Schema(
  {
    nombre: { type: String },
    apellidos: { type: String },
    direccion: { type: String },
    ciudad: { type: String },
    provincia: { type: String },
    pais: { type: String },
    cp: { type: String },
    telefono: { type: String },
    email: { type: String },
    notas: { type: String },
    fechaNacimiento: { type: String },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    method: { type: String, default: 'card' },
    brand: { type: String },
    last4: { type: String },
    holder: { type: String },
    expMonth: { type: String },
    expYear: { type: String },
    country: { type: String },
    remember: { type: Boolean, default: false },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'created' },
    items: { type: [orderItemSchema], default: [] },
    shipping: { type: shippingSchema, default: null },
    payment: { type: paymentSchema, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

module.exports = model('Order', orderSchema);
