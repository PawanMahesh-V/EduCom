import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Pagination = ({ currentPage, totalItems, itemsPerPage = 10, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const startResult = (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="cs-pagination-container">
      <button 
        className="cs-pagination-nav-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FontAwesomeIcon icon={faChevronLeft} />
        <span className="cs-pagination-nav-text">Previous</span>
      </button>

      <div className="cs-pagination-numbers">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="cs-pagination-dots">...</span>
            ) : (
              <button
                className={`cs-pagination-page-btn ${currentPage === page ? 'cs-pagination-page-btn--active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button 
        className="cs-pagination-nav-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span className="cs-pagination-nav-text">Next</span>
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      <div className="cs-pagination-info">
        Showing {startResult} to {endResult} of {totalItems.toLocaleString()} results
      </div>
    </div>
  );
};

export default Pagination;
