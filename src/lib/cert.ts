import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as QR from "qrcode";

export function ensureCertificatesDir() {
  const dir = path.join(process.cwd(), "public", "certificates");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Convert day number to ordinal format (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/**
 * Format date as "15th February 2026"
 */
function formatCertificateDate(date: Date): string {
  const day = date.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
}

export async function generateCertificatePdf({
  userName,
  userEmail,
  overallScore,
  fileName,
  contextTitle,
}: { userName: string; userEmail: string; overallScore: number; fileName?: string; contextTitle?: string }) {
  const dir = ensureCertificatesDir();
  const safe = userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = fileName && fileName.trim().length > 0 ? fileName : `${safe}.pdf`;
  const filePath = path.join(dir, finalName);

  // Load the certificate template
  const templatePath = path.join(process.cwd(), "assets", "Training Certificate.pdf");
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Certificate template not found at: ${templatePath}`);
  }

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Embed fonts - using Helvetica Oblique for elegant script-like appearance
  // For participant name (more elegant/italic style)
  const nameFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  // For date (regular style)
  const dateFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Prepare text
  const participantName = userName || userEmail;
  const completionDate = formatCertificateDate(new Date());

  // Text positioning (based on A4 standard size 595.28 x 841.89 points)
  // These coordinates are calculated for your certificate design
  
  // Participant Name - centered on the signature line (cursive area)
  // Y position approximately 410 from bottom (adjust based on your template)
  const nameSize = 32; // Larger elegant text for name
  const nameWidth = nameFont.widthOfTextAtSize(participantName, nameSize);
  const nameX = (width - nameWidth) / 2;
  const nameY = 410;

  // Date - positioned where the date line appears (lower section)
  // Y position approximately 270 from bottom (adjust based on your template)
  const dateSize = 14;
  const dateText = `and demonstrated proficiency by passing the assessment on ${completionDate}`;
  const dateWidth = dateFont.widthOfTextAtSize(dateText, dateSize);
  const dateX = (width - dateWidth) / 2;
  const dateY = 270;

  // Draw participant name in elegant style (dark color for visibility)
  firstPage.drawText(participantName, {
    x: nameX,
    y: nameY,
    size: nameSize,
    font: nameFont,
    color: rgb(0.17, 0.16, 0.14), // Dark brown/black color (#2C2825)
  });

  // Draw completion date
  firstPage.drawText(dateText, {
    x: dateX,
    y: dateY,
    size: dateSize,
    font: dateFont,
    color: rgb(0.17, 0.16, 0.14), // Dark brown/black color
  });

  // Save the modified PDF
  const bytes = await pdfDoc.save();
  fs.writeFileSync(filePath, Buffer.from(bytes));
  
  return filePath;
}

