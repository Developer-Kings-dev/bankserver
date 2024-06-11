const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true }
});

module.exports = mongoose.model('Transaction', TransactionSchema);