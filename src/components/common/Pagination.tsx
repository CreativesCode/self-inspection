"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDark?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isDark = false,
}: PaginationProps) {
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Función para renderizar el indicador de páginas
  const renderPagination = () => {
    // Si hay menos de 4 páginas, mostramos todas
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`inline-flex items-center justify-center w-7 h-7 text-xs rounded-md ${
            currentPage === page
              ? isDark
                ? "bg-primary-500 text-white"
                : "bg-primary-600 text-white"
              : isDark
              ? "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
          disabled={currentPage === page}
        >
          {page}
        </button>
      ));
    }

    // Si hay más de 3 páginas, mostramos la actual y las adyacentes
    const pagesToShow = [];

    // Primera página
    if (currentPage === 1) {
      pagesToShow.push(1, 2, 3);
    }
    // Última página
    else if (currentPage === totalPages) {
      pagesToShow.push(totalPages - 2, totalPages - 1, totalPages);
    }
    // Páginas intermedias
    else {
      pagesToShow.push(currentPage - 1, currentPage, currentPage + 1);
    }

    return pagesToShow.map((page) => (
      <button
        key={page}
        onClick={() => onPageChange(page)}
        className={`inline-flex items-center justify-center w-7 h-7 text-xs rounded-md mx-0.5 ${
          currentPage === page
            ? isDark
              ? "bg-primary-500 text-white"
              : "bg-primary-600 text-white"
            : isDark
            ? "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
        disabled={currentPage === page}
      >
        {page}
      </button>
    ));
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handlePreviousPage}
        disabled={currentPage <= 1}
        className={`inline-flex items-center px-1 py-1 h-7 w-7 border rounded-md ${
          currentPage > 1
            ? isDark
              ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            : isDark
            ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
            : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        <ChevronLeftIcon
          className={`h-5 w-5 ${
            currentPage > 1 ? "text-primary-500" : "text-gray-400"
          }`}
        />
      </button>

      <div className="flex flex-row gap-1 mx-1">{renderPagination()}</div>

      <button
        onClick={handleNextPage}
        disabled={currentPage >= totalPages}
        className={`inline-flex items-center px-1 py-1 h-7 w-7 border rounded-md ${
          currentPage < totalPages
            ? isDark
              ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            : isDark
            ? "border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
            : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        <ChevronRightIcon
          className={`h-5 w-5 ${
            currentPage < totalPages ? "text-primary-500" : "text-gray-400"
          }`}
        />
      </button>
    </div>
  );
}
