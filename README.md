# RecoverAI

### AI-Powered Payment Failure & Revenue Recovery Agent

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://recover-ai-app.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/mjs281018-web/recover-ai)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Webhook-blue)](https://razorpay.com/)

<p align="center">
  <strong>Intelligent payment recovery powered by AI decision-making, financial policy guardrails, human approval, verification, and complete auditability.</strong>
</p>

<p align="center">
  <a href="https://recover-ai-app.vercel.app/">🚀 View Live Demo</a>
  &nbsp;•&nbsp;
  <a href="https://github.com/mjs281018-web/recover-ai">📦 View Source</a>
</p>

---

## 🚀 Live Demo

**Production:**  
https://recover-ai-app.vercel.app/

RecoverAI is deployed on Vercel as an interactive demonstration of an AI-powered payment recovery agent.

> **Demo Safety:** The current deployment uses synthetic payment data and dry-run recovery operations. No real customer charges or real money movement are performed.

---

## 📌 Overview

RecoverAI is an AI-powered revenue recovery platform designed to intelligently handle failed payment events.

Instead of blindly retrying every failed payment, RecoverAI analyzes the failure context, estimates recovery probability, selects an appropriate recovery strategy, checks the decision against financial policies, requests human approval when required, verifies the result, and records the complete lifecycle.

The core idea is:

> **Don't just retry failed payments — intelligently decide what should happen next.**

---

## 🎯 Problem

Payment failures can result in significant revenue loss and poor customer experience.

Common failure scenarios include:

- Bank declines
- Insufficient funds
- Network failures
- Gateway timeouts
- Processor errors
- Expired cards
- Expired mandates
- Invalid accounts
- Fraud signals
- Lost cards
- Repeated failed attempts

A traditional payment system may simply retry the transaction:

```text
Payment Failed
      ↓
    Retry
      ↓
Success / Failure
```

However, not every payment failure should be retried.

For example:

| Failure Scenario | Intelligent Response |
|---|---|
| Temporary network failure | Smart Retry |
| Bank decline | Adaptive Retry |
| Expired card | Update Payment Method |
| Lost card | Block Retry |
| Suspected fraud | Hold / Escalate |
| High-value payment | Human Approval |
| Repeated failures | Change Strategy |

RecoverAI introduces an intelligent, policy-controlled recovery layer between payment failure and recovery action.

---

# 💡 Solution

RecoverAI combines:

**AI Decision Making + Payment Intelligence + Policy Guardrails + Human Approval + Verification + Auditability**

### Recovery Lifecycle

```text
Payment Failure
       ↓
    Observe
       ↓
    Analyze
       ↓
    Predict
       ↓
     Decide
       ↓
  Policy Check
       ↓
 ┌─────┼──────────┐
 ↓     ↓          ↓
Allow  Approval   Block
 ↓     ↓
 └─────┬──────────┘
       ↓
      Act
       ↓
    Verify
       ↓
     Audit
```

---

# 🤖 AI Recovery Agent

RecoverAI uses an eight-stage agent pipeline.

### 1. Observe

Collect payment and customer context:

- Payment amount
- Payment channel
- Failure status
- Customer information
- Previous attempts
- Risk level
- Gateway response

### 2. Analyze

Identify the likely root cause of the payment failure.

Example:

```text
Failure:  Bank declined
Risk:     High
Channel:  Card
Customer: Demo Customer
```

### 3. Predict

Estimate the probability that the payment can be successfully recovered.

Example:

```text
Recovery Probability: 68%
AI Confidence:        88%
```

### 4. Decide

Select the most appropriate recovery strategy.

Supported strategies include:

- Smart Retry
- Retry
- Switch Payment Channel
- Send Reminder
- Update Payment Method
- Human Approval
- Escalate
- Hold
- Write-off

### 5. Policy Check

Every proposed action is evaluated by the policy engine.

Possible policy outcomes:

```text
ALLOW
APPROVAL REQUIRED
BLOCK
```

### 6. Act

If permitted, the selected recovery action is executed.

In the current demo, recovery is **synthetic and dry-run only**.

### 7. Verify

The agent verifies whether the recovery action produced the expected result.

### 8. Audit

The complete decision lifecycle is recorded for traceability and review.

---

# 🛡️ Bounded AI Autonomy

RecoverAI is designed around **bounded autonomy**.

AI does not have unrestricted control over financial operations.

```text
                AI Decision
                     ↓
               Policy Engine
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
      ALLOW       APPROVAL       BLOCK
        ↓            ↓
   Autonomous      Human
     Action        Review
        ↓            ↓
        └──────┬─────┘
               ↓
            Verify
               ↓
             Audit
```

### Autonomous Actions

Low-risk operations can be executed automatically.

### Human Approval

Sensitive operations can be routed to a human reviewer.

### Blocked Actions

Unsafe or prohibited actions are prevented by policy.

---

# 💳 Razorpay Integration

RecoverAI includes a demo-safe Razorpay webhook integration.

### Webhook Flow

```text
Razorpay
   │
   │ payment.failed
   ↓
Webhook Endpoint
   ↓
Signature Verification
   ↓
Razorpay Adapter
   ↓
Payment Normalization
   ↓
RecoverAI Agent
   ↓
Policy Engine
   ↓
Recovery Decision
```

### Supported Integration

- `payment.failed` event handling
- Webhook signature verification
- HMAC-SHA256 validation
- Event ID handling
- Payment normalization
- Failure reason mapping
- Risk classification
- Recovery strategy recommendation
- Policy evaluation
- Dry-run recovery

---

# 🔐 Webhook Security

Incoming Razorpay webhook requests are verified using HMAC-SHA256.

```text
Incoming Webhook
       ↓
Raw Request Body
       ↓
X-Razorpay-Signature
       ↓
HMAC-SHA256
       ↓
Timing-Safe Comparison
       ↓
Verified / Rejected
```

Invalid or missing signatures are rejected.

---

# 👤 Human-in-the-Loop

RecoverAI supports human approval for actions that should not be executed autonomously.

```text
AI Decision
     ↓
Policy Evaluation
     ↓
Approval Required
     ↓
Human Review
     ↓
Approve / Reject
     ↓
Continue / Stop
```

Approval records include:

- Payment ID
- Amount
- Reason
- Risk level
- Requested by
- Approval status
- Decision timestamp
- Decision maker

---

# 🧠 Explainable AI

RecoverAI exposes the reasoning behind recovery decisions.

Example:

```text
Root Cause:
Bank declined

Recovery Probability:
68%

AI Confidence:
88%

Risk:
High

Previous Attempts:
2

Matched Strategy:
Soft decline smart retry

Policy:
PL-01

Final Decision:
Smart Retry
```

The AI Decision Panel can display:

- Root cause
- Recovery probability
- AI confidence
- Risk level
- Policy result
- Recommended action
- Decision factors
- AI rationale

---

# 📊 Recovery Intelligence

The RecoverAI command center provides visibility into the recovery lifecycle.

### Key Metrics

- Revenue at risk
- Recoverable revenue
- Revenue recovered
- Recovery rate
- AI decisions
- Human escalations
- Safety blocks
- Recovery funnel
- Failure intelligence
- Risk analysis
- Customer segmentation
- Recovery probability
- AI confidence
- Recent agent activity

> Dashboard values in the current deployment are synthetic demonstration data.

---

# 🔄 Demo Scenario

A typical RecoverAI demonstration follows this flow:

### Failed Payment

```text
Payment ID:  RZP-297595
Amount:     ₹499
Channel:   Card
Failure:    Bank declined
Risk:       High
```

### AI Prediction

```text
Recovery Probability: 68%
AI Confidence:        88%
```

### AI Decision

```text
Smart Retry
```

### Policy

```text
PL-01
Allowed
```

### Recovery

```text
Synthetic Retry
       ↓
    Success
```

### Final State

```text
Payment:      RECOVERED
Verification: PASSED
Audit:        RECORDED
```

---

# 🏗️ System Architecture

```text
┌─────────────────────────────┐
│       Payment Gateway       │
│          Razorpay           │
└──────────────┬──────────────┘
               │
               │ payment.failed
               ↓
┌─────────────────────────────┐
│     Webhook Verification    │
│        HMAC-SHA256          │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│      Razorpay Adapter       │
│      Event Normalizer       │
└──────────────┬──────────────┘
               │
               ↓
┌────────────────────────────────────────┐
│           RecoverAI Agent              │
│                                        │
│ Observe → Analyze → Predict → Decide   │
│ Policy Check → Act → Verify → Audit    │
└───────────────────┬────────────────────┘
                    │
          ┌─────────┼─────────┐
          ↓         ↓         ↓
       ┌──────┐ ┌────────┐ ┌───────┐
       │ALLOW │ │APPROVAL│ │ BLOCK │
       └──┬───┘ └───┬────┘ └───────┘
          │         │
          └────┬────┘
               ↓
      ┌─────────────────┐
      │ Recovery Action │
      │    Dry Run      │
      └────────┬────────┘
               ↓
      ┌─────────────────┐
      │     Verify      │
      └────────┬────────┘
               ↓
      ┌─────────────────┐
      │   Audit Trail   │
      └─────────────────┘
```

---

# 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| UI | Tailwind CSS, shadcn-style components, Lucide |
| Backend | Next.js App Router, API Routes |
| AI Layer | AI Decision Abstraction, Deterministic Fallback |
| Payments | Razorpay Webhooks, Synthetic Payment Provider |
| Security | HMAC-SHA256, Policy Engine |
| Governance | Human Approval, Risk Guardrails, Audit Trail |
| Deployment | Vercel |
| Version Control | Git, GitHub |

---

# 📁 Project Structure

```text
recover-ai/
│
├── app/
│   ├── agent/
│   ├── api/
│   │   ├── ai/
│   │   └── webhooks/
│   │       └── razorpay/
│   ├── analytics/
│   ├── approvals/
│   ├── audit-trail/
│   ├── at-risk-payments/
│   ├── batch-recovery/
│   ├── customers/
│   └── recovery-strategies/
│
├── components/
│   ├── agent/
│   ├── dashboard/
│   └── ui/
│
├── data/
│   └── demo.ts
│
├── lib/
│   ├── providers/
│   ├── razorpay/
│   └── runtime-events.ts
│
├── services/
│   ├── agent-service.ts
│   ├── approval-service.ts
│   ├── audit-service.ts
│   ├── payment-service.ts
│   └── policy-service.ts
│
├── types/
│   └── index.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

- Node.js 20+
- npm
- Git

## Clone

```bash
git clone https://github.com/mjs281018-web/recover-ai.git
cd recover-ai
```

## Install Dependencies

```bash
npm install
```

## Environment Variables

Create `.env.local`:

```env
PAYMENT_PROVIDER=synthetic
RAZORPAY_WEBHOOK_SECRET=your_demo_webhook_secret
```

> Never commit real API keys, webhook secrets, or credentials.

## Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
```

---

# 🧪 Demo Instructions

### 1. Open the Agent

Go to:

```text
/agent
```

### 2. Simulate Payment Failure

Click:

**Simulate Razorpay Payment Failure**

### 3. Verify Webhook

The system should show:

```text
Webhook: Ready
Signature: Verified
Event: payment.failed
Execution: Dry Run
```

### 4. Review the Payment

The simulated payment is registered as:

```text
Status: AT RISK
```

### 5. Run Recovery

Click:

**Run Recovery**

### 6. Observe the Agent

The complete eight-stage lifecycle executes:

```text
Observe
   ↓
Analyze
   ↓
Predict
   ↓
Decide
   ↓
Policy Check
   ↓
Act
   ↓
Verify
   ↓
Audit
```

### 7. Verify Result

The payment should reach:

```text
RECOVERED
```

with verification and audit records updated.

---

# 🔒 Safety & Security

RecoverAI is currently a controlled financial automation prototype.

### Safety Controls

- Webhook signature verification
- Policy-based authorization
- Risk classification
- Human approval
- Blocked action handling
- Dry-run payment operations
- Synthetic payment provider
- Audit trail
- No real money movement

### The Current Demo Does Not

- Charge real customers
- Move real money
- Perform real payment retries
- Modify real merchant balances
- Execute real financial transactions

---

# 🧩 AI Reliability

RecoverAI includes an AI decision abstraction with a deterministic fallback.

If an external AI service is unavailable or not configured, the system can still generate a deterministic recovery decision.

This provides:

- Predictable behavior
- Explainability
- Safe fallback execution
- Reduced external dependency
- Consistent policy enforcement

The deterministic fallback is intended for demonstration and resilience and should not be considered a production-grade predictive model.

---

# 📈 Project Status

| Feature | Status |
|---|---|
| AI Recovery Agent | ✅ Complete |
| 8-Stage Agent Pipeline | ✅ Complete |
| Payment Failure Analysis | ✅ Complete |
| Recovery Probability | ✅ Complete |
| Recovery Strategy Selection | ✅ Complete |
| Policy Engine | ✅ Complete |
| Human Approval | ✅ Complete |
| Blocked Actions | ✅ Complete |
| Audit Trail | ✅ Complete |
| Synthetic Payment Provider | ✅ Complete |
| Razorpay Webhook Simulation | ✅ Complete |
| Webhook Signature Verification | ✅ Complete |
| Dry-Run Recovery | ✅ Complete |
| Vercel Deployment | ✅ Complete |
| Production Demo | ✅ Ready |

---

# 🚀 Future Scope

- Production payment provider integrations
- Real ML-based recovery prediction
- LLM-powered payment failure reasoning
- Customer behavioral modeling
- Personalized recovery strategies
- Multi-gateway optimization
- Real-time payment anomaly detection
- Advanced revenue forecasting
- Continuous outcome-based learning
- Multi-tenant merchant architecture
- Role-based access control
- Persistent production database
- Advanced observability
- Production-grade authentication and authorization

---

# 🏆 Why RecoverAI?

RecoverAI is designed to move beyond simple payment retries.

### Traditional Approach

```text
Payment Failed
      ↓
Retry
      ↓
Success / Failure
```

### RecoverAI Approach

```text
Payment Failed
      ↓
Understand the Failure
      ↓
Predict Recovery Probability
      ↓
Select Strategy
      ↓
Check Financial Policy
      ↓
Allow / Approve / Block
      ↓
Execute
      ↓
Verify
      ↓
Audit
```

This creates a:

**Policy-Controlled + Explainable + Auditable AI Recovery Agent**

---

# 🌟 Key Differentiators

| Capability | RecoverAI |
|---|---|
| AI-driven recovery decisions | ✅ |
| Recovery probability | ✅ |
| Explainable decisions | ✅ |
| Policy guardrails | ✅ |
| Human-in-the-loop | ✅ |
| Risk-based decisions | ✅ |
| Razorpay webhook integration | ✅ |
| Webhook signature verification | ✅ |
| Verification layer | ✅ |
| Complete audit trail | ✅ |
| Safe dry-run execution | ✅ |

---

# 📜 Disclaimer

RecoverAI is currently a demonstration and prototype system.

All payment records, customer information, dashboard metrics, recovery outcomes, and financial values displayed in the demo are synthetic.

The current Razorpay integration is intended for webhook demonstration and does not perform real customer charges or real money movement.

A production implementation would require additional security, authentication, authorization, compliance validation, payment-provider certification, persistent infrastructure, monitoring, financial controls, data protection, and production-grade AI/ML validation.

---

# 🔗 Links

### 🚀 Live Demo

https://recover-ai-app.vercel.app/

### 📦 GitHub Repository

https://github.com/mjs281018-web/recover-ai

---

## 👨‍💻 RecoverAI

**AI-Powered Payment Failure & Revenue Recovery Agent**

Built with:

**Next.js · React · TypeScript · Tailwind CSS · Razorpay Webhooks · AI Decision Layer · Policy Engine · Human Approval · Audit Trail · Vercel**

---

<p align="center">
  ⭐ If you find RecoverAI interesting, consider starring the repository.
</p>
