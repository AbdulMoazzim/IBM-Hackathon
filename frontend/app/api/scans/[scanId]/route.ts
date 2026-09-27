// app/api/scans/[scanId]/route.ts
// API route for individual scan operations
// Handles: GET scan details, DELETE scan, update scan

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: { scanId: string };
}

/**
 * GET /api/scans/:scanId
 * Fetch detailed information about a specific scan
 * 
 * Returns:
 * - Scan metadata (name, date, status)
 * - Security score
 * - Detected technologies
 * - Summary of findings by severity
 * - Last update time
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { scanId } = params;

        if (!scanId) {
            return NextResponse.json(
                {
                    success: false,
                    error: { message: 'Scan ID is required', code: 'MISSING_PARAM' },
                },
                { status: 400 }
            );
        }

        // BACKEND INTEGRATION POINT:
        // Fetch scan from database and calculate progress
        //
        // const response = await fetch(
        //   `https://backend-api.example.com/scans/${scanId}`,
        //   {
        //     headers: {
        //       'Authorization': request.headers.get('authorization') || '',
        //     },
        //   }
        // );
        //
        // if (!response.ok) {
        //   return NextResponse.json(
        //     { success: false, error: { message: 'Scan not found', code: 'NOT_FOUND' } },
        //     { status: 404 }
        //   );
        // }
        //
        // const scan = await response.json();

        // Mock response for development
        const mockScan = {
            id: scanId,
            applicationName: 'Pharmacy Management SaaS',
            status: 'completed',
            securityScore: 72,
            totalFindings: 15,
            criticalCount: 2,
            highCount: 4,
            mediumCount: 6,
            lowCount: 3,
            framework: 'Next.js',
            database: 'PostgreSQL',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            progress: 100,
            detectedTechs: [
                { name: 'Next.js', category: 'frontend' },
                { name: 'TypeScript', category: 'frontend' },
                { name: 'PostgreSQL', category: 'database' },
            ],
        };

        return NextResponse.json({
            success: true,
            data: mockScan,
        });
    } catch (error) {
        console.error(`GET /api/scans/:scanId error:`, error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Failed to fetch scan',
                    code: 'FETCH_FAILED',
                },
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/scans/:scanId
 * Delete a scan and all its associated data
 * 
 * This is a destructive operation:
 * - Deletes scan record
 * - Deletes all findings
 * - Deletes reports
 * - Cleans up temporary files
 * 
 * Requires confirmation from user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { scanId } = params;

        if (!scanId) {
            return NextResponse.json(
                {
                    success: false,
                    error: { message: 'Scan ID is required', code: 'MISSING_PARAM' },
                },
                { status: 400 }
            );
        }

        // BACKEND INTEGRATION POINT:
        // Delete scan from database
        //
        // const response = await fetch(
        //   `https://backend-api.example.com/scans/${scanId}`,
        //   {
        //     method: 'DELETE',
        //     headers: {
        //       'Authorization': request.headers.get('authorization') || '',
        //     },
        //   }
        // );
        //
        // if (!response.ok) {
        //   return NextResponse.json(
        //     { success: false, error: { message: 'Scan not found', code: 'NOT_FOUND' } },
        //     { status: 404 }
        //   );
        // }

        return NextResponse.json({
            success: true,
            data: { message: 'Scan deleted successfully' },
        });
    } catch (error) {
        console.error(`DELETE /api/scans/:scanId error:`, error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Failed to delete scan',
                    code: 'DELETE_FAILED',
                },
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/scans/:scanId
 * Update scan metadata (name, notes, etc.)
 * 
 * Do NOT use this for findings updates - use /api/scans/:id/findings/:findingId instead
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { scanId } = params;
        const body = await request.json();

        if (!scanId) {
            return NextResponse.json(
                {
                    success: false,
                    error: { message: 'Scan ID is required', code: 'MISSING_PARAM' },
                },
                { status: 400 }
            );
        }

        // BACKEND INTEGRATION POINT:
        // Update scan in database
        //
        // const response = await fetch(
        //   `https://backend-api.example.com/scans/${scanId}`,
        //   {
        //     method: 'PATCH',
        //     headers: {
        //       'Authorization': request.headers.get('authorization') || '',
        //       'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(body),
        //   }
        // );

        return NextResponse.json({
            success: true,
            data: { message: 'Scan updated successfully' },
        });
    } catch (error) {
        console.error(`PATCH /api/scans/:scanId error:`, error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Failed to update scan',
                    code: 'UPDATE_FAILED',
                },
            },
            { status: 500 }
        );
    }
}