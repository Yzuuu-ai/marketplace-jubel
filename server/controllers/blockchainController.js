const Web3 = require('web3');
const web3 = new Web3(process.env.INFURA_URL || 'https://mainnet.infura.io/v3/your-project-id');

exports.verifyTransaction = async (req, res) => {
    try {
        const { txHash } = req.body;
        const txReceipt = await web3.eth.getTransactionReceipt(txHash);

        if (!txReceipt) return res.status(404).json({ error: 'Transaction not found' });

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
};
