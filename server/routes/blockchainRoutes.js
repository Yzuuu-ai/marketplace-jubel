const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');

router.post('/verify-transaction', blockchainController.verifyTransaction);

module.exports = router;
