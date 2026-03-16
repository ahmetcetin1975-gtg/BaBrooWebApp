"use client";

import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/gtg/config";
import { NotFoundPage } from "@/components/gtg/pages/NotFoundPage";

export default function NotFound() {
  const params = useParams();
  const lang = normalizeLang(typeof params?.lang === "string" ? params.lang : "tr");
  return <NotFoundPage lang={lang} />;
}

