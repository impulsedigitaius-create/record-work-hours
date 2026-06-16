'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { PayrollRow } from '@/lib/types';

// Register Montserrat Bold from Google Fonts
Font.register({
  family: 'Montserrat',
  src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUQjIg69CK48gIEo1z8kRQN.ttf',
  fontWeight: 700,
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1B3A8C',
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerText: {
    flex: 1,
    marginLeft: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B3A8C',
    fontFamily: 'Montserrat',
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B3A8C',
    fontFamily: 'Montserrat',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1B3A8C',
    marginBottom: 20,
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1B3A8C',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tableRowAlt: {
    backgroundColor: '#E8ECF5',
  },
  columnEmployee: {
    flex: 2,
  },
  columnHours: {
    flex: 1,
    textAlign: 'right',
  },
  headerCell: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bodyCell: {
    fontSize: 10,
    color: '#333333',
  },
  totalBanner: {
    backgroundColor: '#1B3A8C',
    padding: 15,
    marginBottom: 20,
    borderRadius: 4,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  totalValue: {
    fontSize: 12,
    color: '#E8ECF5',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    fontSize: 9,
    color: '#999999',
    textAlign: 'center',
  },
});

interface WeeklyReportPDFProps {
  rows: PayrollRow[];
  from: string;
  to: string;
  settings: {
    weekly_hours: number;
    working_days: number;
    overtime_multiplier: number;
  };
}

export const WeeklyReportPDF: React.FC<WeeklyReportPDFProps> = ({
  rows,
  from,
  to,
  settings,
}) => {
  const totalHours = rows.reduce((sum, row) => sum + row.workedHours, 0);

  // Format dates for display
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const fromFormatted = fromDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const toFormatted = toDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.companyName}>IMPULSEDIGITAI LLC</Text>
              <Text style={styles.reportTitle}>Weekly Hours Report</Text>
              <Text style={styles.subHeader}>Client: Lox Life Camps</Text>
            </View>
          </View>
        </View>

        {/* Period Label */}
        <Text style={styles.periodLabel}>
          Period: {fromFormatted} – {toFormatted}
        </Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, styles.columnEmployee]}>
              Employee
            </Text>
            <Text style={[styles.headerCell, styles.columnHours]}>
              Hours Worked
            </Text>
          </View>

          {/* Table Rows */}
          {rows.map((row, index) => (
            <View
              key={row.employeeId}
              style={
                index % 2 === 1
                  ? [styles.tableRow, styles.tableRowAlt]
                  : styles.tableRow
              }
            >
              <Text style={[styles.bodyCell, styles.columnEmployee]}>
                {row.name}
              </Text>
              <Text style={[styles.bodyCell, styles.columnHours]}>
                {row.workedHours.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total Banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalText}>
            Total Period: {totalHours.toFixed(2)} hrs
          </Text>
          <Text style={styles.totalValue}>
            {rows.length} employee{rows.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by ImpulseDigitAI LLC · impulsedigitaius@gmail.com</Text>
        </View>
      </Page>
    </Document>
  );
};
