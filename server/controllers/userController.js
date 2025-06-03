const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -email');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const products = await Product.find({ seller: req.params.id, status: 'active' });
        const totalSales = await Transaction.countDocuments({ seller: req.params.id, status: 'completed' });

        res.json({ user, products, totalSales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
