# Firestore Security Specification

## 1. Data Invariants
1. Every `/users/{userId}` document must belong strictly to `request.auth.uid == userId`, with `role == 'teacher'` enforced on client creation (preventing privilege escalation).
2. Every `/users/{userId}/datasets/{datasetKey}` document cannot exist without a valid parent `/users/{userId}` document (`exists(...)` Master Gate) and must match an allowlisted `datasetKey` and `uid == request.auth.uid`.
3. `createdAt`, `uid`, and `datasetKey` are immutable after creation; `updatedAt` and `createdAt` must equal `request.time`.
4. Only verified admin (`admins/{uid}` or verified bootstrap admin email) can write `/appMeta/release` or update another user's `role`.
5. List queries on `/users` and `/users/{userId}/datasets` strictly enforce `resource.data.uid == request.auth.uid` without `get()`/`exists()` inside `allow list`.

## 2. Dirty Dozen Adversarial Payloads
1. **Unauthenticated Read**: Read `/users/u1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Cross-Tenant Read**: Read `/users/u2/datasets/students_list_v1` as `u1` -> `PERMISSION_DENIED`.
3. **Self-Assigned Admin Role**: Create `/users/u1` with `{ role: "admin" }` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Create `/users/u1` with extra field `isVerified: true` -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Dataset**: Create `/users/u1/datasets/students_list_v1` with `{ uid: "u2" }` -> `PERMISSION_DENIED`.
6. **Orphaned Subcollection Write**: Create `/users/u99/datasets/students_list_v1` when `/users/u99` does not exist -> `PERMISSION_DENIED`.
7. **ID Poisoning**: Write `/users/${'a'.repeat(500)}` -> `PERMISSION_DENIED`.
8. **Invalid Dataset Key Injection**: Write `/users/u1/datasets/arbitrary_evil_key` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Create `/users/u1` with `createdAt` != `request.time` -> `PERMISSION_DENIED`.
10. **Immutable Field Tampering**: Update `/users/u1` changing `uid` or `role` or `createdAt` -> `PERMISSION_DENIED`.
11. **Unverified Admin Email Spoof**: Write `/appMeta/release` with admin email and `email_verified: false` -> `PERMISSION_DENIED`.
12. **Blanket List Query**: List `/users` without `uid == request.auth.uid` constraint -> `PERMISSION_DENIED`.
