import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ComparisonProperty {
  property_name: string;
  property_data: Record<string, any>;
  financing_data: Record<string, any>;
  expense_data: Record<string, any>;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

function computeMetrics(p: ComparisonProperty) {
  const pd = p.property_data || {};
  const fd = p.financing_data || {};
  const ed = p.expense_data || {};

  const purchasePrice = parseFloat(pd.purchase_price) || 0;
  const downPayment = parseFloat(fd.down_payment) || 0;
  const loanAmount = parseFloat(fd.loan_amount) || 0;
  const rate = (parseFloat(fd.interest_rate) || 0) / 100 / 12;
  const payments = (parseInt(fd.loan_term) || 30) * 12;

  let monthlyMortgage = 0;
  if (loanAmount > 0 && rate > 0) {
    monthlyMortgage = loanAmount * (rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
  }

  const monthlyRent = parseFloat(ed.monthly_rental_income) || 0;
  const vacancyRate = parseFloat(ed.vacancy_rate) || 0;
  const annualRental = monthlyRent * 12;
  const egi = annualRental * (1 - vacancyRate / 100);
  const totalExpenses = (parseFloat(ed.property_tax) || 0) + (parseFloat(ed.insurance) || 0) + (parseFloat(ed.maintenance) || 0) + egi * ((parseFloat(ed.management_fee) || 0) / 100);
  const noi = egi - totalExpenses;
  const annualDebt = monthlyMortgage * 12;
  const netCF = noi - annualDebt;

  return {
    address: pd.address || p.property_name || 'Untitled',
    city: pd.city || '',
    state: pd.state || '',
    purchasePrice,
    monthlyRent,
    capRate: purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0,
    cashOnCash: downPayment > 0 ? (netCF / downPayment) * 100 : 0,
    dscr: annualDebt > 0 ? noi / annualDebt : 0,
    grm: annualRental > 0 ? purchasePrice / annualRental : 0,
    monthlyCF: netCF / 12,
    opExRatio: egi > 0 ? (totalExpenses / egi) * 100 : 0,
    noi,
    downPayment,
  };
}

export async function exportComparisonPdf(setName: string, properties: ComparisonProperty[]): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape' });
  const metrics = properties.map(computeMetrics);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const green: [number, number, number] = [16, 185, 129]; // emerald-500

  // Helper for footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    doc.text('DealEval - Property Comparison Report | Confidential', 14, pageHeight - 10);
  };

  // ===== PAGE 1: Header + Property Summary + Metrics Table =====
  // Header
  doc.setFillColor(green[0], green[1], green[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Comparison Report', 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${setName} | ${new Date().toLocaleDateString()}`, pageWidth - 14, 20, { align: 'right' });

  // Property Summary Table
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Overview', 14, 45);

  const summaryHead = [['Property', 'Address', 'City/State', 'Purchase Price', 'Monthly Rent', 'Down Payment']];
  const summaryBody = metrics.map((m, i) => [
    `Property ${i + 1}`,
    m.address.substring(0, 35),
    `${m.city}, ${m.state}`.trim().replace(/^,\s*/, ''),
    fmt(m.purchasePrice),
    fmt(m.monthlyRent),
    fmt(m.downPayment),
  ]);

  (doc as any).autoTable({
    startY: 50,
    head: summaryHead,
    body: summaryBody,
    theme: 'grid',
    headStyles: { fillColor: green, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // Metrics Comparison Table
  let y = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Investment Metrics Comparison', 14, y);

  const metricsConfig = [
    { label: 'Cap Rate', key: 'capRate', format: (v: number) => `${v.toFixed(2)}%`, higherIsBetter: true },
    { label: 'Cash-on-Cash', key: 'cashOnCash', format: (v: number) => `${v.toFixed(2)}%`, higherIsBetter: true },
    { label: 'DSCR', key: 'dscr', format: (v: number) => v.toFixed(2), higherIsBetter: true },
    { label: 'GRM', key: 'grm', format: (v: number) => v.toFixed(1), higherIsBetter: false },
    { label: 'Monthly Cash Flow', key: 'monthlyCF', format: (v: number) => fmt(v), higherIsBetter: true },
    { label: 'OpEx Ratio', key: 'opExRatio', format: (v: number) => `${v.toFixed(1)}%`, higherIsBetter: false },
    { label: 'NOI', key: 'noi', format: (v: number) => fmt(v), higherIsBetter: true },
  ];

  const metricsHead = [['Metric', ...metrics.map((_, i) => `Property ${i + 1}`), 'Best']];
  const metricsBody = metricsConfig.map(mc => {
    const values = metrics.map(m => (m as any)[mc.key] as number);
    const best = mc.higherIsBetter ? Math.max(...values) : Math.min(...values);
    const bestIdx = values.indexOf(best);
    const row = [
      mc.label,
      ...values.map(v => mc.format(v)),
      `P${bestIdx + 1} \u2605`,
    ];
    return row;
  });

  (doc as any).autoTable({
    startY: y + 5,
    head: metricsHead,
    body: metricsBody,
    theme: 'grid',
    headStyles: { fillColor: green, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      // Highlight best values
      if (data.section === 'body' && data.column.index > 0 && data.column.index <= metrics.length) {
        const mc = metricsConfig[data.row.index];
        if (mc) {
          const values = metrics.map(m => (m as any)[mc.key] as number);
          const best = mc.higherIsBetter ? Math.max(...values) : Math.min(...values);
          if (values[data.column.index - 1] === best) {
            data.cell.styles.fillColor = [220, 252, 231]; // green-100
            data.cell.styles.textColor = [22, 101, 52]; // green-800
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  // ===== PAGE 2: Recommendation Summary =====
  doc.addPage();

  doc.setFillColor(green[0], green[1], green[2]);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommendation Summary', 14, 14);

  doc.setTextColor(0);
  const recoHead = [['Metric', 'Best Property', 'Value', 'Rating']];
  const recoBody = metricsConfig.map(mc => {
    const values = metrics.map(m => (m as any)[mc.key] as number);
    const best = mc.higherIsBetter ? Math.max(...values) : Math.min(...values);
    const bestIdx = values.indexOf(best);
    const rating = mc.key === 'capRate' ? (best >= 7 ? 'Excellent' : best >= 5 ? 'Good' : 'Fair')
      : mc.key === 'cashOnCash' ? (best >= 8 ? 'Excellent' : best >= 5 ? 'Good' : 'Fair')
      : mc.key === 'dscr' ? (best >= 1.25 ? 'Strong' : best >= 1.0 ? 'Adequate' : 'Weak')
      : mc.key === 'monthlyCF' ? (best >= 500 ? 'Excellent' : best > 0 ? 'Positive' : 'Negative')
      : '';
    return [mc.label, metrics[bestIdx].address.substring(0, 40), mc.format(best), rating];
  });

  (doc as any).autoTable({
    startY: 30,
    head: recoHead,
    body: recoBody,
    theme: 'grid',
    headStyles: { fillColor: green, fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  // Disclaimer
  y = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('This report is for informational purposes only and does not constitute financial advice.', 14, y);
  doc.text('Verify all data independently before making investment decisions.', 14, y + 5);

  // Add footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save
  const fileName = `Comparison_Report_${setName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
}
