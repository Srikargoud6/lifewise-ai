---
name: AgenticOrg deployment authentication
description: Why AgenticOrg authentication diagnosis must start with the actual user dashboard origin.
---

Confirm the AgenticOrg deployment the user actually uses before diagnosing an
authentication failure or sending its credentials. Do not silently use a generic
SDK default host.

**Why:** The generic SDK host and the user's Pine Labs hackathon deployment are
separately authenticated. A 401 from the generic host initially made the app's
key look invalid without first confirming it belonged to that host. Even a
correct API route does not establish that it is the correct deployment.

**How to apply:** Use the configured origin documented in replit.md and the
deployment's current API contract. Use a bounded read-only credential check
before any billable agent execution. Distinguish 401 from 403; neither alone
proves an API key needs different scopes.

Do not treat current public-repository or SDK authentication support as proof
of what the hackathon server has deployed. If a replacement workspace key with
the documented format still fails through independent HTTP clients, obtain
the deployment-specific integration instructions rather than repeatedly
asking the user to rotate keys.
