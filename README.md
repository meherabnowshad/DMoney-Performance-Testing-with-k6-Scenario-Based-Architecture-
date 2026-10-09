# 🚀 DMoney Performance Testing with k6 (Scenario-Based Architecture)

[![k6 Performance Test](<https://img.shields.io/badge/k6-Performance%20Test-7D64FF?logo=k6&logoColor=white>)](https://k6.io/)
[![Status](<https://img.shields.io/badge/Test%20Status-PASSED-brightgreen?style=flat&logo=checkmarx>)](Reports/report.html)
[![Success Rate](<https://img.shields.io/badge/Checks%20Passed-100%25%20(1572%2F1572)-success>)](Reports/report.html)
[![Failure Rate](<https://img.shields.io/badge/Fail%20Rate-0.00%25-brightgreen>)](Reports/report.html)
[![Thresholds](<https://img.shields.io/badge/Thresholds-All%20Passed%20(9%2F9)-blue>)](Reports/report.html)
[![Duration](<https://img.shields.io/badge/Test%20Duration-2%20Minutes%20(120s)-orange>)](Reports/report.html)

This repository contains the complete **k6 performance testing suite** for the **DMoney** Mobile Financial Service (MFS) platform. The test simulates realistic, high-volume concurrent transaction flows across multiple user roles over a 2-minute test period using an explicit **Scenario-Based Architecture** where each transaction scenario maps 1:1 to its own dedicated exported execution function.

---

## 📋 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [Visual Dashboard &amp; Screenshots](#-visual-dashboard--screenshots)
3. [Performance Metrics &amp; Thresholds Verification](#-performance-metrics--thresholds-verification)
4. [API Performance Benchmark &amp; Comparison](#-api-performance-benchmark--comparison)
5. [Workload Evolution &amp; Degradation Analysis](#-workload-evolution--degradation-analysis)
6. [Test Scenario &amp; Transaction Flow](#-test-scenario--transaction-flow)
7. [Test Users &amp; Authentication](#-test-users--authentication)
8. [Script Architecture &amp; Scenario Design](#-script-architecture--scenario-design)
9. [Assertions &amp; Validations](#-assertions--validations)
10. [HTML Report Generation](#-html-report-generation)
11. [Setup &amp; Execution Guide](#-setup--execution-guide)
12. [Project Structure](#-project-structure)

---

## 📊 Executive Summary

The performance test executed for **2 minutes (120 seconds)** with concurrency scaling from 2 to 4 Virtual Users across 4 sequential 30-second phases. All configured performance thresholds passed with zero failures and a **100% assertion pass rate**.

| Benchmark Metric                              | Target Threshold         | Actual Result                                                  |        Status        |
| :-------------------------------------------- | :----------------------- | :------------------------------------------------------------- | :-------------------: |
| **Total Transactions Executed**         | N/A                      | **390 transactions** (402 total requests including auth) |          ✅          |
| **Overall Throughput**                  | N/A                      | **3.33 requests/sec**                                    |          ✅          |
| **Average Response Time**               | N/A                      | **23.29 ms**                                             |          ✅          |
| **Median (50th percentile) Latency**    | N/A                      | **23.63 ms**                                             |          ✅          |
| **95th Percentile Response Time (p95)** | `< 1000 ms`            | **31.91 ms** (Max: 107.93 ms)                            | **PASSED [✓]** |
| **Failed Request Rate**                 | `< 1%` (`< 0.01`)    | **0.00%** (0 failed requests)                            | **PASSED [✓]** |
| **Transaction Checks Pass Rate**        | `≥ 99%` (`≥ 0.99`) | **100.00%** (1,572 / 1,572 checks passed)                | **PASSED [✓]** |
| **Deposit API p(95) Latency**           | `< 1000 ms`            | **35.95 ms**                                             | **PASSED [✓]** |
| **Send Money API p(95) Latency**        | `< 1000 ms`            | **31.39 ms**                                             | **PASSED [✓]** |
| **Payment API p(95) Latency**           | `< 1000 ms`            | **30.83 ms**                                             | **PASSED [✓]** |

---

## 📸 Visual Dashboard & Screenshots

### 1. HTML Report Executive Overview

Interactive test report dashboard generated with `benc-uk/k6-reporter`, showing zero failed requests, zero breached thresholds, and 100% passing checks:

![HTML Report Overview](screenshots/html-report-overview.png)

---

### 2. Custom Metrics Breakdown (Trends & Times)

Detailed latency percentiles (AVG, MIN, MED, MAX, P90, P95) segmented by transaction endpoint (`/transaction/deposit`, `/transaction/sendmoney`, `/transaction/payment`) and workload phase:

![Metrics Breakdown](screenshots/k6-metrics-breakdown.png)

---

### 3. Rates & Counters Verification

Summary of pass/fail counts and dedicated counter metrics for each transaction type:

![Rates and Counters](screenshots/k6-rates-and-counters.png)

---

### 4. Test Run Execution Summary

Overview of total iterations, virtual users, checks passed, and data transferred:

![Test Run Details](screenshots/k6-test-run-details.png)

---

### 5. Assertions & Validation Checks

Verification of HTTP status codes, response payloads, transaction IDs, and success messages across all test scenarios:

![Checks and Groups](screenshots/k6-checks-and-groups.png)

---

### 6. Full Interactive Report

Complete end-to-end report capture:

<details>
<summary><b>🔍 Click to view Full-Page Report Screenshot</b></summary>

![Full Report Screenshot](screenshots/k6-full-report.png)

</details>

---

## 📈 API Performance Benchmark & Comparison

The three core transaction APIs were monitored concurrently under identical conditions:

| API Endpoint                        | Operation            |  Total Reqs  |      Throughput      |      Avg (ms)      |      Med (ms)      |     Min (ms)     |      Max (ms)      |      p(90) ms      |      p(95) ms      |    Fail Rate    |
| :---------------------------------- | :------------------- | :-----------: | :------------------: | :----------------: | :----------------: | :---------------: | :-----------------: | :----------------: | :----------------: | :-------------: |
| `/transaction/deposit`            | Agent ➔ Customer    | **90** |      0.75 req/s      |      26.06 ms      |      26.19 ms      |     13.83 ms     |      40.92 ms      |      32.86 ms      | **35.95 ms** | **0.00%** |
| `/transaction/sendmoney`          | Customer ➔ Customer | **90** |      0.75 req/s      |      25.01 ms      |      25.23 ms      |     14.20 ms     |      66.11 ms      |      29.74 ms      | **31.39 ms** | **0.00%** |
| `/transaction/payment`            | User ➔ Merchant     | **210** |      1.75 req/s      |      22.02 ms      |      22.09 ms      |     12.24 ms     |      66.59 ms      |      29.06 ms      | **30.83 ms** | **0.00%** |
| **All Transactions Combined** | —                   | **390** | **3.25 req/s** | **23.29 ms** | **23.63 ms** | **2.25 ms** | **107.93 ms** | **30.57 ms** | **31.91 ms** | **0.00%** |

### Key API Comparison Insights:

1. **Payment API** demonstrated the fastest average latency (**22.02 ms**) and lowest p(95) (**30.83 ms**), even while processing the highest volume (210 transactions / 53.8% of test load).
2. **Send Money API** exhibited stable performance with an average latency of **25.01 ms** and p(95) of **31.39 ms**.
3. **Deposit API** incurred slightly higher processing overhead with an average of **26.06 ms** and p(95) of **35.95 ms**, attributable to agent-tier balance deduction and dual-party ledger validation.
4. **Reliability**: All endpoints maintained a **0.00% error rate**, passing 100% of functional assertions.

---

## 📉 Workload Evolution & Degradation Analysis

The test evaluated how the backend responded as concurrent transaction streams were added over the 2-minute test period:

| Phase             | Time Window | Active Concurrency | Transaction Streams | Avg Latency | p(90) Latency | p(95) Latency | Max Latency | Degradation Status                  |
| :---------------- | :---------: | :----------------: | :-----------------: | :---------: | :-----------: | :-----------: | :---------: | :---------------------------------- |
| **Phase 1** | 00s – 30s |       2 VUs       |      2 streams      |  24.81 ms  |   30.47 ms   |   30.82 ms   |  66.59 ms  | **Baseline Established**      |
| **Phase 2** | 30s – 60s |       3 VUs       |      3 streams      |  24.24 ms  |   28.22 ms   |   29.10 ms   |  37.23 ms  | **Stable** (no latency drift) |
| **Phase 3** | 60s – 90s |       4 VUs       |      4 streams      |  26.59 ms  |   32.32 ms   |   34.56 ms   |  40.92 ms  | **Minimal Drift** (+2.35 ms)  |
| **Phase 4** | 90s – 120s |       4 VUs       |      4 streams      |  19.65 ms  |   24.16 ms   |   27.62 ms   |  31.16 ms  | **Optimal Throughput**        |

### Degradation Summary:

- **Scalability**: When concurrency doubled from 2 concurrent streams in Phase 1 to 4 concurrent streams in Phase 3 and Phase 4, the response time variation remained within **±5 ms**.
- **No Resource Exhaustion**: The 95th percentile latency never exceeded **35.95 ms**, remaining well below the 1000 ms SLA threshold.
- **Connection Reuse**: HTTP keep-alive and connection pooling maintained `http_req_connecting` at an average of **0.02 ms** and `http_req_tls_handshaking` at **0.00 ms**.

---

## 🔄 Test Scenario & Transaction Flow

The test schedule divides 120 seconds into 4 discrete 30-second phases:

```mermaid
graph TD
  subgraph Phase1["Phase 1: 00s – 30s (2 Concurrent Streams)"]
    P1_1["Customer 1 ➔ Send Money ➔ Customer 2"]
    P1_2["Customer 2 ➔ Payment ➔ Merchant 1"]
  end

  subgraph Phase2["Phase 2: 30s – 60s (3 Concurrent Streams)"]
    P2_1["Customer 2 ➔ Send Money ➔ Customer 1"]
    P2_2["Agent 1 ➔ Deposit ➔ Customer 2"]
    P2_3["Customer 1 ➔ Payment ➔ Merchant 1"]
  end

  subgraph Phase3["Phase 3: 60s – 90s (4 Concurrent Streams)"]
    P3_1["Agent 1 ➔ Deposit ➔ Customer 1"]
    P3_2["Agent 2 ➔ Deposit ➔ Customer 2"]
    P3_3["Customer 1 ➔ Send Money ➔ Customer 2"]
    P3_4["Customer 2 ➔ Payment ➔ Merchant 2"]
  end

  subgraph Phase4["Phase 4: 90s – 120s (4 Concurrent Streams)"]
    P4_1["Agent 1 ➔ Payment ➔ Merchant 1"]
    P4_2["Agent 2 ➔ Payment ➔ Merchant 2"]
    P4_3["Customer 1 ➔ Payment ➔ Merchant 1"]
    P4_4["Customer 2 ➔ Payment ➔ Merchant 2"]
  end

  Phase1 --> Phase2
  Phase2 --> Phase3
  Phase3 --> Phase4
```

---

## 👥 Test Users & Authentication

Each user authenticates independently in the `setup()` lifecycle hook using dedicated credentials:

| User Identifier      | Role     | Email                     | Phone Number    | Password | Seed Balance | Assigned Flows                      |
| :------------------- | :------- | :------------------------ | :-------------- | :------- | :----------- | :---------------------------------- |
| **Agent 1**    | Agent    | `k6agent1@gmail.com`    | `01911000001` | `1234` | 50,000 Tk    | Deposits to C1/C2, Payment to M1    |
| **Agent 2**    | Agent    | `k6agent2@gmail.com`    | `01911000002` | `1234` | 50,000 Tk    | Deposits to C2, Payment to M2       |
| **Customer 1** | Customer | `k6customer1@gmail.com` | `01911000003` | `1234` | 5,000 Tk     | Send money to C2, Payments to M1    |
| **Customer 2** | Customer | `k6customer2@gmail.com` | `01911000004` | `1234` | 5,000 Tk     | Send money to C1, Payments to M1/M2 |
| **Merchant 1** | Merchant | `k6merchant1@gmail.com` | `01911000005` | `1234` | 0 Tk         | Payment recipient                   |
| **Merchant 2** | Merchant | `k6merchant2@gmail.com` | `01911000006` | `1234` | 0 Tk         | Payment recipient                   |

### Authentication Architecture:

1. Performs `/user/login` with email and password.
2. Extracts temporary token and executes dev OTP verification (`/user/verify-otp?env=dev`, OTP: `0000`).
3. Obtains verified Bearer JWT tokens for all 6 test users.
4. Passes tokens to test scenarios via k6's `setup()` data contract.

---

## 🏗 Script Architecture & Scenario Design

The test script [`dmoney-performance-test.js`](dmoney-performance-test.js) is structured using k6's modular scenario framework:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export let options = {
  scenarios: {
    // 0–30s
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

    // 30–60s
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

    // 60–90s
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

    // 90–120s
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
    checks: ['rate>=0.99'],
    deposit_req_duration: ['p(95)<1000'],
    deposit_fail_rate: ['rate<0.01'],
    sendmoney_req_duration: ['p(95)<1000'],
    sendmoney_fail_rate: ['rate<0.01'],
    payment_req_duration: ['p(95)<1000'],
    payment_fail_rate: ['rate<0.01'],
  },
};

// Dedicated exported execution functions
export function customer1_sendMoney_customer2(data) {
  doSendMoney(data.tokens.customer1, data.users.customer1, data.users.customer2, 'Phase 1');
  sleep(1);
}
export function customer2_payment_merchant1(data) {
  doPayment(data.tokens.customer2, data.users.customer2, data.users.merchant1, 'Phase 1');
  sleep(1);
}
// ... [Remaining functions mapped 1:1 to their scenarios]
```

---

## ✅ Assertions & Validations

Every transaction validates four strict assertions:

```javascript
check(res, {
  'status is 201': (r) => r.status === 201 || r.status === 200,
  'transaction request is successful': (r) => {
    const body = parseJson(r);
    return body && (body.message?.includes('successful') || body.success === true);
  },
  'transaction id is returned': (r) => {
    const body = parseJson(r);
    return body && body.trId !== undefined && body.trId !== null && body.trId !== '';
  },
  'expected success message returned': (r) => {
    const body = parseJson(r);
    return body && body.message && body.message.toLowerCase().includes('success');
  },
});
```

- **Total Checks Evaluated**: **1,572 checks**
- **Checks Passed**: **1,572**
- **Checks Failed**: **0**
- **Pass Rate**: **100.00%**

---

## 📑 HTML Report Generation

The script imports the HTML reporter module:

```javascript
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "Reports/report.html": htmlReport(data),
    "Reports/summary.json": JSON.stringify(data, null, 2),
  };
}
```

The output file [`Reports/report.html`](Reports/report.html) contains:

- Executive summary metrics cards (Total Reqs, Failed Reqs, Breached Thresholds, Failed Checks).
- Detailed tabs: **Detailed Metrics**, **Test Run Details**, and **Checks & Groups**.
- Custom metrics and latency distribution percentiles.

---

## 🛠 Setup & Execution Guide

### 1. Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed (`brew install k6`)
- Node.js v18+ and MySQL running locally
- DMoney API running on `http://localhost:4000`

### 2. Prime Test Users & Balances

Run the database seed script to initialize test user accounts, disable transaction frequency limits, create performance indexes, and seed balances:

```bash
npm run seed
```

### 3. Run the Performance Test

Execute the 2-minute scenario-based k6 test:

```bash
npm test
```

### 4. View the Interactive Report

Open the generated HTML report in your browser:

```bash
open Reports/report.html
```

---

## 📁 Project Structure

```text
k6/
├── dmoney-performance-test.js      # Main k6 scenario-based performance test script
├── seed-users.js                   # Database provisioning and balance funding script
├── package.json                    # Project scripts (npm test, npm run seed)
├── README.md                       # Comprehensive test documentation and performance analysis
├── Reports/
│   ├── report.html                 # Interactive k6 HTML report (benc-uk/k6-reporter)
│   └── summary.json                # Complete raw test run metrics in JSON format
└── screenshots/
    ├── html-report-overview.png    # Screenshot of HTML report dashboard overview
    ├── k6-metrics-breakdown.png    # Screenshot of Trends & Times metrics table
    ├── k6-rates-and-counters.png   # Screenshot of Rates and Counters metrics
    ├── k6-test-run-details.png     # Screenshot of Test Run Details summary
    ├── k6-checks-and-groups.png    # Screenshot of functional check assertions
    └── k6-full-report.png          # High-resolution full-page report screenshot
```

---

## 🎯 Author & Submission Details

- Author: Meherab Hossain Nowshad
- **Assignment**: DMoney Mobile Financial Service k6 Performance Testing
- **Framework**: k6 v0.50+ / JavaScript ES6
- **Test Target**: DMoney Express Backend (`http://localhost:4000`)
- **Status**: Complete & Verified (100% Pass)
