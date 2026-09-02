# Bugfix Requirements Document

## Introduction

This document covers the full backlog of known bugs in the ecommerce platform (Django backend + React/Vite frontend). Bugs are grouped by priority: P0 (critical, data-corrupting or security issues), P1 (important functional gaps), and P2 (quality improvements). Each group follows the bug condition methodology so that fix checking and regression-prevention can be verified systematically.

---

## P0 — Bugs Críticos

---

### Bug 1 — Inventario desunificado (productos y variantes)

#### Bug Analysis

##### Current Behavior (Defect)

1.1 WHEN a customer places an order for a product with active variants AND the item resolves to a specific `ProductVariant` THEN the system decrements both `variant.inventory_qty` AND `product.variant_inventory_qty` (double deduction), causing the parent product's stock counter to diverge from the sum of its variants.

1.2 WHEN a customer places an order for a product without variants (simple product) THEN the system decrements only `product.variant_inventory_qty`, leaving `variant.inventory_qty` untouched, so variant-level and product-level stock figures become inconsistent.

1.3 WHEN the stock check is performed during order creation for a variant-based product THEN the system reads `variant.inventory_qty` for the availability check but then also deducts from `product.variant_inventory_qty`, so the displayed "available" count on the product page can be greater than the actual variant stock, allowing overselling.

##### Expected Behavior (Correct)

2.1 WHEN an order item resolves to a specific `ProductVariant` THEN the system SHALL decrement only `variant.inventory_qty` and SHALL NOT modify `product.variant_inventory_qty`.

2.2 WHEN an order item is a simple product (no variant) THEN the system SHALL decrement only `product.variant_inventory_qty` and SHALL NOT touch any `ProductVariant` record.

2.3 WHEN the stock check is performed during order creation THEN the system SHALL read the same stock field it will later deduct from — `variant.inventory_qty` for variant items, `product.variant_inventory_qty` for simple items — so the check and the deduction are always consistent.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN a valid order is placed for a product with sufficient stock THEN the system SHALL CONTINUE TO create the order, record an `InventoryMovement`, and deduct the purchased quantity from the correct stock field.

3.2 WHEN a customer attempts to purchase more units than available stock THEN the system SHALL CONTINUE TO reject the order with a stock-insufficient error.

3.3 WHEN an order is canceled or refunded THEN the system SHALL CONTINUE TO restore stock to the same field from which it was originally deducted.

---

### Bug 2 — Cancelaciones, fallos y reembolsos rotos

#### Bug Analysis

##### Current Behavior (Defect)

2.1 WHEN the payment webhook receives a `FAILED` status for an order that is in `AWAITING_PAYMENT` THEN the system transitions the order to `CANCELED` but never records a status transition in `OrderAudit`, making the cancellation invisible to admins.

2.2 WHEN a payment failure triggers inventory rollback in `handle_payment_webhook` THEN the system always updates `product.variant_inventory_qty` for every item, even for variant-based items that should roll back `variant.inventory_qty`, resulting in incorrect stock restoration.

2.3 WHEN an admin calls the `refund` action on a PAID or PROCESSING order THEN the system restores stock by updating only `product.variant_inventory_qty` for all items, even when those items were originally deducted from a variant, causing the variant stock to remain at zero after refund.

2.4 WHEN `Payment.objects.filter(...).update(status='FAILED')` is called during a refund THEN the system uses a bulk `UPDATE` that bypasses any model-level logic and records no `reviewed_by` or `reviewed_at`, leaving the payment audit trail incomplete.

##### Expected Behavior (Correct)

2.5 WHEN a payment failure occurs THEN the system SHALL record an `OrderAudit` event with `action='PAYMENT_FAILED'`, the correct `from_status` and `to_status` fields, and set the order status to `FAILED_PAYMENT` (or `CANCELED`) atomically.

2.6 WHEN inventory is rolled back due to payment failure THEN the system SHALL restore `variant.inventory_qty` for variant-based items and `product.variant_inventory_qty` for simple items, mirroring exactly the deduction logic used during order creation.

2.7 WHEN an admin processes a refund THEN the system SHALL restore `variant.inventory_qty` for variant-based items and `product.variant_inventory_qty` for simple items.

2.8 WHEN a refund is processed THEN the system SHALL update the `Payment` record by setting `status` to a dedicated refund status (e.g., `REFUNDED`), recording `reviewed_by` and `reviewed_at`, and logging an `OrderAudit` event with `action='REFUNDED'`.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN a payment succeeds THEN the system SHALL CONTINUE TO transition the order to `PAID` and leave inventory unchanged.

3.2 WHEN a refund is attempted on an order that is not PAID or PROCESSING THEN the system SHALL CONTINUE TO reject the request with an appropriate error.

3.3 WHEN an order is refunded THEN the system SHALL CONTINUE TO set the order status to `CANCELED`.

---

### Bug 3 — AWAITING_PAYMENT → PAID permitido vía PATCH

#### Bug Analysis

##### Current Behavior (Defect)

3.1 WHEN a STAFF or ADMIN user sends a PATCH request to `/api/orders/{id}/` with `{"status": "PAID"}` AND the order is currently in `AWAITING_PAYMENT` THEN the system accepts the transition and marks the order as PAID without verifying that a real payment has been confirmed, bypassing the payment confirmation flow entirely.

##### Expected Behavior (Correct)

3.2 WHEN any user sends a PATCH request that attempts to set `status` to `PAID` THEN the system SHALL reject the request with a `400` error and a message indicating that payment confirmation must go through the `/orders/{id}/confirm_payment/` endpoint.

3.3 WHEN an admin confirms payment via `POST /api/orders/{id}/confirm_payment/` THEN the system SHALL continue to transition the order to `PAID`, create/update the `Payment` record, and log the `OrderAudit` event.

##### Unchanged Behavior (Regression Prevention)

3.4 WHEN a STAFF or ADMIN user sends a valid PATCH to change order status to any value other than `PAID` (e.g., `PROCESSING`, `SHIPPED`, `CANCELED`) THEN the system SHALL CONTINUE TO allow those transitions according to the existing transition rules.

3.5 WHEN `POST /orders/{id}/confirm_payment/` is called by a STAFF or ADMIN user on an `AWAITING_PAYMENT` order THEN the system SHALL CONTINUE TO mark it as PAID with the full audit trail.

---

### Bug 4 — Comprobantes manuales incompletos

#### Bug Analysis

##### Current Behavior (Defect)

4.1 WHEN a customer submits a payment proof via `POST /api/payments/proof/{order_id}/` THEN the system stores `proof_reference` and `proof_note` on the `Payment` record but does NOT notify any admin (no email, no dashboard alert) and does NOT transition the order to a status that makes the pending proof visible to admins in the orders list.

4.2 WHEN an admin views the orders panel THEN there is no dedicated filter or indicator for orders with status `PROOF_RECEIVED`, so proofs awaiting review are invisible in the default admin workflow.

4.3 WHEN a customer submits a proof for an order that already has a `PROOF_RECEIVED` payment THEN the system silently overwrites the existing `proof_reference` without warning the customer or recording a history of proof submissions.

##### Expected Behavior (Correct)

4.4 WHEN a customer successfully submits a payment proof THEN the system SHALL update the order status to `PROOF_RECEIVED` (or an equivalent visible state) so the order surfaces clearly in the admin panel.

4.5 WHEN a payment proof is received THEN the system SHALL send a notification to the configured admin email informing them that a new proof is pending review.

4.6 WHEN a customer attempts to submit a proof for an order that already has a proof under review THEN the system SHALL return a `409` response indicating that a proof is already pending, rather than silently overwriting it.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN an admin calls `confirm_payment` on an order with a received proof THEN the system SHALL CONTINUE TO mark the order as PAID, update the `Payment` record to `MANUAL_CONFIRMED`, and record the audit event.

3.2 WHEN a customer submits a proof with a missing or empty `proof_reference` THEN the system SHALL CONTINUE TO return a `400` validation error.

---

## P1 — Bugs Importantes

---

### Bug 5 — Cupones no conectados al checkout

#### Bug Analysis

##### Current Behavior (Defect)

5.1 WHEN a customer applies a coupon in the cart UI and proceeds to checkout THEN the system calls `createOrder` without including `coupon_code` in the request payload, so the backend receives no coupon and applies zero discount regardless of what was shown in the cart.

5.2 WHEN the backend `CreateOrderSerializer.create()` receives a valid `coupon_code` THEN the system does compute the discount and attaches `applied_coupon` to the order; however this code path is never reached because the frontend never sends `coupon_code`.

5.3 WHEN an order is created with a valid coupon THEN the system does NOT increment `coupon.used_count` and does NOT create a `CouponUsage` record, so coupon usage limits are never enforced.

##### Expected Behavior (Correct)

5.4 WHEN a customer has a coupon applied in the cart and confirms the checkout THEN the system SHALL include `coupon_code` in the `POST /api/orders/` request body.

5.5 WHEN the backend processes an order creation with a valid `coupon_code` THEN the system SHALL compute and persist `discount_amount`, link `applied_coupon`, and return the discounted `total` in the order response.

5.6 WHEN an order is successfully created with a coupon THEN the system SHALL increment `coupon.used_count` by 1 and create a `CouponUsage` record linking the coupon, the user, and the order.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer checks out without a coupon THEN the system SHALL CONTINUE TO create the order with `discount_amount = 0` and no `applied_coupon`.

3.2 WHEN a coupon code is invalid or expired THEN the system SHALL CONTINUE TO return a `400` validation error and abort order creation.

---

### Bug 6 — Paginación del panel incorrecta

#### Bug Analysis

##### Current Behavior (Defect)

6.1 WHEN an admin navigates to the Products panel THEN the system loads ALL products from the API into client memory and calculates pages using `filtered.slice(...)`, so navigating between pages does not fetch new data from the server; large catalogs cause excessive memory usage and slow renders.

6.2 WHEN an admin searches for a product and then navigates to page 2 THEN the system applies the pagination slice on the already-filtered client-side array, and if the filter changes the total count, the page counter may show incorrect totals or skip items.

6.3 WHEN the Admin Orders panel is open THEN orders are fetched all at once with no server-side pagination, meaning performance degrades linearly with order volume and the total count shown is always the full unfiltered count.

##### Expected Behavior (Correct)

6.4 WHEN an admin requests the Products list THEN the system SHALL use server-side pagination, sending `?page=N&page_size=M` query parameters and relying on the API's `PageNumberPagination` response (`count`, `next`, `previous`, `results`).

6.5 WHEN an admin changes the search filter in the Products panel THEN the system SHALL reset to page 1 and issue a new server-side request, not re-slice a local array.

6.6 WHEN the Admin Orders panel loads THEN the system SHALL support server-side pagination consistent with how products pagination works, showing accurate total counts from the API.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN an admin applies a search filter on the Products panel THEN the system SHALL CONTINUE TO filter results (now server-side via `?search=`) and display matching items.

3.2 WHEN an admin navigates to a page beyond the last available page THEN the system SHALL CONTINUE TO show an empty or last-valid-page result without crashing.

---

### Bug 7 — Permisos de inventario y proveedores incorrectos

#### Bug Analysis

##### Current Behavior (Defect)

7.1 WHEN a user with role `PROVIDER` calls `POST /api/products/{id}/adjust_stock/` THEN the system rejects the request with a `403` error because the `adjust_stock` action checks for `ADMIN` or `STAFF` roles only, not `PROVIDER`; however the business requirement is that providers should be able to adjust their own products' stock.

7.2 WHEN a user with role `PROVIDER` calls `PUT` or `PATCH` on `/api/products/{id}/` for a product they do NOT own THEN the `get_permissions()` method returns `[IsProviderOrAdmin(), IsOwnerOrAdmin()]` but DRF evaluates permissions with AND logic; `IsProviderOrAdmin` passes for any provider, and `IsOwnerOrAdmin` is object-level only, meaning the view-level check passes and the provider can attempt edits on products they do not own before the object check fires.

7.3 WHEN a user with role `STAFF` calls `DELETE /api/products/{id}/` THEN the system allows deletion because `IsProviderOrAdmin` permits STAFF and `IsOwnerOrAdmin` permits STAFF, so staff can delete any product including those from other providers without any ownership check.

##### Expected Behavior (Correct)

7.4 WHEN a user with role `PROVIDER` calls `adjust_stock` on a product they own THEN the system SHALL allow the request and apply the stock adjustment.

7.5 WHEN a user with role `PROVIDER` calls `adjust_stock` on a product they do NOT own THEN the system SHALL return a `403` response.

7.6 WHEN a user with role `PROVIDER` calls `PUT`, `PATCH`, or `DELETE` on a product they do NOT own THEN the system SHALL return a `403` response at the object-permission level before any write occurs.

7.7 WHEN a user with role `ADMIN` or `STAFF` performs any product write operation THEN the system SHALL continue to allow the operation regardless of product ownership.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN an unauthenticated user attempts to create or modify a product THEN the system SHALL CONTINUE TO return a `403` response.

3.2 WHEN a provider reads (GET) any published product THEN the system SHALL CONTINUE TO allow read access.

---

### Bug 8 — Snapshots de líneas de pedido ausentes

#### Bug Analysis

##### Current Behavior (Defect)

8.1 WHEN an `OrderItem` is created THEN the system stores a foreign key `product_id` and records `price` at creation time, but stores no snapshot of the product title, SKU, or variant details; if the product is later renamed or its title changes, historical order views will display the new name, corrupting the purchase history.

8.2 WHEN an `OrderItem` references a `ProductVariant` via foreign key `ON DELETE SET NULL` THEN if the variant is later deactivated or deleted, the variant field becomes `NULL` and the line item loses all variant context (size, color, SKU) with no recoverable record.

##### Expected Behavior (Correct)

8.3 WHEN an `OrderItem` is created THEN the system SHALL store snapshot fields for at minimum: `product_title` (from `product.title`), `variant_sku` (from `variant.sku` if applicable), and `variant_label` (a human-readable description of the variant options, e.g. "Talla M / Color Rojo") at the time of order placement.

8.4 WHEN the linked product or variant is later modified or deleted THEN the system SHALL CONTINUE TO display the snapshotted values in order history, audit reports, and proforma invoices.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN an order is created THEN the system SHALL CONTINUE TO store the `price` per unit at the time of purchase as it currently does.

3.2 WHEN the admin views an active order THEN the system SHALL CONTINUE TO show the current product/variant data for items that have not changed.

---

## P2 — Mejoras de Calidad

---

### Bug 9 — Reportes incompletos

#### Bug Analysis

##### Current Behavior (Defect)

9.1 WHEN an admin views the dashboard revenue summary THEN the system counts revenue only from orders with status `PAID`, excluding `PROCESSING` and `SHIPPED` orders that have already been fulfilled, understating confirmed revenue.

9.2 WHEN the `top_products` calculation runs THEN the system aggregates by `Count('id')` (number of order line items) rather than `Sum('quantity')`, so a product ordered 10 times in one line item appears less popular than one ordered 10 times in separate single-unit line items.

##### Expected Behavior (Correct)

9.3 WHEN the dashboard revenue summary is computed THEN the system SHALL include orders with statuses `PAID`, `PROCESSING`, and `SHIPPED` in the revenue total, reflecting all confirmed-revenue orders.

9.4 WHEN the `top_products` list is computed THEN the system SHALL aggregate by `Sum('quantity')` so that the ranking reflects total units sold, not number of order rows.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN revenue is reported THEN the system SHALL CONTINUE TO exclude `CREATED`, `AWAITING_PAYMENT`, and `CANCELED` orders from revenue totals.

3.2 WHEN the dashboard period filter is applied THEN the system SHALL CONTINUE TO scope all aggregations to the selected time window.

---

### Bug 10 — Exportaciones ausentes

#### Bug Analysis

##### Current Behavior (Defect)

10.1 WHEN an admin requests a data export for payments THEN there is no export endpoint or UI action available; payment data can only be reviewed record-by-record in the admin panel.

10.2 WHEN an admin requests an inventory export THEN there is no export endpoint for current stock levels, inventory movements, or low-stock summaries.

##### Expected Behavior (Correct)

10.3 WHEN an admin calls `GET /api/payments/export/` (or equivalent) THEN the system SHALL return a CSV file containing at minimum: transaction ID, order ID, amount, status, payment method, proof reference, reviewed by, reviewed at.

10.4 WHEN an admin calls `GET /api/products/export/` (or equivalent) THEN the system SHALL return a CSV file containing at minimum: product ID, title, SKU, variant options, current inventory qty, last movement date.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN an admin calls the existing `GET /api/orders/export/` endpoint THEN the system SHALL CONTINUE TO return the current orders CSV without regression.

---

### Bug 11 — Observabilidad insuficiente

#### Bug Analysis

##### Current Behavior (Defect)

11.1 WHEN a payment webhook handler raises an exception THEN the system fails silently with no structured log entry, making it impossible to diagnose failures from logs alone.

11.2 WHEN an order status transition is rejected due to an invalid transition THEN the system returns a `400` response but logs nothing server-side, so repeated invalid transition attempts are invisible to operators.

11.3 WHEN a critical operation (order creation, payment confirmation, refund) completes THEN the system produces no structured log entry with correlation data (order ID, user ID, amount, outcome), making audit-trail reconstruction from logs impossible.

##### Expected Behavior (Correct)

11.4 WHEN any exception occurs inside a payment handler or order mutation THEN the system SHALL emit a structured log entry at `ERROR` level containing: timestamp, event type, order/payment ID, exception class, and message.

11.5 WHEN an order is created, confirmed, refunded, or canceled THEN the system SHALL emit a structured log entry at `INFO` level containing: timestamp, event type, order ID, user ID, old status, new status, and amount.

11.6 WHEN a permission check fails on a sensitive endpoint (payment confirmation, refund, stock adjustment) THEN the system SHALL emit a structured log entry at `WARNING` level containing: timestamp, user ID, attempted action, and resource ID.

##### Unchanged Behavior (Regression Prevention)

3.1 WHEN normal request processing completes without error THEN the system SHALL CONTINUE TO respond within its current latency profile; structured logging SHALL NOT add more than 5 ms to average response time.
