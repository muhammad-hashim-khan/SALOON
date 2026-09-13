"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:5173'),
    SUPABASE_URL: zod_1.z.string().default('https://placeholder.supabase.co'),
    SUPABASE_ANON_KEY: zod_1.z.string().default('placeholder-anon-key'),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().default('placeholder-service-role-key'),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('Invalid environment variables:', _env.error.format());
    process.exit(1);
}
exports.env = _env.data;
