/**
 * seed-users.js
 * 
 * Prepares the DMoney database for the k6 performance test:
 * 1. Ensures 6 dedicated test users (Agent 1, Agent 2, Customer 1, Customer 2, Merchant 1, Merchant 2) exist and are active.
 * 2. Sets their passwords to '1234'.
 * 3. Deactivates any daily transaction limits on TransactionLimits table so load testing isn't artificially throttled.
 * 4. Verifies account balances and tops them up from SYSTEM so they never run out of funds or hit cap limits.
 */

const path = require('path');
const dotenvPath = path.resolve(__dirname, '../SDET/dMoney/dmoney-transaction-api/.env');
require('/Users/nowshad/SDET/dMoney/dmoney-transaction-api/node_modules/dotenv').config({ path: dotenvPath });

const { Users } = require('/Users/nowshad/SDET/dMoney/dmoney-transaction-api/sequelizeModel/Users');
const { Transactions } = require('/Users/nowshad/SDET/dMoney/dmoney-transaction-api/sequelizeModel/Transactions');
const { hashPassword } = require('/Users/nowshad/SDET/dMoney/dmoney-transaction-api/utils/hash');
const { generateTrnxId } = require('/Users/nowshad/SDET/dMoney/dmoney-transaction-api/services/generateTrnxId');
const { sequelize } = require('/Users/nowshad/SDET/dMoney/dmoney-transaction-api/sequelizeModel/db');

const TEST_USERS = [
  { name: 'Agent 1', email: 'k6agent1@gmail.com', phone_number: '01911000001', role: 'Agent', targetBalance: 50000 },
  { name: 'Agent 2', email: 'k6agent2@gmail.com', phone_number: '01911000002', role: 'Agent', targetBalance: 50000 },
  { name: 'Customer 1', email: 'k6customer1@gmail.com', phone_number: '01911000003', role: 'Customer', targetBalance: 5000 },
  { name: 'Customer 2', email: 'k6customer2@gmail.com', phone_number: '01911000004', role: 'Customer', targetBalance: 5000 },
  { name: 'Merchant 1', email: 'k6merchant1@gmail.com', phone_number: '01911000005', role: 'Merchant', targetBalance: 0 },
  { name: 'Merchant 2', email: 'k6merchant2@gmail.com', phone_number: '01911000006', role: 'Merchant', targetBalance: 0 },
];

async function seed() {
  console.log('====================================================');
  console.log('  DMONEY K6 PERFORMANCE TEST USER SEED & BALANCE CHECK');
  console.log('====================================================\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database.');

    // 1. Disable daily count limit in TransactionLimits table if exists
    try {
      await sequelize.query('UPDATE TransactionLimits SET is_active = 0');
      console.log('✅ TransactionLimits daily rate limits disabled for load testing.');
    } catch (e) {
      console.log('ℹ️  TransactionLimits table query skipped:', e.message);
    }

    // 1b. Ensure performance indexes on Transactions table to prevent full-table scan deadlocks
    try {
      await sequelize.query('CREATE INDEX idx_transactions_account ON Transactions (account)');
      console.log('✅ Created index on Transactions(account).');
    } catch (e) { /* index already exists */ }
    try {
      await sequelize.query('CREATE INDEX idx_transactions_from_account ON Transactions (from_account)');
      console.log('✅ Created index on Transactions(from_account).');
    } catch (e) { /* index already exists */ }
    try {
      await sequelize.query('CREATE INDEX idx_transactions_to_account ON Transactions (to_account)');
      console.log('✅ Created index on Transactions(to_account).');
    } catch (e) { /* index already exists */ }

    // 2. Ensure each user exists, is active, and has password '1234'
    console.log('\n--- Checking / Creating Test Users ---');
    for (const u of TEST_USERS) {
      let user = await Users.findOne({ where: { phone_number: u.phone_number } });
      if (!user) {
        user = await Users.create({
          name: u.name,
          email: u.email,
          phone_number: u.phone_number,
          password: hashPassword('1234'),
          role: u.role,
          status: 'active',
          nid: '1234567890'
        });
        console.log(`[CREATED] ${u.name.padEnd(12)} | Phone: ${u.phone_number} | Role: ${u.role}`);
      } else {
        user.status = 'active';
        user.password = hashPassword('1234');
        await user.save();
        console.log(`[READY]   ${u.name.padEnd(12)} | Phone: ${u.phone_number} | Role: ${u.role} (Status: Active)`);
      }
    }

    // 3. Check and top-up balances
    console.log('\n--- Checking Balances and Top-up ---');
    for (const u of TEST_USERS) {
      const trnxs = await Transactions.findAll({ where: { account: u.phone_number } });
      const currentBal = trnxs.reduce((acc, t) => acc + t.credit - t.debit, 0);

      if (u.targetBalance > 0 && currentBal < u.targetBalance) {
        const topUpAmt = u.targetBalance - currentBal;
        const trnxId = generateTrnxId();

        // SYSTEM debit
        await Transactions.create({
          account: 'SYSTEM',
          from_account: 'SYSTEM',
          to_account: u.phone_number,
          description: `Top-up for ${u.name}`,
          trnxId: trnxId,
          debit: topUpAmt,
          credit: 0,
          transaction_type: 'Deposit'
        });

        // User credit
        await Transactions.create({
          account: u.phone_number,
          from_account: 'SYSTEM',
          to_account: u.phone_number,
          description: 'Top-up from SYSTEM',
          trnxId: trnxId,
          debit: 0,
          credit: topUpAmt,
          transaction_type: 'Deposit'
        });

        console.log(`[TOP-UP]  ${u.name.padEnd(12)} | Added: ${topUpAmt.toFixed(2)} Tk | New Balance: ${u.targetBalance.toFixed(2)} Tk`);
      } else {
        console.log(`[BALANCE] ${u.name.padEnd(12)} | Current: ${currentBal.toFixed(2)} Tk (Target: ${u.targetBalance.toFixed(2)} Tk)`);
      }
    }

    console.log('\n✅ All test accounts are ready for k6 execution!');
    console.log('====================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error during seed:', err);
    process.exit(1);
  }
}

seed();
