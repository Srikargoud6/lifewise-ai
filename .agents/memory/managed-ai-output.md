---
name: Managed AI output compatibility
description: Live-observed structured-output and native-script constraints for managed OpenAI.
---

Use strict structured output for multi-step scenario shape, but retain local
validation. For native-language translation, explicitly request the native
script and validate it locally rather than assuming the language name prevents
Latin transliteration.

**Why:** A live Hindi translation returned Latin-script Hindi. Adding a native
Unicode-range regex to provider-side strict JSON Schema caused a provider request
failure; a native-script prompt with JSON-object output and local regex
validation succeeded. The exact provider limitation was not established.

**How to apply:** Do not reintroduce Unicode-pattern constraints into
provider-side schemas without a compatibility check. Keep failed validation
explicit; never silently label transliteration or English as a native-script
translation.
