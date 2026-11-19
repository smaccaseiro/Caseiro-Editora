# Security Specification & Red-Team Payloads — Caseiro Editora

## 1. Data Invariants
1. **Identity Integrity**: User profile documents at `/users/{userId}` can only be created when `request.auth.uid == userId`, `request.auth.token.email_verified == true`, and `data.uid == request.auth.uid`.
2. **Privilege Escalation Prevention**: Non-admin users MUST always create profiles with `isAdmin == false` and are permanently forbidden from modifying `isAdmin` on updates (`incoming().isAdmin == existing().isAdmin`). Admin authority is verified via `request.auth.token.email == 'smaccaseiro@gmail.com' && request.auth.token.email_verified == true` or `/admins/{uid}`.
3. **PII Isolation**: `/users/{userId}`, `/contactMessages/{messageId}`, and `/newsletterSubscribers/{subscriberId}` contain PII (`email`, `name`) and NEVER permit blanket `isSignedIn()` reads or lists. Non-admins can only read their own `/users/{uid}` doc and cannot read/list contact messages or newsletter subscribers.
4. **Strict Keys & Payload Bounds**: Every collection enforces `keys().hasAll(...) && keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, string `.size()` limits, ID regex `^[a-zA-Z0-9_\-]+$`, bounded array `.size() <= 500`, and server timestamps `request.time`.
5. **Catalog Integrity**: Only verified admins can create, update, or delete `/books/{bookId}` and `/categories/{categoryId}`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Admin Promotion on Registration**: `users/attacker` create `{ uid: "attacker", isAdmin: true, ... }` -> MUST DENY.
2. **Shadow Field Injection ("Ghost Field")**: `users/u1` update `{ ..., favorites: ["1"], role: "superadmin", updatedAt: serverTimestamp() }` -> MUST DENY.
3. **Email Spoofing Without Verification**: Auth token `{ email: "smaccaseiro@gmail.com", email_verified: false }` trying to write `/books/b1` -> MUST DENY.
4. **UID Spoofing in Profile Create**: User `u1` creating `/users/u1` with `{ uid: "u2", ... }` -> MUST DENY.
5. **Cross-User PII Read**: User `u1` calling `get(/users/u2)` or `list(/users)` -> MUST DENY.
6. **Unauthorized Admin Mutation of Books**: Non-admin authenticated user creating/deleting `/books/b1` -> MUST DENY.
7. **Unbounded Array Resource Exhaustion**: Writing `favorites` or `content` with `> 500` items -> MUST DENY.
8. **Type Poisoning on Update**: Updating `users/u1` with `{ isSubscribed: "yes", updatedAt: serverTimestamp() }` -> MUST DENY.
9. **1.5KB Document ID Poisoning**: Creating `/books/<2000-char-id>` or `/contactMessages/bad$id!` -> MUST DENY.
10. **Forged Client Timestamp**: Creating `/contactMessages/m1` with `createdAt: "2020-01-01"` instead of `request.time` -> MUST DENY.
11. **Public Scraping of Newsletter / Contact PII**: Non-admin user listing `/newsletterSubscribers` or `/contactMessages` -> MUST DENY.
12. **Terminal Status Bypass by Non-Admin**: Non-admin updating `/contactMessages/m1` status from `'new'` to `'replied'` -> MUST DENY.
