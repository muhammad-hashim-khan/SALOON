"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const getHealth = (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'CUT&STYLE API is running',
    });
};
exports.getHealth = getHealth;
