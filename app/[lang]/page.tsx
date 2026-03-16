import React from "react";
import { IndexPage } from "@/components/gtg/pages/IndexPage";
import { normalizeLang } from "@/lib/gtg/config";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default function Page({ params }: PageProps) {
  const { lang } = React.use(params);
  return <IndexPage lang={normalizeLang(lang)} />;
}

