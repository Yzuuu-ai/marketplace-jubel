const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const web3 = require('../utils/web3'); // anggap ada setup Web3 di sini

exports.createTransaction = async (req, res) => {
    try {
        const { productId, txHash } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.status !== 'active') return res.status(400).json({ error: 'Product is not available' });

        // Verify transaction on blockchain (optional)
        let txReceipt = null;
        if (txHash) {
            txReceipt = await web3.eth.getTransactionReceipt(txHash);
            if (!txReceipt) return res.status(400).json({ error: 'Transaction not found on blockchain' });
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
};

exports.getUserTransactions = async (req, res) => {
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
};

exports.updateTransactionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        if (transaction.seller.toString() !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });

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
};
