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

const reviewRequestDict: Record<
    Locale,
    {
        subject: (id: string) => string;
        greeting: (name: string) => string;
        intro: string;
        cta: string;
        reviewLink: (product: string) => string;
        thanks: string;
    }
> = {
    en: {
        subject: () => `How did you like your LILETTI pieces?`,
        greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
        intro:
            "Your order has been delivered — we'd love to hear what you think. Your review helps other shoppers and takes just a moment.",
        cta: "Leave a review",
        reviewLink: (product) => `Review ${product}`,
        thanks: "Thank you for shopping with LILETTI.",
    },
    ru: {
        subject: () => `Как вам изделия LILETTI?`,
        greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
        intro:
            "Ваш заказ доставлен — поделитесь впечатлениями. Ваш отзыв поможет другим покупателям и займёт всего минуту.",
        cta: "Оставить отзыв",
        reviewLink: (product) => `Оставить отзыв: ${product}`,
        thanks: "Спасибо, что выбрали LILETTI.",
    },
    ro: {
        subject: () => `Cum vi s-au părut piesele LILETTI?`,
        greeting: (name) => (name ? `Bună, ${name},` : "Bună,"),
        intro:
            "Comanda dvs. a fost livrată — ne-ar plăcea să aflăm părerea dvs. Recenzia dvs. îi ajută pe alți cumpărători și durează doar un moment.",
        cta: "Lăsați o recenzie",
        reviewLink: (product) => `Recenzie: ${product}`,
        thanks: "Vă mulțumim că ați ales LILETTI.",
    },
};

// Post-delivery review-request email. `storeUrl` is the storefront origin
// (no trailing slash); links point at each product's reviews section.
export function orderReviewRequestEmail(
    order: EmailOrder,
    storeUrl: string,
    localeInput?: string | null,
): { subject: string; html: string } {
    const locale = normalizeLocale(localeInput ?? order.locale);
    const d = reviewRequestDict[locale];

    const name = escapeHtml((order.customerName ?? "").trim());
    const base = storeUrl.replace(/\/+$/, "");
    const items = order.orderItems ?? [];

    const seen = new Set<string>();
    const links = items
        .filter((it) => {
            const pid = (it.productId ?? "").toString();
            if (!pid || seen.has(pid)) return false;
            seen.add(pid);
            return true;
        })
        .map((it) => {
            const pid = encodeURIComponent((it.productId ?? "").toString());
            const label = escapeHtml(
                (it.productName ?? it.productId ?? "").toString(),
            );
            const href = `${base}/${locale}/product/${pid}#reviews`;
            return `<p style="margin:0 0 8px;"><a href="${href}" style="color:#1a1a1a;">${d.reviewLink(label)}</a></p>`;
        })
        .join("");

    const cta = `<p style="margin:16px 0;"><a href="${base}/${locale}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 20px;text-decoration:none;">${d.cta}</a></p>`;

    const html = `${WRAP_OPEN}
    <h1 style="font-size:20px;margin:0 0 16px;">LILETTI</h1>
    <p style="margin:0 0 8px;">${d.greeting(name)}</p>
    <p style="margin:0 0 16px;">${d.intro}</p>
    ${links || cta}
    <p style="margin:16px 0 0;">${d.thanks}</p>
  ${WRAP_CLOSE}`;

    return { subject: d.subject(order.id), html };
}

// --- Custom order (made-to-measure) requests --------------------------------

// Minimal shape for custom-order request emails. Like `EmailOrder`, this is a
// pure value object so the builders never touch next-intl request scope.
export type EmailCustomOrder = {
    id: string;
    name?: string | null;
    email?: string | null;
    locale?: string | null;
};

const customOrderConfirmationDict: Record<
    Locale,
    {
        subject: (id: string) => string;
        greeting: (name: string) => string;
        intro: string;
        referenceLabel: string;
        thanks: string;
    }
> = {
    en: {
        subject: (id) => `We received your custom order request ${id}`,
        greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
        intro:
            "Thank you for your custom order request! Our Olesia Frient atelier has received it and will review it shortly.",
        referenceLabel: "Reference",
        thanks: "We'll be in touch soon with the next steps.",
    },
    ru: {
        subject: (id) => `Мы получили ваш запрос на индивидуальный заказ ${id}`,
        greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
        intro:
            "Спасибо за ваш запрос на индивидуальный заказ! Ателье Olesia Frient получило его и скоро рассмотрит.",
        referenceLabel: "Номер запроса",
        thanks: "Мы свяжемся с вами в ближайшее время для уточнения деталей.",
    },
    ro: {
        subject: (id) => `Am primit solicitarea dvs. de comandă personalizată ${id}`,
        greeting: (name) => (name ? `Bună, ${name},` : "Bună,"),
        intro:
            "Vă mulțumim pentru solicitarea de comandă personalizată! Atelierul Olesia Frient a primit-o și o va analiza în curând.",
        referenceLabel: "Referință",
        thanks: "Vă vom contacta în curând cu pașii următori.",
    },
};

export function customOrderConfirmationEmail(
    request: EmailCustomOrder,
    localeInput?: string | null,
): { subject: string; html: string } {
    const locale = normalizeLocale(localeInput ?? request.locale);
    const d = customOrderConfirmationDict[locale];

    const name = escapeHtml((request.name ?? "").trim());

    const html = `${WRAP_OPEN}
    <h1 style="font-size:20px;margin:0 0 16px;">LILETTI</h1>
    <p style="margin:0 0 8px;">${d.greeting(name)}</p>
    <p style="margin:0 0 16px;">${d.intro}</p>
    <p style="margin:0 0 12px;"><strong>${d.referenceLabel}:</strong> ${escapeHtml(request.id)}</p>
    <p style="margin:16px 0 0;">${d.thanks}</p>
  ${WRAP_CLOSE}`;

    return { subject: d.subject(request.id), html };
}

type CustomOrderStatus = "quoted" | "accepted" | "declined";

const customOrderStatusDict: Record<
    CustomOrderStatus,
    Record<
        Locale,
        {
            subject: (id: string) => string;
            greeting: (name: string) => string;
            body: string;
            referenceLabel: string;
            thanks: string;
        }
    >
> = {
    quoted: {
        en: {
            subject: (id) => `A quote is ready for your custom order ${id}`,
            greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
            body:
                "Good news — we've prepared a quote for your custom order request. Reply to this email and we'll walk you through the details.",
            referenceLabel: "Reference",
            thanks: "Thank you for choosing Olesia Frient.",
        },
        ru: {
            subject: (id) => `Готово предложение по вашему заказу ${id}`,
            greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
            body:
                "Хорошие новости — мы подготовили предложение по вашему индивидуальному заказу. Ответьте на это письмо, и мы расскажем детали.",
            referenceLabel: "Номер запроса",
            thanks: "Спасибо, что выбрали Olesia Frient.",
        },
        ro: {
            subject: (id) => `O ofertă este gata pentru comanda dvs. ${id}`,
            greeting: (name) => (name ? `Bună, ${name},` : "Bună,"),
            body:
                "Vești bune — am pregătit o ofertă pentru solicitarea dvs. de comandă personalizată. Răspundeți la acest e-mail și vă vom prezenta detaliile.",
            referenceLabel: "Referință",
            thanks: "Vă mulțumim că ați ales Olesia Frient.",
        },
    },
    accepted: {
        en: {
            subject: (id) => `Your custom order ${id} is confirmed`,
            greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
            body:
                "Your custom order request has been accepted and is now in progress. We'll keep you posted on its progress.",
            referenceLabel: "Reference",
            thanks: "Thank you for choosing Olesia Frient.",
        },
        ru: {
            subject: (id) => `Ваш индивидуальный заказ ${id} подтверждён`,
            greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
            body:
                "Ваш запрос на индивидуальный заказ принят и теперь в работе. Мы будем держать вас в курсе.",
            referenceLabel: "Номер запроса",
            thanks: "Спасибо, что выбрали Olesia Frient.",
        },
        ro: {
            subject: (id) => `Comanda dvs. personalizată ${id} este confirmată`,
            greeting: (name) => (name ? `Bună, ${name},` : "Bună,"),
            body:
                "Solicitarea dvs. de comandă personalizată a fost acceptată și este acum în lucru. Vă vom ține la curent.",
            referenceLabel: "Referință",
            thanks: "Vă mulțumim că ați ales Olesia Frient.",
        },
    },
    declined: {
        en: {
            subject: (id) => `Update on your custom order request ${id}`,
            greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
            body:
                "Thank you for your interest. Unfortunately we're unable to take on your custom order request at this time. Please don't hesitate to reach out for anything else.",
            referenceLabel: "Reference",
            thanks: "Thank you for considering Olesia Frient.",
        },
        ru: {
            subject: (id) => `Обновление по вашему запросу ${id}`,
            greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
            body:
                "Спасибо за ваш интерес. К сожалению, сейчас мы не можем взять ваш индивидуальный заказ в работу. Будем рады помочь вам с чем-то ещё.",
            referenceLabel: "Номер запроса",
            thanks: "Спасибо, что рассматриваете Olesia Frient.",
        },
        ro: {
            subject: (id) => `Actualizare privind solicitarea dvs. ${id}`,
            greeting: (name) => (name ? `Bună, ${name},` : "Bună,"),
            body:
                "Vă mulțumim pentru interes. Din păcate, momentan nu putem prelua solicitarea dvs. de comandă personalizată. Nu ezitați să ne contactați pentru orice altceva.",
            referenceLabel: "Referință",
            thanks: "Vă mulțumim că ați luat în considerare Olesia Frient.",
        },
    },
};

export function customOrderStatusEmail(
    status: CustomOrderStatus,
    request: EmailCustomOrder,
    localeInput?: string | null,
): { subject: string; html: string } {
    const locale = normalizeLocale(localeInput ?? request.locale);
    const d = customOrderStatusDict[status][locale];

    const name = escapeHtml((request.name ?? "").trim());

    const html = `${WRAP_OPEN}
    <h1 style="font-size:20px;margin:0 0 16px;">LILETTI</h1>
    <p style="margin:0 0 8px;">${d.greeting(name)}</p>
    <p style="margin:0 0 16px;">${d.body}</p>
    <p style="margin:0 0 12px;"><strong>${d.referenceLabel}:</strong> ${escapeHtml(request.id)}</p>
    <p style="margin:16px 0 0;">${d.thanks}</p>
  ${WRAP_CLOSE}`;

    return { subject: d.subject(request.id), html };
}
