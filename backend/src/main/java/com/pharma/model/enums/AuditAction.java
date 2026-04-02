package com.pharma.model.enums;

public enum AuditAction {

    // ── Auth ──────────────────────────────────────────────────────────────────
    USER_LOGIN,
    USER_LOGIN_FAILED,
    USER_LOGOUT,
    USER_REGISTERED,
    PASSWORD_RESET_REQUESTED,
    PASSWORD_RESET_COMPLETED,
    PASSWORD_CHANGED,

    // ── Products ──────────────────────────────────────────────────────────────
    PRODUCT_CREATED,
    PRODUCT_UPDATED,
    PRODUCT_DELETED,
    PRODUCT_BULK_DELETED,

    // ── Orders ────────────────────────────────────────────────────────────────
    ORDER_PLACED,
    ORDER_CANCELLED,
    ORDER_STATUS_UPDATED,
    ORDERS_EXPORTED,

    // ── User management ───────────────────────────────────────────────────────
    USER_ROLE_CHANGED,

    // ── Categories ────────────────────────────────────────────────────────────
    CATEGORY_CREATED,
    CATEGORY_UPDATED,
    CATEGORY_DELETED,
    SUBCATEGORY_CREATED,
    SUBCATEGORY_UPDATED,
    SUBCATEGORY_DELETED
}
