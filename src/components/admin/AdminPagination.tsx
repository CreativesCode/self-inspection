"use client";

import { PageBtn } from "@/components/ui/PageBtn";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  shown: number;
  onPageChange: (n: number) => void;
  onPageSizeChange: (n: number) => void;
  pageSizeOptions?: number[];
};

/**
 * AdminPagination — pieza estándar para listas administrativas. Muestra el
 * conteo, selector de tamaño de página y `<PageBtn>` con la lógica de "1 2 3 …
 * última".
 */
export function AdminPagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  shown,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [8, 12, 24, 48],
}: AdminPaginationProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-2 dark:text-dark-ink-2">
      <div className="flex items-center gap-3">
        <span>
          Mostrando {shown} de {total}
        </span>
        <div className="hidden items-center gap-1.5 sm:flex">
          <span>·</span>
          <span>Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-hairline bg-surface px-2 py-1 dark:border-hairline-dark dark:bg-dark-surface"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <PageBtn
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={13} />
        </PageBtn>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const page = i + 1;
          return (
            <PageBtn
              key={page}
              active={page === currentPage}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PageBtn>
          );
        })}
        {totalPages > 5 && (
          <>
            <span className="px-1">…</span>
            <PageBtn
              active={totalPages === currentPage}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </PageBtn>
          </>
        )}
        <PageBtn
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight size={13} />
        </PageBtn>
      </div>
    </div>
  );
}
