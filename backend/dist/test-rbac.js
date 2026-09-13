"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const http_1 = __importDefault(require("http"));
const roleMiddleware_1 = require("./middleware/roleMiddleware");
async function runTests() {
    console.log('--- STARTING PHASE 2 RBAC & AUTH TEST SUITE ---');
    let testsPassed = 0;
    let testsFailed = 0;
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 5000;
    const baseUrl = `http://localhost:${port}`;
    try {
        // 1. Unauthenticated /api/auth/me -> 401
        const resMe = await fetch(`${baseUrl}/api/auth/me`);
        const dataMe = (await resMe.json());
        if (resMe.status === 401 && dataMe.success === false && dataMe.message === 'Authentication required') {
            console.log('✅ Test 1 Passed: Unauthenticated /api/auth/me returns 401 Authentication required');
            testsPassed++;
        }
        else {
            console.error('❌ Test 1 Failed: Unauthenticated /api/auth/me response:', resMe.status, dataMe);
            testsFailed++;
        }
        // 2. Unauthenticated /api/auth/admin-test -> 401
        const resAdmin = await fetch(`${baseUrl}/api/auth/admin-test`);
        const dataAdmin = (await resAdmin.json());
        if (resAdmin.status === 401 && dataAdmin.success === false && dataAdmin.message === 'Authentication required') {
            console.log('✅ Test 2 Passed: Unauthenticated /api/auth/admin-test returns 401 Authentication required');
            testsPassed++;
        }
        else {
            console.error('❌ Test 2 Failed: Unauthenticated /api/auth/admin-test response:', resAdmin.status, dataAdmin);
            testsFailed++;
        }
        // 3. Unauthenticated /api/auth/worker-test -> 401
        const resWorker = await fetch(`${baseUrl}/api/auth/worker-test`);
        const dataWorker = (await resWorker.json());
        if (resWorker.status === 401 && dataWorker.success === false && dataWorker.message === 'Authentication required') {
            console.log('✅ Test 3 Passed: Unauthenticated /api/auth/worker-test returns 401 Authentication required');
            testsPassed++;
        }
        else {
            console.error('❌ Test 3 Failed: Unauthenticated /api/auth/worker-test response:', resWorker.status, dataWorker);
            testsFailed++;
        }
        // 4. Role middleware: Worker accessing ADMIN route -> 403
        let status403 = 0;
        let message403 = '';
        const mockReqWorker = {
            user: {
                id: 'w-1',
                fullName: 'Worker Staff',
                role: 'WORKER',
                status: 'ACTIVE',
            },
        };
        const mockResWorker = {
            status: (code) => {
                status403 = code;
                return {
                    json: (body) => {
                        message403 = body.message;
                    },
                };
            },
        };
        const adminRoleMiddleware = (0, roleMiddleware_1.requireRole)('ADMIN');
        let nextCalled = false;
        adminRoleMiddleware(mockReqWorker, mockResWorker, () => {
            nextCalled = true;
        });
        if (status403 === 403 && message403 === 'You do not have permission to perform this action' && !nextCalled) {
            console.log('✅ Test 4 Passed: Worker role on ADMIN route returns 403 with exact permission denied message');
            testsPassed++;
        }
        else {
            console.error('❌ Test 4 Failed: Worker on ADMIN role test:', status403, message403, nextCalled);
            testsFailed++;
        }
        // 5. Role middleware: Admin accessing ADMIN route -> next()
        let adminNextCalled = false;
        const mockReqAdmin = {
            user: {
                id: 'a-1',
                fullName: 'Admin User',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        };
        adminRoleMiddleware(mockReqAdmin, {}, () => {
            adminNextCalled = true;
        });
        if (adminNextCalled) {
            console.log('✅ Test 5 Passed: Admin role on ADMIN route calls next() successfully');
            testsPassed++;
        }
        else {
            console.error('❌ Test 5 Failed: Admin on ADMIN route was not allowed through');
            testsFailed++;
        }
        // 6. Role middleware: Admin accessing WORKER route -> 403
        let adminWorkerStatus = 0;
        let adminWorkerMessage = '';
        const mockResAdminWorker = {
            status: (code) => {
                adminWorkerStatus = code;
                return {
                    json: (body) => {
                        adminWorkerMessage = body.message;
                    },
                };
            },
        };
        const workerRoleMiddleware = (0, roleMiddleware_1.requireRole)('WORKER');
        let workerNextCalled = false;
        workerRoleMiddleware(mockReqAdmin, mockResAdminWorker, () => {
            workerNextCalled = true;
        });
        if (adminWorkerStatus === 403 && adminWorkerMessage === 'You do not have permission to perform this action' && !workerNextCalled) {
            console.log('✅ Test 6 Passed: Admin role on WORKER-only route returns 403 (strict role separation)');
            testsPassed++;
        }
        else {
            console.error('❌ Test 6 Failed:', adminWorkerStatus, adminWorkerMessage);
            testsFailed++;
        }
        // 7. Role middleware: Worker accessing WORKER route -> next()
        let workerSelfNextCalled = false;
        workerRoleMiddleware(mockReqWorker, {}, () => {
            workerSelfNextCalled = true;
        });
        if (workerSelfNextCalled) {
            console.log('✅ Test 7 Passed: Worker role on WORKER route calls next() successfully');
            testsPassed++;
        }
        else {
            console.error('❌ Test 7 Failed: Worker on WORKER route failed');
            testsFailed++;
        }
        // 8. Health check /api/health -> 200
        const resHealth = await fetch(`${baseUrl}/api/health`);
        const dataHealth = (await resHealth.json());
        if (resHealth.status === 200 && dataHealth.success === true && dataHealth.message === 'CUT&STYLE API is running') {
            console.log('✅ Test 8 Passed: GET /api/health returns 200 OK');
            testsPassed++;
        }
        else {
            console.error('❌ Test 8 Failed:', resHealth.status, dataHealth);
            testsFailed++;
        }
    }
    finally {
        server.close();
    }
    console.log(`\n--- TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed ---`);
    if (testsFailed > 0) {
        process.exit(1);
    }
}
runTests().catch((err) => {
    console.error('Test runner execution error:', err);
    process.exit(1);
});
