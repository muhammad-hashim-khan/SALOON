"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
class SupabaseService {
    /**
     * Check connection to Supabase database
     */
    static async checkConnection() {
        try {
            const { error } = await supabase_1.supabase.from('profiles').select('id').limit(1);
            if (error) {
                // Table might be empty or permissions might apply; if response returned from server without network error, Supabase is accessible
                logger_1.logger.warn('Supabase ping notice:', error.message);
                return { connected: true };
            }
            return { connected: true };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
            logger_1.logger.error('Failed to connect to Supabase:', errorMessage);
            return { connected: false, error: errorMessage };
        }
    }
    /**
     * Log an audit action to audit_logs table
     */
    static async logAudit(params) {
        try {
            const { error } = await supabase_1.supabaseAdmin.from('audit_logs').insert({
                user_id: params.userId,
                action: params.action,
                entity_type: params.entityType,
                entity_id: params.entityId || null,
                description: params.description,
            });
            if (error) {
                logger_1.logger.error('Failed to record audit log:', error.message);
            }
        }
        catch (err) {
            logger_1.logger.error('Error recording audit log:', err);
        }
    }
}
exports.SupabaseService = SupabaseService;
