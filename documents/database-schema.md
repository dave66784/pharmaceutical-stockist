# Database Schema

```mermaid
erDiagram

    %% ─────────────────────────────────────────
    %%  CORE: USERS & AUTH
    %% ─────────────────────────────────────────
    users {
        bigint      id              PK
        varchar     email           UK  "NOT NULL"
        varchar     password            "NOT NULL (hashed)"
        varchar     first_name      "NOT NULL"
        varchar     last_name       "NOT NULL"
        varchar     phone
        varchar     role            "CUSTOMER | ADMIN"
        varchar     password_reset_token
        timestamp   password_reset_token_expiry
        timestamp   created_at
        timestamp   updated_at
    }

    refresh_tokens {
        bigint      id              PK
        varchar     token           UK  "NOT NULL"
        bigint      user_id         FK
        timestamp   expires_at      "NOT NULL"
        timestamp   created_at
    }

    addresses {
        bigint      id              PK
        bigint      user_id         FK  "NOT NULL"
        varchar     street          "NOT NULL"
        varchar     city            "NOT NULL"
        varchar     state           "NOT NULL"
        varchar     zip_code        "NOT NULL"
        varchar     country         "NOT NULL"
        boolean     is_default
        timestamp   created_at
        timestamp   updated_at
    }

    %% ─────────────────────────────────────────
    %%  CATALOGUE
    %% ─────────────────────────────────────────
    categories {
        bigint      id              PK
        varchar     name            UK  "NOT NULL"
        text        description
        varchar     slug            UK  "NOT NULL"
        timestamp   created_at
        timestamp   updated_at
    }

    sub_categories {
        bigint      id              PK
        varchar     name            "NOT NULL"
        text        description
        varchar     slug            "NOT NULL"
        bigint      category_id     FK  "NOT NULL"
        timestamp   created_at
        timestamp   updated_at
    }

    products {
        bigint      id              PK
        varchar     name            "NOT NULL"
        text        description
        varchar     manufacturer
        decimal     price           "NOT NULL"
        int         stock_quantity  "NOT NULL, default 0"
        bigint      category_id     FK  "NOT NULL"
        bigint      sub_category_id FK  "nullable"
        date        expiry_date
        boolean     is_prescription_required "default false"
        boolean     is_deleted      "default false"
        boolean     is_available_for_sale "default true"
        boolean     is_bundle_offer "default false"
        int         bundle_buy_quantity
        int         bundle_free_quantity
        decimal     bundle_price
        timestamp   created_at
        timestamp   updated_at
    }

    product_images {
        bigint      product_id      FK  "NOT NULL"
        varchar     image_url       "NOT NULL"
    }

    %% ─────────────────────────────────────────
    %%  CART
    %% ─────────────────────────────────────────
    carts {
        bigint      id              PK
        bigint      user_id         FK  UK "1-to-1 with users"
        timestamp   created_at
    }

    cart_items {
        bigint      id              PK
        bigint      cart_id         FK  "NOT NULL"
        bigint      product_id      FK  "NOT NULL"
        int         quantity        "NOT NULL"
    }

    %% ─────────────────────────────────────────
    %%  ORDERS
    %% ─────────────────────────────────────────
    orders {
        bigint      id              PK
        bigint      user_id         FK  "NOT NULL"
        decimal     total_amount    "NOT NULL"
        varchar     status          "PENDING|PROCESSING|SHIPPED|DELIVERED|CANCELLED"
        varchar     payment_method  "COD|ONLINE"
        varchar     payment_status  "PENDING|PAID|FAILED|REFUNDED"
        varchar     transaction_id
        text        shipping_address "NOT NULL (snapshot)"
        bigint      address_id      "snapshot ref (no FK)"
        timestamp   order_date
        timestamp   delivery_date
    }

    order_items {
        bigint      id              PK
        bigint      order_id        FK  "NOT NULL"
        bigint      product_id      FK  "NOT NULL"
        int         quantity        "NOT NULL"
        decimal     price           "NOT NULL (at time of order)"
        int         free_quantity   "default 0"
        decimal     subtotal        "NOT NULL"
    }

    %% ─────────────────────────────────────────
    %%  COMPLIANCE
    %% ─────────────────────────────────────────
    audit_logs {
        bigint      id              PK
        varchar     user_email      "denormalised — survives user deletion"
        varchar     action          "AuditAction enum"
        varchar     entity_type     "AUTH|USER|PRODUCT|ORDER|CATEGORY"
        varchar     entity_id       "PK of affected row"
        varchar     details         "max 2000 chars"
        varchar     ip_address
        timestamp   created_at      "indexed"
    }

    %% ─────────────────────────────────────────
    %%  RELATIONSHIPS
    %% ─────────────────────────────────────────

    users         ||--o{ addresses      : "has many"
    users         ||--o{ refresh_tokens : "has many"
    users         ||--||  carts          : "has one"
    users         ||--o{ orders         : "places"

    categories    ||--o{ sub_categories : "has many"
    categories    ||--o{ products       : "contains"
    sub_categories ||--o{ products      : "refines"
    products      ||--o{ product_images : "has many"

    carts         ||--o{ cart_items     : "contains"
    cart_items    }o--|| products       : "references"

    orders        ||--o{ order_items    : "contains"
    order_items   }o--|| products       : "snapshot of"
```

## Entity Groups

| Group | Tables | Purpose |
|---|---|---|
| **Auth** | `users`, `refresh_tokens` | Identity, session management, password reset |
| **Profile** | `addresses` | Delivery addresses per user |
| **Catalogue** | `categories`, `sub_categories`, `products`, `product_images` | Product hierarchy |
| **Cart** | `carts`, `cart_items` | Per-user persistent shopping cart |
| **Orders** | `orders`, `order_items` | Immutable purchase records |
| **Compliance** | `audit_logs` | Tamper-evident event trail |

## Key Design Decisions

- **`audit_logs.user_email`** is denormalised — the email is copied at write time so audit history is retained even if the user account is deleted.
- **`order_items.price` / `subtotal`** are snapshotted at checkout — product price changes do not affect historical orders.
- **`orders.shipping_address`** stores the full address as TEXT — the address record can be edited/deleted later without corrupting order history.
- **`carts`** is a 1-to-1 with `users` (unique FK) — each user has exactly one active cart.
- **`products.is_deleted`** uses soft-delete — products are never physically removed so `order_items` references remain valid.
