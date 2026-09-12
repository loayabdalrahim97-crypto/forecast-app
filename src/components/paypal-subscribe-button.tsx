"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, string>;
        createSubscription: (data: unknown, actions: { subscription: { create: (opts: { plan_id: string }) => Promise<string> } }) => Promise<string>;
        onApprove: (data: { subscriptionID?: string }) => void;
        onError?: (err: unknown) => void;
      }) => { render: (selector: string | HTMLElement) => void };
    };
  }
}

/**
 * §9: renders the official PayPal Buttons SDK for a given plan ID.
 * The client never decides "payment succeeded" — onApprove only hands
 * the subscriptionID to our backend (§9 step 1: verify server-side).
 */
export function PayPalSubscribeButton({
  planId,
  locale,
  onSubscribed,
}: {
  planId: string | null;
  locale: string;
  onSubscribed: (subscriptionId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "unconfigured">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const configRes = await fetch("/api/billing/config").catch(() => null);
      const config = configRes && configRes.ok ? await configRes.json() : null;
      if (!config?.clientId || !planId) {
        if (!cancelled) setStatus("unconfigured");
        return;
      }

      if (!window.paypal) {
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&vault=true&intent=subscription`;
        script.onload = () => {
          if (!cancelled) renderButton();
        };
        script.onerror = () => {
          if (!cancelled) setStatus("error");
        };
        document.body.appendChild(script);
      } else {
        renderButton();
      }
    }

    function renderButton() {
      if (!window.paypal || !containerRef.current) {
        setStatus("error");
        return;
      }
      containerRef.current.innerHTML = "";
      window.paypal
        .Buttons({
          style: { shape: "pill", color: "black", layout: "horizontal", label: "subscribe" },
          createSubscription: (_data, actions) => actions.subscription.create({ plan_id: planId as string }),
          onApprove: (data) => {
            if (data.subscriptionID) onSubscribed(data.subscriptionID);
          },
          onError: () => setStatus("error"),
        })
        .render(containerRef.current);
      setStatus("ready");
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  if (status === "unconfigured") {
    return (
      <p style={{ fontSize: "0.8rem", color: "var(--fc-text-muted)" }}>
        {locale === "ar" ? "الدفع عبر PayPal غير مُهيّأ بعد." : "PayPal checkout isn't configured yet."}
      </p>
    );
  }
  if (status === "error") {
    return (
      <p style={{ fontSize: "0.8rem", color: "var(--fc-band-high)" }}>
        {locale === "ar" ? "تعذّر تحميل زر PayPal." : "Couldn't load the PayPal button."}
      </p>
    );
  }
  return <div ref={containerRef} />;
}
