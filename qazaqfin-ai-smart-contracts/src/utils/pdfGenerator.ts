import jsPDF from 'jspdf';
import { Contract, UserProfile } from '../types';

export const generateContractPDF = (contract: Contract, user?: UserProfile | null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('ELEKTRONIKALYQ KELISIMSHART', pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('SATYP ALU-SATU JANE BOLIP TOLEU SHARTY', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Contract ID & Date Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kelisimshart No: ${contract.id}`, 15, y);
  const dateStr = new Date(contract.createdAt).toLocaleDateString('kk-KZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Kuni: ${dateStr}`, pageWidth - 15, y, { align: 'right' });
  y += 10;

  // Section 1: Parties
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. TARAPTAR (PARTIES)', 15, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  // Seller box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, (pageWidth - 35) / 2, 28, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('SATUSHY (SELLER):', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(contract.sellerName || 'TOO QazaqFin Store', 18, y + 12);
  doc.text(`BIN: ${contract.sellerBin || '240140089123'}`, 18, y + 18);
  doc.text('Almaty q., Dostyq dangyly, 180', 18, y + 24);

  // Buyer box
  const rightX = 15 + (pageWidth - 35) / 2 + 5;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, y, (pageWidth - 35) / 2, 28, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('SATYP ALUSHY (BUYER):', rightX + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(user?.fullName || 'Tirkelgen qoldanushy', rightX + 3, y + 12);
  doc.text(`IIN: ${user?.iin || 'Korsetilmegen'}`, rightX + 3, y + 18);
  doc.text(`Tel: ${user?.phone || 'Korsetilmegen'}`, rightX + 3, y + 24);

  y += 35;

  // Section 2: Subject & Pricing
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. KELISIMSHART MANI JANE BAGASY (SUBJECT & TERMS)', 15, y);
  y += 6;

  // Product table
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Tauar atauly (Product)', 18, y + 5.5);
  doc.text('Turi (Type)', 105, y + 5.5);
  doc.text('Tolem (Amount)', pageWidth - 18, y + 5.5, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(contract.productName, 18, y + 6);
  doc.text(contract.type === 'CREDIT_INSTALLMENT' ? `Rassrochka (${contract.months} ai)` : 'Tolyq tolem', 105, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(`${contract.totalAmount.toLocaleString()} KZT`, pageWidth - 18, y + 6, { align: 'right' });
  y += 10;

  // Installment Details if applicable
  if (contract.type === 'CREDIT_INSTALLMENT') {
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(15, y, pageWidth - 30, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(49, 46, 129);
    doc.text(`• Bastapqy jarna (Down payment): ${contract.initialFee.toLocaleString()} KZT`, 20, y + 6);
    doc.text(`• Bolip toleu merzimi (Duration): ${contract.months} ai`, 20, y + 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`• Ai saiyn tolenetin somasy (Monthly installment): ${contract.monthlyPayment.toLocaleString()} KZT / ai`, 20, y + 16);
    y += 26;
  } else {
    y += 4;
  }

  // Section 3: Legal Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. ZANDYQ TARTIPTI SHARTTAR (LEGAL CLAUSES)', 15, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const legalClauses = [
    '3.1. Mazkur shart Qazaqstan Respublikasy Azamattyq kodeksine jane tutynushylar quqygyn qorgau turaly zanna bagynady.',
    '3.2. Satyp alushy tolem kestesin buzbaug\'a jane belgilengen keste boiynsha ai saiyn tolemdi oryndaug\'a mindetti.',
    '3.3. Tolem keshiktirilgen jagdaiynda Qazaqstan Respublikasy Zannamasyna saikes penya qoldanyluy mumkin.',
    '3.4. Mazkur elektron shart bir rettik SMS OTP kod arqyly kualandyrylyp, zandy kushi qagaz nusqamen ten.',
  ];

  for (const clause of legalClauses) {
    doc.text(clause, 15, y);
    y += 5;
  }

  y += 10;

  // Digital Signature / EDS Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. ELEKTRONIKALYQ CIFRLYQ QOL (DIGITAL SIGNATURE STAMP)', 15, y);
  y += 6;

  const stampBoxY = y;
  if (contract.isSigned) {
    doc.setDrawColor(16, 185, 129); // green-500
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(15, stampBoxY, pageWidth - 30, 32, 2, 2, 'FD');

    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('V  QOL QOYILGAN / SIGNED WITH VERIFIED OTP', 22, stampBoxY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Sertifikat: ${contract.digitalCertificate || 'EDS-KZ-VERIFIED-980415301824'}`, 22, stampBoxY + 15);
    const signTime = contract.signedAt ? new Date(contract.signedAt).toLocaleString('kk-KZ') : 'Rastaldy';
    doc.text(`Qol qoyylgan uaqyty: ${signTime}`, 22, stampBoxY + 21);
    doc.text(`SMS OTP kod: ${contract.signatureOtp} (One-Time Password Verified)`, 22, stampBoxY + 27);
  } else {
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(15, stampBoxY, pageWidth - 30, 26, 2, 2, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('! QOL QOYU KUTILUDE (PENDING SIGNATURE)', 22, stampBoxY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Qol qoyu ushin SMS OTP kod: ${contract.signatureOtp}`, 22, stampBoxY + 17);
    doc.text('Kelisimshartty bekitu ushin portal arqyly kodty engiziniz.', 22, stampBoxY + 22);
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('QazaqFin AI Smart Contracts Portal • Respublika Kazakhstan • Barliq quqyqtar qorgalgan', pageWidth / 2, 285, { align: 'center' });

  // Download trigger
  doc.save(`Kelisimshart_${contract.id}.pdf`);
};
