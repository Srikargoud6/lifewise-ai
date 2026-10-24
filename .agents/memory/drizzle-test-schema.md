---
name: Drizzle test database compatibility
description: Why an injected test database can work at runtime but fail TypeScript compatibility.
---
Drizzle's transaction type captures the entire schema module, including exported
validation schemas, not only table definitions. A test client built with no
schema or only tables can execute correctly yet be incompatible with the app's
database transaction type.

**Why:** Narrowing the test schema produced repeated TypeScript failures even
though PostgreSQL transaction tests passed. The mismatch included a non-table
insert validator from the schema barrel.

**How to apply:** When injecting a separate Drizzle connection for isolated
integration tests, match the application's complete schema module rather than
silencing the mismatch with casts.
