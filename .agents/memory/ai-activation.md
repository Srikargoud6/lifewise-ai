---
name: AI activation gate
description: How to handle the AI setup phone-verification status without treating it as a credential failure.
---

An AI setup response of `awaiting_phone_verification` means user activation is
required. Do not assume an API-key failure, inspect credentials, fabricate AI
output, or retry provider setup in a loop.

**Why:** Initial OpenAI provisioning returned this status without provisioning
the AI environment. The ordinary curriculum can still work without a model.

**How to apply:** Explain the activation requirement, keep model-dependent
features explicitly unavailable, and resume setup after the user completes
verification. Do not describe local scoring or authored lessons as external
model or AgenticOrg executions.
