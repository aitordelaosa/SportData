const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = model('CartItem', cartItemSchema);
