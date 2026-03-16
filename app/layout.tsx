import "./tailwind.css";
import "./globals.scss";
import type { Metadata } from "next";
import Script from "next/script";
import { Nunito, Poppins } from "next/font/google";
import { Switcher } from "@/components/gtg/Switcher";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "GoTradeGo",
  description: "GoTradeGo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" dir="ltr" className={`light scroll-smooth ${poppins.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link href="/assets/libs/tiny-slider/tiny-slider.css" rel="stylesheet" />
        <link href="/assets/libs/@iconscout/unicons/css/line.css" rel="stylesheet" />
        <link href="/assets/libs/@mdi/font/css/materialdesignicons.min.css" rel="stylesheet" />
        <link href="/assets/libs/animate.css/animate.min.css" rel="stylesheet" />
        <link href="/assets/libs/swiper/css/swiper.min.css" rel="stylesheet" />
      </head>
      <body className="font-pop text-base text-black dark:text-white dark:bg-slate-900">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TL4WG3W"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {children}
        <Switcher />
        <Script id="gtm" strategy="beforeInteractive">
          {`(function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            var f = d.getElementsByTagName(s)[0],
              j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
          })(window, document, 'script', 'dataLayer', 'GTM-TL4WG3W');`}
        </Script>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-3QM2JVFFWM" strategy="afterInteractive" />
        <Script id="gtag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);} 
          gtag('js', new Date());
          gtag('config', 'G-3QM2JVFFWM');`}
        </Script>
      </body>
    </html>
  );
}
