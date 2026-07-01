// Shared, static content seed data for the storefront:
// stats, FAQ, journal/blog, editorial content blocks and review templates.
//
// This module holds ONLY pure data (arrays/objects) plus a tiny i18n helper.
// It performs no Prisma calls. It is consumed by:
//   - scripts/seed-catalog.mjs      (destructive local reseed: deleteMany + create)
//   - scripts/seed-content-prod.mjs (additive production seed: upsert / skip)
//
// Runtime linkage that depends on created products (blog `coverImage`,
// content-block `mediaUrl`, review `productId`) is NOT stored here — the
// consuming script attaches it. All en/ru/ro i18n below is authoritative.

// 1) Stats (homepage / about trust strip). `order` + `isPublished` are added
//    by the consumer (order derived from array index).
export const STATS = [
  {
    key: "orders_shipped", value: "500+",
    label: "Orders shipped",
    labelI18n: { en: "Orders shipped", ru: "Заказов отправлено", ro: "Comenzi expediate" },
  },
  {
    key: "satisfaction", value: "99%",
    label: "Customer satisfaction",
    labelI18n: { en: "Customer satisfaction", ru: "Довольных клиентов", ro: "Clienți mulțumiți" },
  },
  {
    key: "repeat_customers", value: "45%",
    label: "Repeat customers",
    labelI18n: { en: "Repeat customers", ru: "Возвращаются снова", ro: "Clienți fideli" },
  },
  {
    key: "countries_shipped", value: "12+",
    label: "Countries shipped to",
    labelI18n: { en: "Countries shipped to", ru: "Стран доставки", ro: "Țări de livrare" },
  },
  {
    key: "atelier_pieces", value: "120+",
    label: "Atelier pieces",
    labelI18n: { en: "Atelier pieces", ru: "Моделей в ателье", ro: "Modele în atelier" },
  },
];

// 2) FAQ (shipping, sizing, returns, care, orders). `order` + `isPublished`
//    are added by the consumer (order derived from array index).
const cat = (en, ru, ro) => ({ category: en, categoryI18n: { en, ru, ro } });
export const FAQS = [
  {
    ...cat("Shipping", "Доставка", "Livrare"),
    question: "Where do you ship to?",
    questionI18n: {
      en: "Where do you ship to?",
      ru: "Куда вы доставляете?",
      ro: "Unde livrați?",
    },
    answer: "We ship across Moldova, Romania and most of Europe, with worldwide delivery to 12+ countries on request.",
    answerI18n: {
      en: "We ship across Moldova, Romania and most of Europe, with worldwide delivery to 12+ countries on request.",
      ru: "Мы доставляем по Молдове, Румынии и большей части Европы, а по запросу — в более чем 12 стран мира.",
      ro: "Livrăm în Moldova, România și în cea mai mare parte a Europei, iar la cerere în peste 12 țări din lume.",
    },
  },
  {
    ...cat("Shipping", "Доставка", "Livrare"),
    question: "How long does delivery take?",
    questionI18n: {
      en: "How long does delivery take?",
      ru: "Сколько занимает доставка?",
      ro: "Cât durează livrarea?",
    },
    answer: "Orders are dispatched within 1–2 business days. Delivery typically takes 2–4 days locally and 5–10 days internationally.",
    answerI18n: {
      en: "Orders are dispatched within 1–2 business days. Delivery typically takes 2–4 days locally and 5–10 days internationally.",
      ru: "Заказы отправляются в течение 1–2 рабочих дней. Доставка обычно занимает 2–4 дня по стране и 5–10 дней за рубеж.",
      ro: "Comenzile sunt expediate în 1–2 zile lucrătoare. Livrarea durează de obicei 2–4 zile local și 5–10 zile internațional.",
    },
  },
  {
    ...cat("Shipping", "Доставка", "Livrare"),
    question: "Is shipping free?",
    questionI18n: {
      en: "Is shipping free?",
      ru: "Доставка бесплатная?",
      ro: "Livrarea este gratuită?",
    },
    answer: "Shipping is complimentary on all orders over 1500 MDL. Below that, a flat local rate is shown at checkout.",
    answerI18n: {
      en: "Shipping is complimentary on all orders over 1500 MDL. Below that, a flat local rate is shown at checkout.",
      ru: "Доставка бесплатна для всех заказов свыше 1500 MDL. Для меньших сумм при оформлении указывается фиксированная ставка.",
      ro: "Livrarea este gratuită pentru comenzile peste 1500 MDL. Sub această sumă, la finalizare se afișează un tarif local fix.",
    },
  },
  {
    ...cat("Sizing", "Размеры", "Mărimi"),
    question: "How do I choose the right size?",
    questionI18n: {
      en: "How do I choose the right size?",
      ru: "Как выбрать правильный размер?",
      ro: "Cum aleg mărimea potrivită?",
    },
    answer: "Each product page includes a detailed size guide with measurements in centimetres. When in doubt between two sizes, we recommend the larger one.",
    answerI18n: {
      en: "Each product page includes a detailed size guide with measurements in centimetres. When in doubt between two sizes, we recommend the larger one.",
      ru: "На каждой странице товара есть подробная таблица размеров в сантиметрах. Если сомневаетесь между двумя размерами, выбирайте больший.",
      ro: "Fiecare pagină de produs include un ghid detaliat de mărimi în centimetri. Dacă ezitați între două mărimi, vă recomandăm pe cea mai mare.",
    },
  },
  {
    ...cat("Sizing", "Размеры", "Mărimi"),
    question: "Do you offer made-to-measure?",
    questionI18n: {
      en: "Do you offer made-to-measure?",
      ru: "Есть ли пошив по меркам?",
      ro: "Oferiți croitorie la comandă?",
    },
    answer: "Yes. Many of our pieces can be tailored to your measurements — submit a request from any product page and our atelier will be in touch.",
    answerI18n: {
      en: "Yes. Many of our pieces can be tailored to your measurements — submit a request from any product page and our atelier will be in touch.",
      ru: "Да. Многие модели можно сшить по вашим меркам — оставьте запрос на странице товара, и наше ателье свяжется с вами.",
      ro: "Da. Multe dintre piesele noastre pot fi croite după măsurile dvs. — trimiteți o cerere din orice pagină de produs, iar atelierul nostru vă va contacta.",
    },
  },
  {
    ...cat("Sizing", "Размеры", "Mărimi"),
    question: "The dress doesn't fit — what can I do?",
    questionI18n: {
      en: "The dress doesn't fit — what can I do?",
      ru: "Платье не подошло по размеру — что делать?",
      ro: "Rochia nu mi se potrivește — ce pot face?",
    },
    answer: "You can exchange it for a different size within 14 days, provided the item is unworn with tags attached.",
    answerI18n: {
      en: "You can exchange it for a different size within 14 days, provided the item is unworn with tags attached.",
      ru: "Вы можете обменять её на другой размер в течение 14 дней при условии, что вещь не носили и бирки на месте.",
      ro: "O puteți schimba cu altă mărime în termen de 14 zile, cu condiția ca articolul să fie nepurtat și cu etichetele atașate.",
    },
  },
  {
    ...cat("Returns", "Возврат", "Retururi"),
    question: "What is your return policy?",
    questionI18n: {
      en: "What is your return policy?",
      ru: "Какие условия возврата?",
      ro: "Care este politica de retur?",
    },
    answer: "Returns are accepted within 14 days of delivery. Items must be unworn, unwashed and in their original packaging with tags.",
    answerI18n: {
      en: "Returns are accepted within 14 days of delivery. Items must be unworn, unwashed and in their original packaging with tags.",
      ru: "Возврат принимается в течение 14 дней с момента получения. Вещи должны быть неношеными, нестиранными, в оригинальной упаковке с бирками.",
      ro: "Returnările sunt acceptate în termen de 14 zile de la livrare. Articolele trebuie să fie nepurtate, nespălate și în ambalajul original, cu etichete.",
    },
  },
  {
    ...cat("Returns", "Возврат", "Retururi"),
    question: "How do I start a return?",
    questionI18n: {
      en: "How do I start a return?",
      ru: "Как оформить возврат?",
      ro: "Cum încep un retur?",
    },
    answer: "Email us with your order number and we'll send a prepaid return label and step-by-step instructions.",
    answerI18n: {
      en: "Email us with your order number and we'll send a prepaid return label and step-by-step instructions.",
      ru: "Напишите нам номер заказа, и мы пришлём оплаченную обратную этикетку и пошаговую инструкцию.",
      ro: "Trimiteți-ne un e-mail cu numărul comenzii și vă vom trimite o etichetă de retur preplătită și instrucțiuni pas cu pas.",
    },
  },
  {
    ...cat("Returns", "Возврат", "Retururi"),
    question: "When will I be refunded?",
    questionI18n: {
      en: "When will I be refunded?",
      ru: "Когда вернут деньги?",
      ro: "Când voi primi banii înapoi?",
    },
    answer: "Refunds are processed within 5 business days of receiving your return, to the original payment method.",
    answerI18n: {
      en: "Refunds are processed within 5 business days of receiving your return, to the original payment method.",
      ru: "Возврат средств обрабатывается в течение 5 рабочих дней после получения вашей посылки, на исходный способ оплаты.",
      ro: "Rambursările sunt procesate în 5 zile lucrătoare de la primirea returului, către metoda de plată originală.",
    },
  },
  {
    ...cat("Care", "Уход", "Îngrijire"),
    question: "How should I care for my dress?",
    questionI18n: {
      en: "How should I care for my dress?",
      ru: "Как ухаживать за платьем?",
      ro: "Cum am grijă de rochia mea?",
    },
    answer: "Always follow the care label inside the garment. As a rule, we recommend gentle hand-washing or dry cleaning for delicate fabrics.",
    answerI18n: {
      en: "Always follow the care label inside the garment. As a rule, we recommend gentle hand-washing or dry cleaning for delicate fabrics.",
      ru: "Всегда следуйте ярлыку по уходу внутри изделия. Как правило, для деликатных тканей рекомендуем бережную ручную стирку или химчистку.",
      ro: "Respectați întotdeauna eticheta de îngrijire din interiorul articolului. De regulă, recomandăm spălarea delicată manuală sau curățarea chimică pentru țesăturile fine.",
    },
  },
  {
    ...cat("Care", "Уход", "Îngrijire"),
    question: "Can I machine wash my pieces?",
    questionI18n: {
      en: "Can I machine wash my pieces?",
      ru: "Можно ли стирать вещи в машине?",
      ro: "Pot spăla piesele la mașină?",
    },
    answer: "Many everyday pieces are machine-washable on a cold, delicate cycle. Check the label first and use a laundry bag to protect the fabric.",
    answerI18n: {
      en: "Many everyday pieces are machine-washable on a cold, delicate cycle. Check the label first and use a laundry bag to protect the fabric.",
      ru: "Многие повседневные вещи можно стирать в машине в холодном деликатном режиме. Сначала проверьте ярлык и используйте мешок для стирки.",
      ro: "Multe piese de zi cu zi pot fi spălate la mașină într-un program delicat la rece. Verificați mai întâi eticheta și folosiți un sac de rufe pentru a proteja țesătura.",
    },
  },
  {
    ...cat("Care", "Уход", "Îngrijire"),
    question: "How do I store my dresses?",
    questionI18n: {
      en: "How do I store my dresses?",
      ru: "Как хранить платья?",
      ro: "Cum depozitez rochiile?",
    },
    answer: "Hang structured pieces on padded hangers and fold knits to keep their shape. Store away from direct sunlight to preserve the colours.",
    answerI18n: {
      en: "Hang structured pieces on padded hangers and fold knits to keep their shape. Store away from direct sunlight to preserve the colours.",
      ru: "Структурированные модели вешайте на мягкие плечики, а трикотаж складывайте, чтобы сохранить форму. Храните вдали от прямых солнечных лучей, чтобы сохранить цвет.",
      ro: "Atârnați piesele structurate pe umerașe căptușite și împăturiți tricotajele pentru a-și păstra forma. Depozitați ferit de lumina directă a soarelui pentru a păstra culorile.",
    },
  },
  {
    ...cat("Orders", "Заказы", "Comenzi"),
    question: "Can I change or cancel my order?",
    questionI18n: {
      en: "Can I change or cancel my order?",
      ru: "Можно ли изменить или отменить заказ?",
      ro: "Pot modifica sau anula comanda?",
    },
    answer: "Contact us as soon as possible. If your order hasn't shipped yet, we'll gladly amend or cancel it for you.",
    answerI18n: {
      en: "Contact us as soon as possible. If your order hasn't shipped yet, we'll gladly amend or cancel it for you.",
      ru: "Свяжитесь с нами как можно скорее. Если заказ ещё не отправлен, мы с радостью изменим или отменим его.",
      ro: "Contactați-ne cât mai curând posibil. Dacă comanda nu a fost încă expediată, o vom modifica sau anula cu plăcere.",
    },
  },
  {
    ...cat("Orders", "Заказы", "Comenzi"),
    question: "Do I need an account to order?",
    questionI18n: {
      en: "Do I need an account to order?",
      ru: "Нужен ли аккаунт для заказа?",
      ro: "Am nevoie de un cont pentru a comanda?",
    },
    answer: "No — you can check out as a guest. Creating an account simply lets you track orders and save your details for next time.",
    answerI18n: {
      en: "No — you can check out as a guest. Creating an account simply lets you track orders and save your details for next time.",
      ru: "Нет — можно оформить заказ как гость. Аккаунт лишь позволяет отслеживать заказы и сохранять данные для следующего раза.",
      ro: "Nu — puteți finaliza comanda ca oaspete. Crearea unui cont vă permite doar să urmăriți comenzile și să salvați datele pentru data viitoare.",
    },
  },
];

// 3) Blog / Journal posts. `coverImage` is attached at runtime by the consumer
//    (derived from created products, by array index). `isPublished` is added by
//    the consumer.
export const BLOG_POSTS = [
  {
    slug: "how-to-style-a-midi-dress",
    publishedAt: new Date("2026-02-14T09:00:00.000Z"),
    title: "How to Style a Midi Dress for Every Occasion",
    titleI18n: {
      en: "How to Style a Midi Dress for Every Occasion",
      ru: "Как носить платье миди по любому поводу",
      ro: "Cum să porți o rochie midi pentru orice ocazie",
    },
    excerpt: "From the office to a dinner date — three effortless ways to wear the season's most versatile silhouette.",
    excerptI18n: {
      en: "From the office to a dinner date — three effortless ways to wear the season's most versatile silhouette.",
      ru: "От офиса до ужина — три простых способа носить самый универсальный силуэт сезона.",
      ro: "De la birou la o cină — trei moduri lejere de a purta cea mai versatilă siluetă a sezonului.",
    },
    content:
      "The midi dress is the quiet hero of any wardrobe. Here is how we style ours.\n\n" +
      "## For the office\nLayer a tailored blazer over a column-cut midi and add a low heel. Keep accessories minimal and let the silhouette speak.\n\n" +
      "## For the weekend\nSwap the blazer for a chunky knit and white trainers. Roll the sleeves and you are ready for brunch.\n\n" +
      "## For the evening\nA satin midi, a fine gold chain and strappy heels. Add a clutch and you are dressed for dinner in minutes.",
    contentI18n: {
      en:
        "The midi dress is the quiet hero of any wardrobe. Here is how we style ours.\n\n" +
        "## For the office\nLayer a tailored blazer over a column-cut midi and add a low heel. Keep accessories minimal and let the silhouette speak.\n\n" +
        "## For the weekend\nSwap the blazer for a chunky knit and white trainers. Roll the sleeves and you are ready for brunch.\n\n" +
        "## For the evening\nA satin midi, a fine gold chain and strappy heels. Add a clutch and you are dressed for dinner in minutes.",
      ru:
        "Платье миди — скромный герой любого гардероба. Вот как мы его сочетаем.\n\n" +
        "## Для офиса\nНаденьте строгий блейзер поверх прямого платья миди и добавьте обувь на низком каблуке. Минимум аксессуаров — пусть говорит силуэт.\n\n" +
        "## Для выходных\nЗамените блейзер объёмным трикотажем и белыми кедами. Подверните рукава — и вы готовы к бранчу.\n\n" +
        "## Для вечера\nАтласное миди, тонкая золотая цепочка и босоножки на каблуке. Добавьте клатч — и образ для ужина готов за пару минут.",
      ro:
        "Rochia midi este eroul discret al oricărui dulap. Iată cum o asortăm noi.\n\n" +
        "## Pentru birou\nAdaugă un blazer croit peste o rochie midi dreaptă și o pereche de pantofi cu toc mic. Păstrează accesoriile minime și lasă silueta să vorbească.\n\n" +
        "## Pentru weekend\nÎnlocuiește blazerul cu un tricotaj gros și teniși albi. Suflecă mânecile și ești gata de brunch.\n\n" +
        "## Pentru seară\nO rochie midi din satin, un lănțișor fin de aur și sandale cu barete. Adaugă o gentuță și ești gata de cină în câteva minute.",
    },
  },
  {
    slug: "fabric-guide-silk-vs-satin",
    publishedAt: new Date("2026-03-08T09:00:00.000Z"),
    title: "Fabric Guide: Silk vs. Satin",
    titleI18n: {
      en: "Fabric Guide: Silk vs. Satin",
      ru: "Гид по тканям: шёлк против атласа",
      ro: "Ghid de țesături: mătase vs. satin",
    },
    excerpt: "They look similar on the hanger — but feel and care couldn't be more different. Here's how to choose.",
    excerptI18n: {
      en: "They look similar on the hanger — but feel and care couldn't be more different. Here's how to choose.",
      ru: "На вешалке они похожи, но ощущения и уход совершенно разные. Рассказываем, как выбрать.",
      ro: "Pe umeraș arată similar — dar la atingere și la îngrijire nu pot fi mai diferite. Iată cum alegi.",
    },
    content:
      "Silk and satin are often confused, yet only one is a fibre.\n\n" +
      "## Silk is a fibre\nA natural protein fibre, prized for its breathability and subtle sheen. It drapes beautifully and lasts for years with care.\n\n" +
      "## Satin is a weave\nSatin describes the glossy weave, which can be made from silk, polyester or blends. It delivers high shine, often at a friendlier price.\n\n" +
      "## How to choose\nReach for silk when you want luxury against the skin; choose satin for bold shine and easy care.",
    contentI18n: {
      en:
        "Silk and satin are often confused, yet only one is a fibre.\n\n" +
        "## Silk is a fibre\nA natural protein fibre, prized for its breathability and subtle sheen. It drapes beautifully and lasts for years with care.\n\n" +
        "## Satin is a weave\nSatin describes the glossy weave, which can be made from silk, polyester or blends. It delivers high shine, often at a friendlier price.\n\n" +
        "## How to choose\nReach for silk when you want luxury against the skin; choose satin for bold shine and easy care.",
      ru:
        "Шёлк и атлас часто путают, но волокном является только один.\n\n" +
        "## Шёлк — это волокно\nНатуральное белковое волокно, ценимое за воздухопроницаемость и мягкий блеск. Красиво струится и служит годами при должном уходе.\n\n" +
        "## Атлас — это переплетение\nАтлас — это глянцевое переплетение, которое может быть из шёлка, полиэстера или смесей. Даёт яркий блеск, часто по более доступной цене.\n\n" +
        "## Как выбрать\nВыбирайте шёлк, когда хотите роскоши на коже; атлас — ради выразительного блеска и простоты ухода.",
      ro:
        "Mătasea și satinul sunt adesea confundate, însă doar una este o fibră.\n\n" +
        "## Mătasea este o fibră\nO fibră naturală proteică, apreciată pentru respirabilitate și luciul subtil. Cade frumos și durează ani de zile cu îngrijire.\n\n" +
        "## Satinul este o țesătură\nSatinul descrie țesătura lucioasă, care poate fi din mătase, poliester sau amestecuri. Oferă un luciu intens, adesea la un preț mai prietenos.\n\n" +
        "## Cum alegi\nAlege mătasea când vrei lux pe piele; alege satinul pentru luciu îndrăzneț și îngrijire ușoară.",
    },
  },
  {
    slug: "inside-the-olesia-frient-atelier",
    publishedAt: new Date("2026-04-22T09:00:00.000Z"),
    title: "Inside the Olesia Frient Atelier",
    titleI18n: {
      en: "Inside the Olesia Frient Atelier",
      ru: "Внутри ателье Olesia Frient",
      ro: "În atelierul Olesia Frient",
    },
    excerpt: "A look at the hands and craft behind every piece — from first sketch to final stitch.",
    excerptI18n: {
      en: "A look at the hands and craft behind every piece — from first sketch to final stitch.",
      ru: "Взгляд на руки и мастерство за каждым изделием — от первого эскиза до последнего стежка.",
      ro: "O privire asupra mâinilor și măiestriei din spatele fiecărei piese — de la prima schiță la ultima cusătură.",
    },
    content:
      "Every Olesia Frient dress begins as a sketch and ends in the hands of our seamstresses.\n\n" +
      "## The sketch\nDesigns start on paper, refined over many fittings before a single metre of fabric is cut.\n\n" +
      "## The cut\nPatterns are cut by hand to honour the grain of each fabric and the drape we want to achieve.\n\n" +
      "## The finish\nFinal seams, linings and buttons are completed by hand, so every piece leaves the atelier ready to last.",
    contentI18n: {
      en:
        "Every Olesia Frient dress begins as a sketch and ends in the hands of our seamstresses.\n\n" +
        "## The sketch\nDesigns start on paper, refined over many fittings before a single metre of fabric is cut.\n\n" +
        "## The cut\nPatterns are cut by hand to honour the grain of each fabric and the drape we want to achieve.\n\n" +
        "## The finish\nFinal seams, linings and buttons are completed by hand, so every piece leaves the atelier ready to last.",
      ru:
        "Каждое платье Olesia Frient начинается с эскиза и завершается в руках наших швей.\n\n" +
        "## Эскиз\nМодели рождаются на бумаге и оттачиваются на множестве примерок, прежде чем будет раскроен хоть метр ткани.\n\n" +
        "## Крой\nЛекала кроятся вручную, чтобы учесть направление нити каждой ткани и нужную нам драпировку.\n\n" +
        "## Отделка\nФинальные швы, подкладка и пуговицы выполняются вручную, поэтому каждое изделие покидает ателье готовым служить долго.",
      ro:
        "Fiecare rochie Olesia Frient începe ca o schiță și se termină în mâinile croitoreselor noastre.\n\n" +
        "## Schița\nDesignurile încep pe hârtie, rafinate prin multe probe înainte ca un singur metru de țesătură să fie tăiat.\n\n" +
        "## Croiala\nTiparele sunt tăiate manual pentru a respecta firul fiecărei țesături și căderea pe care o dorim.\n\n" +
        "## Finisajul\nCusăturile finale, căptușelile și nasturii sunt realizate manual, astfel încât fiecare piesă pleacă din atelier gata să dureze.",
    },
  },
];

// 4) Content blocks (brand story -> /about, behind-the-scenes -> /atelier).
//    `mediaUrl` is attached at runtime by the consumer (derived from created
//    products, by array index). `isPublished` is added by the consumer.
export const CONTENT_BLOCKS = [
  {
    type: "brand-story",
    order: 0,
    heading: "Our Story",
    headingI18n: { en: "Our Story", ru: "Наша история", ro: "Povestea noastră" },
    body:
      "Olesia Frient was born from a simple belief: that a beautifully made dress can change how a woman feels about her day. " +
      "We design timeless, feminine pieces in small runs, choosing natural fabrics and considered details over fleeting trends. " +
      "Each collection is created to be worn, loved and kept — never thrown away.",
    bodyI18n: {
      en:
        "Olesia Frient was born from a simple belief: that a beautifully made dress can change how a woman feels about her day. " +
        "We design timeless, feminine pieces in small runs, choosing natural fabrics and considered details over fleeting trends. " +
        "Each collection is created to be worn, loved and kept — never thrown away.",
      ru:
        "Olesia Frient родился из простой веры: красиво сшитое платье может изменить то, как женщина чувствует себя в течение дня. " +
        "Мы создаём вне времени, женственные модели небольшими партиями, выбирая натуральные ткани и продуманные детали вместо мимолётных трендов. " +
        "Каждая коллекция создана, чтобы её носили, любили и хранили — а не выбрасывали.",
      ro:
        "Olesia Frient s-a născut dintr-o credință simplă: o rochie frumos realizată poate schimba felul în care o femeie își simte ziua. " +
        "Creăm piese feminine, atemporale, în serii mici, alegând țesături naturale și detalii gândite în locul tendințelor trecătoare. " +
        "Fiecare colecție este creată pentru a fi purtată, iubită și păstrată — niciodată aruncată.",
    },
  },
  {
    type: "behind-the-scenes",
    order: 0,
    heading: "Inside the Atelier",
    headingI18n: { en: "Inside the Atelier", ru: "В ателье", ro: "În atelier" },
    body:
      "Behind every Olesia Frient piece is a small team of pattern-makers and seamstresses who still cut and finish by hand. " +
      "We work in limited batches so we can watch over the quality of every seam, lining and button. " +
      "It is slower, more deliberate work — and it is exactly why our dresses are made to last.",
    bodyI18n: {
      en:
        "Behind every Olesia Frient piece is a small team of pattern-makers and seamstresses who still cut and finish by hand. " +
        "We work in limited batches so we can watch over the quality of every seam, lining and button. " +
        "It is slower, more deliberate work — and it is exactly why our dresses are made to last.",
      ru:
        "За каждым изделием Olesia Frient стоит небольшая команда конструкторов и швей, которые по-прежнему кроят и отделывают вручную. " +
        "Мы работаем малыми партиями, чтобы следить за качеством каждого шва, подкладки и пуговицы. " +
        "Это более медленная и вдумчивая работа — и именно поэтому наши платья служат долго.",
      ro:
        "În spatele fiecărei piese Olesia Frient se află o echipă mică de creatori de tipare și croitorese care încă taie și finisează manual. " +
        "Lucrăm în serii limitate ca să putem veghea asupra calității fiecărei cusături, căptușeli și nasture. " +
        "Este o muncă mai lentă și mai atentă — și exact de aceea rochiile noastre sunt făcute să dureze.",
    },
  },
  {
    type: "behind-the-scenes",
    order: 1,
    heading: "Considered Materials",
    headingI18n: { en: "Considered Materials", ru: "Продуманные материалы", ro: "Materiale alese cu grijă" },
    body:
      "We source natural and responsibly chosen fabrics — silks, fine cottons and soft knits — that feel as good as they look. " +
      "Choosing better materials means fewer, longer-lasting pieces, and a wardrobe you reach for again and again.",
    bodyI18n: {
      en:
        "We source natural and responsibly chosen fabrics — silks, fine cottons and soft knits — that feel as good as they look. " +
        "Choosing better materials means fewer, longer-lasting pieces, and a wardrobe you reach for again and again.",
      ru:
        "Мы выбираем натуральные и ответственно подобранные ткани — шелка, тонкий хлопок и мягкий трикотаж, — которые приятны и на вид, и на ощупь. " +
        "Лучшие материалы — это меньше вещей, которые служат дольше, и гардероб, к которому возвращаешься снова и снова.",
      ro:
        "Alegem țesături naturale și selectate responsabil — mătăsuri, bumbacuri fine și tricotaje moi — care se simt la fel de bine pe cât arată. " +
        "Materialele mai bune înseamnă mai puține piese, dar mai durabile, și o garderobă la care revii mereu.",
    },
  },
];

// 5) Review templates (approved, guest). `productId`, `customerId`, `status`,
//    `source` and `createdAt` linkage is applied at runtime by the consumer.
export const REVIEW_TEMPLATES = [
  {
    rating: 5, customerName: "Maria P.", verified: true, fitVote: "true-to-size",
    body: "Absolutely in love with this dress — the fabric is gorgeous and the fit is perfect. I get compliments every time I wear it.",
    bodyI18n: {
      en: "Absolutely in love with this dress — the fabric is gorgeous and the fit is perfect. I get compliments every time I wear it.",
      ru: "Совершенно влюблена в это платье — ткань великолепная, а посадка идеальная. Получаю комплименты каждый раз.",
      ro: "Sunt complet îndrăgostită de această rochie — materialul este superb, iar croiala este perfectă. Primesc complimente de fiecare dată.",
    },
  },
  {
    rating: 5, customerName: "Elena V.", verified: true, fitVote: "true-to-size",
    body: "Beautiful quality and it arrived faster than expected. The colour is exactly as shown in the photos.",
    bodyI18n: {
      en: "Beautiful quality and it arrived faster than expected. The colour is exactly as shown in the photos.",
      ru: "Прекрасное качество, и доставка была быстрее, чем я ожидала. Цвет точно как на фото.",
      ro: "Calitate frumoasă și a ajuns mai repede decât mă așteptam. Culoarea este exact ca în fotografii.",
    },
  },
  {
    rating: 4, customerName: "Ana M.", verified: true, fitVote: "runs-small",
    body: "Lovely dress and great material. It runs a touch small, so I'd recommend sizing up if you're between sizes.",
    bodyI18n: {
      en: "Lovely dress and great material. It runs a touch small, so I'd recommend sizing up if you're between sizes.",
      ru: "Прелестное платье и отличный материал. Маломерит, так что советую брать размер больше, если сомневаетесь.",
      ro: "Rochie minunată și material grozav. Vine puțin mic, așa că recomand o mărime mai mare dacă ezitați.",
    },
  },
  {
    rating: 5, customerName: "Cristina D.", verified: false, fitVote: "true-to-size",
    body: "Elegant, comfortable and so well made. This has become my go-to dress for special occasions.",
    bodyI18n: {
      en: "Elegant, comfortable and so well made. This has become my go-to dress for special occasions.",
      ru: "Элегантное, удобное и прекрасно сшитое. Стало моим любимым платьем для особых случаев.",
      ro: "Elegantă, confortabilă și foarte bine făcută. A devenit rochia mea preferată pentru ocazii speciale.",
    },
  },
  {
    rating: 4, customerName: "Natalia S.", verified: true, fitVote: "true-to-size",
    body: "Really happy with my purchase. Beautiful design — I just wish it came in more colours!",
    bodyI18n: {
      en: "Really happy with my purchase. Beautiful design — I just wish it came in more colours!",
      ru: "Очень довольна покупкой. Красивый дизайн — жаль только, что мало расцветок!",
      ro: "Foarte mulțumită de achiziție. Design frumos — îmi doresc doar să fie în mai multe culori!",
    },
  },
];
