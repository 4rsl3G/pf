"use client";

import { Button } from "@/components/ui/button";

export default function CheckoutBar({
  total,
  onCheckout,
  disabled,
}: {
  total: string;
  onCheckout: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="
        fixed inset-x-0 bottom-0 z-40
        border-t border-soft
        bg-white/95 backdrop-blur-xl
      "
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-subtle">Total</div>
          <div className="text-lg font-semibold">{total}</div>
        </div>

        <Button
          onClick={onCheckout}
          disabled={disabled}
          className="btn-brand h-11 rounded-xl px-6"
        >
          Lanjut Checkout
        </Button>
      </div>
    </div>
  );
}
