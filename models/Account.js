const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
    accountNumber: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    balance: { type: Number, default: 0 },
    dailyWithdrawalLimit: { type: Number, required: true },
    withdrawalAmountToday: { type: Number, default: 0 },
    transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }]
});

module.exports = mongoose.model('Account', AccountSchema);