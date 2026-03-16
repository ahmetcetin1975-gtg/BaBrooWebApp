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
        className="back-to-top fixed hidden text-4xl rounded-full z-10 bottom-16 end-5 size-9 text-center bg-blue-700 text-white leading-10 hover:cursor-pointer"
        onClick={scrollToTop}
      >
        <i className="uil uil-arrow-up leading-10"></i>
      </button>
      <a
        href="https://wa.me/971544832320"
        target="_blank"
        id="wa-message"
        className="overflow-hidden flex items-center justify-center fixed text-3xl rounded-full 
        z-10 bottom-5 end-5 size-9 text-center bg-green-700 text-white leading-10 hover:cursor-pointer"
        
        rel="noreferrer"
      >
   
        <i className="uil uil-whatsapp text-[28px] leading-none"></i>
      </a>
    </>
  );
}


