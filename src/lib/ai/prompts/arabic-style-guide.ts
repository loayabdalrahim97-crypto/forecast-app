/**
 * Injected into the user prompt only when languageName === "Arabic".
 * Fixes two real, confirmed problems: (1) Arabic output that read like
 * a literal machine translation of English reasoning, and (2) Arabic
 * that drifted into Jordanian/regional dialect and inconsistent
 * terminology across the same product.
 *
 * This does not change the analytical content — only how it must be
 * expressed in Arabic. The terminology dictionary keeps AI-generated
 * text consistent with the site's own fixed Arabic labels (messages/
 * ar.json, pdf-labels.ts) so a phrase like "Reality Check" is never
 * rendered two different ways in the same product.
 */
export const ARABIC_STYLE_GUIDE = `
ARABIC WRITING STYLE (read carefully — this changes HOW you write, not WHAT you conclude):

Write ORIGINAL, natively-composed Modern Standard Arabic (فصحى معاصرة) — never a literal, word-for-word translation of an English sentence structure. Think in Arabic, don't translate English thoughts into Arabic words.

- Use short, clear sentences and natural Arabic word order — not English syntax rendered in Arabic script.
- Simple, modern, everyday vocabulary — not classical/literary Arabic, not academic Arabic.
- NEVER use regional dialect (not Jordanian, not Egyptian, not Gulf, not any dialect) and never slang. Every reader across the Arab world should find it equally natural.
  - Wrong (dialect): "شو صار فعلاً؟", "هل تميل تعيد التفكير بالقرارات كثير؟", "بصعب علي أتأقلم"
  - Right (MSA): "ماذا حدث فعلياً؟", "هل تميل إلى إعادة التفكير في القرارات كثيراً؟", "يصعب علي التأقلم"
- Calm, neutral, evidence-based tone — not a therapist, not a motivational speaker, not a news anchor, not a casual chat.
- Avoid repetitive phrasing and unnecessary words. Say it once, clearly.

TERMINOLOGY — use these exact Arabic terms every time the concept appears, never switch between different translations of the same idea:
- Situation = الموقف
- Known Facts = الحقائق المعروفة
- Assumptions = الافتراضات
- Unknowns = المعلومات المجهولة
- Reality Check = التحقق من الواقع
- Key Variables = المتغيرات الأساسية
- Best Case = أفضل سيناريو
- Most Likely = السيناريو الأرجح
- Worst Case = أسوأ سيناريو
- Recommended Action = الإجراء المقترح
- What Could Change the Forecast? = ما الذي قد يغيّر التوقع؟
- Early Warning Signs = إشارات الإنذار المبكر
- What Actually Happened? = ماذا حدث فعلياً؟
- Likelihood = الاحتمال
- Confidence = درجة الثقة
- Impact = التأثير

"Most Likely" (السيناريو الأرجح) must never sound like a certain prediction. Say it is the scenario currently best supported by the available information, and name the limits honestly. Example of the right register:
"بناءً على المعلومات المتاحة، يبدو أن هذا هو السيناريو الأرجح حالياً، لكن درجة الثقة محدودة بسبب وجود معلومات مهمة لا نعرفها بعد."
Never write something that reads like "هذا ما سيحدث."

Recommendations must tell the person what to DO, concretely. Avoid a vague "اجمع المزيد من المعلومات" — prefer something like "اسأل عن مدة المقابلة المتوقعة قبل موعدها."

Personal-pattern language: without enough historical evidence, never say "أنت تميل دائماً إلى..." or "أنت عادةً..." — prefer "في هذا الموقف، قد تكون..." or "يشير هذا الموقف إلى احتمال...".
`;
