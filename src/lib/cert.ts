import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function ensureCertificatesDir() {
  const dir = path.join(process.cwd(), "public", "certificates");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatCertificateDate(date: Date): string {
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const day = date.getDate();
  return `${day}${getOrdinalSuffix(day)} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export async function generateCertificatePdf({
  userName,
  userEmail,
  overallScore,
  fileName,
  contextTitle,
  completionDate,
}: {
  userName: string;
  userEmail: string;
  overallScore: number;
  fileName?: string;
  contextTitle?: string;
  completionDate?: Date;
}) {
  const dir = ensureCertificatesDir();
  const safe = userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = fileName && fileName.trim().length > 0 ? fileName : `${safe}.pdf`;
  const filePath = path.join(dir, finalName);

  const templatePath = path.join(process.cwd(), "assets", "certificate-template.png");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Certificate template not found at: ${templatePath}`);
  }

  //  Create fresh PDF at A4 landscape 
  // A4 landscape: 841.89  595.28 pt  (origin = bottom-left in pdf-lib)
  const pageWidth  = 841.89;
  const pageHeight = 595.28;

  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([pageWidth, pageHeight]);

  // Embed the PNG template as the full-page background
  const pngBytes = fs.readFileSync(templatePath);
  const pngImage = await pdfDoc.embedPng(pngBytes);
  page.drawImage(pngImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  const font  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const color = rgb(0.17, 0.16, 0.14); // Dark brown #2C2825

  const participantName = userName || userEmail;
  const certDate = formatCertificateDate(completionDate ?? new Date());

  //  Participant Name 
  // Sits centered in the blank space between "This certificate is awarded to :"
  // (~Y=446 pt) and the horizontal signature line (~Y=355 pt).
  // nameY=365 places the baseline just above the line with comfortable clearance.
  // Font size auto-scales down if the name is wider than the visible line (700 pt).
  const maxNameWidth = 700;
  let nameSize = 28;
  const rawNameWidth = font.widthOfTextAtSize(participantName, nameSize);
  if (rawNameWidth > maxNameWidth) {
    nameSize = Math.floor(nameSize * (maxNameWidth / rawNameWidth));
  }
  const nameX = (pageWidth - font.widthOfTextAtSize(participantName, nameSize)) / 2;
  const nameY = 330; // just above the signature line at ~355 pt

  page.drawText(participantName, { x: nameX, y: nameY, size: nameSize, font, color });

  // ── Completion Date ────────────────────────────────────────────────────────
  // The template already prints:
  //   "and demonstrated proficiency by passing the assessment on"
  // We overlay ONLY the date value so it reads as one continuous sentence.
  //
  // dateX = body-text left margin + measured width of the prefix string,
  //         both at the same font/size as we draw, keeping alignment exact.
  //
  // Body-text left margin calibrated from PNG: ~65 pt (≈7.7% of 841.89 pt).
  // dateY calibrated from PNG: body line-2 baseline ≈ 298 pt from bottom.
  const dateSize  = 14;
  const bodyLeftX = 167;
  const prefix    = "and demonstrated proficiency by passing the assessment on ";
  const dateX     = bodyLeftX + font.widthOfTextAtSize(prefix, dateSize);
  const dateY     = 242;

  page.drawText(certDate, { x: dateX, y: dateY, size: dateSize, font, color });

  const bytes = await pdfDoc.save();
  fs.writeFileSync(filePath, Buffer.from(bytes));
  return filePath;
}
