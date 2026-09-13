import { createApp } from './app';
import http from 'http';
import { requireRole } from './middleware/roleMiddleware';
import { AuthenticatedRequest } from './middleware/authMiddleware';
import { Response } from 'express';

interface JsonResponse {
  success?: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

async function runTests() {
  console.log('--- STARTING PHASE 2 RBAC & AUTH TEST SUITE ---');
  let testsPassed = 0;
  let testsFailed = 0;

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5000;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated /api/auth/me -> 401
    const resMe = await fetch(`${baseUrl}/api/auth/me`);
    const dataMe = (await resMe.json()) as JsonResponse;
    if (resMe.status === 401 && dataMe.success === false && dataMe.message === 'Authentication required') {
      console.log('✅ Test 1 Passed: Unauthenticated /api/auth/me returns 401 Authentication required');
      testsPassed++;
    } else {
      console.error('❌ Test 1 Failed: Unauthenticated /api/auth/me response:', resMe.status, dataMe);
      testsFailed++;
    }

    // 2. Unauthenticated /api/auth/admin-test -> 401
    const resAdmin = await fetch(`${baseUrl}/api/auth/admin-test`);
    const dataAdmin = (await resAdmin.json()) as JsonResponse;
    if (resAdmin.status === 401 && dataAdmin.success === false && dataAdmin.message === 'Authentication required') {
      console.log('✅ Test 2 Passed: Unauthenticated /api/auth/admin-test returns 401 Authentication required');
      testsPassed++;
    } else {
      console.error('❌ Test 2 Failed: Unauthenticated /api/auth/admin-test response:', resAdmin.status, dataAdmin);
      testsFailed++;
    }

    // 3. Unauthenticated /api/auth/worker-test -> 401
    const resWorker = await fetch(`${baseUrl}/api/auth/worker-test`);
    const dataWorker = (await resWorker.json()) as JsonResponse;
    if (resWorker.status === 401 && dataWorker.success === false && dataWorker.message === 'Authentication required') {
      console.log('✅ Test 3 Passed: Unauthenticated /api/auth/worker-test returns 401 Authentication required');
      testsPassed++;
    } else {
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
    } as AuthenticatedRequest;

    const mockResWorker = {
      status: (code: number) => {
        status403 = code;
        return {
          json: (body: { success: boolean; message: string }) => {
            message403 = body.message;
          },
        };
      },
    } as unknown as Response;

    const adminRoleMiddleware = requireRole('ADMIN');
    let nextCalled = false;
    adminRoleMiddleware(mockReqWorker, mockResWorker, () => {
      nextCalled = true;
    });

    if (status403 === 403 && message403 === 'You do not have permission to perform this action' && !nextCalled) {
      console.log('✅ Test 4 Passed: Worker role on ADMIN route returns 403 with exact permission denied message');
      testsPassed++;
    } else {
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
    } as AuthenticatedRequest;

    adminRoleMiddleware(mockReqAdmin, {} as Response, () => {
      adminNextCalled = true;
    });

    if (adminNextCalled) {
      console.log('✅ Test 5 Passed: Admin role on ADMIN route calls next() successfully');
      testsPassed++;
    } else {
      console.error('❌ Test 5 Failed: Admin on ADMIN route was not allowed through');
      testsFailed++;
    }

    // 6. Role middleware: Admin accessing WORKER route -> 403
    let adminWorkerStatus = 0;
    let adminWorkerMessage = '';
    const mockResAdminWorker = {
      status: (code: number) => {
        adminWorkerStatus = code;
        return {
          json: (body: { success: boolean; message: string }) => {
            adminWorkerMessage = body.message;
          },
        };
      },
    } as unknown as Response;

    const workerRoleMiddleware = requireRole('WORKER');
    let workerNextCalled = false;
    workerRoleMiddleware(mockReqAdmin, mockResAdminWorker, () => {
      workerNextCalled = true;
    });

    if (adminWorkerStatus === 403 && adminWorkerMessage === 'You do not have permission to perform this action' && !workerNextCalled) {
      console.log('✅ Test 6 Passed: Admin role on WORKER-only route returns 403 (strict role separation)');
      testsPassed++;
    } else {
      console.error('❌ Test 6 Failed:', adminWorkerStatus, adminWorkerMessage);
      testsFailed++;
    }

    // 7. Role middleware: Worker accessing WORKER route -> next()
    let workerSelfNextCalled = false;
    workerRoleMiddleware(mockReqWorker, {} as Response, () => {
      workerSelfNextCalled = true;
    });

    if (workerSelfNextCalled) {
      console.log('✅ Test 7 Passed: Worker role on WORKER route calls next() successfully');
      testsPassed++;
    } else {
      console.error('❌ Test 7 Failed: Worker on WORKER route failed');
      testsFailed++;
    }

    // 8. Health check /api/health -> 200
    const resHealth = await fetch(`${baseUrl}/api/health`);
    const dataHealth = (await resHealth.json()) as JsonResponse;
    if (resHealth.status === 200 && dataHealth.success === true && dataHealth.message === 'CUT&STYLE API is running') {
      console.log('✅ Test 8 Passed: GET /api/health returns 200 OK');
      testsPassed++;
    } else {
      console.error('❌ Test 8 Failed:', resHealth.status, dataHealth);
      testsFailed++;
    }

  } finally {
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
