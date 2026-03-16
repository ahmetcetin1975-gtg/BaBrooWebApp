"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

export function Paginator({
  lang,
  baseRoute,
  currentPage,
  totalItems,
  tableSize,
}: {
  lang: "tr" | "en";
  baseRoute: string;
  currentPage: number;
  totalItems: number;
  tableSize: number;
}) {
  const router = useRouter();
  const totalPages = Math.ceil(totalItems / tableSize);

  const displayedPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    if (currentPage > 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage < totalPages) pages.push(currentPage + 1);
    return pages;
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    router.push(`/${lang}/${baseRoute}/${page}`);
  };

  return (
    <div className="grid md:grid-cols-12 grid-cols-1 mt-8">
      <div className="md:col-span-12 text-center">
        <nav aria-label="Page navigation">
          <ul className="inline-flex items-center -space-x-px">
            <li>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="size-[40px] inline-flex justify-center items-center text-slate-400 bg-indigo-50 rounded-s-lg hover:text-white border border-gray-100 dark:border-gray-700 hover:border-blue-700 dark:hover:border-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700"
              >
                <i className="uil uil-angle-left text-[20px] rtl:rotate-180 rtl:-mt-1"></i>
              </button>
            </li>
            {displayedPages.map((page) => (
              <li key={page}>
                <button
                  onClick={() => goToPage(page)}
                  className={
                    page === currentPage
                      ? "z-10 size-[40px] inline-flex justify-center items-center text-white bg-blue-700 border border-blue-700"
                      : "size-[40px] inline-flex justify-center items-center text-slate-400 hover:text-white bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-700 hover:border-blue-700 dark:hover:border-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700"
                  }
                >
                  {page}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="size-[40px] inline-flex justify-center items-center text-slate-400 bg-indigo-50 rounded-e-lg hover:text-white border border-gray-100 dark:border-gray-700 hover:border-blue-700 dark:hover:border-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700"
              >
                <i className="uil uil-angle-right text-[20px] rtl:rotate-180 rtl:-mt-1"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}


