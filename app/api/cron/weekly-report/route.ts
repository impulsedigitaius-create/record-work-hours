import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { WeeklyReportPDF } from '@/components/pdf/WeeklyReportPDF';
import {
  listEmployees,
  getPunchesInRange,
  getSettings,
} from '@/lib/queries';
import { calculatePayroll } from '@/lib/payroll';
import { todaySite } from '@/lib/timezone';

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET from request header (Bearer token)
  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    // Allow test mode without secret for local dev
    const testMode = req.nextUrl.searchParams.get('test');
    if (!testMode) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    // Dynamic import of Resend to avoid build-time errors
    const { Resend } = await import('resend');

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Calculate Monday-Friday of current week (Florida time)
    const today = new Date(todaySite());
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Monday of current week
    const monday = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diff);

    // Set Friday (4 days after Monday)
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fromDate = monday.toISOString().split('T')[0]; // YYYY-MM-DD
    const toDate = friday.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch data in parallel
    const [employees, punches, settings] = await Promise.all([
      listEmployees(false), // active only
      getPunchesInRange(fromDate, toDate),
      getSettings(),
    ]);

    // Calculate payroll
    const payrollRows = calculatePayroll(
      employees,
      punches,
      settings,
      fromDate,
      toDate
    );

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      WeeklyReportPDF({
        rows: payrollRows,
        from: fromDate,
        to: toDate,
        settings,
      })
    );

    // Send email via Resend
    const pdfFileName = `weekly-report-${fromDate}-to-${toDate}.pdf`;

    const emailResponse = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'impulsedigitaius@gmail.com',
      subject: `Lox Life Camps Weekly Hours Report - ${fromDate} to ${toDate}`,
      html: `
        <p>Dear Lox Life Camps,</p>
        <p>Please find attached the weekly hours report for the period <strong>${fromDate}</strong> to <strong>${toDate}</strong>.</p>
        <p>This report shows the total hours worked by each employee during the week.</p>
        <br/>
        <p>Best regards,<br/>ImpulseDigitAI LLC<br/>impulsedigitaius@gmail.com</p>
      `,
      attachments: [
        {
          filename: pdfFileName,
          content: pdfBuffer,
        },
      ],
    });

    if (emailResponse.error) {
      throw new Error(
        `Failed to send email: ${emailResponse.error.message}`
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly report sent successfully',
      emailId: emailResponse.data?.id,
      period: { from: fromDate, to: toDate },
      employees: payrollRows.length,
      totalHours: payrollRows.reduce((sum, row) => sum + row.workedHours, 0),
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate or send report',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
// Build cache bust
