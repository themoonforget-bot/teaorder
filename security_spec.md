# Security Specification for TeaOrder

## Data Invariants
1. A Product must have a name, category, and prices for M and L.
2. An Order must have items, a total price calculated from items, and a status.
3. Only authenticated admins can create or modify products.
4. Anyone can read products.
5. Anyone (authenticated or not, depending on user preference, but let's stick to simple "anyone" for now or use anonymous auth) can create an order.
6. Only the creator of an order or an admin can read their own order (if we use auth). 
7. For this specific request, let's keep it simple: Guests can order, but we'll use a session ID or just let them read their own submitted order via ID. Admins manage everything.

Wait, the prompt says "前台後台" (Frontend/Backend). Usually, backend means admin management.
I'll use Google Auth for Admin.

## The "Dirty Dozen" Payloads
1. Product with negative price.
2. Order with status "completed" set by customer.
3. Order items mapping to non-existent products (hard to check in rules without complex logic, but we'll try).
4. Updating an order's `totalPrice` without changing items.
5. Unauthorized user modifying a product.
6. Customer modifying an order's status to "prepared".
7. Injecting 1MB strings into drink names.
8. Changing `createdAt` on update.
9. Deleting orders by non-admins.
10. Creating a product with a shadow field `isVerified: true`.
11. Reading the full list of orders as a guest.
12. Updating an order after it has been cancelled/completed.

## The Test Runner (Conceptual)
We will verify that:
- `create` on `/products` fails for non-admins.
- `update` on `/orders` status fails for customers.
- `create` on `/orders` with terminal status fails.
- `delete` on `/products` fails for everyone except admins.
