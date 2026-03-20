/**
 * Audit Log Service
 * 
 * Records administrative and sensitive actions for compliance and debugging.
 * Every action that modifies data for another user, or represents an
 * admin-level override, should be logged here.
 * 
 * Audit log entries are written to:
 *   1. The `audit_logs` table in Supabase (persistent, queryable)
 *   2. Winston logger at INFO level (for immediate visibility)
 * 
 * Usage:
 *   await auditLog({
 *     action: 'ORDER_STATUS_CHANGED',
 *     actorId: req.user.id,
 *     actorRole: req.user.role,
 *     targetId: orderId,
 *     targetType: 'order',
 *     details: { from: 'pending', to: 'preparing' },
 *     ipAddress: req.ip,
 *   });
 */

import { supabase } from '../config/supabase';
import logger from '../services/logger';

// ─── Typed Action Names ───────────────────────────────────────────────────────
export type AuditAction =
    // Orders
    | 'ORDER_STATUS_CHANGED'
    | 'ORDER_CANCELLED'
    | 'ORDER_MANUALLY_COMPLETED'
    | 'ORDER_QR_VERIFIED'
    // Users
    | 'USER_BANNED'
    | 'USER_UNBANNED'
    | 'USER_FROZEN'
    | 'USER_UNFROZEN'
    | 'USER_ROLE_CHANGED'
    // Menu
    | 'MENU_ITEM_CREATED'
    | 'MENU_ITEM_UPDATED'
    | 'MENU_ITEM_DELETED'
    // Outlet
    | 'OUTLET_CREATED'
    | 'OUTLET_UPDATED'
    | 'OUTLET_DELETED'
    // Auth
    | 'ADMIN_PASSWORD_RESET'
    // Payments
    | 'PAYMENT_REFUND_ISSUED'
    // Generic
    | 'ADMIN_ACTION';

// ─── Request Shape ────────────────────────────────────────────────────────────
export interface AuditLogEntry {
    action: AuditAction;
    actorId: string;
    actorRole: string;
    targetId?: string | number;
    targetType?: string; // 'order' | 'user' | 'menu_item' | 'outlet'
    details?: Record<string, any>;
    ipAddress?: string;
}

// ─── Writer ───────────────────────────────────────────────────────────────────
export const auditLog = async (entry: AuditLogEntry): Promise<void> => {
    const payload = {
        action: entry.action,
        actor_id: entry.actorId,
        actor_role: entry.actorRole,
        target_id: entry.targetId ? String(entry.targetId) : null,
        target_type: entry.targetType ?? null,
        details: entry.details ?? null,
        ip_address: entry.ipAddress ?? null,
        created_at: new Date().toISOString(),
    };

    // Always log to Winston first (non-blocking)
    logger.info(`[AUDIT] ${entry.action}`, payload);

    // Then persist to database
    const { error } = await supabase.from('audit_logs').insert([payload]);

    if (error) {
        // Don't crash the request for a failed audit log — just warn
        logger.warn(`[AUDIT] Failed to persist audit log to DB:`, {
            error: error.message,
            action: entry.action,
        });
    }
};

export default auditLog;
