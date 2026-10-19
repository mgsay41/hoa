"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal, flushSync } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportView, getPeriodLabel, type ReportData } from "@/components/report-view";
import { ReportPdfPages, type PdfTransaction } from "@/components/report-pdf";
import { ErrorState } from "@/components/states";
import { useToast } from "@/components/toast";
import { arabicMonths, formatAmount } from "@/lib/utils";
import { useYears } from "@/lib/use-years";
import { whatsappLink } from "@/lib/share";
import { buildReportPdf, canShareFiles, downloadFile, reportFileName } from "@/lib/report-pdf";

const selectClass =
  "px-4 py-2 rounded-xl border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none bg-surface";

export function Reports() {
  const now = new Date();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const years = useYears();

  // The selection lives in the URL so a report can be shared as a link
  const mode: "month" | "year" = searchParams.get("mode") === "year" ? "year" : "month";
  const selectedMonth = Math.min(12, Math.max(1, Number(searchParams.get("month")) || now.getMonth() + 1));
  const selectedYear = Number(searchParams.get("year")) || now.getFullYear();

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [pdfTransactions, setPdfTransactions] = useState<PdfTransaction[] | null>(null);
  // A ready PDF waiting for the user to tap "share" (the share sheet needs a fresh tap)
  const [ready, setReady] = useState<{ file: File; text: string } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const setSelection = (next: { mode?: "month" | "year"; month?: number; year?: number }) => {
    const params = new URLSearchParams();
    const m = next.mode ?? mode;
    params.set("mode", m);
    if (m === "month") params.set("month", String(next.month ?? selectedMonth));
    params.set("year", String(next.year ?? selectedYear));
    setLoading(true);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (mode === "month") params.set("month", selectedMonth.toString());
      params.set("year", selectedYear.toString());

      const [summaryRes, incomeCatRes, expenseCatRes, monthlyRes] = await Promise.all([
        fetch(`/api/transactions/summary?${params}`),
        fetch(`/api/analytics/categories?${params}&type=INCOME`),
        fetch(`/api/analytics/categories?${params}&type=EXPENSE`),
        mode === "year" ? fetch(`/api/analytics/monthly?year=${selectedYear}`) : Promise.resolve(null),
      ]);

      if (!summaryRes.ok || !incomeCatRes.ok || !expenseCatRes.ok || (monthlyRes && !monthlyRes.ok)) {
        throw new Error("Failed to fetch");
      }

      const [summary, incomeData, expenseData, monthlyData] = await Promise.all([
        summaryRes.json(),
        incomeCatRes.json(),
        expenseCatRes.json(),
        monthlyRes ? monthlyRes.json() : Promise.resolve(null),
      ]);

      setData({
        periodLabel: getPeriodLabel(mode, selectedMonth, selectedYear),
        income: summary.currentMonth.income,
        expense: summary.currentMonth.expense,
        net: summary.currentMonth.net,
        incomeCategories: incomeData.categories,
        expenseCategories: expenseData.categories,
        monthly: monthlyData?.monthly,
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Every transaction of the selected period, oldest first, for the detailed PDF pages. */
  const fetchAllTransactions = async () => {
    const params = new URLSearchParams({ year: String(selectedYear), sort: "date_asc", limit: "100" });
    if (mode === "month") params.set("month", String(selectedMonth));
    const all: PdfTransaction[] = [];
    for (let page = 1; page <= 50; page++) {
      params.set("page", String(page));
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const body = await res.json();
      all.push(...body.transactions);
      if (page >= body.pagination.totalPages) break;
    }
    return all;
  };

  const generatePdf = async () => {
    if (!data) throw new Error("No report data");
    const transactions = await fetchAllTransactions();
    // Render the off-screen pages synchronously, then let the browser lay them out
    flushSync(() => setPdfTransactions(transactions));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (!pdfRef.current) throw new Error("PDF pages not mounted");
    const blob = await buildReportPdf(pdfRef.current);
    setPdfTransactions(null);
    return new File([blob], reportFileName(data.periodLabel), { type: "application/pdf" });
  };

  // Same summary for the WhatsApp text and the caption that goes with the PDF
  const summaryText = () => {
    if (!data) return "";
    return [
      `📊 التقرير المالي لاتحاد ملاك برج الوليد — ${data.periodLabel}`,
      `🟢 الإيرادات: ${formatAmount(data.income)} ج.م`,
      `🔴 المصروفات: ${formatAmount(data.expense)} ج.م`,
      `${data.net >= 0 ? "✅" : "⚠️"} الصافي: ${data.net >= 0 ? "+" : ""}${formatAmount(data.net)} ج.م`,
      "",
      `التفاصيل: ${window.location.href}`,
    ].join("\n");
  };

  const handleDownload = async () => {
    setBusy("download");
    try {
      downloadFile(await generatePdf());
    } catch {
      toast("تعذر إنشاء ملف PDF", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy("share");
    try {
      setReady({ file: await generatePdf(), text: summaryText() });
    } catch {
      toast("تعذر إنشاء ملف PDF", "error");
    } finally {
      setBusy(null);
    }
  };

  const shareReady = async () => {
    if (!ready) return;
    try {
      await navigator.share({ files: [ready.file], text: ready.text, title: ready.file.name });
      setReady(null);
    } catch (e) {
      // AbortError = the user closed the share sheet; keep the dialog so they can retry
      if ((e as Error).name !== "AbortError") toast("تعذرت المشاركة — جرّب التنزيل ثم الإرسال يدوياً", "error");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("تم نسخ رابط التقرير");
    } catch {
      toast("تعذر نسخ الرابط", "error");
    }
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">التقارير المالية</h1>
          <p className="text-sm text-text-muted mt-0.5">تقرير شهري أو سنوي قابل للتحميل والمشاركة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={!data || busy !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-income text-white hover:bg-income/90 transition-colors disabled:opacity-50"
          >
            {busy === "share" ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 8 4.42zm8.02-17.45A11.33 11.33 0 0 0 12.04.75 11.37 11.37 0 0 0 2.2 17.8L.6 23.6l5.94-1.56a11.35 11.35 0 0 0 5.43 1.38h.01A11.37 11.37 0 0 0 20.06 4.05z" />
            </svg>
            )}
            {busy === "share" ? "جارٍ تجهيز التقرير..." : "مشاركة التقرير"}
          </button>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border border-border text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            نسخ الرابط
          </button>
          <button
            onClick={handleDownload}
            disabled={!data || busy !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === "download" ? (
              <>
                <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                جارٍ التحميل...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                تحميل PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-0.5 bg-bg rounded-xl p-1 border border-border" role="tablist" aria-label="نوع التقرير">
            {(["month", "year"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setSelection({ mode: m })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m ? "bg-primary text-on-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m === "month" ? "تقرير شهري" : "تقرير سنوي"}
              </button>
            ))}
          </div>

          {mode === "month" && (
            <select value={selectedMonth} onChange={(e) => setSelection({ month: Number(e.target.value) })} aria-label="الشهر" className={selectClass}>
              {arabicMonths.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          )}

          <select value={selectedYear} onChange={(e) => setSelection({ year: Number(e.target.value) })} aria-label="السنة" className={selectClass}>
            {(years.includes(selectedYear) ? years : [selectedYear, ...years]).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-surface border border-border rounded-2xl">
          <ErrorState message="تعذر تحميل التقرير" onRetry={() => { setLoading(true); fetchData(); }} />
        </div>
      ) : (
        <ReportView ref={reportRef} data={data} loading={loading} />
      )}

      {/* Off-screen A4 pages, mounted only while a PDF is being generated */}
      <div style={{ position: "fixed", top: 0, left: "-10000px", pointerEvents: "none" }} aria-hidden>
        {data && pdfTransactions && <ReportPdfPages ref={pdfRef} data={data} transactions={pdfTransactions} />}
      </div>

      {ready && <ShareDialog ready={ready} onShare={shareReady} onClose={() => setReady(null)} />}
    </div>
  );
}

function ShareDialog({
  ready,
  onShare,
  onClose,
}: {
  ready: { file: File; text: string };
  onShare: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const nativeShare = canShareFiles();
  const sizeKb = Math.max(1, Math.round(ready.file.size / 1024));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(ready.text);
      toast("تم نسخ الملخص");
    } catch {
      toast("تعذر النسخ", "error");
    }
  };

  // Portal to <body>: the page's fade-in transform would otherwise trap this fixed overlay inside the page
  return createPortal(
    <div className="fixed inset-0 z-300 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="pop-in w-full max-w-md bg-surface border border-border rounded-2xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="share-title" className="text-sm font-bold text-text-primary">التقرير جاهز للمشاركة</h2>
            <p className="text-xs text-text-muted mt-1" dir="auto">📄 {ready.file.name} — {sizeKb.toLocaleString("ar-EG")} ك.ب</p>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="text-text-muted hover:text-text-primary text-lg leading-none">✕</button>
        </div>

        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-secondary bg-bg border border-border rounded-xl p-3 mb-4 font-sans" dir="rtl">
          {ready.text}
        </pre>

        {nativeShare ? (
          <>
            <button
              type="button"
              onClick={onShare}
              autoFocus
              className="w-full py-3 rounded-xl text-sm font-semibold bg-income text-white hover:bg-income/90 transition-colors"
            >
              مشاركة الملف مع الملخص
            </button>
            <p className="text-[11px] text-text-muted mt-2 text-center">
              اختر «واتساب» من قائمة المشاركة، ثم جهة الاتصال أو المجموعة
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-text-secondary mb-3">
              متصفحك لا يدعم إرسال الملفات مباشرة. نزّل الملف ثم افتح واتساب — الملخص سيكون مكتوباً، فقط أرفق الملف قبل الإرسال.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => downloadFile(ready.file)}
                className="py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-dark transition-colors"
              >
                ١. تنزيل PDF
              </button>
              <a
                href={whatsappLink(ready.text)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 rounded-xl text-sm font-semibold text-center bg-income text-white hover:bg-income/90 transition-colors"
              >
                ٢. فتح واتساب
              </a>
            </div>
          </>
        )}

        <button type="button" onClick={copySummary} className="w-full mt-3 text-xs text-primary hover:underline">
          نسخ الملخص فقط
        </button>
      </div>
    </div>,
    document.body
  );
}
