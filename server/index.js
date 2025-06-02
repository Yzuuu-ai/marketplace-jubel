const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const Web3 = require('web3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gamexchange', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Web3 Setup
const web3 = new Web3(new Web3.providers.HttpProvider(
    process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'
));

// File Upload Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletAddress: { type: String },
    isVerified: { type: Boolean, default: false },
    reputation: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    game: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'ETH' },
    images: [{ type: String }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'sold', 'inactive'], default: 'active' },
    gameDetails: {
        level: String,
        rank: String,
        characters: [String],
        items: [String],
        serverRegion: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    txHash: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'failed', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update wallet address
app.put('/api/auth/wallet', authenticateToken, async (req, res) => {
    try {
        const { walletAddress } = req.body;
        
        await User.findByIdAndUpdate(req.user.userId, { walletAddress });
        
        res.json({ message: 'Wallet address updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Product Routes
app.get('/api/products', async (req, res) => {
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
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'username reputation createdAt');
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', authenticateToken, upload.array('images', 5), async (req, res) => {
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
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.seller.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

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
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.seller.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transaction Routes
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { productId, txHash } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.status !== 'active') {
            return res.status(400).json({ error: 'Product is not available' });
        }

        // Verify transaction on blockchain
        let txReceipt = null;
        if (txHash) {
            try {
                txReceipt = await web3.eth.getTransactionReceipt(txHash);
                if (!txReceipt) {
                    return res.status(400).json({ error: 'Transaction not found on blockchain' });
                }
            } catch (error) {
                console.log('Blockchain verification error:', error.message);
            }
        }

        const transaction = new Transaction({
            buyer: req.user.userId,
            seller: product.seller,
            product: productId,
            amount: product.price,
            currency: product.currency,
            txHash,
            status: txReceipt ? 'confirmed' : 'pending'
        });

        await transaction.save();

        // Update product status if transaction is confirmed
        if (txReceipt) {
            product.status = 'sold';
            await product.save();
        }

        await transaction.populate(['buyer', 'seller', 'product']);

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [
                { buyer: req.user.userId },
                { seller: req.user.userId }
            ]
        })
        .populate('buyer', 'username')
        .populate('seller', 'username')
        .populate('product', 'title game images')
        .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/transactions/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.seller.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        transaction.status = status;
        await transaction.save();

        if (status === 'completed') {
            await Product.findByIdAndUpdate(transaction.product, { status: 'sold' });
        }

        res.json({
            message: 'Transaction status updated successfully',
            transaction
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Categories Route
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        const games = await Product.distinct('game');
        
        res.json({
            categories,
            games
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Profile Routes
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const products = await Product.find({ seller: req.params.id, status: 'active' });
        const totalSales = await Transaction.countDocuments({ seller: req.params.id, status: 'completed' });

        res.json({
            user,
            products,
            totalSales
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Blockchain verification endpoint
app.post('/api/blockchain/verify-transaction', async (req, res) => {
    try {
        const { txHash } = req.body;
        
        const txReceipt = await web3.eth.getTransactionReceipt(txHash);
        
        if (!txReceipt) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({
            status: txReceipt.status ? 'success' : 'failed',
            blockNumber: txReceipt.blockNumber,
            gasUsed: txReceipt.gasUsed,
            from: txReceipt.from,
            to: txReceipt.to
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;