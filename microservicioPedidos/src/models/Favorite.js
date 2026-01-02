const { Schema, model } = require('mongoose');

const favoriteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = model('Favorite', favoriteSchema);
