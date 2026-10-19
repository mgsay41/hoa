/**
 * Turns the off-screen report pages (each element marked [data-pdf-page], sized to A4)
 * into a multi-page PDF. Each page is captured separately so rows are never cut in half.
 * Pages are rendered as images because jsPDF can't shape Arabic text itself.
 */
export async function buildReportPdf(container: HTMLElement): Promise<Blob> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  await document.fonts?.ready;

  const pages = Array.from(container.querySelectorAll<HTMLElement>("[data-pdf-page]"));
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    if (i > 0) pdf.addPage();
    // JPEG keeps a 10+ page yearly report small enough to send on WhatsApp
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, 210, 297);
  }

  return pdf.output("blob");
}

export function reportFileName(periodLabel: string) {
  return `تقرير-برج-الوليد-${periodLabel.replace(/\s+/g, "-")}.pdf`;
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** True when the browser can hand a PDF to the system share sheet (phones, most tablets, Windows/macOS Chrome & Edge). */
export function canShareFiles() {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [new File(["x"], "test.pdf", { type: "application/pdf" })] });
  } catch {
    return false;
  }
}
