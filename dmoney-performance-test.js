import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const SECRET_KEY = __ENV.SECRET_KEY || 'ROADTOSDET';
const TXN_AMOUNT = 10;

// Custom metrics for endpoint-specific analysis & phase degradation tracking
const depositDuration = new Trend('deposit_req_duration', true);
const depositFailRate = new Rate('deposit_fail_rate');
const depositCheckRate = new Rate('deposit_checks');
const depositCounter = new Counter('deposit_txns_total');

const sendMoneyDuration = new Trend('sendmoney_req_duration', true);
const sendMoneyFailRate = new Rate('sendmoney_fail_rate');
const sendMoneyCheckRate = new Rate('sendmoney_checks');
const sendMoneyCounter = new Counter('sendmoney_txns_total');

const paymentDuration = new Trend('payment_req_duration', true);
const paymentFailRate = new Rate('payment_fail_rate');
const paymentCheckRate = new Rate('payment_checks');
const paymentCounter = new Counter('payment_txns_total');

const phase1Duration = new Trend('phase1_duration', true);
const phase2Duration = new Trend('phase2_duration', true);
const phase3Duration = new Trend('phase3_duration', true);
const phase4Duration = new Trend('phase4_duration', true);

export let options = {
  scenarios: {
    // Phase 1 (0–30s)
    customer1_sendMoney_customer2: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      exec: 'customer1_sendMoney_customer2',
    },
    customer2_payment_merchant1: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      exec: 'customer2_payment_merchant1',
    },

    // Phase 2 (30–60s)
    customer2_sendMoney_customer1: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '30s',
      exec: 'customer2_sendMoney_customer1',
    },
    agent1_deposit_customer2: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '30s',
      exec: 'agent1_deposit_customer2',
    },
    customer1_payment_merchant1_p2: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '30s',
      exec: 'customer1_payment_merchant1_p2',
    },

    // Phase 3 (60–90s)
    agent1_deposit_customer1: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '60s',
      exec: 'agent1_deposit_customer1',
    },
    agent2_deposit_customer2: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '60s',
      exec: 'agent2_deposit_customer2',
    },
    customer1_sendMoney_customer2_p3: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '60s',
      exec: 'customer1_sendMoney_customer2_p3',
    },
    customer2_payment_merchant2_p3: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '60s',
      exec: 'customer2_payment_merchant2_p3',
    },

    // Phase 4 (90–120s)
    agent1_payment_merchant1: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '90s',
      exec: 'agent1_payment_merchant1',
    },
    agent2_payment_merchant2: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '90s',
      exec: 'agent2_payment_merchant2',
    },
    customer1_payment_merchant1_p4: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '90s',
      exec: 'customer1_payment_merchant1_p4',
    },
    customer2_payment_merchant2_p4: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '90s',
      exec: 'customer2_payment_merchant2_p4',
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],

    deposit_req_duration: ['p(95)<1000'],
    deposit_fail_rate: ['rate<0.01'],
    deposit_checks: ['rate>0.99'],

    sendmoney_req_duration: ['p(95)<1000'],
    sendmoney_fail_rate: ['rate<0.01'],
    sendmoney_checks: ['rate>0.99'],

    payment_req_duration: ['p(95)<1000'],
    payment_fail_rate: ['rate<0.01'],
    payment_checks: ['rate>0.99'],

    'http_req_duration{endpoint:deposit}': ['p(95)<1000'],
    'http_req_failed{endpoint:deposit}': ['rate<0.01'],
    'http_req_duration{endpoint:sendmoney}': ['p(95)<1000'],
    'http_req_failed{endpoint:sendmoney}': ['rate<0.01'],
    'http_req_duration{endpoint:payment}': ['p(95)<1000'],
    'http_req_failed{endpoint:payment}': ['rate<0.01'],
  },
};

function authenticateUser(email, password) {
  const loginRes = http.post(
    `${BASE_URL}/user/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginCheck = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  if (!loginCheck) {
    console.error(`Login failed for ${email}: status ${loginRes.status}`);
    return null;
  }

  const loginBody = loginRes.json();
  if (loginBody && loginBody.token) {
    return loginBody.token;
  }

  // Handle dev OTP verification if required
  if (loginBody && loginBody.otpRequired) {
    const otpRes = http.post(
      `${BASE_URL}/user/verify-otp?env=dev`,
      JSON.stringify({ identifier: email, otp: '0000' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    const otpCheck = check(otpRes, {
      'otp verification status is 200': (r) => r.status === 200,
    });

    if (!otpCheck) {
      console.error(`OTP verification failed for ${email}: status ${otpRes.status}`);
      return null;
    }

    const otpBody = otpRes.json();
    return otpBody ? otpBody.token : null;
  }

  return null;
}

// Authenticates all test users and returns credentials/tokens to scenarios
export function setup() {
  const usersConfig = {
    agent1: { email: 'k6agent1@gmail.com', password: '1234', phone: '01911000001', role: 'Agent' },
    agent2: { email: 'k6agent2@gmail.com', password: '1234', phone: '01911000002', role: 'Agent' },
    customer1: { email: 'k6customer1@gmail.com', password: '1234', phone: '01911000003', role: 'Customer' },
    customer2: { email: 'k6customer2@gmail.com', password: '1234', phone: '01911000004', role: 'Customer' },
    merchant1: { email: 'k6merchant1@gmail.com', password: '1234', phone: '01911000005', role: 'Merchant' },
    merchant2: { email: 'k6merchant2@gmail.com', password: '1234', phone: '01911000006', role: 'Merchant' },
  };

  const setupData = {};

  for (const [key, user] of Object.entries(usersConfig)) {
    const token = authenticateUser(user.email, user.password);
    if (!token) {
      throw new Error(`Authentication failed for ${user.email}. Check server status and credentials.`);
    }
    setupData[key] = {
      phone: user.phone,
      email: user.email,
      role: user.role,
      token,
    };
  }

  return setupData;
}

function executeDeposit(token, fromAccount, toAccount, amount, phaseMetric) {
  const payload = JSON.stringify({
    from_account: fromAccount,
    to_account: toAccount,
    amount,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-AUTH-SECRET-KEY': SECRET_KEY,
    },
    tags: { endpoint: 'deposit' },
  };

  const res = http.post(`${BASE_URL}/transaction/deposit`, payload, params);
  const duration = res.timings.duration;

  depositDuration.add(duration);
  if (phaseMetric) phaseMetric.add(duration);
  depositCounter.add(1);

  const isStatus201 = res.status === 201;
  let trnxIdValid = false;
  let messageValid = false;

  try {
    const body = res.json();
    if (body) {
      trnxIdValid = typeof body.trnxId === 'string' && body.trnxId.length > 0;
      messageValid = body.message === 'Deposit successful';
    }
  } catch (e) {
    // Non-JSON response
  }

  const checksPassed = check(res, {
    'deposit status is 201': () => isStatus201,
    'deposit transaction request is successful': () => isStatus201 && trnxIdValid,
    'deposit transaction ID is returned': () => trnxIdValid,
    'deposit expected success message is returned': () => messageValid,
  });

  depositFailRate.add(!isStatus201);
  depositCheckRate.add(checksPassed);

  return res;
}

function executeSendMoney(token, fromAccount, toAccount, amount, phaseMetric) {
  const payload = JSON.stringify({
    from_account: fromAccount,
    to_account: toAccount,
    amount,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-AUTH-SECRET-KEY': SECRET_KEY,
    },
    tags: { endpoint: 'sendmoney' },
  };

  const res = http.post(`${BASE_URL}/transaction/sendmoney`, payload, params);
  const duration = res.timings.duration;

  sendMoneyDuration.add(duration);
  if (phaseMetric) phaseMetric.add(duration);
  sendMoneyCounter.add(1);

  const isStatus201 = res.status === 201;
  let trnxIdValid = false;
  let messageValid = false;

  try {
    const body = res.json();
    if (body) {
      trnxIdValid = typeof body.trnxId === 'string' && body.trnxId.length > 0;
      messageValid = body.message === 'Send money successful';
    }
  } catch (e) {
    // Non-JSON response
  }

  const checksPassed = check(res, {
    'sendmoney status is 201': () => isStatus201,
    'sendmoney transaction request is successful': () => isStatus201 && trnxIdValid,
    'sendmoney transaction ID is returned': () => trnxIdValid,
    'sendmoney expected success message is returned': () => messageValid,
  });

  sendMoneyFailRate.add(!isStatus201);
  sendMoneyCheckRate.add(checksPassed);

  return res;
}

function executePayment(token, fromAccount, toAccount, amount, phaseMetric) {
  const payload = JSON.stringify({
    from_account: fromAccount,
    to_account: toAccount,
    amount,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-AUTH-SECRET-KEY': SECRET_KEY,
    },
    tags: { endpoint: 'payment' },
  };

  const res = http.post(`${BASE_URL}/transaction/payment`, payload, params);
  const duration = res.timings.duration;

  paymentDuration.add(duration);
  if (phaseMetric) phaseMetric.add(duration);
  paymentCounter.add(1);

  const isStatus201 = res.status === 201;
  let trnxIdValid = false;
  let messageValid = false;

  try {
    const body = res.json();
    if (body) {
      trnxIdValid = typeof body.trnxId === 'string' && body.trnxId.length > 0;
      messageValid = body.message === 'Payment successful';
    }
  } catch (e) {
    // Non-JSON response
  }

  const checksPassed = check(res, {
    'payment status is 201': () => isStatus201,
    'payment transaction request is successful': () => isStatus201 && trnxIdValid,
    'payment transaction ID is returned': () => trnxIdValid,
    'payment expected success message is returned': () => messageValid,
  });

  paymentFailRate.add(!isStatus201);
  paymentCheckRate.add(checksPassed);

  return res;
}

// Phase 1 (0–30s)
export function customer1_sendMoney_customer2(data) {
  executeSendMoney(data.customer1.token, data.customer1.phone, data.customer2.phone, TXN_AMOUNT, phase1Duration);
  sleep(1);
}

export function customer2_payment_merchant1(data) {
  executePayment(data.customer2.token, data.customer2.phone, data.merchant1.phone, TXN_AMOUNT, phase1Duration);
  sleep(1);
}

// Phase 2 (30–60s)
export function customer2_sendMoney_customer1(data) {
  executeSendMoney(data.customer2.token, data.customer2.phone, data.customer1.phone, TXN_AMOUNT, phase2Duration);
  sleep(1);
}

export function agent1_deposit_customer2(data) {
  executeDeposit(data.agent1.token, data.agent1.phone, data.customer2.phone, TXN_AMOUNT, phase2Duration);
  sleep(1);
}

export function customer1_payment_merchant1_p2(data) {
  executePayment(data.customer1.token, data.customer1.phone, data.merchant1.phone, TXN_AMOUNT, phase2Duration);
  sleep(1);
}

// Phase 3 (60–90s)
export function agent1_deposit_customer1(data) {
  executeDeposit(data.agent1.token, data.agent1.phone, data.customer1.phone, TXN_AMOUNT, phase3Duration);
  sleep(1);
}

export function agent2_deposit_customer2(data) {
  executeDeposit(data.agent2.token, data.agent2.phone, data.customer2.phone, TXN_AMOUNT, phase3Duration);
  sleep(1);
}

export function customer1_sendMoney_customer2_p3(data) {
  executeSendMoney(data.customer1.token, data.customer1.phone, data.customer2.phone, TXN_AMOUNT, phase3Duration);
  sleep(1);
}

export function customer2_payment_merchant2_p3(data) {
  executePayment(data.customer2.token, data.customer2.phone, data.merchant2.phone, TXN_AMOUNT, phase3Duration);
  sleep(1);
}

// Phase 4 (90–120s)
export function agent1_payment_merchant1(data) {
  executePayment(data.agent1.token, data.agent1.phone, data.merchant1.phone, TXN_AMOUNT, phase4Duration);
  sleep(1);
}

export function agent2_payment_merchant2(data) {
  executePayment(data.agent2.token, data.agent2.phone, data.merchant2.phone, TXN_AMOUNT, phase4Duration);
  sleep(1);
}

export function customer1_payment_merchant1_p4(data) {
  executePayment(data.customer1.token, data.customer1.phone, data.merchant1.phone, TXN_AMOUNT, phase4Duration);
  sleep(1);
}

export function customer2_payment_merchant2_p4(data) {
  executePayment(data.customer2.token, data.customer2.phone, data.merchant2.phone, TXN_AMOUNT, phase4Duration);
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'Reports/report.html': htmlReport(data),
    'Reports/summary.json': JSON.stringify(data, null, 2),
  };
}

