/**
 * The free-webinar landing page (`/webinar`, `/webinar/en`): every string, in both languages.
 *
 * ⚠️ ONE DICTIONARY, TWO ROUTES — NOT GOOGLE'S TRANSLATOR. The rest of the site leans on the
 * `translate_a/element.js` widget for Hindi. That is wrong for this page on three counts: it
 * is an ad landing page whose Hindi IS the product (machine Hindi on a parents' page reads as
 * a scam), the widget is a third-party script on the one page whose budget is "loads on 4G
 * in under three seconds", and crawlers never see translated text at all. So each language
 * is its own server-rendered URL with reciprocal hreflang, and `LanguageToggle` stands down
 * on these paths.
 *
 * ⚠️ THE HINDI IS THE SOURCE. The English column is a rendering of it for the `/en` page.
 * Change a Hindi line and the English one beside it is now stale — change them together.
 */

import type { Metadata } from "next";

export type WebinarLang = "hi" | "en";

export const WEBINAR_PATH: Record<WebinarLang, string> = {
  hi: "/webinar",
  en: "/webinar/en",
};

/**
 * ⚠️ NULL UNTIL THE DATE IS FIXED, AND THE EVENT SCHEMA DEPENDS ON IT. Google rejects an
 * `Event` without a `startDate`, and inventing a placeholder date is worse than none — it
 * shows up in search as a session that never happened. Set this (IST, ISO 8601 with offset,
 * e.g. "2026-11-02T17:00:00+05:30") and the page starts emitting the Event graph by itself.
 */
export const WEBINAR_START: string | null = null;

/** Every CTA on the page names its position, so the click log can say which one converts. */
export const JOIN_SOURCES = ["hero", "sticky", "final"] as const;
export type JoinSource = (typeof JOIN_SOURCES)[number];

/**
 * The CTA target. A same-origin hop rather than the invite link itself, for two reasons:
 * the invite can be swapped in an env var when a group fills up (WhatsApp caps a group at
 * 1,024) without a redeploy, and the hop is where the click is counted.
 *
 * ⚠️ PLAIN `<a href>`, ONE REDIRECT, NOTHING ELSE. Facebook's and Instagram's in-app
 * browsers are where most of this traffic lands, and they are the browsers that lose
 * `intent://` handoffs across a second redirect or a JS navigation.
 */
export function joinHref(lang: WebinarLang, src: JoinSource): string {
  return `/webinar/join?src=${src}&lang=${lang}`;
}

export interface WebinarCopy {
  meta: { title: string; description: string; ogAlt: string };
  skip: string;
  langLabel: string;
  /** Headline in three runs; `em` is the highlighted phrase. */
  h1: { before: string; em: string; after: string };
  /** Subtext; `strong` is the closing emphasis. */
  sub: { text: string; strong: string };
  cta: string;
  ctaNote: string;
  ledBy: string;
  facilitatorShort: string;
  /** Second line under the facilitator in the hero. */
  facilitatorBadge: string;
  photoAlt: string;
  /** `{wa}` in a value renders as the WhatsApp logo (see `withLogo`). */
  facts: { label: string; value: string }[];
  proof: string[];
  learn: {
    eyebrow: string;
    title: string;
    tutor: { title: string; body: string; ask: string; steps: string[] };
    quiz: {
      title: string;
      body: string;
      tag: string;
      /** The badge that marks the question as AI-generated. */
      ai: string;
      question: string;
      options: string[];
      correct: number;
      /** The AI's explanation, shown after the answer is tapped. */
      feedback: string;
    };
    check: {
      title: string;
      body: string;
      tag: string;
      /**
       * The mistakes the demo cycles through. `source` picks the icon on the correction
       * (checked in a book, or counted by hand). `word` + `letter`, when set, spell the
       * word out under the correction with every `letter` highlighted.
       */
      items: {
        claim: string;
        wrong: string;
        verified: string;
        right: string;
        source: "book" | "count";
        word?: string;
        letter?: string;
      }[];
    };
  };
  trust: {
    eyebrow: string;
    title: string;
    line: string;
    photoAlt: string;
    facilitatorRole: string;
    dpiit: string;
  };
  steps: { eyebrow: string; title: string; items: string[] };
  parents: { eyebrow: string; title: string; items: string[] };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  final: { eyebrow: string; title: string; fallback: string; privacy: string; privacyLink: string };
  footer: { terms: string; privacy: string };
  sticky: { title: string; meta: string; cta: string };
}

export const WEBINAR_COPY: Record<WebinarLang, WebinarCopy> = {
  hi: {
    meta: {
      title: "फ्री AI वेबिनार कक्षा 9–12 | Boards, JEE, NEET | Innovgeist",
      description:
        "बोर्ड, JEE और NEET की तैयारी में AI का सही इस्तेमाल सीखें, बिना नकल के। फ्री लाइव वेबिनार, हिंदी और English में।",
      ogAlt: "AI से बेहतर सोचें, तेज़ी से सीखें: फ्री लाइव वेबिनार, कक्षा 9–12",
    },
    skip: "मुख्य सामग्री पर जाएँ",
    langLabel: "भाषा / Language",
    h1: { before: "AI से ", em: "बेहतर सोचें,", after: " तेज़ी से सीखें" },
    sub: {
      text: "बोर्ड परीक्षा, JEE और NEET की तैयारी में AI का सही इस्तेमाल सीखें, ",
      strong: "बिना नकल के।",
    },
    cta: "WhatsApp ग्रुप जॉइन करें, फ्री",
    ctaNote: "तारीख और समय ग्रुप में बताया जाएगा।",
    ledBy: "सत्र लेंगे",
    facilitatorShort: "Director, Innovgeist Technologies",
    facilitatorBadge: "DPIIT-recognized startup",
    photoAlt:
      "श्री विश्वनाथ इंटर कॉलेज, कलान के हॉल में AI सत्र, स्क्रीन पर “AI as your personal tutor”, सामने बैठे छात्र।",
    facts: [
      { label: "तारीख", value: "{wa} ग्रुप में बताई जाएगी" },
      { label: "तरीका", value: "लाइव, ऑनलाइन" },
      { label: "भाषा", value: "हिंदी + English" },
      { label: "फीस", value: "₹0, पूरी तरह फ्री" },
    ],
    proof: ["स्कूलों में 20+ सत्र हो चुके हैं", "DPIIT मान्यता प्राप्त", "NNF के तहत इनक्यूबेटेड"],
    learn: {
      eyebrow: "वेबिनार में क्या सीखेंगे",
      title: "AI को शॉर्टकट नहीं, पढ़ाई का साथी बनाएँ",
      tutor: {
        title: "स्टेप-बाय-स्टेप ट्यूटर",
        body: "कोई भी टॉपिक AI से आसान भाषा में समझें।",
        ask: "प्रकाश संश्लेषण आसान भाषा में समझाओ",
        steps: ["पत्ती सूरज की रोशनी सोखती है", "जड़ से पानी, हवा से CO₂", "बनता है ग्लूकोज़ + ऑक्सीजन"],
      },
      quiz: {
        title: "क्विज़ कोच",
        body: "परीक्षा से पहले AI से अपना टेस्ट लें।",
        tag: "PHYSICS · QUIZ",
        ai: "AI ने बनाया सवाल",
        question: "प्रकाश की चाल किसमें सबसे तेज़ होती है?",
        options: ["पानी", "निर्वात", "काँच", "हवा"],
        correct: 1,
        feedback: "सही! निर्वात में प्रकाश सबसे तेज़ चलता है, 3 × 10⁸ m/s",
      },
      check: {
        title: "AI की गलती पकड़ें",
        body: "AI के गलत जवाब पहचानना सीखें।",
        tag: "AI का जवाब",
        items: [
          { claim: "पानी का सूत्र है", wrong: "H₂O₂", verified: "किताब से जाँचा: सही है", right: "H₂O", source: "book" },
          {
            claim: "“strawberry” में r कितनी बार आता है?",
            wrong: "2",
            verified: "खुद गिनकर देखा: सही है",
            right: "3",
            source: "count",
            word: "strawberry",
            letter: "r",
          },
        ],
      },
    },
    trust: {
      eyebrow: "पिछला सत्र",
      title: "असली कक्षा, असली छात्र",
      line: "13 सितंबर 2026 को श्री विश्वनाथ इंटर कॉलेज, कलान (सुल्तानपुर) में हुआ सत्र।",
      photoAlt: "कलान के सत्र में Atul Kumar Verma छात्राओं से सीधे बात करते हुए।",
      facilitatorRole: "Director, Innovgeist Technologies Pvt. Ltd.",
      dpiit: "DPIIT मान्यता प्राप्त स्टार्टअप",
    },
    steps: {
      eyebrow: "कैसे जुड़ें",
      title: "तीन आसान कदम",
      items: ["हरे बटन पर टैप करें", "WhatsApp में “Join group” दबाएँ", "सत्र की तारीख और लिंक ग्रुप में मिलेगा"],
    },
    parents: {
      eyebrow: "अभिभावकों के लिए",
      title: "बेफ़िक्र होकर जुड़ें",
      items: ["यह पूरी तरह फ्री है।", "सत्र हिंदी और अंग्रेज़ी में होगा।", "कोई पहले से AI का ज्ञान ज़रूरी नहीं।"],
    },
    faq: {
      eyebrow: "सवाल-जवाब",
      title: "अक्सर पूछे जाने वाले सवाल",
      items: [
        {
          q: "क्या इससे बच्चा नकल करना सीखेगा?",
          a: "नहीं। सत्र में AI से समझना, खुद का टेस्ट लेना और AI की गलतियाँ पकड़ना सिखाया जाएगा, जवाब कॉपी करना नहीं।",
        },
        { q: "क्या मोबाइल से जुड़ सकते हैं?", a: "हाँ, स्मार्टफ़ोन काफ़ी है।" },
        { q: "मेरा नंबर किसके पास जाएगा?", a: "सिर्फ़ वेबिनार की जानकारी के लिए।" },
        { q: "क्या सच में कोई फीस नहीं है?", a: "हाँ, वेबिनार पूरी तरह फ्री है।" },
      ],
    },
    final: {
      eyebrow: "बस एक टैप",
      title: "ग्रुप में जुड़ें, सत्र की हर जानकारी वहीं मिलेगी",
      fallback: "WhatsApp नहीं खुला? ऊपर ⋮ दबाकर “Chrome में खोलें” चुनें।",
      privacy: "आपका नंबर सिर्फ़ इस वेबिनार की जानकारी के लिए इस्तेमाल होगा।",
      privacyLink: "प्राइवेसी पॉलिसी",
    },
    footer: { terms: "नियम व शर्तें", privacy: "प्राइवेसी पॉलिसी" },
    sticky: { title: "फ्री लाइव वेबिनार", meta: "कक्षा 9–12 · हिंदी + English", cta: "ग्रुप जॉइन करें" },
  },

  en: {
    meta: {
      title: "Free AI Webinar for Class 9–12 | Boards, JEE, NEET | Innovgeist",
      description:
        "Learn to use AI the right way for boards, JEE and NEET, without copying. A free live webinar in Hindi and English.",
      ogAlt: "Think Better. Learn Faster with AI. Free live webinar, Class 9–12",
    },
    skip: "Skip to content",
    langLabel: "Language / भाषा",
    h1: { before: "Think Better. ", em: "Learn Faster", after: " with AI." },
    sub: { text: "Learn to use AI the right way for boards, JEE and NEET, ", strong: "without copying." },
    cta: "Join the free WhatsApp group",
    ctaNote: "Date and time will be announced in the group.",
    ledBy: "Led by",
    facilitatorShort: "Director, Innovgeist Technologies",
    facilitatorBadge: "DPIIT-recognized startup",
    photoAlt:
      "The AI session in the hall at Shri Vishwanath Inter College, Kalan, with “AI as your personal tutor” on screen, students seated in front.",
    facts: [
      { label: "Date", value: "Shared on {wa} group" },
      { label: "Format", value: "Live, online" },
      { label: "Language", value: "Hindi + English" },
      { label: "Fee", value: "₹0, completely free" },
    ],
    proof: ["20+ sessions already held in schools", "DPIIT-recognized", "Incubated under NNF"],
    learn: {
      eyebrow: "What you'll learn",
      title: "Make AI a study partner, not a shortcut",
      tutor: {
        title: "Step-by-step tutor",
        body: "Understand any topic in simple language with AI.",
        ask: "Explain photosynthesis in simple words",
        steps: ["The leaf absorbs sunlight", "Water from the roots, CO₂ from the air", "Glucose + oxygen are made"],
      },
      quiz: {
        title: "Quiz coach",
        body: "Test yourself with AI before the exam.",
        tag: "PHYSICS · QUIZ",
        ai: "Question by AI",
        question: "Where does light travel the fastest?",
        options: ["Water", "Vacuum", "Glass", "Air"],
        correct: 1,
        feedback: "Correct! Light is fastest in a vacuum, 3 × 10⁸ m/s",
      },
      check: {
        title: "Catch AI's mistakes",
        body: "Learn to spot AI's wrong answers.",
        tag: "AI's answer",
        items: [
          { claim: "The formula for water is", wrong: "H₂O₂", verified: "Checked in the textbook: it's", right: "H₂O", source: "book" },
          {
            claim: "How many r's are in “strawberry”?",
            wrong: "2",
            verified: "Counted it yourself: it's",
            right: "3",
            source: "count",
            word: "strawberry",
            letter: "r",
          },
        ],
      },
    },
    trust: {
      eyebrow: "Our last session",
      title: "A real classroom, real students",
      line: "Session held on 13 September 2026 at Shri Vishwanath Inter College, Kalan (Sultanpur).",
      photoAlt: "Atul Kumar Verma speaking directly with students during the Kalan session.",
      facilitatorRole: "Director, Innovgeist Technologies Pvt. Ltd.",
      dpiit: "DPIIT-recognized startup",
    },
    steps: {
      eyebrow: "How to join",
      title: "Three easy steps",
      items: ["Tap the green button", "Press “Join group” in WhatsApp", "The session date and link arrive in the group"],
    },
    parents: {
      eyebrow: "For parents",
      title: "Join without worry",
      items: ["It's completely free.", "The session will be in Hindi and English.", "No prior knowledge of AI needed."],
    },
    faq: {
      eyebrow: "Questions",
      title: "Frequently asked questions",
      items: [
        {
          q: "Will this teach my child to copy?",
          a: "No. The session teaches understanding topics with AI, testing yourself and catching AI's mistakes, not copying answers.",
        },
        { q: "Can we join from a mobile phone?", a: "Yes, a smartphone is enough." },
        { q: "Who will my number go to?", a: "It is used only for webinar updates." },
        { q: "Is there really no fee?", a: "Yes, the webinar is completely free." },
      ],
    },
    final: {
      eyebrow: "Just one tap",
      title: "Join the group. Every session detail will be shared there.",
      fallback: "WhatsApp didn't open? Tap ⋮ at the top and choose “Open in Chrome”.",
      privacy: "Your number will be used only for updates about this webinar.",
      privacyLink: "Privacy policy",
    },
    footer: { terms: "Terms", privacy: "Privacy policy" },
    sticky: { title: "Free live webinar", meta: "Class 9–12 · Hindi + English", cta: "Join group" },
  },
};

/**
 * Head tags for one language of the page.
 *
 * ⚠️ RECIPROCAL HREFLANG OR NONE. Google ignores an `hreflang` pair unless each page lists
 * the other *and itself*; both routes call this, so the two sets cannot drift apart.
 * `x-default` is the Hindi page because that is who the ads are aimed at.
 *
 * The canonical is the bare path — ad links arrive with `utm_*` on them, and without it
 * every campaign variant would be indexed as its own duplicate page.
 */
export function webinarMetadata(lang: WebinarLang): Metadata {
  const t = WEBINAR_COPY[lang];
  const image = `/assets/img/webinar/og-webinar-${lang}.jpg`;
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: WEBINAR_PATH[lang],
      languages: {
        "hi-IN": WEBINAR_PATH.hi,
        "en-IN": WEBINAR_PATH.en,
        "x-default": WEBINAR_PATH.hi,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Innovgeist",
      url: WEBINAR_PATH[lang],
      title: t.meta.title,
      description: t.meta.description,
      locale: lang === "hi" ? "hi_IN" : "en_IN",
      alternateLocale: lang === "hi" ? "en_IN" : "hi_IN",
      images: [{ url: image, width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: [image],
    },
  };
}

/**
 * The page's two photos, as built by `scripts/build-webinar-images.mjs` from the hand-
 * upscaled sources in `source-assets/webinar/`. `widths` must match what that script
 * printed — a width listed here with no file behind it is a broken image for exactly the
 * screens that pick it.
 */
export const WEBINAR_PHOTOS = {
  hall: { widths: [800, 1400, 2000], width: 3024, height: 1365 },
  students: { widths: [800, 1400, 2000], width: 3024, height: 1365 },
} as const;
