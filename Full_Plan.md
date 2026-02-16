# e-Khata — Multi-Tenant Digital Ledger System

A full-stack digital khata (ledger) application replacing traditional paper-based debit/credit systems for Pakistani businesses. Built with **Laravel 11 + MySQL** backend and **React Native (Expo)** for cross-platform mobile & web. Features RTL Urdu/English support, single-DB multi-tenancy via `tenant_id`, role-based access control, bank-statement-style reports, ledger sharing (PDF/WhatsApp/Email/Link/Print), live **JazzCash + EasyPaisa** payment collection & disbursement with auto-ledger recording, full logging system, session management with device tracking, Firebase Phone Auth (OTP), Firebase Cloud Messaging (push notifications), and in-app notification center. Developed by [Esystematic Technologies](https://www.esystematics.com), Gujranwala, Pakistan.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Laravel 11 (PHP) | REST API, business logic, PDF generation |
| Database | MySQL (Single-DB multi-tenant via `tenant_id`) | Data storage with tenant isolation |
| Frontend | React Native (Expo) + Expo Router | Cross-platform: iOS, Android, Web |
| UI Kit | react-native-paper (Material Design 3) | Professional, clean, RTL-ready UI |
| State | Zustand + @tanstack/react-query | Client state + server state sync |
| Auth | Firebase Phone Auth + Laravel Sanctum | OTP via Firebase, API tokens via Sanctum |
| Push | Firebase Cloud Messaging (FCM) + @notifee/react-native | Push notifications + rich local display |
| Payments | JazzCash HTTP POST API v4.2 + EasyPaisa REST API | Collect & send payments |
| PDF | barryvdh/laravel-dompdf (+ mpdf fallback for Urdu) | Bank-statement-style PDF export |
| RBAC | spatie/laravel-permission | Tenant-scoped roles & permissions |
| i18n | i18next + react-i18next | English + Urdu (RTL) |
| Logging | Custom 3-tier (Activity + System + Access) | Full audit trail |
| Sessions | Custom device-aware session system | IP, device model, geo, FCM token |
| Geolocation | stevebauman/location | IP-based country/city detection |
| Device Detection | jenssegers/agent + expo-device | UA parsing + native device info |
| Export | maatwebsite/excel | Excel/CSV export |

---

## Steps

### Phase 1 — Project Scaffolding

1. **Create Laravel 11 Backend** in `backend/` directory. Install packages:
   - `laravel/sanctum` — API token auth
   - `laravel/socialite` — Google/Facebook OAuth
   - `spatie/laravel-permission` — RBAC roles & permissions
   - `barryvdh/laravel-dompdf` — PDF statement generation
   - `kreait/laravel-firebase` — Firebase Admin SDK (FCM push + token verification)
   - `stevebauman/location` — IP geolocation
   - `jenssegers/agent` — User-agent parsing (device, browser, OS)
   - `maatwebsite/excel` — Excel/CSV exports
   - Custom JazzCash & EasyPaisa service classes

2. **Create Expo React Native Frontend** in `frontend/` directory using Expo Router. Install:
   - `react-native-paper` — Material Design 3 UI
   - `expo-router` — File-based navigation
   - `i18next` + `react-i18next` — Urdu/English i18n
   - `@tanstack/react-query` — Server state + offline caching
   - `zustand` — Client state management
   - `expo-print` + `expo-sharing` — PDF & sharing
   - `react-native-chart-kit` — Dashboard charts
   - `expo-linking` — Deep links for WhatsApp
   - `expo-web-browser` — Payment gateway redirect
   - `react-native-webview` — In-app payment flow
   - `@react-native-firebase/app` — Firebase core
   - `@react-native-firebase/auth` — Phone OTP authentication
   - `@react-native-firebase/messaging` — Push notifications (FCM)
   - `@notifee/react-native` — Advanced local notification display
   - `expo-device` — Device brand, model, OS info
   - `expo-application` — App version info
   - `expo-secure-store` — Persistent device ID storage

3. **Directory Structure:**

   ```
   ekhata/
   ├── backend/                         (Laravel 11)
   │   ├── app/
   │   │   ├── Models/
   │   │   │   ├── Tenant.php
   │   │   │   ├── User.php
   │   │   │   ├── Party.php
   │   │   │   ├── Transaction.php
   │   │   │   ├── Payment.php
   │   │   │   ├── LedgerShare.php
   │   │   │   ├── Session.php
   │   │   │   ├── ActivityLog.php
   │   │   │   ├── SystemLog.php
   │   │   │   ├── AccessLog.php
   │   │   │   ├── Notification.php
   │   │   │   ├── NotificationPreference.php
   │   │   │   └── TenantInvitation.php
   │   │   ├── Http/
   │   │   │   ├── Controllers/Api/V1/
   │   │   │   │   ├── AuthController.php
   │   │   │   │   ├── FirebaseAuthController.php
   │   │   │   │   ├── PartyController.php
   │   │   │   │   ├── TransactionController.php
   │   │   │   │   ├── PaymentController.php
   │   │   │   │   ├── ReportController.php
   │   │   │   │   ├── TenantController.php
   │   │   │   │   ├── TeamController.php
   │   │   │   │   ├── ShareController.php
   │   │   │   │   ├── SessionController.php
   │   │   │   │   ├── NotificationController.php
   │   │   │   │   └── LogController.php
   │   │   │   ├── Middleware/
   │   │   │   │   ├── EnsureTenant.php
   │   │   │   │   ├── TrackSession.php
   │   │   │   │   ├── LogApiRequest.php
   │   │   │   │   └── DetectSuspiciousLogin.php
   │   │   │   └── Requests/
   │   │   ├── Services/
   │   │   │   ├── FirebaseAuthService.php
   │   │   │   ├── FirebaseMessagingService.php
   │   │   │   ├── SessionService.php
   │   │   │   ├── ActivityLogService.php
   │   │   │   ├── NotificationService.php
   │   │   │   ├── GeoLocationService.php
   │   │   │   ├── DeviceDetectorService.php
   │   │   │   ├── JazzCashService.php
   │   │   │   ├── EasyPaisaService.php
   │   │   │   ├── PdfService.php
   │   │   │   ├── LedgerService.php
   │   │   │   └── ShareService.php
   │   │   ├── Contracts/
   │   │   │   ├── PaymentGatewayInterface.php
   │   │   │   └── NotificationChannelInterface.php
   │   │   ├── Events/
   │   │   │   ├── PaymentReceived.php
   │   │   │   ├── PaymentSent.php
   │   │   │   ├── TransactionCreated.php
   │   │   │   ├── TransactionEdited.php
   │   │   │   ├── TransactionDeleted.php
   │   │   │   ├── NewDeviceLogin.php
   │   │   │   ├── LedgerShared.php
   │   │   │   └── TeamMemberJoined.php
   │   │   ├── Listeners/
   │   │   │   ├── CreateLedgerEntryOnPayment.php
   │   │   │   ├── SendTransactionNotification.php
   │   │   │   ├── SendPaymentNotification.php
   │   │   │   ├── SendNewDeviceAlert.php
   │   │   │   ├── LogActivity.php
   │   │   │   └── DetectSuspiciousActivity.php
   │   │   ├── Traits/
   │   │   │   ├── BelongsToTenant.php
   │   │   │   ├── HasRunningBalance.php
   │   │   │   └── LogsActivity.php
   │   │   ├── Observers/
   │   │   │   ├── TransactionObserver.php
   │   │   │   └── PartyObserver.php
   │   │   └── Logging/
   │   │       └── SystemLogHandler.php
   │   ├── database/
   │   │   ├── migrations/
   │   │   └── seeders/              (RoleSeeder, PermissionSeeder, DemoDataSeeder)
   │   ├── resources/views/
   │   │   ├── pdf/                  (statement.blade.php)
   │   │   ├── emails/               (statement-email, invite)
   │   │   └── shared/               (public-ledger.blade.php)
   │   ├── config/
   │   │   └── firebase.php
   │   ├── storage/app/firebase/
   │   │   └── service-account.json  (.gitignored)
   │   └── routes/
   │       ├── api.php
   │       └── web.php
   │
   ├── frontend/                     (Expo / React Native)
   │   ├── app/
   │   │   ├── (auth)/               (login, register, otp-verify)
   │   │   ├── (app)/
   │   │   │   ├── (tabs)/           (dashboard, parties, daybook, more)
   │   │   │   ├── party/            ([id], create, statement)
   │   │   │   ├── transaction/      (create, [id])
   │   │   │   ├── payment/          (collect, send, history, callback)
   │   │   │   ├── reports/          (trial-balance, daybook-report)
   │   │   │   ├── team/             (members, invite)
   │   │   │   ├── settings/         (profile, tenant, language, sessions, notification-prefs, security)
   │   │   │   ├── notifications.tsx (notification center)
   │   │   │   └── logs/             (activity)
   │   │   └── shared/               ([token] — public ledger)
   │   ├── components/
   │   │   ├── PartyCard.tsx
   │   │   ├── TransactionRow.tsx
   │   │   ├── StatementTable.tsx
   │   │   ├── BalanceCard.tsx
   │   │   ├── PaymentModal.tsx
   │   │   ├── AmountInput.tsx
   │   │   ├── NotificationBell.tsx
   │   │   ├── NotificationItem.tsx
   │   │   ├── SessionCard.tsx
   │   │   └── DeviceIcon.tsx
   │   ├── services/
   │   │   ├── api.ts
   │   │   ├── firebase.ts
   │   │   ├── notifications.ts
   │   │   ├── device.ts
   │   │   ├── jazzcash.ts
   │   │   └── easypaisa.ts
   │   ├── hooks/
   │   │   ├── useNotifications.ts
   │   │   ├── usePushNotifications.ts
   │   │   └── useDeviceInfo.ts
   │   ├── stores/
   │   │   ├── auth.ts
   │   │   ├── tenant.ts
   │   │   ├── party.ts
   │   │   ├── transaction.ts
   │   │   └── notification.ts
   │   ├── locales/                  (en.json, ur.json)
   │   ├── theme/                    (colors.ts, typography.ts, spacing.ts)
   │   └── utils/                    (formatCurrency.ts, formatDate.ts, rtl.ts)
   │
   └── docs/                         (API docs, ERD, setup guide)
   ```

---

### Phase 2 — Database Schema (MySQL, Single-DB Multi-Tenant)

4. **Core Tables:**

   | Table | Key Columns | Notes |
   |-------|------------|-------|
   | `tenants` | id, name, slug (unique), logo_url, address, city, phone, email, settings (JSON), is_active, created_at | The business entity |
   | `users` | id, name, email (unique nullable), mobile (unique), password, avatar_url, provider (google/facebook/null), provider_id, firebase_uid, otp, otp_expires_at, language_pref (en/ur), is_active | Global user |
   | `tenant_user` | id, tenant_id (FK), user_id (FK), joined_at | Pivot: user ↔ tenant (M:M) |
   | `roles` | id, tenant_id, name, guard_name | spatie — tenant-scoped roles |
   | `permissions` | id, name, guard_name | spatie — global permissions list |
   | `parties` | id, tenant_id, name, mobile (unique per tenant), email, address, city, khata_number, book_number, type (customer/supplier/both), opening_balance (DECIMAL 15,2), opening_balance_type (dr/cr), notes, is_active, created_by, created_at | Khata party |
   | `transactions` | id, tenant_id, party_id (FK), user_id (FK), type (debit/credit), amount (DECIMAL 15,2), running_balance (DECIMAL 15,2), date, description, reference_number, attachment_url, payment_id (FK nullable), created_at, updated_at, deleted_at | Core ledger entry |
   | `payments` | id, tenant_id, party_id (FK), gateway (jazzcash/easypaisa), direction (inbound/outbound), amount (DECIMAL 15,2), currency (PKR), status (pending/completed/failed/refunded), gateway_txn_ref, gateway_response (JSON), pp_TxnRefNo, pp_ReturnURL, initiated_by (FK user), completed_at, created_at | Payment gateway records |
   | `ledger_shares` | id, tenant_id, party_id (FK), share_token (UUID unique), date_from, date_to, expires_at, is_active, created_by, created_at | Shareable links |
   | `tenant_invitations` | id, tenant_id, invited_by (FK), mobile, email, role_id, token, status (pending/accepted/expired), accepted_at, expires_at, created_at | Team invites |

5. **Logging & Session Tables:**

   | Table | Key Columns |
   |-------|------------|
   | `sessions` | id (UUID), user_id, tenant_id, token_id, device_id, device_name, device_model, device_brand, os_name, os_version, app_version, browser_name, browser_version, ip_address, last_ip_address, geo_country, geo_city, geo_lat, geo_lng, fcm_token, is_active, last_active_at, login_at, logout_at |
   | `activity_logs` | id, tenant_id, user_id, session_id, action (ENUM), model_type, model_id, description, old_values (JSON), new_values (JSON), ip_address, user_agent, device_type, platform, geo_location (JSON), created_at |
   | `system_logs` | id, level (info/warning/error/critical), channel (auth/payment/sms/notification/sync), message, context (JSON), ip_address, user_id, tenant_id, created_at |
   | `access_logs` | id, user_id, tenant_id, session_id, method, url, route_name, request_headers (JSON), request_body (JSON — sanitized), response_status, response_time_ms, ip_address, user_agent, created_at |

6. **Notification Tables:**

   | Table | Key Columns |
   |-------|------------|
   | `notifications` | id (UUID), tenant_id, user_id, type, title, body, data (JSON), channel (push/in_app/both), is_read, read_at, sent_via_push, push_sent_at, created_at |
   | `notification_preferences` | id, user_id, type, push_enabled, in_app_enabled, email_enabled, created_at, updated_at |

7. **Critical Indexes:**
   - `transactions`: composite `(tenant_id, party_id, date)` for statement queries
   - `transactions`: index on `(tenant_id, date)` for daybook
   - `parties`: unique constraint `(tenant_id, mobile)`
   - `payments`: index on `(gateway_txn_ref)` for callback lookups
   - `payments`: index on `(tenant_id, party_id, status)`
   - `activity_logs`: index on `(tenant_id, user_id, created_at)`
   - `sessions`: index on `(user_id, is_active)`

8. **Running Balance Strategy:**
   - Each transaction row stores computed `running_balance`
   - `TransactionObserver::created()` — calculates balance = previous running_balance ± amount
   - `TransactionObserver::updated()` / `deleted()` — recalculates all downstream balances for that party
   - Opening balance stored on the `parties` table is the seed value

---

### Phase 3 — Firebase Setup

9. **Firebase Project Configuration:**
   - Create Firebase project "e-Khata" in Firebase Console
   - Enable Phone Number sign-in provider in Authentication
   - Enable Firebase Cloud Messaging
   - Add test phone numbers (e.g. +92 300 0000000 / code: 123456)
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Generate FCM V1 Service Account Key JSON for Laravel backend

10. **Frontend Firebase Config:**
    - Configure `app.json` with plugins: `["@react-native-firebase/app", "@react-native-firebase/auth"]`
    - Add `googleServicesFile` path
    - iOS entitlements: `aps-environment: production`
    - iOS `UIBackgroundModes: ["remote-notification"]`

11. **Backend Firebase Config:**
    - Store service account JSON in `storage/app/firebase/service-account.json` (.gitignored)
    - Configure `config/firebase.php` with project ID + credentials path

---

### Phase 4 — Authentication System

12. **Firebase OTP Auth Flow (Primary):**
    - User enters mobile → `signInWithPhoneNumber(auth, phoneNumber)` → Firebase sends SMS OTP
    - User enters 6-digit code → `confirm(code)` → Firebase ID Token
    - Frontend sends Firebase `idToken` to backend: `POST /api/v1/auth/firebase/verify`
    - Backend verifies via `kreait/firebase-php` → extracts phone + Firebase UID
    - Upserts user (find by mobile or create) → stores `firebase_uid`
    - Creates session record with device info → issues Sanctum token

13. **Alternative Auth Methods:**
    - `POST /api/v1/auth/register` — name, email, mobile, password → Sanctum token
    - `POST /api/v1/auth/login` — (email or mobile) + password → Sanctum token
    - `GET /api/v1/auth/social/{provider}/redirect` — returns OAuth URL
    - `POST /api/v1/auth/social/{provider}/callback` — handles OAuth, upserts user → Sanctum token
    - `POST /api/v1/auth/logout` — revokes current token, marks session inactive
    - `GET /api/v1/auth/me` — current user profile + tenants list

14. **Auth Flow Diagram:**
    ```
    Firebase Phone OTP  ─┐
    Email + Password     ─┤→ Laravel Sanctum Token → All API calls
    Google/Facebook OAuth ─┘
    ```

---

### Phase 5 — Multi-Tenant Middleware & Traits

15. **EnsureTenant Middleware:**
    - Reads `X-Tenant-ID` from request header
    - Validates authenticated user belongs to that tenant via `tenant_user` pivot
    - Binds current tenant to `app('currentTenant')`
    - Rejects with 403 if user doesn't belong to tenant

16. **BelongsToTenant Trait:**
    - Adds global scope: `where('tenant_id', currentTenant()->id)` to all queries
    - Auto-sets `tenant_id` on model creation
    - Applied to: Party, Transaction, Payment, LedgerShare, TenantInvitation, ActivityLog, Notification

17. **RBAC Setup (spatie/laravel-permission):**
    - **Roles (tenant-scoped):** Owner, Manager, Accountant, Viewer
    - **Permissions:** `manage_tenant`, `manage_team`, `create_party`, `edit_party`, `delete_party`, `create_transaction`, `edit_transaction`, `delete_transaction`, `view_ledger`, `share_ledger`, `collect_payment`, `send_payment`, `view_reports`, `view_audit_log`
    - Role-permission mapping:
      - Owner: all permissions
      - Manager: all except `manage_tenant`, `manage_team`, `view_audit_log`
      - Accountant: `create_party`, `create_transaction`, `view_ledger`, `share_ledger`, `collect_payment`, `view_reports`
      - Viewer: `view_ledger`, `view_reports`

---

### Phase 6 — Core API Endpoints

18. **Tenant Endpoints (`TenantController`):**
    - `POST /api/v1/tenants` — create business (caller becomes Owner)
    - `GET /api/v1/tenants` — list user's businesses
    - `PUT /api/v1/tenants/{id}` — update business info (Owner only)
    - `DELETE /api/v1/tenants/{id}` — deactivate (Owner only)

19. **Team Endpoints (`TeamController`):**
    - `GET /api/v1/team/members` — list members with roles
    - `POST /api/v1/team/invite` — invite via mobile/email, assign role
    - `PUT /api/v1/team/members/{userId}/role` — change member role
    - `DELETE /api/v1/team/members/{userId}` — remove member
    - `POST /api/v1/team/invite/accept` — accept invitation token

20. **Party Endpoints (`PartyController`):**
    - `POST /api/v1/parties` — create with unique mobile per tenant validation
    - `GET /api/v1/parties` — list: search, filter (type, active), sort (name/balance/recent), paginated. Each row returns current balance
    - `GET /api/v1/parties/{id}` — detail with balance, total debit, total credit, transaction count
    - `PUT /api/v1/parties/{id}` — update
    - `DELETE /api/v1/parties/{id}` — soft delete
    - `GET /api/v1/parties/summary` — aggregate: total receivable, total payable, net, party count

21. **Transaction Endpoints (`TransactionController`):**
    - `POST /api/v1/parties/{partyId}/transactions` — create debit or credit. Validate: amount > 0, date ≤ today, description required. Observer computes `running_balance`.
    - `GET /api/v1/parties/{partyId}/transactions` — ledger statement. Filters: date_from, date_to, type. Returns: date, description, reference, debit_amount, credit_amount, running_balance + totals.
    - `GET /api/v1/parties/{partyId}/transactions/{id}` — single detail
    - `PUT /api/v1/parties/{partyId}/transactions/{id}` — edit (triggers downstream recalc)
    - `DELETE /api/v1/parties/{partyId}/transactions/{id}` — delete (triggers downstream recalc)

22. **Report Endpoints (`ReportController`):**
    - `GET /api/v1/reports/dashboard` — total receivable, total payable, net, party count, recent transactions (10), daily totals (last 30 days)
    - `GET /api/v1/reports/daybook?date=YYYY-MM-DD` — all transactions across parties for date/range
    - `GET /api/v1/reports/trial-balance` — all parties with current balance

---

### Phase 7 — Payment Gateway Integration (JazzCash + EasyPaisa)

23. **JazzCash Integration (HTTP POST + API v4.2):**
    - `JazzCashGateway` implements `PaymentGatewayInterface`
    - Sandbox URL: `https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction`
    - Live URL: `https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction`
    - Secure Hash: HMAC SHA256 using integrity salt
    - TxnTypes: `MWALLET` (mobile account), `MPAY` (card), `OTC` (voucher)
    - Parameters: `pp_Version`, `pp_TxnType`, `pp_MerchantID`, `pp_Password`, `pp_Amount` (paisa), `pp_TxnRefNo`, `pp_TxnCurrency=PKR`, `pp_TxnDateTime`, `pp_BillReference`, `pp_Description`, `pp_TxnExpiryDateTime`, `pp_ReturnURL`, `pp_CustomerMobile`

24. **EasyPaisa Integration (REST API):**
    - `EasyPaisaGateway` implements `PaymentGatewayInterface`
    - Open Transaction API / MA transaction
    - Parameters: storeId, orderId, transactionAmount, mobileAccountNo, emailAddress
    - Auth: username + password base64 token

25. **Payment API Endpoints (`PaymentController`):**
    - `POST /api/v1/parties/{partyId}/payments/collect` — initiate inbound collection. Creates `payments` record (status=pending), calls gateway API.
    - `POST /api/v1/parties/{partyId}/payments/send` — initiate outbound disbursement
    - `GET /api/v1/payments` — payment history (filterable by party, gateway, status, date)
    - `GET /api/v1/payments/{id}` — payment detail
    - `POST /api/v1/payments/jazzcash/callback` (public) — IPN callback. Verifies hash, updates payment status, fires `PaymentReceived`/`PaymentSent` event.
    - `POST /api/v1/payments/easypaisa/callback` (public) — IPN callback
    - `GET /api/v1/payments/jazzcash/return` (public) — redirect return URL

26. **Auto-Ledger Entry on Payment:**
    - `PaymentReceived` event → `CreateLedgerEntryOnPayment` listener
    - If inbound (collection): creates **credit** entry — "Payment received via JazzCash/EasyPaisa — Ref: {txn_ref}"
    - If outbound (disbursement): creates **debit** entry — "Payment sent via JazzCash/EasyPaisa — Ref: {txn_ref}"
    - Links `transactions.payment_id` to payment record
    - Idempotency: checks `gateway_txn_ref` to prevent double-entry

---

### Phase 8 — Sharing & Export

27. **Sharing Endpoints (`ShareController`):**
    - `GET /api/v1/parties/{partyId}/statement/pdf?from=&to=` — generates bank-statement PDF via DomPDF
    - `POST /api/v1/parties/{partyId}/statement/share` — generates UUID link in `ledger_shares`
    - `POST /api/v1/parties/{partyId}/statement/email` — emails PDF to party's email
    - `POST /api/v1/parties/{partyId}/statement/whatsapp` — returns WhatsApp deep link
    - `GET /shared/{token}` (web, public) — renders HTML statement, checks token validity

28. **PDF Template** (`resources/views/pdf/statement.blade.php`):
    - Business logo + name + address + phone at top
    - Party info: Name, Khata #, Book #, Mobile, Address
    - Period: from — to
    - Table with alternating row shading: Date | Description | Reference | Debit | Credit | Balance
    - Totals row (bold) with Dr/Cr indicator
    - Footer: "Generated by e-Khata | Powered by [Esystematic Technologies](https://www.esystematics.com) | Contact: 0311-3999345, 0334-5266444"

29. **Export Formats:**
    - PDF (bank statement)
    - Excel/CSV via `maatwebsite/excel` — party lists, transaction reports, daybook
    - JSON export for data portability
    - Print: `expo-print` on mobile, `window.print()` on web

---

### Phase 9 — Logging System (3-Tier)

30. **Tier 1 — Activity Logs (User Actions):**
    - `ActivityLogService` called from model Observers and controller actions
    - `LogsActivity` trait on models for auto-logging create/update/delete
    - Logs: action, model, old/new values, user, device, IP, geo location
    - Activity types: `created`, `updated`, `deleted`, `viewed`, `exported`, `shared`, `login`, `logout`, `payment_initiated`, `payment_completed`, `invited`, `role_changed`

31. **Tier 2 — System Logs (Application Events):**
    - Custom Laravel Log Channel via `SystemLogHandler`
    - Captures: failed logins, payment gateway errors, SMS failures, Firebase errors, rate limit hits, validation failures
    - Levels: info, warning, error, critical
    - Channels: auth, payment, sms, notification, sync

32. **Tier 3 — Access Logs (API Request Logs):**
    - `LogApiRequest` middleware on all `/api/*` routes
    - Logs: method, URL, route, headers, body (sanitized — no passwords/tokens), response status, response time (ms)
    - Configurable: can disable per-route
    - Retention: auto-purge after 90 days via `php artisan logs:purge` scheduled command

33. **Log Viewer API (Owner role only):**
    - `GET /api/v1/logs/activity` — paginated, filterable by user, action, model, date
    - `GET /api/v1/logs/system` — filterable by level, channel, date
    - `GET /api/v1/logs/access` — filterable by user, method, status, date
    - `GET /api/v1/logs/activity/export` — CSV/Excel export

---

### Phase 10 — Session Management & Device Tracking

34. **Device Info Gathering (Frontend):**
    - `expo-device` provides: brand, modelName, osName, osVersion, deviceType
    - `expo-application` provides: nativeApplicationVersion
    - Web: parse `navigator.userAgent` for browser info
    - Generate persistent `device_id` via `expo-secure-store` (UUID, stored permanently)
    - Send as headers on login and every request:
      ```
      X-Device-ID, X-Device-Name, X-Device-Model, X-Device-Brand,
      X-OS-Name, X-OS-Version, X-App-Version, X-FCM-Token
      ```

35. **Session Creation (Backend):**
    - On successful auth → create `sessions` record with device info from headers
    - `TrackSession` middleware: updates `last_active_at` and `last_ip_address` on every request
    - IP geolocation via `stevebauman/location`
    - FCM token stored in session for targeted push

36. **Session API:**
    - `GET /api/v1/sessions` — list all active sessions (device name, location, last active)
    - `GET /api/v1/sessions/current` — current session details
    - `DELETE /api/v1/sessions/{id}` — revoke session (logs out that device)
    - `DELETE /api/v1/sessions/all-except-current` — log out from all other devices
    - `PUT /api/v1/sessions/fcm-token` — update FCM token

37. **Suspicious Login Detection:**
    - `DetectSuspiciousLogin` middleware checks: new device_id, different country from previous session, rapid geo changes
    - Triggers `NewDeviceLogin` or `SuspiciousLogin` event → sends push notification alert

---

### Phase 11 — Notification System

38. **Push Notifications (FCM via Laravel):**
    - `FirebaseMessagingService` uses `kreait/firebase-php`
    - Targets individual devices via `sessions.fcm_token`
    - Multi-device: sends to all active sessions of a user
    - Topic-based for tenant-wide: subscribe members to `tenant_{id}`
    - Handles `UNREGISTERED` token → mark session inactive

39. **Push Handling (Frontend):**
    - Foreground: `messaging().onMessage()` → `@notifee/react-native` local notification with custom channel
    - Background: `messaging().setBackgroundMessageHandler()` → system tray
    - Tap: `messaging().onNotificationOpenedApp()` → deep link to relevant screen
    - Cold start: `messaging().getInitialNotification()` → navigate
    - Token: `messaging().getToken()` + `onTokenRefresh()` → sync to backend

40. **Notification Triggers:**

    | Event | Notification | Recipients | Channel |
    |-------|-------------|------------|---------|
    | PaymentReceived | "Rs. X received from {party} via {gateway}" | Creator + Owner | both |
    | PaymentSent | "Rs. X sent to {party} via {gateway}" | Creator + Owner | both |
    | TransactionCreated | "New {type} of Rs. X added to {party}" | Owner + Managers | in_app |
    | LedgerShared | "{party} ledger shared via {channel}" | Owner | in_app |
    | TeamMemberInvited | "You've been invited to join {tenant}" | Invitee | both |
    | TeamMemberJoined | "{user} joined your business" | Owner | both |
    | NewDeviceLogin | "New login from {device} in {city}" | User | both |
    | SuspiciousLogin | "Login from unusual location: {city}" | User | both |
    | BalanceThreshold | "{party} balance exceeded Rs. {threshold}" | Configurable | both |
    | TransactionEdited | "Transaction #{id} modified by {user}" | Owner | in_app |
    | TransactionDeleted | "Transaction #{id} deleted by {user}" | Owner + Auditors | both |
    | PaymentFailed | "Payment of Rs. X to {party} failed" | Initiator | both |
    | SystemAnnouncement | Admin broadcast | All users | both |

41. **Notification API:**
    - `GET /api/v1/notifications` — paginated, filterable by type, read status
    - `GET /api/v1/notifications/unread-count` — `{ count: 5 }`
    - `PUT /api/v1/notifications/{id}/read` — mark as read
    - `PUT /api/v1/notifications/read-all` — mark all read
    - `DELETE /api/v1/notifications/{id}` — delete
    - `GET /api/v1/notifications/preferences` — get preferences
    - `PUT /api/v1/notifications/preferences` — update (toggle per type: push/in_app/email)

42. **In-App Notification Center (Frontend):**
    - Bell icon in header with unread count badge
    - Grouped by date, each item: icon (by type), title, body, time ago
    - Swipe to dismiss / mark read
    - "Mark all read" action
    - Tap → navigate to relevant screen via `data.action_url`
    - Pull-to-refresh + polling every 30 seconds

---

### Phase 12 — Frontend Implementation

43. **Theme & Design System:**
    - Primary: Deep Blue `#1A237E`
    - Credit/Received: Teal `#00897B`
    - Debit/Sent: Red `#E53935`
    - Background: `#F5F5F5`, Cards: `#FFFFFF`
    - Typography: Inter (English), Noto Nastaliq Urdu (Urdu)
    - RTL: `I18nManager.forceRTL()` when Urdu selected
    - Material Design 3 via `react-native-paper`

44. **Screen Flow:**
    ```
    Login/Register → Tenant Select (if multiple) → Dashboard (tabs)
         │
         ├── Dashboard Tab — Balance cards, chart, recent list, FAB (+)
         ├── Parties Tab — Search bar, party cards (name, balance, type)
         │     └── Party Detail → Ledger (bank statement view)
         │           ├── Add Transaction (debit/credit)
         │           ├── Collect Payment (JazzCash/EasyPaisa)
         │           ├── Send Payment (JazzCash/EasyPaisa)
         │           └── Share (PDF/WhatsApp/Email/Link/Print)
         ├── Daybook Tab — Date-wise all-party transactions
         └── More Tab
               ├── Reports (Trial Balance)
               ├── Team Management
               ├── Payment History
               ├── Active Sessions
               ├── Audit Log (Owner only)
               ├── Notification Preferences
               ├── Business Settings
               ├── Language Toggle
               └── Logout
    ```

45. **Dashboard Screen:**
    - Top Cards: "Aap Ne Lena Hai" (Receivable) green | "Aap Ne Dena Hai" (Payable) red | Net Balance
    - Chart: Bar chart — last 7/30 days debit vs credit
    - Recent Transactions: last 10, showing party name, amount (+/-), date
    - FAB: Quick add → select party → debit/credit → amount → done

46. **Party Ledger Screen (Bank Statement Format):**
    ```
    ┌──────────────────────────────────────────────────────┐
    │  BUSINESS NAME                    Khata #: 001       │
    │  Address, Phone                   Book #: A-1        │
    ├──────────────────────────────────────────────────────┤
    │  Party: XYZ Traders               Mobile: 03XX...    │
    │  Period: 01 Jan 2026 - 16 Feb 2026                   │
    │  Opening Balance:                 Rs. 5,000 Dr       │
    ├──────────┬──────────┬────────┬────────┬──────────────┤
    │ Date     │ Details  │ Debit  │ Credit │ Balance      │
    ├──────────┼──────────┼────────┼────────┼──────────────┤
    │ 01 Jan   │ Opening  │        │        │ 5,000 Dr     │
    │ 05 Jan   │ Goods    │ 10,000 │        │ 15,000 Dr    │
    │ 10 Jan   │ Payment  │        │ 8,000  │ 7,000 Dr     │
    ├──────────┴──────────┼────────┼────────┼──────────────┤
    │ TOTALS              │ 45,000 │ 38,000 │ 7,000 Dr     │
    └─────────────────────┴────────┴────────┴──────────────┘
    │  Share: [PDF] [WhatsApp] [Email] [Link] [Print]      │
    │  Pay:   [Collect via JazzCash] [Send via EasyPaisa]  │
    └──────────────────────────────────────────────────────┘
    ```

47. **Transaction Entry Flow:**
    - Select party → Choose Debit or Credit → Enter amount → Description → Date (defaults today) → Optional attachment → Save
    - Instant balance update with optimistic UI

48. **Payment Flow:**
    - Collect: Select party → amount → gateway (JazzCash/EasyPaisa) → confirm → redirect → callback → auto credit in ledger
    - Send: Select party → amount → gateway → recipient mobile (pre-filled) → confirm → OTP → callback → auto debit in ledger
    - History: Filterable list with status badges

49. **i18n:**
    - `locales/en.json` and `locales/ur.json`
    - Currency: Rs. ×,×××.×× format
    - Language toggle in settings, persisted in `users.language_pref`
    - RTL layout auto-flip

50. **Active Sessions Screen:**
    - Cards: Device icon + name, OS, location (city, country), last active, "This device" badge
    - Swipe-to-revoke or "Log out from all devices" button
    - Alert on new login from unknown device

---

### Phase 13 — Tenant Settings (Flexible Configuration)

51. **Configurable Settings** (`tenants.settings` JSON):
    ```json
    {
      "currency": "PKR",
      "currency_symbol": "Rs.",
      "date_format": "DD MMM YYYY",
      "fiscal_year_start": "07-01",
      "timezone": "Asia/Karachi",
      "language": "en",
      "opening_balance_date": "2026-01-01",
      "balance_alert_threshold": 50000,
      "auto_share_on_transaction": false,
      "require_description": true,
      "require_reference_number": false,
      "allow_future_dates": false,
      "allow_negative_balance": true,
      "pdf_template": "classic",
      "notification_defaults": { "new_transaction": true, "payment": true },
      "payment_gateways": { "jazzcash": true, "easypaisa": true }
    }
    ```

52. **Plugin-Like Service Architecture:**
    - Independent Service classes: `LedgerService`, `PaymentGatewayService`, `NotificationService`, `SessionService`, `ActivityLogService`, `PdfService`, `ShareService`
    - Gateway pattern: `PaymentGatewayInterface` → `JazzCashGateway`, `EasyPaisaGateway`
    - Event-driven: business logic fires Events, Listeners handle side effects (logging, notifications, ledger entries)

53. **API Versioning:**
    - Routes under `/api/v1/`
    - Standardized response:
      ```json
      {
        "success": true,
        "message": "Party created successfully",
        "data": { ... },
        "meta": { "page": 1, "per_page": 20, "total": 150 }
      }
      ```

---

### Phase 14 — Security & SEO

54. **Security Measures:**
    - Sanctum tokens with configurable expiry
    - Rate limiting: OTP (5/10min), login (10/min), payments (3/min)
    - Input validation via FormRequest classes
    - Tenant isolation via global scopes
    - Payment callback hash verification
    - HTTPS enforced, CORS configured
    - Sensitive fields encrypted at rest

55. **SEO & Backlinks:**
    - Public shared ledger pages: `<title>`, `<meta description>`, Open Graph, canonical URL
    - Footer on all web pages and PDFs: "Developed by [Esystematic Technologies](https://www.esystematics.com) — [Software Development Services](https://www.esystematics.com/services.php) — Gujranwala, Pakistan — 0311-3999345 / 0334-5266444"
    - `sitemap.xml` for public pages, `robots.txt`
    - JSON-LD structured data for SoftwareApplication schema

56. **Testing:**
    - Backend: PHPUnit feature tests — auth, CRUD, balances, payments, tenant isolation
    - Frontend: Jest + React Native Testing Library
    - E2E: Detox or Maestro for critical flows

---

## Verification

1. **Firebase OTP:** Test with fictional phone numbers. Verify token round-trip (Firebase → Laravel → Sanctum)
2. **Push Notifications:** Send test FCM from Firebase Console. Verify foreground, background, quit-state handling
3. **Sessions:** Login 2 devices → both appear in Active Sessions → revoke one → API rejects revoked token
4. **Logging:** CRUD operations populate `activity_logs`. Payment error → `system_logs`. API calls → `access_logs` with response times
5. **Notifications:** Add transaction → in-app + push arrives. New device login → security alert
6. **Suspicious Login:** Login from different country → alert fires
7. **Balance Integrity:** Add 10 entries → verify running balance. Edit/delete middle → downstream recalculates correctly
8. **Payments:** JazzCash sandbox collect → auto credit. EasyPaisa send → auto debit. Failed payment → notification
9. **PDF:** Matches bank statement format with Esystematic Technologies branding
10. **Sharing:** PDF/WhatsApp/Email/Link/Print — all work correctly
11. **RBAC:** Viewer cannot add transactions (UI hidden + API rejects 403)
12. **Tenant Isolation:** Second tenant → zero data leakage
13. **RTL:** Switch to Urdu → full RTL layout + all strings translated

## Decisions

- **Firebase Phone Auth over Twilio** — Free tier (10K SMS/month), built-in reCAPTCHA, auto-OTP-read on Android
- **FCM over OneSignal/Expo Notifications** — Direct Firebase integration, free unlimited push, topic-based broadcasting
- **`@notifee/react-native`** — Rich notification channels, custom sounds, action buttons for foreground display
- **3-Tier logging** — Separation: user actions vs system errors vs API traffic. Different retention and access patterns
- **Session-per-device** — Full device fingerprint. "Active Sessions" management. FCM token tied to session
- **`stevebauman/location`** — Free IP geolocation, no API key for basic lookups
- **API `/api/v1/` versioning** — Future-proof for breaking changes
- **Laravel + MySQL** — PHP ecosystem, proven accounting patterns, DomPDF/Spatie maturity
- **Single-DB multi-tenant with `tenant_id`** — Cost-effective, simpler DevOps, adequate isolation
- **Running balance stored per transaction** — Trades storage for O(1) balance lookups
- **React Native (Expo)** — Single codebase for Android + iOS + Web, OTA updates
- **Zustand over Redux** — Lighter, simpler API for this app's complexity
- **Material Design 3 via react-native-paper** — Professional look, built-in RTL + accessibility
- **JazzCash HTTP POST API v4.2** — `MWALLET`, `MPAY`, `OTC` transaction types; HMAC SHA256 secure hash
- **EasyPaisa REST API** — Open Transaction API for collections, MA for disbursements
- **DomPDF + mpdf fallback** — DomPDF default; mpdf for Urdu Nastaliq rendering edge cases
