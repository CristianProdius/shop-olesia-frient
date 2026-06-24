/**
 * Localized (en/ru/ro) transactional email builders.
 *
 * These are PLAIN, PURE functions: they take an order-shaped object plus a
 * locale and return `{ subject, html }`. They intentionally do NOT depend on
 * next-intl server context (that needs a request scope and isn't available in
 * arbitrary server code), so localization is done via a small in-file
 * dictionary. Keeping them pure also makes them trivially testable later.
 */

type Locale = "en" | "ru" | "ro";

// Minimal price type: Prisma `Decimal`, number, string, or null all coerce
// cleanly via `Number(...)`.
type PriceLike = number | string | { toString(): string } | null | undefined;

export type EmailOrderItem = {
    quantity: number;
    unitPrice: PriceLike;
    // Optional human label for the line; falls back to the productId.
    productName?: string | null;
    productId?: string | null;
};

export type EmailOrder = {
    id: string;
    email?: string | null;
    customerName?: string | null;
    locale?: string | null;
    carrier?: string | null;
    trackingNumber?: string | null;
    orderItems?: EmailOrderItem[] | null;
};

function normalizeLocale(locale?: string | null): Locale {
    return locale === "ru" || locale === "ro" ? locale : "en";
}

// Intl locale tag matching the storefront convention (currency: MDL).
const INTL_LOCALE: Record<Locale, string> = {
    en: "en-US",
    ru: "ru-RU",
    ro: "ro-MD",
};

function formatMdl(value: PriceLike, locale: Locale): string {
    const n = value == null ? 0 : Number(value.toString());
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat(INTL_LOCALE[locale], {
        style: "currency",
        currency: "MDL",
    }).format(safe);
}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// --- Dictionaries -----------------------------------------------------------

const confirmationDict: Record<
    Locale,
    {
        subject: (id: string) => string;
        greeting: (name: string) => string;
        intro: string;
        orderLabel: string;
        itemHeader: string;
        qtyHeader: string;
        priceHeader: string;
        lineTotalHeader: string;
        totalLabel: string;
        simulatedNote: string;
        thanks: string;
    }
> = {
    en: {
        subject: (id) => `Your LILETTI order ${id} is confirmed`,
        greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
        intro: "Thank you for your order! Here is a summary:",
        orderLabel: "Order",
        itemHeader: "Item",
        qtyHeader: "Qty",
        priceHeader: "Unit price",
        lineTotalHeader: "Total",
        totalLabel: "Order total",
        simulatedNote:
            "Note: this is a simulated payment — no real charge was made.",
        thanks: "We'll let you know when your order ships.",
    },
    ru: {
        subject: (id) => `Ваш заказ LILETTI ${id} подтверждён`,
        greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
        intro: "Спасибо за ваш заказ! Краткая информация:",
        orderLabel: "Заказ",
        itemHeader: "Товар",
        qtyHeader: "Кол-во",
        priceHeader: "Цена за шт.",
        lineTotalHeader: "Сумма",
        totalLabel: "Итого по заказу",
        simulatedNote:
            "Примечание: это симуляция оплаты — реальное списание не производилось.",
        thanks: "Мы сообщим вам, когда заказ будет отправлен.",
    },
    ro: {
        subject: (id) => `Comanda dvs. LILETTI ${id} este confirmată`,
        greeting: (name) => (name ? `Bună, ${name},` : "Bună,"),
        intro: "Vă mulțumim pentru comandă! Iată un rezumat:",
        orderLabel: "Comanda",
        itemHeader: "Produs",
        qtyHeader: "Cant.",
        priceHeader: "Preț unitar",
        lineTotalHeader: "Total",
        totalLabel: "Total comandă",
        simulatedNote:
            "Notă: aceasta este o plată simulată — nu a fost efectuată nicio plată reală.",
        thanks: "Vă vom anunța când comanda dvs. va fi expediată.",
    },
};

const shippedDict: Record<
    Locale,
    {
        subject: (id: string) => string;
        greeting: (name: string) => string;
        intro: (id: string) => string;
        carrierLabel: string;
        trackingLabel: string;
        noTracking: string;
        thanks: string;
    }
> = {
    en: {
        subject: (id) => `Your LILETTI order ${id} has shipped`,
        greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
        intro: (id) => `Good news — your order ${id} is on its way!`,
        carrierLabel: "Carrier",
        trackingLabel: "Tracking number",
        noTracking:
            "Tracking details will follow shortly if not included here.",
        thanks: "Thank you for shopping with LILETTI.",
    },
    ru: {
        subject: (id) => `Ваш заказ LILETTI ${id} отправлен`,
        greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
        intro: (id) => `Хорошие новости — ваш заказ ${id} уже в пути!`,
        carrierLabel: "Перевозчик",
        trackingLabel: "Номер отслеживания",
        noTracking:
            "Данные для отслеживания будут отправлены позже, если их нет здесь.",
        thanks: "Спасибо, что выбрали LILETTI.",
    },
    ro: {
        subject: (id) => `Comanda dvs. LILETTI ${id} a fost expediată`,
        greeting: (name) => (name ? `Bună, ${name},` : "Bună,"),
        intro: (id) => `Vești bune — comanda dvs. ${id} este pe drum!`,
        carrierLabel: "Curier",
        trackingLabel: "Număr de urmărire",
        noTracking:
            "Detaliile de urmărire vor urma în curând dacă nu sunt incluse aici.",
        thanks: "Vă mulțumim că ați ales LILETTI.",
    },
};

// --- Builders ---------------------------------------------------------------

const WRAP_OPEN =
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">';
const WRAP_CLOSE = "</div>";

export function orderConfirmationEmail(
    order: EmailOrder,
    localeInput?: string | null,
): { subject: string; html: string } {
    const locale = normalizeLocale(localeInput ?? order.locale);
    const d = confirmationDict[locale];

    const name = escapeHtml((order.customerName ?? "").trim());
    const items = order.orderItems ?? [];

    let total = 0;
    const rows = items
        .map((it) => {
            const qty = Math.max(0, Number(it.quantity) || 0);
            const unit = it.unitPrice == null ? 0 : Number(it.unitPrice.toString());
            const safeUnit = Number.isFinite(unit) ? unit : 0;
            const lineTotal = qty * safeUnit;
            total += lineTotal;
            const label = escapeHtml(
                (it.productName ?? it.productId ?? "").toString(),
            );
            return `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${label}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${formatMdl(safeUnit, locale)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${formatMdl(lineTotal, locale)}</td>
      </tr>`;
        })
        .join("");

    const html = `${WRAP_OPEN}
    <h1 style="font-size:20px;margin:0 0 16px;">LILETTI</h1>
    <p style="margin:0 0 8px;">${d.greeting(name)}</p>
    <p style="margin:0 0 16px;">${d.intro}</p>
    <p style="margin:0 0 12px;"><strong>${d.orderLabel}:</strong> ${escapeHtml(order.id)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;">${d.itemHeader}</th>
          <th style="padding:6px 8px;text-align:center;border-bottom:2px solid #ddd;">${d.qtyHeader}</th>
          <th style="padding:6px 8px;text-align:right;border-bottom:2px solid #ddd;">${d.priceHeader}</th>
          <th style="padding:6px 8px;text-align:right;border-bottom:2px solid #ddd;">${d.lineTotalHeader}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:16px 0 8px;text-align:right;font-size:16px;"><strong>${d.totalLabel}: ${formatMdl(total, locale)}</strong></p>
    <p style="margin:16px 0 8px;color:#666;font-size:13px;">${d.simulatedNote}</p>
    <p style="margin:16px 0 0;">${d.thanks}</p>
  ${WRAP_CLOSE}`;

    return { subject: d.subject(order.id), html };
}

const backInStockDict: Record<
    Locale,
    {
        subject: (product: string) => string;
        greeting: string;
        intro: (product: string) => string;
        cta: string;
        thanks: string;
    }
> = {
    en: {
        subject: (product) => `${product} is back in stock at LILETTI`,
        greeting: "Hi,",
        intro: (product) =>
            `Good news — ${product} that you wanted is back in stock!`,
        cta: "Hurry, limited quantities are available.",
        thanks: "Thank you for shopping with LILETTI.",
    },
    ru: {
        subject: (product) => `${product} снова в наличии в LILETTI`,
        greeting: "Здравствуйте!",
        intro: (product) =>
            `Хорошие новости — ${product}, который вы хотели, снова в наличии!`,
        cta: "Поторопитесь, количество ограничено.",
        thanks: "Спасибо, что выбрали LILETTI.",
    },
    ro: {
        subject: (product) => `${product} este din nou în stoc la LILETTI`,
        greeting: "Bună,",
        intro: (product) =>
            `Vești bune — ${product} pe care îl doreați este din nou în stoc!`,
        cta: "Grăbiți-vă, cantitățile sunt limitate.",
        thanks: "Vă mulțumim că ați ales LILETTI.",
    },
};

// Back-in-stock notification email. `productLabel` is a best-effort human label
// (product name + optional size/color); falls back to a generic phrase.
export function backInStockEmail(
    productLabel: string | null | undefined,
    localeInput?: string | null,
): { subject: string; html: string } {
    const locale = normalizeLocale(localeInput);
    const d = backInStockDict[locale];

    const fallback: Record<Locale, string> = {
        en: "An item",
        ru: "Товар",
        ro: "Un produs",
    };
    const label = escapeHtml((productLabel ?? "").trim() || fallback[locale]);

    const html = `${WRAP_OPEN}
    <h1 style="font-size:20px;margin:0 0 16px;">LILETTI</h1>
    <p style="margin:0 0 8px;">${d.greeting}</p>
    <p style="margin:0 0 16px;">${d.intro(label)}</p>
    <p style="margin:0 0 16px;color:#666;">${d.cta}</p>
    <p style="margin:16px 0 0;">${d.thanks}</p>
  ${WRAP_CLOSE}`;

    return { subject: d.subject(label), html };
}

export function orderShippedEmail(
    order: EmailOrder,
    localeInput?: string | null,
): { subject: string; html: string } {
    const locale = normalizeLocale(localeInput ?? order.locale);
    const d = shippedDict[locale];

    const name = escapeHtml((order.customerName ?? "").trim());
    const carrier = (order.carrier ?? "").trim();
    const tracking = (order.trackingNumber ?? "").trim();

    const detailRows: string[] = [];
    if (carrier) {
        detailRows.push(
            `<p style="margin:0 0 6px;"><strong>${d.carrierLabel}:</strong> ${escapeHtml(carrier)}</p>`,
        );
    }
    if (tracking) {
        detailRows.push(
            `<p style="margin:0 0 6px;"><strong>${d.trackingLabel}:</strong> ${escapeHtml(tracking)}</p>`,
        );
    }
    const details =
        detailRows.length > 0
            ? detailRows.join("")
            : `<p style="margin:0 0 6px;color:#666;">${d.noTracking}</p>`;

    const html = `${WRAP_OPEN}
    <h1 style="font-size:20px;margin:0 0 16px;">LILETTI</h1>
    <p style="margin:0 0 8px;">${d.greeting(name)}</p>
    <p style="margin:0 0 16px;">${d.intro(escapeHtml(order.id))}</p>
    ${details}
    <p style="margin:16px 0 0;">${d.thanks}</p>
  ${WRAP_CLOSE}`;

    return { subject: d.subject(order.id), html };
}
