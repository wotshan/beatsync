---
name: OpenAPI integer compatibility
description: Current workspace codegen uses a Zod version without the z.int helper emitted for OpenAPI integer schemas.
---

Use numeric OpenAPI schemas for API fields that need whole-number semantics, then round or validate at the server boundary when necessary.

**Why:** The installed generated-validation stack rejected z.int during codegen typechecking, while numeric schemas generated portable z.number validators.

**How to apply:** When adding API contracts, prefer number in the spec unless the generator/runtime is upgraded and integer output is confirmed compatible.