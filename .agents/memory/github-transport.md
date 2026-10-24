---
name: GitHub transport authorization
description: Distinguish connector attachment failures from authorization of normal Git operations.
---

A failed GitHub connector attachment does not by itself establish that normal
Git transport is unavailable. Do not repeatedly request authorization or switch
accounts based only on connector admission errors.

**Why:** Workspace connector attachment was rejected while a separately
authorized, ordinary Git push succeeded through Replit's secure GitHub proxy.

**How to apply:** For an explicitly user-approved repository, check the normal
Git remote and try the requested non-forced operation through the existing
transport. Respect any transport authorization failure; never expose or extract
credentials, bypass access controls, or overwrite remote history to get past it.
