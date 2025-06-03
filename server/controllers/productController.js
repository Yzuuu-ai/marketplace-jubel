const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, category, game, search } = req.query;

        let query = { status: 'active' };

        if (category) query.category = category;
        if (game) query.game = new RegExp(game, 'i');
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { game: new RegExp(search, 'i') }
            ];
        }

        const products = await Product.find(query)
            .populate('seller', 'username reputation')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'username reputation createdAt');

        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            game,
            category,
            price,
            currency,
            gameDetails
        } = req.body;

        const images = req.files ? req.files.map(file => file.filename) : [];

        const product = new Product({
            title,
            description,
            game,
            category,
            price: parseFloat(price),
            currency,
            images,
            seller: req.user.userId,
            gameDetails: JSON.parse(gameDetails || '{}')
        });

        await product.save();
        await product.populate('seller', 'username reputation');

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.seller.toString() !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        ).populate('seller', 'username reputation');

        res.json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.seller.toString() !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });

        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
