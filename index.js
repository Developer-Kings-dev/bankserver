const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const dBuri = 'mongodb://localhost:27017/simulatebanks';
const port = 2000;
const app = express();
app.use(bodyParser.json());

mongoose.connect(dBuri)
.then(() => {
    console.log('Connected to MongoDB...')
})
.catch((err) => {
    console.log('Failed to connect to MongoDB...', err)
});
  
  // Define models
  const Schema = mongoose.Schema;
  
  const transactionSchema = new Schema({
    type: String,
    amount: Number,
    timestamp: { type: Date, default: Date.now },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  });
  
  const accountSchema = new Schema({
    accountNumber: String,
    firstName: String,
    lastName: String,
    dailyWithdrawalLimit: Number,
    withdrawalAmountToday: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  });
  
  const Transaction = mongoose.model('Transaction', transactionSchema);
  const Account = mongoose.model('Account', accountSchema);
  
  // Fetch all accounts
  app.get('/banks/', async (req, res) => {
    try {
      const accounts = await Account.find().populate('transactions');
      res.status(200).json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Create account
  app.post('/banks/', async (req, res) => {
    const { accountNumber, firstName, lastName, dailyWithdrawalLimit } = req.body;
    try {
      const newAccount = new Account({ accountNumber, firstName, lastName, dailyWithdrawalLimit });
      await newAccount.save();
      res.status(201).json(newAccount);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Fetch single account
  app.get('/banks/:id', async (req, res) => {
    const accountId = req.params.id;
    try {
      const account = await Account.findById(accountId).populate('transactions');
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(200).json(account);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Delete account
  app.delete('/banks/:id', async (req, res) => {
    const accountId = req.params.id;
    try {
      const account = await Account.findByIdAndDelete(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(204).json({});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Update account
  app.put('/banks/:id', async (req, res) => {
    const { firstName, lastName, dailyWithdrawalLimit } = req.body;
    const accountId = req.params.id;
    try {
      const account = await Account.findByIdAndUpdate(accountId, { firstName, lastName, dailyWithdrawalLimit }, { new: true, runValidators: true });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(200).json(account);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Fetch all transactions for an account
  app.get('/banks/:id/transactions', async (req, res) => {
    const accountId = req.params.id;
    try {
      const account = await Account.findById(accountId).populate('transactions');
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(200).json(account.transactions);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Withdrawal
  app.post('/banks/:id/withdraw', async (req, res) => {
    const accountId = req.params.id;
    const { amount } = req.body;
    try {
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      if (account.withdrawalAmountToday + amount > account.dailyWithdrawalLimit) {
        return res.status(400).json({ error: 'Daily withdrawal limit exceeded' });
      }
      if (account.balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      account.balance -= amount;
      account.withdrawalAmountToday += amount;
      const transaction = new Transaction({ type: 'Withdrawal', amount, accountId: account._id });
      await transaction.save();
      account.transactions.push(transaction);
      await account.save();
      res.status(200).json(account);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Deposit
  app.post('/banks/:id/deposit', async (req, res) => {
    const accountId = req.params.id;
    const { amount } = req.body;
    try {
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      account.balance += amount;
      const transaction = new Transaction({ type: 'Deposit', amount, accountId: account._id });
      await transaction.save();
      account.transactions.push(transaction);
      await account.save();
      res.status(200).json(account);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
 
  app.post('/banks/transfer', async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;
    try {
      const fromAccount = await Account.findById(fromAccountId);
      const toAccount = await Account.findById(toAccountId);
      if (!fromAccount || !toAccount) {
        return res.status(404).json({ error: 'One or both accounts not found' });
      }
      if (fromAccount.balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      fromAccount.balance -= amount;
      toAccount.balance += amount;
      const withdrawalTransaction = new Transaction({ type: 'Withdrawal', amount, accountId: fromAccount._id });
      const depositTransaction = new Transaction({ type: 'Deposit', amount, accountId: toAccount._id });
      await withdrawalTransaction.save();
      await depositTransaction.save();
      fromAccount.transactions.push(withdrawalTransaction);
      toAccount.transactions.push(depositTransaction);
      await fromAccount.save();
      await toAccount.save();
      res.status(200).json({ fromAccount, toAccount });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`)
});