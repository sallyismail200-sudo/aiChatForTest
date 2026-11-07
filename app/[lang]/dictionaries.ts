"use server";
import { cookies } from "next/headers";

export const getOptimizedDictionary = async (
  pageName?: string,
  dashboardPageName?: string,
) => {
  const cookieStore = await cookies();
  const lang = cookieStore.get("il18")?.value as "en" | "ar";

  if (pageName !== undefined) {
    const pageDict = import(
      `@/app/[lang]/dictionaries/${lang}/pages/${pageName}.json`
    ).then((m) => m.default);
    const [page] = await Promise.all([pageDict]);
    return { ...page };
  } else if (dashboardPageName !== undefined) {
    const pageDict = import(
      `@/app/[lang]/dictionaries/${lang}/dashboard/${dashboardPageName}.json`
    ).then((m) => m.default);
    const [page] = await Promise.all([pageDict]);
    return { ...page };
  } else {
    const commonDict = import(
      `@/app/[lang]/dictionaries/${lang}/common.json`
    ).then((m) => m.default);
    const [page] = await Promise.all([commonDict]);
    return { ...page };
  }
};

export const getDictionary = async (
  pageName?: string,
  dashboardPageName?: string,
) => {
  return await getOptimizedDictionary(pageName, dashboardPageName);
};
