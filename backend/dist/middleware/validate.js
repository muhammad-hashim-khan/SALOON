"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors
                    .map((err) => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');
                (0, response_1.sendError)(res, `Validation error: ${errorMessages}`, 400);
                return;
            }
            (0, response_1.sendError)(res, 'Internal validation error', 500);
        }
    };
};
exports.validateRequest = validateRequest;
