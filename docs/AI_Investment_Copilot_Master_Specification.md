# AI INVESTMENT COPILOT — MASTER PRODUCT & ENGINEERING SPECIFICATION
## Project: Youth Investment Copilot — CaixaBank / Imagin × Google Cloud
### Purpose: Production-ready blueprint for Codex / VS Code implementation

---

## 0. EXECUTIVE DIRECTIVE

Build a production-oriented mobile-first investment application for young users.

The application must make investing feel:

- simple;
- natural;
- visual;
- trustworthy;
- modern;
- motivating;
- educational;
- never intimidating.

The user should feel that they are having a natural conversation with **one intelligent investment copilot**, not interacting with a complex financial system.

Behind the interface, implement a sophisticated multi-agent architecture capable of:

1. understanding the user's language and voice;
2. building and continuously updating a financial profile;
3. evaluating financial capacity, risk tolerance and investment horizon;
4. monitoring the user's portfolio;
5. monitoring relevant financial markets in near real time;
6. analysing macroeconomic conditions;
7. analysing financial news and events;
8. performing quantitative analysis;
9. comparing eligible investment products;
10. detecting portfolio concentration and risk;
11. generating explainable investment actions;
12. enforcing regulatory and safety constraints;
13. educating the user at the exact moment education is useful;
14. maintaining a natural, concise and human conversation;
15. making recurring investing effortless.

The application must **never pretend to predict markets with certainty**.

Market intelligence should inform decisions, not create false promises of future returns.

---

# 1. CORE PRODUCT VISION

## Product concept

### "Your Investment Copilot"

The user provides:

- a goal;
- an amount;
- a time horizon;
- their preferences.

The system continuously analyses:

- the user's financial situation;
- their portfolio;
- current market conditions;
- relevant news;
- available products;
- risk;
- costs;
- diversification;
- suitability.

The application then communicates one simple conclusion.

Examples:

> "I'd keep things as they are this month."

> "You have €30 available and your long-term plan still makes sense. I'd put it into your diversified global allocation."

> "Something changed this week. Interest rates moved more than expected, but you don't need to do anything."

> "You said you may need this money in six months. I wouldn't put it into a volatile investment."

The complexity must remain behind the scenes.

---

# 2. NON-NEGOTIABLE UX PRINCIPLE

## Complex backend, simple frontend.

The user should never see:

- agent names;
- orchestration graphs;
- model reasoning;
- internal scores;
- raw market indicators;
- technical terminology unless explained;
- raw API responses;
- compliance implementation details.

Instead, the user sees:

- cards;
- simple charts;
- short explanations;
- conversational answers;
- clear actions;
- visual risk indicators;
- progress;
- goals;
- simple numbers.

Every complex concept must have a plain-language explanation.

---

# 3. CONVERSATIONAL COPILOT

The Copilot is the only conversational identity exposed to the user.

Internally, many specialised agents may contribute.

The Copilot must sound:

- natural;
- warm;
- intelligent;
- concise;
- confident but not arrogant;
- youthful without being childish;
- conversational without being unprofessional.

## It must NOT sound like:

> "According to your risk profile, the system recommends..."

Prefer:

> "Based on what you've told me, I'd keep this simple."

## It must NOT sound like:

> "Your financial capacity score is 73."

Prefer:

> "You have enough room to start with a small monthly amount without putting your everyday finances under pressure."

## It must NOT overuse emojis.

Use them sparingly and consistently.

## It must never use fake human claims.

Do not say:

- "I personally bought..."
- "I know exactly how you feel..."
- "I guarantee..."
- "Trust me..."

---

# 4. CONVERSATION DESIGN

## One question at a time

Never overwhelm the user with a questionnaire.

Bad:

> "What is your income, savings, debt, investment experience, goals, horizon and risk tolerance?"

Good:

> "What would you like your money to help you achieve?"

Then wait.

The next question should depend on the answer.

## Conversational memory

During the session, remember:

- stated goal;
- target date;
- available amount;
- risk answers;
- preferences;
- questions already answered;
- explanations already given.

Do not ask the same question twice unless information has become stale or contradictory.

## Progressive disclosure

Only reveal information when it becomes useful.

First:

> "I'd start with €25/month."

Then:

> "Here's why."

Then:

> "Here's the risk."

Then:

> "Here are the costs."

The user can always expand for more detail.

---

# 5. COPILOT RESPONSE FORMAT

Every important investment response should conceptually follow:

### 1. Direct answer
One sentence.

### 2. Why
Maximum three reasons.

### 3. Risk
One clear sentence.

### 4. Action
One primary CTA.

Example:

> **I'd keep investing €25/month into your diversified plan.**
>
> Why:
> - You have a long horizon.
> - You don't need this money soon.
> - Your portfolio is already well diversified.
>
> ⚠️ The value can fall in the short term.
>
> **[Invest €25]**
>
> [Why am I seeing this?]

Do not show all reasoning at once.

---

# 6. VISUAL LANGUAGE

The UI should feel closer to a modern consumer app than a traditional trading terminal.

## Primary components

### Investment cards

Each card contains:

- simple name;
- one-line description;
- risk;
- recommended horizon;
- cost;
- diversification;
- one CTA.

Example:

> ## 🌍 Global Plan
> Thousands of companies around the world in one investment.
>
> Risk: ●●●○○
> Horizon: 5+ years
> Cost: Low
>
> **[See why]**

### Risk indicator

Never rely only on colours.

Use:

- Low;
- Moderate;
- Higher;
- High.

And an accessible visual scale.

### Goal cards

Example:

> ## ✈️ Summer trip
> €420 / €1,000
> ███████░░░ 42%
>
> Target: July 2027

### Portfolio health

A non-predictive score may be used for education and monitoring, but it must not replace suitability or regulatory assessments.

Display:

- diversification;
- concentration;
- costs;
- risk alignment;
- progress.

Example:

> **Portfolio health: Good**
>
> "Your portfolio is diversified, your costs are low and your risk still matches your long-term goal."

---

# 7. HOME SCREEN

The home screen should answer five questions immediately:

1. How much do I have?
2. What am I trying to achieve?
3. Is everything okay?
4. Should I do anything?
5. What can I learn/discover?

Suggested structure:

```text
GOOD MORNING 👋

Your money
€3,240

Portfolio
+2.8%*
[View]

YOUR PLAN
Build long-term wealth
███████░░░ 68%

COPILOT
"Nothing you need to change today."

[Why?]

THIS MONTH
€30 available to invest

[Invest €30]

DISCOVER
"What is happening with AI stocks?"
[Explore]
```

*Performance displays must include appropriate time period and risk context.

---

# 8. THE MULTI-AGENT ARCHITECTURE

Implement 14 specialised agents plus a central Decision Engine.

## Layer A — USER UNDERSTANDING

### Agent 01 — Voice & Language Agent

Responsibilities:

- speech-to-text integration;
- language detection;
- slang interpretation;
- intent extraction;
- amount extraction;
- timeframe extraction;
- ambiguity detection;
- sentiment/emotional signal extraction.

Input:

- text;
- optional audio transcript;
- conversation state.

Output:

```json
{
  "intent": "investment_question",
  "language": "en",
  "goal": null,
  "amount": 30,
  "time_horizon": null,
  "risk_statement": null,
  "emotion": "neutral",
  "confidence": 0.96,
  "needs_clarification": true
}
```

Never make investment decisions.

---

### Agent 02 — Customer Profile Agent

Build and update the user's structured financial profile.

Track:

- financial situation;
- income stability;
- savings;
- emergency liquidity;
- debt;
- investment experience;
- knowledge;
- preferences;
- goals;
- time horizon;
- risk tolerance;
- capacity to absorb losses.

Maintain source provenance:

- user stated;
- bank data;
- inferred;
- calculated;
- stale.

Never silently convert assumptions into facts.

---

### Agent 03 — Goals & Horizon Agent

Determine:

- goal type;
- target amount;
- target date;
- priority;
- liquidity requirement;
- acceptable uncertainty;
- whether the money is needed soon.

Hard rule:

A product whose risk/horizon profile is incompatible with the user's goal cannot be recommended merely because current market conditions look attractive.

---

### Agent 04 — Behavioural Psychology Agent

Detect:

- FOMO;
- panic;
- impulsive buying;
- performance chasing;
- excessive trading;
- loss aversion;
- overconfidence;
- concentration enthusiasm;
- contradictory risk behaviour.

Example:

User:

> "Everyone is buying AI. Should I put all my money in?"

Agent flags:

```json
{
  "fomo": true,
  "concentration_risk": "high",
  "requires_cooling_off": true
}
```

The Copilot should respond calmly rather than encouraging the behaviour.

---

# 9. FINANCIAL SAFETY LAYER

### Agent 05 — Financial Capacity Agent

Calculate sustainable investable capacity.

Conceptually:

```text
Disposable cash flow
- essential expenses
- near-term commitments
- debt obligations
- required liquidity buffer
= sustainable investable capacity
```

Never use a simplistic income percentage as the sole decision rule.

Use absolute and relative measures.

---

### Agent 06 — Risk Agent

Separate:

## Risk tolerance

"What market losses are you psychologically willing to tolerate?"

from:

## Risk capacity

"What losses can your finances actually withstand?"

The effective risk ceiling is:

```text
Effective Risk Ceiling =
MIN(Risk Tolerance, Risk Capacity)
```

Do not let financial literacy increase risk capacity.

---

### Agent 07 — Compliance Agent

Act as a mandatory gate.

Validate:

- required information;
- applicable suitability/convenience requirements;
- product eligibility;
- risk disclosures;
- costs;
- documentation;
- regulatory constraints;
- conflicts;
- appropriate service type.

This agent can veto any action.

The application must be designed for professional legal/compliance review before production deployment.

---

### Agent 08 — Data Quality & Suitability Agent

Check:

- completeness;
- consistency;
- freshness;
- contradictory answers;
- stale financial data;
- confidence.

Output:

```json
{
  "data_confidence": 94,
  "profile_complete": true,
  "contradictions": [],
  "requires_reassessment": false
}
```

If critical data is missing:

> "I need one more detail before I can give you a personalised recommendation."

Never fabricate missing information.

---

# 10. MARKET INTELLIGENCE LAYER

### Agent 09 — Market Intelligence Agent

Continuously ingest authorised near-real-time market data.

Monitor, as applicable:

- major indices;
- interest rates;
- inflation;
- central banks;
- currencies;
- commodities;
- volatility;
- credit conditions;
- sector performance;
- market breadth;
- valuations;
- liquidity.

Output structured signals, not user-facing recommendations.

Example:

```json
{
  "asset": "global_equities",
  "market_regime": "elevated_volatility",
  "valuation_signal": "neutral",
  "momentum_signal": "positive",
  "macro_signal": "mixed",
  "confidence": 0.78,
  "timestamp": "ISO-8601"
}
```

All market data must include timestamps and source metadata.

---

### Agent 10 — News & Events Agent

Monitor trusted, authorised sources.

Classify:

- central bank events;
- earnings;
- regulation;
- geopolitical events;
- corporate actions;
- economic releases;
- sector-specific events.

Rank information by:

1. source credibility;
2. relevance;
3. materiality;
4. recency;
5. corroboration.

Do not treat social-media virality as evidence.

Output:

```json
{
  "event": "central_bank_decision",
  "severity": "medium",
  "relevance": 0.81,
  "market_impact_areas": ["bonds", "equities"],
  "confidence": 0.93
}
```

---

### Agent 11 — Quantitative Analysis Agent

Analyse eligible assets/products using approved models.

Possible metrics:

- volatility;
- maximum drawdown;
- rolling returns;
- Sharpe ratio;
- correlation;
- beta;
- valuation;
- momentum;
- liquidity;
- tracking difference;
- fee impact;
- scenario analysis.

Use multiple horizons.

Never treat historical performance as guaranteed future performance.

Never generate a single-number "buy certainty".

---

### Agent 12 — Portfolio & Product Agent

Maintain a real-time/near-real-time representation of:

- current holdings;
- allocation;
- concentration;
- product characteristics;
- fees;
- liquidity;
- currency exposure;
- geographic exposure;
- sector exposure;
- risk;
- available products.

Compare the user's current portfolio against eligible alternatives.

Important:

**The system must consider what the user already owns.**

---

# 11. DECISION LAYER

### Agent 13 — Investment Decision Engine

This is the only component allowed to produce a final investment action proposal.

Inputs:

- user profile;
- financial capacity;
- risk tolerance;
- risk capacity;
- goals;
- horizon;
- portfolio;
- product data;
- market intelligence;
- news;
- quantitative analysis;
- behavioural signals;
- compliance result;
- data confidence.

Possible actions:

```text
INVEST
KEEP
WAIT
REDUCE
REBALANCE
LEARN
ASK_CLARIFICATION
PROTECT
```

"WAIT" and "KEEP" are first-class valid outcomes.

---

# 12. DECISION ENGINE — PROFESSIONAL RUBRIC

Do NOT use a single weighted score as the sole decision mechanism.

Use:

## Layer 1 — Hard Constraints

Any failure can block the action.

Examples:

```text
critical_data_missing → BLOCK
horizon_mismatch → BLOCK
risk_capacity_exceeded → BLOCK
compliance_failed → BLOCK
product_ineligible → BLOCK
liquidity_requirement_conflict → BLOCK
```

## Layer 2 — Suitability Score

0–100.

Suggested weighting:

| Dimension | Weight |
|---|---:|
| Goal alignment | 20 |
| Horizon alignment | 20 |
| Risk alignment | 20 |
| Loss capacity | 15 |
| Liquidity | 10 |
| Knowledge & experience | 5 |
| Cost efficiency | 5 |
| Diversification benefit | 5 |

The score is informative only after hard constraints pass.

## Layer 3 — Market Opportunity Score

0–100.

Suggested components:

| Signal | Weight |
|---|---:|
| Valuation | 20 |
| Momentum | 15 |
| Volatility/regime | 15 |
| Macro | 15 |
| Rates | 10 |
| Sentiment | 10 |
| Flows | 5 |
| Upcoming events | 10 |

This score does NOT mean probability of profit.

It represents the strength and coherence of current signals.

## Layer 4 — Portfolio Benefit Score

0–100.

Assess:

- diversification;
- concentration reduction;
- risk alignment;
- goal alignment;
- cost;
- liquidity.

## Layer 5 — Data Confidence

0–100.

Final recommendations require a configurable minimum confidence threshold.

---

# 13. ACTION SCORE

Calculate an internal:

## Investment Action Score (IAS)

Conceptually:

```text
IAS =
0.45 × Suitability
+ 0.20 × Portfolio Benefit
+ 0.20 × Market Opportunity
+ 0.10 × Cost Efficiency
+ 0.05 × Data Confidence
```

BUT:

```text
If any hard constraint fails:
IAS is irrelevant → BLOCK
```

Do not expose IAS directly to the user.

The user sees:

> "Strong fit"

or:

> "This doesn't look like the right moment for you"

with an explanation.

---

# 14. PRODUCT MATCHING

Every product must have a structured product profile.

Example:

```json
{
  "product_id": "PRODUCT-001",
  "type": "fund",
  "risk_level": 4,
  "recommended_horizon_months": 60,
  "liquidity": "high",
  "complexity": "low",
  "diversification": 0.92,
  "annual_cost": 0.002,
  "currency_exposure": ["EUR", "USD", "JPY"],
  "geographic_exposure": "global",
  "sector_concentration": 0.08,
  "provider": "approved_provider",
  "last_updated": "ISO-8601"
}
```

User-product matching should consider the full vector.

Never recommend purely from:

- past return;
- popularity;
- trending status;
- social media;
- commission to the bank;
- one market signal.

---

# 15. REAL-TIME MARKET FEATURE

Create a feature called:

## "WHY NOW?"

When appropriate, show:

> ### Why now?
> **3 things matter today**
>
> 1. Markets are more volatile than usual.
> 2. Your portfolio is still aligned with your long-term plan.
> 3. You have €30 available to invest.
>
> **My take:** Keep your normal monthly contribution.
>
> [Invest €30]
>
> [Explain more]

Never say:

> "Buy now before prices rise."

Never guarantee timing.

---

# 16. RISK RADAR

Create:

## "Risk Radar"

Only notify users when information is materially relevant.

Example:

> 🔔 **Something changed**
>
> Interest-rate expectations moved this week.
>
> **Does it affect you?**
>
> Not much. Your plan is long term and diversified.
>
> **You don't need to do anything.**

This is preferable to sending constant market alerts.

---

# 17. MARKET PULSE

Create an optional visual section:

> ## Market Pulse
>
> 🌍 Global markets — Mixed
> 🤖 Technology — Strong momentum / elevated volatility
> 💶 Rates — Important event this week
> 🛢️ Commodities — Stable
>
> [Explore]

Every item should be timestamped.

---

# 18. EDUCATION AGENT

### Agent 14 — Youth Experience + Education Agent

The experience layer must convert complex investment concepts into short, visual lessons.

Topics:

- saving vs investing;
- inflation;
- compound growth;
- diversification;
- fees;
- volatility;
- risk;
- index funds;
- bonds;
- equities;
- liquidity;
- time horizon.

Use:

- cards;
- animations;
- mini scenarios;
- interactive questions;
- voice explanations;
- short videos;
- progress.

Do not make education a mandatory obstacle unless required by the applicable product/service rules.

---

# 19. LEARN WHILE INVESTING

When the user encounters an unfamiliar concept:

> "What's a global index?"

Do not send them to a 20-page document.

Answer:

> "Think of it as one basket containing lots of companies around the world. Instead of betting on one company, your money is spread across many."

Then:

> **Want the 20-second version?**

Education is contextual.

---

# 20. GAMIFICATION

Gamification must reward:

- consistency;
- learning;
- diversification;
- long-term behaviour;
- goal progress.

Do NOT reward:

- taking more risk;
- frequent trading;
- leverage;
- speculation;
- chasing returns.

Possible achievements:

### 🌱 First Step
Made your first investment.

### 🔁 Consistency
Invested every month for 6 months.

### 🧠 Money Level 3
Understands diversification.

### 🌍 Diversifier
Built a diversified portfolio.

### 🎯 Goal Builder
Reached 25% of a savings/investment goal.

---

# 21. AUTO-PILOT

Core feature.

User says:

> "I can put €30 away every month."

Copilot:

> "Nice. We can automate that if you want."

User chooses:

- €10/month;
- €25/month;
- €50/month;
- custom.

Every cycle the system rechecks:

- available cash;
- financial capacity;
- goals;
- portfolio;
- risk;
- product eligibility;
- relevant market conditions;
- compliance.

The system can recommend:

- continue;
- change allocation;
- hold;
- pause.

Do not silently change investment strategy.

Where automated execution is legally/technically permitted, require explicit user consent and appropriate controls.

---

# 22. USER MODES

## Mode 1 — START

For beginners.

Focus:

- simplicity;
- education;
- small first investment;
- diversified/basic products;
- automation.

## Mode 2 — GUIDED

For users with more experience.

Show:

- portfolio allocation;
- product comparison;
- market context;
- scenarios;
- recurring investing.

## Mode 3 — EXPLORE

For curious users.

Ask:

> "What's happening with AI?"

The system can explore sectors, companies and themes.

Clearly label:

> INFORMATION

versus:

> PERSONALISED RECOMMENDATION

## Mode 4 — PROTECT

When the financial situation suggests investing may be inappropriate.

Say:

> "I wouldn't invest this money yet. Let's strengthen your financial buffer first."

This is a success state, not a failure.

---

# 23. CONVERSATIONAL EXAMPLES

## Beginner

User:

> "I know literally nothing about investing."

Copilot:

> "Perfectly fine. You don't need to become a finance expert. We'll keep it simple. First: what would you like your money to help you do?"

---

## FOMO

User:

> "Everyone is buying AI. Should I put €2,000 in?"

Copilot:

> "I wouldn't put all €2,000 into one theme just because it's trending. That would make your portfolio much more concentrated."
>
> "If you're interested in AI, we can look at a small allocation that doesn't take over your whole plan."
>
> [Show me]

---

## Market drop

User:

> "Everything is down 8%. Should I sell?"

Copilot:

> "Not automatically."
>
> "Your plan is long term, and the money isn't needed soon. An 8% drop is uncomfortable, but it doesn't by itself mean the plan is wrong."
>
> "Let me check whether anything important has changed in your portfolio."
>
> [Check my plan]

---

## No action

User:

> "What should I buy today?"

Copilot:

> "For you, I wouldn't change anything today."
>
> "Your current plan is already diversified and fits your goal. There isn't a strong enough reason to make a change just because the market moved."
>
> [Why?]

This is a critical product behaviour.

---

# 24. PERSONALISATION

The Copilot should learn preferences such as:

- preferred language;
- preferred explanation depth;
- voice vs text;
- visual vs textual explanations;
- preferred notification frequency;
- recurring investment amount;
- preferred learning format.

Do not infer sensitive personal attributes.

---

# 25. NOTIFICATION ENGINE

Notifications must be scarce and useful.

Priorities:

### P0 — Critical
Potentially important account/security/compliance event.

### P1 — Important
Relevant portfolio or financial event.

### P2 — Useful
Goal or investing reminder.

### P3 — Educational
Optional learning content.

Never send notifications simply to increase engagement.

---

# 26. TRUST & TRANSPARENCY

Every personalised recommendation must be explainable.

Store an internal recommendation record:

```json
{
  "recommendation_id": "REC-123",
  "timestamp": "ISO-8601",
  "user_profile_version": "PROFILE-22",
  "portfolio_version": "PORT-11",
  "market_snapshot": "MARKET-991",
  "product_snapshot": "PRODUCT-88",
  "hard_constraints_passed": true,
  "suitability_score": 91,
  "portfolio_benefit_score": 87,
  "market_opportunity_score": 72,
  "data_confidence": 96,
  "action": "INVEST",
  "explanation": [
    "Long investment horizon",
    "Adequate financial capacity",
    "Improves diversification"
  ]
}
```

This creates auditability.

---

# 27. DATA FRESHNESS

Every dynamic financial input must have:

- timestamp;
- source;
- freshness status;
- confidence;
- fallback state.

Never use stale market information while presenting it as real time.

If market data is unavailable:

> "I'm not getting reliable live market data right now, so I won't pretend I know what is happening."

This is a trust feature.

---

# 28. SOURCE HIERARCHY

For market intelligence, prefer:

1. authorised market-data providers;
2. official institutions;
3. company filings;
4. regulated/public disclosures;
5. high-quality financial news;
6. secondary sources.

Do not rely on social media as a primary source.

---

# 29. SYSTEM SAFETY

The application must never:

- guarantee returns;
- promise profit;
- claim certainty about future prices;
- encourage FOMO;
- recommend inappropriate risk;
- hide fees;
- hide losses;
- invent financial data;
- fabricate live market information;
- make decisions from stale data without warning;
- override compliance;
- silently change a user's investment strategy.

---

# 30. HUMAN OVERSIGHT

Provide escalation to a human advisor/support flow when:

- user disputes a recommendation;
- financial information is contradictory;
- regulatory requirements cannot be satisfied;
- product complexity is high;
- system confidence is low;
- unusual financial circumstances are detected;
- user explicitly asks for human help.

---

# 31. TECHNICAL ARCHITECTURE

Suggested implementation:

## Frontend

Build a mobile-first responsive application.

Preferred architecture:

- React / Next.js for prototype/web;
- React Native or equivalent for mobile production;
- TypeScript;
- component-driven design;
- accessible design system;
- responsive cards and charts.

## Backend

- TypeScript/Node.js or Python;
- API gateway;
- authentication;
- user profile service;
- portfolio service;
- product catalogue;
- market-data service;
- news service;
- recommendation service;
- notification service;
- audit service.

## AI

Use a model orchestration layer capable of routing tasks to specialised agents.

Google Cloud / Vertex AI can be used where appropriate.

The architecture must remain model-agnostic enough to replace individual models.

---

# 32. EVENT-DRIVEN DESIGN

Use events such as:

```text
USER_MESSAGE_RECEIVED
PROFILE_UPDATED
MARKET_EVENT_DETECTED
NEWS_EVENT_DETECTED
PORTFOLIO_CHANGED
GOAL_CHANGED
RISK_PROFILE_CHANGED
DATA_BECAME_STALE
RECOMMENDATION_CREATED
COMPLIANCE_BLOCKED
USER_INVESTMENT_CONFIRMED
MONTHLY_AUTOPILOT_TRIGGERED
```

Agents should respond to relevant events rather than constantly calling one another.

---

# 33. AGENT CONTRACT

Every agent must have:

```text
SYSTEM PROMPT
INPUT SCHEMA
OUTPUT SCHEMA
TOOLS
PERMISSIONS
DATA SOURCES
CONFIDENCE MODEL
ERROR STATES
TIMEOUT
RETRY POLICY
ESCALATION RULES
AUDIT LOGGING
```

Agents must be deterministic where possible.

Financial calculations must be performed by deterministic code, not generated by an LLM.

LLMs may interpret and explain results but must not be the source of truth for arithmetic.

---

# 34. DECISION ENGINE IMPLEMENTATION RULE

Separate:

### LLM responsibilities

- language;
- interpretation;
- summarisation;
- explanation;
- conversational interaction.

### Deterministic software responsibilities

- scoring;
- financial calculations;
- risk limits;
- eligibility;
- thresholds;
- portfolio allocation;
- fee calculations;
- market timestamps;
- rule enforcement.

Never ask an LLM:

> "Calculate whether the user can afford to invest €500."

Calculate it in code and pass the result to the LLM.

---

# 35. TESTING REQUIREMENTS

Create automated tests for:

## Profile tests

- beginner;
- experienced investor;
- unstable income;
- high liquidity needs;
- high debt;
- long-term investor.

## Behaviour tests

- FOMO;
- panic;
- overconfidence;
- contradictory answers.

## Market tests

- normal market;
- high volatility;
- crash;
- missing market data;
- stale data;
- contradictory sources.

## Compliance tests

- missing information;
- unsuitable product;
- excessive risk;
- unavailable product.

## UX tests

The Copilot must:

- ask one question at a time;
- avoid jargon;
- answer directly;
- never expose internal agent details;
- clearly show risk and costs;
- provide one primary CTA;
- explain recommendations.

---

# 36. DESIGN SYSTEM

Create a reusable design system with:

- typography;
- spacing;
- cards;
- buttons;
- badges;
- risk indicators;
- charts;
- progress bars;
- bottom sheets;
- chat bubbles;
- voice UI;
- empty states;
- error states;
- loading states.

Accessibility:

- WCAG-conscious contrast;
- keyboard navigation where applicable;
- screen-reader labels;
- colour-independent meaning;
- readable financial figures;
- motion reduction support.

---

# 37. VISUAL PRINCIPLES

Use:

- generous whitespace;
- large numbers;
- rounded cards;
- subtle motion;
- simple charts;
- progressive disclosure;
- clear hierarchy.

Avoid:

- dense dashboards;
- trading-terminal aesthetics;
- excessive green/red;
- flashing prices;
- casino-like animations;
- aggressive alerts.

The visual identity should communicate:

> "Investing is understandable."

Not:

> "Trading is exciting."

---

# 38. CORE USER JOURNEY

```text
OPEN APP
   ↓
NATURAL WELCOME
   ↓
GOAL
   ↓
HORIZON
   ↓
FINANCIAL CAPACITY
   ↓
RISK
   ↓
PROFILE CREATED
   ↓
FIRST SIMPLE RECOMMENDATION
   ↓
WHY?
   ↓
RISK + COST
   ↓
FIRST INVESTMENT
   ↓
CELEBRATE
   ↓
AUTOPILOT
   ↓
ONGOING MONITORING
   ↓
MARKET PULSE
   ↓
LEARN WHEN NEEDED
   ↓
LONG-TERM HABIT
```

---

# 39. FIRST INVESTMENT EXPERIENCE

The first investment must feel like a milestone.

After confirmation:

> ## 🌱 You're officially investing.
>
> €25 is now working toward your long-term plan.
>
> You don't need to watch it every day.
>
> **Your next move:** nothing.
>
> We'll keep an eye on the plan with you.

Avoid confetti overload or casino-style celebration.

The emotional message should be:

> "I have started building a financial habit."

---

# 40. LONG-TERM ENGAGEMENT LOOP

The product's engagement loop is:

```text
UNDERSTAND
   ↓
START
   ↓
SEE PROGRESS
   ↓
LEARN
   ↓
AUTOMATE
   ↓
REVIEW
   ↓
ADAPT WHEN NECESSARY
   ↓
REPEAT
```

Not:

```text
CHECK PRICE
→ TRADE
→ CHECK PRICE
→ TRADE
```

---

# 41. MVP PRIORITY

Build in this order.

## Phase 1 — Foundation

- authentication mock;
- user profile;
- chat;
- voice input;
- goal onboarding;
- financial profile;
- risk questionnaire;
- product catalogue;
- deterministic Decision Engine;
- recommendation cards.

## Phase 2 — Intelligence

- portfolio simulation;
- market data integration;
- news integration;
- quantitative analysis;
- Risk Radar;
- Why Now;
- Market Pulse.

## Phase 3 — Behaviour

- education;
- gamification;
- goals;
- Auto-Pilot;
- notifications.

## Phase 4 — Production integration

- secure bank integrations;
- authorised market-data providers;
- regulatory/compliance review;
- execution systems;
- audit;
- human escalation.

---

# 42. DEMO MODE

For development, create a fully simulated environment.

Use mock:

- user accounts;
- balances;
- portfolios;
- market prices;
- news;
- products;
- recommendations.

Include a visible developer/demo mode but make the production UI look real.

Create at least these demo personas:

### Persona A — Beginner

€1,500 savings, €25/month capacity, low experience.

### Persona B — Long-term

Stable income, €100/month, 10+ year horizon.

### Persona C — FOMO

Wants to invest everything in AI after seeing social-media hype.

### Persona D — Short horizon

Needs money in 8 months.

### Persona E — High experience

Understands products and has significant capacity.

### Persona F — Protect

Low emergency buffer and unstable finances.

---

# 43. REPOSITORY STRUCTURE

Create a clean monorepo:

```text
investment-copilot/
├── apps/
│   ├── web/
│   └── mobile/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── decision-engine/
│   ├── financial-models/
│   ├── agent-contracts/
│   └── config/
├── services/
│   ├── orchestration/
│   ├── profile/
│   ├── portfolio/
│   ├── market-data/
│   ├── news/
│   ├── products/
│   ├── recommendations/
│   ├── compliance/
│   └── notifications/
├── agents/
│   ├── voice-language/
│   ├── profile/
│   ├── goals/
│   ├── behavioural/
│   ├── financial-capacity/
│   ├── risk/
│   ├── compliance/
│   ├── data-quality/
│   ├── market-intelligence/
│   ├── news-events/
│   ├── quantitative/
│   ├── portfolio-product/
│   ├── decision-engine/
│   └── experience-education/
├── tests/
├── docs/
└── README.md
```

---

# 44. CODEX EXECUTION INSTRUCTIONS

When implementing this specification:

1. Do not attempt to build the whole production system in one step.
2. First inspect the repository.
3. Identify the existing stack.
4. Create an implementation plan.
5. Create the domain models and shared types.
6. Implement deterministic financial calculations first.
7. Implement the Decision Engine.
8. Implement agent contracts.
9. Implement mocked agents.
10. Implement orchestration.
11. Implement the Copilot chat.
12. Implement the visual UI.
13. Add simulated market data.
14. Add portfolio simulation.
15. Add tests.
16. Only then integrate external APIs.

Never hard-code fake financial facts as if they were live.

Use clearly labelled mock data for development.

---

# 45. DEFINITION OF DONE

The prototype is successful when a young user can:

1. open the app;
2. talk naturally to the Copilot;
3. answer the onboarding questions without feeling like they are filling out a financial form;
4. understand their starting profile;
5. see a simple investment recommendation;
6. understand why it was recommended;
7. see risk and costs clearly;
8. see what is happening in the market;
9. ask "should I invest now?";
10. receive a cautious, evidence-based answer;
11. make a simulated investment;
12. create a monthly Auto-Pilot;
13. see goal progress;
14. learn a concept in under one minute;
15. return later and understand immediately whether anything needs attention.

---

# 46. FINAL PRODUCT PRINCIPLE

The application should feel like:

> **ChatGPT + a modern banking app + a personal financial coach + a professional investment research desk**

without exposing the complexity behind it.

The user should never need to understand the agents.

They should simply feel:

> "I can talk to this thing normally."

> "It understands my situation."

> "It knows what's happening in the markets."

> "It tells me when I actually need to do something."

> "It explains things without making me feel stupid."

> "I can start with €10, €25 or €50."

> "And I don't have to become a trader to invest."

That is the core product.

# END OF MASTER SPECIFICATION
