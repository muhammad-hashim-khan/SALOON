"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ws_1 = __importDefault(require("ws"));
const env_1 = require("./env");
// Public Supabase client using Anon key
exports.supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    realtime: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport: ws_1.default,
    },
});
// Admin Supabase client using Service Role key (for backend admin operations)
exports.supabaseAdmin = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    realtime: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport: ws_1.default,
    },
});
