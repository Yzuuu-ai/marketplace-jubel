const Product = require('../models/Product');

exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        const games = await Product.distinct('game');
        res.json({ categories, games });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
