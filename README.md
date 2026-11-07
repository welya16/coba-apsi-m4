# JK Jogja Konveksi

Next.js App Router application backed by PostgreSQL and Prisma ORM 7.

## Run locally

1. Keep the existing `DATABASE_URL` in `.env`, then add a private session secret
   (a 32-character secret has been generated in the current local workspace):

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Set the generated value as `AUTH_SECRET` in `.env`. Use a different secret per
   environment and do not commit `.env`.
2. Install packages and generate Prisma Client:

   ```bash
   npm install
   npx prisma generate
   ```
3. Start the application:

   ```bash
   npm run dev
   ```

## API

All API routes return JSON. Protected routes use the `jk_session` HttpOnly,
SameSite=Lax cookie created by login. Roles come from the account record in the
database, not from client-supplied role values. Error responses use
`{ "error": "..." }`.

The workspace UI uses these routes for sign-in/session restoration, registration,
product and customer management, order creation and status updates, payments,
feedback, notifications, and owner reports. UI data is loaded after
authentication and refreshed after successful writes; it is not persisted in
browser-only preview state. Payment proof selection currently sends the file
name as a reference only; the file contents are not uploaded.

### Authentication

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Sign in with `{ "username", "password", "role" }`. Role can be `pelanggan`, `admin`, `owner`, `produksi`, or `pengiriman`. |
| `POST` | `/api/auth/register` | Public | Create a customer account/profile/address or an invited staff account. |
| `GET` | `/api/auth/session` | Public | Return the current user or `null`. |
| `POST` | `/api/auth/logout` | Public | Clear the session cookie. |
| `PATCH` | `/api/auth/password` | Authenticated | Change password with `{ "old_password", "new_password" }`. |

New passwords must be at least 10 characters. Seed accounts with legacy
plaintext passwords are upgraded to scrypt hashes after a successful login.
Passwords are never included in API responses.

All five role sign-in screens offer registration. Customer signup creates the
customer profile and address. Admin, owner, production, and courier signup
requires the matching `ADMIN_REGISTRATION_CODE`, `OWNER_REGISTRATION_CODE`,
`PRODUCTION_REGISTRATION_CODE`, or `COURIER_REGISTRATION_CODE` in the server
environment. Keep these invitation codes private and distribute each only to
the intended role; public role selection alone cannot create a privileged
account. The local workspace has generated private per-role codes in its
ignored `.env`; restart the server after changing them.

Sign-in checks the accounts and passwords in the configured PostgreSQL
database. Credentials in `database.sql` work only when that seed data is
present; an existing database can contain different credentials. Registration
requires a unique username and a password of at least 10 characters. The
session cookie is marked `Secure` on HTTPS requests; set
`AUTH_COOKIE_SECURE=true` when a production HTTPS proxy does not forward
`x-forwarded-proto`.

### Data

| Routes | Access and operations |
| --- | --- |
| `/api/products`, `/api/products/[id]` | Authenticated list/detail; admin create, update, and delete. Supports `?q=`. |
| `/api/customers`, `/api/customers/[id]` | Customer reads and edits their own profile; admin/owner can list and read; admin can create, update, and delete. Admin-created accounts return a one-time `temporary_password`. |
| `/api/orders`, `/api/orders/[id]` | Customers create and view their own orders; production and delivery staff see only their assigned orders; admin updates order status and deletes. Order creation snapshots product prices and atomically creates order details, assigns production when a production account is available, and creates a shipment record for delivery orders. |
| `/api/payments`, `/api/payments/[id]` | Customers submit payment references for their own orders; admin reviews payment status. Verification updates the order status transactionally. |
| `/api/feedback`, `/api/feedback/[id]` | Customers create feedback for their own orders; admin replies. |
| `/api/order-changes`, `/api/order-changes/[id]` | Customers request order changes; admin approves or rejects. |
| `/api/notifications`, `/api/notifications/[id]` | Read a user's own notifications and mark them read. |
| `/api/production`, `/api/production/[id]` | Admin/owner view production; assigned production staff update their own status. |
| `/api/shipments`, `/api/shipments/[id]` | Customer/admin/owner/courier reads are scoped; admin assigns couriers and admin/assigned courier updates shipment status. |
| `/api/reports` | Owner-only report and summary data. |
| `/api/postal-codes?q=` | Authenticated postal-code lookup for address forms. |

Example create-order body:

```json
{
  "metode_pengambilan": "Kirim",
  "tgl_butuh": "2026-11-30",
  "catatan": "Warna navy",
  "items": [
    {
      "id_produk": "PRD-001",
      "jumlah": 12,
      "ukuran": "L",
      "warna": "Navy",
      "spesifikasi_desain": "Logo dada kiri"
    }
  ]
}
```

`bukti_bayar` is a storage reference saved to the database; the project does not
currently configure a binary upload/object-storage service. Configure trusted
file storage before accepting payment-proof uploads in production.

API access depends on the PostgreSQL schema and seed data being present. Apply
schema/data changes using the project's existing database workflow; API routes
do not run migrations automatically.
