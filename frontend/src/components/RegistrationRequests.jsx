import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import Pagination from './Common/Pagination';

const RegistrationRequests = ({
  requestsLoading,
  paginatedRequests,
  filteredRequestsCount,
  requestPage,
  setRequestPage,
  itemsPerPage,
  onApproveRequest,
  onRejectRequest
}) => {
  if (requestsLoading) {
    return <div className="um-loading-state"><div className="um-spinner"></div><span>Loading requests...</span></div>;
  }

  return (
    <div className="um-table-responsive-container">
      <table className="um-data-table">
        <thead>
          <tr>
            <th>Registration ID</th>
            <th>Name</th>
            <th>Email Profile</th>
            <th>Role</th>
            <th>Department</th>
            <th>Semester/Year</th>
            <th>Request Date</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRequests.length === 0 ? (
            <tr>
              <td colSpan="8" className="um-empty-table-cell">
                No pending registration requests found
              </td>
            </tr>
          ) : (
            paginatedRequests.map((request) => (
              <tr key={request.id}>
                <td className="um-font-bold um-text-emerald" data-label="Registration ID">{request.reg_id || 'Staff Link'}</td>
                <td className="um-font-semibold" data-label="Name">{request.name}</td>
                <td data-label="Email">{request.email}</td>
                <td data-label="Role"><span className={`um-role-tag um-role-tag--${request.role?.toLowerCase()}`}>{request.role}</span></td>
                <td data-label="Department">{request.department}</td>
                <td data-label="Semester/Year" className="um-font-medium">
                  {request.role === 'Student' ? `Semester ${request.semester}` :
                   request.role === 'PM' ? `Year ${request.program_year}` : 'N/A'}
                </td>
                <td data-label="Request Date" className="um-text-muted-dark">{new Date(request.created_at).toLocaleDateString()}</td>
                <td data-label="Actions" className="um-actions-cell">
                  <button
                    className="um-icon-btn um-icon-btn--approve"
                    onClick={() => onApproveRequest(request.id)}
                    title="Approve"
                  >
                    <FontAwesomeIcon icon={faUserCheck} />
                  </button>
                  <button
                    className="um-icon-btn um-icon-btn--delete"
                    onClick={() => onRejectRequest(request.id)}
                    title="Reject"
                  >
                    <FontAwesomeIcon icon={faUserMinus} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="um-mobile-cards-viewport">
        {paginatedRequests.length === 0 ? (
          <div className="um-empty-card-fallback">No pending requests.</div>
        ) : (
          paginatedRequests.map((request) => (
            <div key={request.id} className="um-responsive-data-card">
              <div className="um-card-topline">
                <span className="um-card-code">{request.reg_id || 'Staff Dispatch'}</span>
                <span className={`um-role-tag um-role-tag--${request.role?.toLowerCase()}`}>{request.role}</span>
              </div>
              <h4 className="um-card-heading">{request.name}</h4>
              <p className="um-card-email-sub">{request.email}</p>
              <div className="um-card-metadata-row text-xs">
                <p><strong>Dept:</strong> {request.department} • <strong>Placement:</strong> {request.role === 'Student' ? `Sem ${request.semester}` : request.role === 'PM' ? `Yr ${request.program_year}` : 'N/A'}</p>
                <p className="um-text-muted-dark font-mono">Dispatched: {new Date(request.created_at).toLocaleDateString()}</p>
              </div>
              <div className="cm-card-action-bar">
                <button className="cm-card-btn cm-card-btn--approve" onClick={() => onApproveRequest(request.id)}>
                  <FontAwesomeIcon icon={faUserCheck} /> Approve
                </button>
                <button className="cm-card-btn cm-card-btn--delete" onClick={() => onRejectRequest(request.id)}>
                  <FontAwesomeIcon icon={faUserMinus} /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination 
        currentPage={requestPage} 
        totalItems={filteredRequestsCount} 
        itemsPerPage={itemsPerPage} 
        onPageChange={setRequestPage} 
      />
    </div>
  );
};

export default RegistrationRequests;
