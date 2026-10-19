"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Promise-based replacement for window.confirm: `if (await confirm({...})) ...` */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;
    confirmButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-300 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="pop-in w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  options.danger ? "bg-expense-bg text-expense" : "bg-primary/10 text-primary"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {options.danger ? (
                    <>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </>
                  )}
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-sm font-bold text-text-primary">{options.title}</h2>
                {options.message && (
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{options.message}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                ref={confirmButton}
                type="button"
                onClick={() => close(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  options.danger
                    ? "bg-expense text-white hover:bg-expense/90"
                    : "bg-primary text-on-primary hover:bg-primary-dark"
                }`}
              >
                {options.confirmLabel ?? "تأكيد"}
              </button>
              <button
                type="button"
                onClick={() => close(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                {options.cancelLabel ?? "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
