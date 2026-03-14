import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scenario, ScenarioInput } from '../types/scenario';

interface PropertyData {
  address: string;
  purchase_price: string;
}

interface FinancingData {
  loan_amount: string;
  down_payment: string;
  interest_rate: string;
  loan_term: string;
}

interface ExpenseData {
  property_tax: string;
  insurance: string;
  maintenance: string;
  management_fee: string;
  vacancy_rate: string;
  monthly_rental_income: string;
}

interface BarItem {
  label: string;
  value: number;
  color: [number, number, number];
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const fmtPct = (val: number) => `${val.toFixed(2)}%`;

const INDIGO: [number, number, number] = [79, 70, 229];
const GRAY: [number, number, number] = [100, 100, 100];

function sectionHeader(doc: jsPDF, title: string, y: number, pageWidth: number): number {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INDIGO);
  doc.text(title, 14, y);
  y += 1.5;
  doc.setDrawColor(...INDIGO);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  doc.setTextColor(30, 30, 30);
  return y + 5;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawBarChart(
  doc: jsPDF,
  items: BarItem[],
  title: string,
  x: number,
  y: number,
  chartWidth: number
): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text(title.toUpperCase(), x, y);
  y += 5;

  const maxAbs = Math.max(...items.map((d) => Math.abs(d.value)), 1);
  const barHeight = 5;
  const labelWidth = 28;
  const valueWidth = 22;
  const barMaxWidth = chartWidth - labelWidth - valueWidth - 4;

  items.forEach((item) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(item.label, x + labelWidth - 1, y + 3.5, { align: 'right' });

    // bar background
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x + labelWidth + 1, y, barMaxWidth, barHeight, 1, 1, 'F');

    // bar fill
    const barW = Math.max((Math.abs(item.value) / maxAbs) * barMaxWidth, 1);
    doc.setFillColor(...item.color);
    doc.roundedRect(x + labelWidth + 1, y, barW, barHeight, 1, 1, 'F');

    // value
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(fmt(item.value), x + chartWidth, y + 3.5, { align: 'right' });

    y += barHeight + 2;
  });

  return y + 2;
}

function rateMetric(value: number, excellent: number, good: number, average: number): string {
  if (value >= excellent) return 'Excellent';
  if (value >= good) return 'Good';
  if (value >= average) return 'Average';
  return 'Poor';
}

function getRatingColor(rating: string): [number, number, number] {
  if (rating === 'Excellent') return [22, 163, 74];
  if (rating === 'Good') return [59, 130, 246];
  if (rating === 'Average') return [234, 179, 8];
  return [239, 68, 68];
}

export function exportScenarioPdf(
  scenarios: ScenarioInput[],
  results: Scenario[]
) {
  const property: PropertyData | null = JSON.parse(sessionStorage.getItem('propertyInfo') || 'null');
  const financing: FinancingData | null = JSON.parse(sessionStorage.getItem('financingInfo') || 'null');
  const expense: ExpenseData | null = JSON.parse(sessionStorage.getItem('expenseInfo') || 'null');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 0;

  // ============================================================
  // HEADER
  // ============================================================
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Investment Analysis Report', pageWidth / 2, 16, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  if (property?.address) {
    doc.text(property.address, pageWidth / 2, 25, { align: 'center' });
  }
  doc.setFontSize(9);
  doc.text(`Real Estate Deal Evaluator  |  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 34, { align: 'center' });

  y = 52;

  // ============================================================
  // 1. PROPERTY OVERVIEW + FINANCING (side by side)
  // ============================================================
  if (property && financing) {
    y = sectionHeader(doc, 'Property & Financing Overview', y, pageWidth);

    autoTable(doc, {
      startY: y,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, textColor: GRAY },
        1: { cellWidth: 50 },
        2: { fontStyle: 'bold', cellWidth: 40, textColor: GRAY },
        3: { cellWidth: 50 },
      },
      body: [
        ['Address', property.address || 'N/A', 'Loan Amount', fmt(parseFloat(financing.loan_amount) || 0)],
        ['Purchase Price', fmt(parseFloat(property.purchase_price) || 0), 'Down Payment', fmt(parseFloat(financing.down_payment) || 0)],
        ['', '', 'Interest Rate', `${financing.interest_rate}%`],
        ['', '', 'Loan Term', `${financing.loan_term} years`],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ============================================================
  // 2. OPERATING EXPENSES
  // ============================================================
  if (expense) {
    y = checkPageBreak(doc, y, 50);
    y = sectionHeader(doc, 'Operating Expenses', y, pageWidth);

    autoTable(doc, {
      startY: y,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: GRAY },
        1: { cellWidth: 40 },
        2: { fontStyle: 'bold', cellWidth: 50, textColor: GRAY },
        3: { cellWidth: 40 },
      },
      body: [
        ['Monthly Rental Income', fmt(parseFloat(expense.monthly_rental_income) || 0), 'Property Tax / yr', fmt(parseFloat(expense.property_tax) || 0)],
        ['Insurance / yr', fmt(parseFloat(expense.insurance) || 0), 'Maintenance / yr', fmt(parseFloat(expense.maintenance) || 0)],
        ['Management Fee', `${expense.management_fee}%`, 'Vacancy Rate', `${expense.vacancy_rate}%`],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ============================================================
  // 3. KEY INVESTMENT METRICS (calculated like DashboardPage)
  // ============================================================
  if (property && financing && expense) {
    y = checkPageBreak(doc, y, 70);
    y = sectionHeader(doc, 'Key Investment Metrics', y, pageWidth);

    const purchasePrice = parseFloat(property.purchase_price);
    const downPayment = parseFloat(financing.down_payment) || 0;
    const loanAmount = parseFloat(financing.loan_amount);
    const interestRate = parseFloat(financing.interest_rate) / 100 / 12;
    const totalPayments = parseInt(financing.loan_term) * 12;

    let monthlyMortgage = 0;
    if (!isNaN(loanAmount) && !isNaN(interestRate) && interestRate > 0) {
      monthlyMortgage = loanAmount * (interestRate * Math.pow(1 + interestRate, totalPayments)) / (Math.pow(1 + interestRate, totalPayments) - 1);
    }

    const monthlyRental = parseFloat(expense.monthly_rental_income);
    const vacancyRate = parseFloat(expense.vacancy_rate) || 0;
    const annualPropertyTax = parseFloat(expense.property_tax) || 0;
    const annualInsurance = parseFloat(expense.insurance) || 0;
    const annualMaintenance = parseFloat(expense.maintenance) || 0;
    const managementPct = parseFloat(expense.management_fee) || 0;

    const annualRental = monthlyRental * 12;
    const vacancyLoss = annualRental * (vacancyRate / 100);
    const egi = annualRental - vacancyLoss;
    const mgmtExpense = egi * (managementPct / 100);
    const totalExpenses = annualPropertyTax + annualInsurance + annualMaintenance + mgmtExpense;
    const noi = egi - totalExpenses;
    const annualDebtService = monthlyMortgage * 12;
    const netCashFlow = noi - annualDebtService;
    const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
    const cocReturn = downPayment > 0 ? (netCashFlow / downPayment) * 100 : 0;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
    const grm = annualRental > 0 ? purchasePrice / annualRental : 0;
    const opexRatio = egi > 0 ? (totalExpenses / egi) * 100 : 0;

    const capRateRating = rateMetric(capRate, 10, 7, 5);
    const cocRating = rateMetric(cocReturn, 12, 8, 5);
    const dscrRating = rateMetric(dscr, 1.5, 1.25, 1.0);
    const grmRating = grm <= 12 ? 'Good' : grm <= 16 ? 'Average' : 'Poor';
    const opexRating = opexRatio <= 35 ? 'Excellent' : opexRatio <= 45 ? 'Good' : opexRatio <= 55 ? 'Average' : 'Poor';
    const cfRating = netCashFlow >= 0 ? (netCashFlow / 12 >= 500 ? 'Excellent' : 'Good') : 'Poor';

    const metricsData = [
      ['Cap Rate', fmtPct(capRate), `NOI: ${fmt(noi)}`, capRateRating],
      ['Cash-on-Cash Return', fmtPct(cocReturn), `Cash Flow: ${fmt(netCashFlow)}`, cocRating],
      ['Debt Coverage Ratio', dscr.toFixed(2), dscr >= 1.25 ? 'Healthy' : 'Below threshold', dscrRating],
      ['Gross Rent Multiplier', grm.toFixed(1), `${fmt(purchasePrice)} / ${fmt(annualRental)}`, grmRating],
      ['Operating Expense Ratio', fmtPct(opexRatio), `${fmt(totalExpenses)} expenses`, opexRating],
      ['Monthly Cash Flow', fmt(netCashFlow / 12), 'After all expenses', cfRating],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value', 'Detail', 'Rating']],
      body: metricsData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold' } },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          const rating = data.cell.raw as string;
          data.cell.styles.textColor = getRatingColor(rating);
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ============================================================
    // 4. INCOME & EXPENSE BREAKDOWN CHARTS
    // ============================================================
    y = checkPageBreak(doc, y, 70);
    y = sectionHeader(doc, 'Income & Expense Breakdown (Annual)', y, pageWidth);

    const halfW = (pageWidth - 28) / 2 - 4;

    const incomeItems: BarItem[] = [
      { label: 'Gross Rental', value: annualRental, color: [79, 70, 229] },
      { label: 'After Vacancy', value: egi, color: [99, 102, 241] },
      { label: 'NOI', value: noi, color: [34, 197, 94] },
      { label: 'Net Cash Flow', value: netCashFlow, color: netCashFlow >= 0 ? [22, 163, 74] : [239, 68, 68] },
    ];

    const expenseItems: BarItem[] = [
      { label: 'Mortgage', value: annualDebtService, color: [239, 68, 68] },
      { label: 'Property Tax', value: annualPropertyTax, color: [249, 115, 22] },
      { label: 'Insurance', value: annualInsurance, color: [234, 179, 8] },
      { label: 'Maintenance', value: annualMaintenance, color: [139, 92, 246] },
      { label: 'Management', value: mgmtExpense, color: [236, 72, 153] },
      { label: 'Vacancy Loss', value: vacancyLoss, color: [107, 114, 128] },
    ];

    const incomeEndY = drawBarChart(doc, incomeItems, 'Income Breakdown', 14, y, halfW);
    const expenseEndY = drawBarChart(doc, expenseItems, 'Expense Breakdown', 14 + halfW + 8, y, halfW);
    y = Math.max(incomeEndY, expenseEndY) + 6;

    // ============================================================
    // 5. 10-YEAR FINANCIAL PROJECTIONS
    // ============================================================
    y = checkPageBreak(doc, y, 80);
    y = sectionHeader(doc, '10-Year Financial Projections', y, pageWidth);

    // Calculate projections
    const rentGrowth = 0.02;
    const expenseGrowth = 0.02;
    const appreciation = 0.03;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRAY);
    doc.text('Assumptions: 2% rent growth, 2% expense growth, 3% appreciation per year', 14, y);
    y += 5;

    const projRows: string[][] = [];
    let curRental = annualRental;
    let curPropTax = annualPropertyTax;
    let curIns = annualInsurance;
    let curMaint = annualMaintenance;
    let totalCashFlow = 0;

    for (let yr = 1; yr <= 10; yr++) {
      if (yr > 1) {
        curRental *= (1 + rentGrowth);
        curPropTax *= (1 + expenseGrowth);
        curIns *= (1 + expenseGrowth);
        curMaint *= (1 + expenseGrowth);
      }
      const vl = curRental * (vacancyRate / 100);
      const effIncome = curRental - vl;
      const mgmt = effIncome * (managementPct / 100);
      const totExp = curPropTax + curIns + curMaint + mgmt;
      const yrNoi = effIncome - totExp;
      const cf = yrNoi - annualDebtService;
      const propVal = purchasePrice * Math.pow(1 + appreciation, yr);

      const monthlyRate2 = parseFloat(financing.interest_rate) / 100 / 12;
      const pmtsMade = yr * 12;
      let loanBal = 0;
      if (loanAmount > 0 && monthlyRate2 > 0) {
        loanBal = loanAmount * (Math.pow(1 + monthlyRate2, totalPayments) - Math.pow(1 + monthlyRate2, pmtsMade)) / (Math.pow(1 + monthlyRate2, totalPayments) - 1);
      }
      const equity = propVal - loanBal;
      const coc = downPayment > 0 ? (cf / downPayment) * 100 : 0;
      totalCashFlow += cf;

      projRows.push([
        `${yr}`,
        fmt(curRental),
        fmt(yrNoi),
        fmt(cf),
        fmt(propVal),
        fmt(equity),
        `${coc.toFixed(1)}%`,
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [['Year', 'Gross Rent', 'NOI', 'Cash Flow', 'Property Value', 'Equity', 'CoC']],
      body: projRows,
      foot: [['Total', '', '', fmt(totalCashFlow), '', '', '']],
      theme: 'striped',
      styles: { fontSize: 7.5, cellPadding: 2, halign: 'right' },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold', halign: 'center' },
      footStyles: { fillColor: [240, 240, 245], textColor: [30, 30, 30], fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = parseFloat(data.cell.raw.replace(/[^-\d.]/g, ''));
          if (val < 0) data.cell.styles.textColor = [239, 68, 68];
          else data.cell.styles.textColor = [22, 163, 74];
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ============================================================
    // 6. EQUITY GROWTH CHART
    // ============================================================
    y = checkPageBreak(doc, y, 55);
    y = sectionHeader(doc, 'Equity Growth Over 10 Years', y, pageWidth);

    const chartX = 30;
    const chartW = pageWidth - 60;
    const chartH = 35;
    const chartY = y;

    // calculate equity values for the chart
    const equityVals: number[] = [];
    let cr = annualRental;
    let cpt = annualPropertyTax;
    let ci = annualInsurance;
    let cm = annualMaintenance;
    for (let yr = 1; yr <= 10; yr++) {
      if (yr > 1) { cr *= 1.02; cpt *= 1.02; ci *= 1.02; cm *= 1.02; }
      const pv = purchasePrice * Math.pow(1.03, yr);
      const mr2 = parseFloat(financing.interest_rate) / 100 / 12;
      const pm = yr * 12;
      let lb = 0;
      if (loanAmount > 0 && mr2 > 0) {
        lb = loanAmount * (Math.pow(1 + mr2, totalPayments) - Math.pow(1 + mr2, pm)) / (Math.pow(1 + mr2, totalPayments) - 1);
      }
      equityVals.push(pv - lb);
    }

    const maxEquity = Math.max(...equityVals);
    const minEquity = Math.min(...equityVals, 0);
    const eqRange = maxEquity - minEquity || 1;

    // axes
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(chartX, chartY, chartX, chartY + chartH);
    doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // bars
    const barW2 = (chartW - 20) / 10;
    equityVals.forEach((eq, i) => {
      const bh = ((eq - minEquity) / eqRange) * (chartH - 5);
      const bx = chartX + 5 + i * (barW2 + 1.2);
      const by = chartY + chartH - bh;

      // gradient effect
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(bx, by, barW2 - 1, bh, 0.8, 0.8, 'F');

      // year label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Yr${i + 1}`, bx + (barW2 - 1) / 2, chartY + chartH + 4, { align: 'center' });

      // value label on top
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(fmt(eq), bx + (barW2 - 1) / 2, by - 1.5, { align: 'center' });
    });

    y = chartY + chartH + 10;
  }

  // ============================================================
  // 7. SCENARIO PARAMETERS
  // ============================================================
  if (scenarios.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = sectionHeader(doc, 'Scenario Parameters', y, pageWidth);

    const scenarioHeaders = ['Parameter', ...scenarios.map((s) => s.name)];
    const scenarioRows = [
      ['Purchase Price', ...scenarios.map((s) => fmt(parseFloat(s.purchasePrice) || 0))],
      ['Down Payment (%)', ...scenarios.map((s) => `${s.downPaymentPct}%`)],
      ['Interest Rate (%)', ...scenarios.map((s) => `${s.interestRate}%`)],
      ['Monthly Rent', ...scenarios.map((s) => fmt(parseFloat(s.monthlyRent) || 0))],
      ['Vacancy Rate (%)', ...scenarios.map((s) => `${s.vacancyRate}%`)],
    ];

    autoTable(doc, {
      startY: y,
      head: [scenarioHeaders],
      body: scenarioRows,
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2.5, halign: 'center' },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ============================================================
  // 8. SCENARIO COMPARISON RESULTS
  // ============================================================
  if (results.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = sectionHeader(doc, 'Scenario Comparison Results', y, pageWidth);

    const resultHeaders = ['Metric', ...results.map((r) => r.name)];
    const metrics: { label: string; getValue: (r: Scenario) => string; getRaw: (r: Scenario) => number }[] = [
      { label: 'Cap Rate', getValue: (r) => fmtPct(r.capRate), getRaw: (r) => r.capRate },
      { label: 'Cash-on-Cash', getValue: (r) => fmtPct(r.cashOnCash), getRaw: (r) => r.cashOnCash },
      { label: 'Monthly Cash Flow', getValue: (r) => fmt(r.monthlyCashFlow), getRaw: (r) => r.monthlyCashFlow },
      { label: 'Annual NOI', getValue: (r) => fmt(r.noi), getRaw: (r) => r.noi },
    ];

    const bestIndices: number[] = metrics.map(({ getRaw }) => {
      const values = results.map(getRaw);
      return values.indexOf(Math.max(...values));
    });

    const resultRows = metrics.map(({ label, getValue }) => {
      return [label, ...results.map((r) => getValue(r))];
    });

    autoTable(doc, {
      startY: y,
      head: [resultHeaders],
      body: resultRows,
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2.5, halign: 'center' },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index > 0) {
          const rowIdx = data.row.index;
          const colIdx = data.column.index - 1;
          if (bestIndices[rowIdx] === colIdx) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
            data.cell.text = [data.cell.raw + '  (best)'];
          }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ============================================================
    // 9. VISUAL COMPARISON CHARTS
    // ============================================================
    y = checkPageBreak(doc, y, 70);
    y = sectionHeader(doc, 'Visual Comparison', y, pageWidth);

    const scenarioColors: [number, number, number][] = [
      [79, 70, 229], [34, 197, 94], [249, 115, 22], [236, 72, 153], [139, 92, 246],
    ];

    const chartMetrics: { label: string; getValue: (r: Scenario) => number; format: (v: number) => string }[] = [
      { label: 'Cap Rate', getValue: (r) => r.capRate, format: (v) => `${v.toFixed(1)}%` },
      { label: 'Cash-on-Cash', getValue: (r) => r.cashOnCash, format: (v) => `${v.toFixed(1)}%` },
      { label: 'Monthly Cash Flow', getValue: (r) => r.monthlyCashFlow, format: fmt },
      { label: 'Annual NOI', getValue: (r) => r.noi, format: fmt },
    ];

    chartMetrics.forEach((metric) => {
      y = checkPageBreak(doc, y, 20);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(metric.label, 14, y);
      y += 4;

      const maxAbs = Math.max(...results.map((r) => Math.abs(metric.getValue(r))), 1);
      const barMaxW = pageWidth - 80;

      results.forEach((r, i) => {
        const val = metric.getValue(r);
        const barW = Math.max((Math.abs(val) / maxAbs) * barMaxW, 1);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(r.name, 14 + 24, y + 3, { align: 'right' });

        doc.setFillColor(240, 240, 240);
        doc.roundedRect(14 + 26, y, barMaxW, 4.5, 1, 1, 'F');

        doc.setFillColor(...(scenarioColors[i % scenarioColors.length]));
        doc.roundedRect(14 + 26, y, barW, 4.5, 1, 1, 'F');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(metric.format(val), pageWidth - 14, y + 3.2, { align: 'right' });

        y += 6;
      });
      y += 3;
    });

    // ============================================================
    // 10. RECOMMENDATION SUMMARY
    // ============================================================
    y = checkPageBreak(doc, y, 50);
    y = sectionHeader(doc, 'Recommendation Summary', y, pageWidth);

    const bestByCapRate = [...results].sort((a, b) => b.capRate - a.capRate)[0];
    const bestByCashFlow = [...results].sort((a, b) => b.monthlyCashFlow - a.monthlyCashFlow)[0];
    const bestByCoC = [...results].sort((a, b) => b.cashOnCash - a.cashOnCash)[0];
    const bestByNoi = [...results].sort((a, b) => b.noi - a.noi)[0];

    doc.setFillColor(245, 243, 255);
    doc.roundedRect(14, y - 2, pageWidth - 28, 42, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    const recommendations = [
      [`Best Cap Rate:`, `${bestByCapRate.name}  (${fmtPct(bestByCapRate.capRate)})`],
      [`Best Cash-on-Cash:`, `${bestByCoC.name}  (${fmtPct(bestByCoC.cashOnCash)})`],
      [`Best Monthly Cash Flow:`, `${bestByCashFlow.name}  (${fmt(bestByCashFlow.monthlyCashFlow)})`],
      [`Best Annual NOI:`, `${bestByNoi.name}  (${fmt(bestByNoi.noi)})`],
    ];

    recommendations.forEach((rec, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...INDIGO);
      doc.text(rec[0], 20, y + 5 + i * 9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(rec[1], 70, y + 5 + i * 9);
    });

    y += 50;
  }

  // ============================================================
  // FOOTER ON ALL PAGES
  // ============================================================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Real Estate Deal Evaluator — Confidential Investment Analysis', 14, pageH - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageH - 8, { align: 'right' });
    // thin line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(14, pageH - 12, pageWidth - 14, pageH - 12);
  }

  const address = property?.address?.replace(/[^a-zA-Z0-9]/g, '_') || 'property';
  doc.save(`Investment_Report_${address}.pdf`);
}
