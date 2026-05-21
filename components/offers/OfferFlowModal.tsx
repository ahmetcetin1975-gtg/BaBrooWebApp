"use client";

import { Check, Coins, Loader2, X } from "lucide-react";
import { normalizeLang } from "@/lib/i18n/languages";
import { getMessages } from "@/lib/i18n/messages";

export type OfferModalMode = "form" | "insufficient" | "success";

type OfferFlowModalProps = {
  open: boolean;
  lang: string;
  kind: "product" | "service" | "customer" | "ai";
  mode: OfferModalMode;
  coinFee: number | null;
  loadingFee: boolean;
  message: string;
  sending: boolean;
  error: string | null;
  successMessage: string | null;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onOpenTopUp: () => void;
};

function formatCoinFee(value: number | null, lang: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toLocaleString(lang === "tr" ? "tr-TR" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function OfferFlowModal({
  open,
  lang,
  kind,
  mode,
  coinFee,
  loadingFee,
  message,
  sending,
  error,
  successMessage,
  onMessageChange,
  onClose,
  onSubmit,
  onOpenTopUp,
}: OfferFlowModalProps) {
  if (!open) return null;

  const currentLang = normalizeLang(lang);
  const messages = getMessages(currentLang);
  const t = messages.offerModal;
  const feeText = formatCoinFee(coinFee, currentLang);
  const actionLabel =
    kind === "product"
      ? t.productAction
      : kind === "service"
      ? t.serviceAction
      : kind === "ai"
      ? t.aiAction
      : t.messageAction;
  const sendTitle = kind === "ai" ? t.aiAction : t.sendMessageTitle;

  if (mode === "insufficient") {
    return (
      <div
        className="gtg-modal-viewport fixed inset-0 z-[90] flex items-start justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center sm:py-6"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="gtg-mobile-modal-panel w-full max-w-[520px] rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:px-7 sm:py-7"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto flex w-fit items-center gap-2 rounded-xl border border-red-500/80 bg-[#fff4f4] px-4 py-2.5">
            <Coins className="h-6 w-6 text-[var(--gtg-orange)]" />
            <span className="text-[18px] font-bold text-neutral-900">{feeText}</span>
          </div>

          <h2 className="mt-6 text-[24px] font-bold tracking-tight text-neutral-900 sm:text-[26px]">
            {t.insufficientTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-[360px] text-[16px] leading-7 text-neutral-600">
            {t.insufficientText}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onOpenTopUp}
              className="inline-flex min-h-[58px] flex-1 items-center justify-center rounded-full bg-[linear-gradient(90deg,#ff9f0a_0%,#ffb11f_100%)] px-6 text-[18px] font-semibold text-white shadow-[0_14px_30px_rgba(255,159,10,0.24)] transition hover:brightness-95"
            >
              {t.topUp}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[58px] flex-1 items-center justify-center rounded-full border border-[#e7e7ef] bg-white px-6 text-[18px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "success") {
    return (
      <div
        className="gtg-modal-viewport fixed inset-0 z-[90] flex items-start justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center sm:py-6"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="gtg-mobile-modal-panel w-full max-w-[540px] rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:px-7 sm:py-7"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[linear-gradient(180deg,#ffb21c_0%,#ff9708_100%)] shadow-[0_16px_34px_rgba(255,166,17,0.22)]">
            <Check className="h-11 w-11 text-white" strokeWidth={4} />
          </div>

          <h2 className="mt-6 text-[24px] font-bold tracking-tight text-[var(--gtg-orange)] sm:text-[26px]">
            {kind === "customer"
              ? t.customerSuccessTitle
              : kind === "ai"
              ? t.aiSuccessTitle
              : t.offerSuccessTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[360px] text-[16px] leading-7 text-neutral-700">
            {successMessage ??
              (kind === "customer"
                ? t.customerSuccessText
                : kind === "ai"
                ? t.aiSuccessText
                : t.offerSuccessText)}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 inline-flex min-h-[58px] min-w-[180px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#ff9f0a_0%,#ffb11f_100%)] px-8 text-[18px] font-semibold text-white shadow-[0_14px_30px_rgba(255,159,10,0.24)] transition hover:brightness-95"
          >
            {t.done}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="gtg-modal-viewport fixed inset-0 z-[90] flex items-start justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center sm:py-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="gtg-mobile-modal-panel w-full max-w-[560px] rounded-[28px] bg-white px-5 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:px-7 sm:py-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label={messages.support.close}
            className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-1 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff2df]">
            <Coins className="h-8 w-8 text-[var(--gtg-orange)]" />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{actionLabel}</p>
          <h2 className="mt-2 text-[20px] font-bold tracking-tight text-[var(--gtg-orange)] sm:text-[24px]">
            {loadingFee
              ? t.loadingCoinFee
              : `${sendTitle} - ${feeText} Coin`}
          </h2>
          <p className="mt-4 text-[18px] font-bold leading-tight text-neutral-900 sm:text-[21px]">
            {t.confirmSend}
          </p>
          <p className="mt-2 text-[15px] text-neutral-400">
            {t.noRefunds}
          </p>
        </div>

        <div className="mt-6">
          <textarea
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder={t.messagePlaceholder}
            rows={4}
            className="min-h-[150px] w-full resize-none rounded-[22px] border border-[#f1f1f5] bg-[#f7f7f8] px-5 py-4 text-[16px] text-neutral-800 outline-none transition placeholder:text-neutral-500 focus:border-[var(--gtg-orange)] focus:ring-2 focus:ring-[var(--gtg-orange)]/20"
          />
          {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[56px] items-center justify-center rounded-full px-5 text-[18px] font-semibold text-neutral-900 transition hover:bg-neutral-100"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={sending || loadingFee || message.trim() === ""}
            className="inline-flex min-h-[56px] min-w-[210px] items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(90deg,#ff9f0a_0%,#ffb11f_100%)] px-7 text-[18px] font-semibold text-white shadow-[0_14px_30px_rgba(255,159,10,0.24)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {t.sendButton}
          </button>
        </div>
      </div>
    </div>
  );
}
