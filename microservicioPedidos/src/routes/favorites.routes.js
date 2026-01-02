const express = require('express');
const Favorite = require('../models/Favorite');
const { authenticate } = require('../middleware/auth');
const { getProduct } = require('../utils/productClient');

const router = express.Router();

async function enrichFavorites(favs) {
  return Promise.all(
    favs.map(async (fav) => {
      try {
        const product = await getProduct(fav.productId);
        return { ...fav.toObject(), product };
      } catch (error) {
        return { ...fav.toObject(), product: null };
      }
    }),
  );
}

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const favs = await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const data = await enrichFavorites(favs);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: 'productId requerido' });
    }
    const favorite = await Favorite.findOneAndUpdate(
      { userId: req.user.id, productId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return res.status(201).json({ data: favorite });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    await Favorite.deleteOne({ userId: req.user.id, productId });
    res.json({ data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
