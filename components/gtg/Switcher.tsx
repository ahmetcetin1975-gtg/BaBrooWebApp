"use client";

import { useEffect } from "react";

export function Switcher() {
  useEffect(() => {
    const onScroll = () => {
      const backToTop = document.getElementById("back-to-top");
      if (backToTop) {
        if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
          backToTop.classList.add("block");
          backToTop.classList.remove("hidden");
        } else {
          backToTop.classList.add("hidden");
          backToTop.classList.remove("block");
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <button
        id="back-to-top"
        className="back-to-top fixed hidden text-4xl rounded-full z-10 end-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] size-10 text-center leading-10 text-white shadow-[0_14px_28px_rgba(30,64,175,0.35)] hover:cursor-pointer sm:bottom-16 sm:end-5 sm:size-9 bg-blue-700"
        onClick={scrollToTop}
      >
        <i className="uil uil-arrow-up leading-10"></i>
      </button>
      <a
        href="https://wa.me/971544832320"
        target="_blank"
        id="wa-message"
        className="fixed end-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-10 flex size-10 items-center justify-center overflow-hidden rounded-full bg-green-700 text-center text-3xl leading-10 text-white shadow-[0_14px_28px_rgba(21,128,61,0.35)] hover:cursor-pointer sm:bottom-5 sm:end-5 sm:size-9"
        
        rel="noreferrer"
      >
   
        <i className="uil uil-whatsapp text-[28px] leading-none"></i>
      </a>
    </>
  );
}

