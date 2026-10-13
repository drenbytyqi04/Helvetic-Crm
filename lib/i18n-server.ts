import { cookies } from "next/headers";
import {
  DICTS,
  LANG_COOKIE,
  LANG_PARAZGJEDHUR,
  LOCALE,
  eshteLang,
  type Dict,
  type Lang,
} from "./i18n";

/**
 * Gjuha e zgjedhur, e lexuar nga cookie-ja. Pa zgjedhje: gjermanisht.
 *
 * Lexohet në server, që faqja të vijë e përkthyer që në ngarkimin e parë —
 * pa u vizatuar njëherë në një gjuhë e pastaj të kërcejë në tjetrën.
 */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return eshteLang(v) ? v : LANG_PARAZGJEDHUR;
}

/** Fjalori i gjuhës së zgjedhur. */
export async function getDict(): Promise<Dict> {
  return DICTS[await getLang()];
}

/** Gjuha, fjalori dhe formati i datave njëherësh. */
export async function getI18n(): Promise<{
  lang: Lang;
  t: Dict;
  locale: string;
}> {
  const lang = await getLang();
  return { lang, t: DICTS[lang], locale: LOCALE[lang] };
}
