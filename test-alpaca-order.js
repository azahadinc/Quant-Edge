require('dotenv').config({ path: '.env.local' });
const Alpaca = require('@alpacahq/alpaca-trade-api');

// Alpaca credentials from .env.local
const config = {
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: process.env.ALPACA_PAPER === 'true' // Paper trading
};

// Validate environment variables
if (!config.keyId || !config.secretKey) {
  console.error('❌ Missing ALPACA_API_KEY or ALPACA_SECRET_KEY in .env.local');
  process.exit(1);
}

async function runTests() {
  const alpaca = new Alpaca({
    keyId: config.keyId,
    secretKey: config.secretKey,
    paper: config.paper,
  });

  console.log('🔌 [1] Testing Alpaca Connection...\n');
  
  try {
    // Test 1: Get Account Details
    const account = await alpaca.getAccount();
    console.log('✅ Connection successful!');
    console.log(`   Status: ${account.status}`);
    console.log(`   Buying Power: $${parseFloat(account.buying_power).toFixed(2)}`);
    console.log(`   Cash: $${parseFloat(account.cash).toFixed(2)}`);
    console.log(`   Portfolio Value: $${parseFloat(account.portfolio_value).toFixed(2)}`);
    console.log(`   Equity: $${parseFloat(account.equity).toFixed(2)}\n`);

    // Test 2: Place $50 Paper Trading Order
    console.log('📊 [2] Placing $50 Paper Trading Order...\n');
    
    // SPY typical price ~$450-500, so 1 share = ~$50
    const quantity = 1;
    const estimatedPrice = 450;
    
    console.log(`   Symbol: SPY`);
    console.log(`   Estimated Price: ~$${estimatedPrice.toFixed(2)}`);
    console.log(`   Order Quantity: ${quantity} shares`);
    console.log(`   Order Value: ~$${(quantity * estimatedPrice).toFixed(2)}\n`);

    const order = await alpaca.createOrder({
      symbol: 'SPY',
      qty: quantity,
      side: 'buy',
      type: 'market',
      time_in_force: 'day'
    });

    console.log('✅ Order placed successfully!');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Symbol: ${order.symbol}`);
    console.log(`   Quantity: ${order.qty}`);
    console.log(`   Side: ${order.side}`);
    console.log(`   Type: ${order.order_type}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runTests();
