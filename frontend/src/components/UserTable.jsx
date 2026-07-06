import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import Pagination from './Common/Pagination';

const UserTable = ({
  usersLoading,
  paginatedUsers,
  userSearchTerm,
  filteredUsersCount,
  userPage,
  setUserPage,
  itemsPerPage,
  onEditUser,
  onDeleteUser
}) => {
  if (usersLoading) {
    return <div className="um-loading-state"><div className="um-spinner"></div><span>Loading users...</span></div>;
  }

  return (
    <div className="um-table-responsive-container">
      <table className="um-data-table">
        <thead>
          <tr>
            <th>Registration ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th className="um-text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.length === 0 ? (
            <tr>
              <td colSpan="6" className="um-empty-table-cell">
                {userSearchTerm ? 'No users match your search' : 'No users found'}
              </td>
            </tr>
          ) : (
            paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td className="um-font-bold um-text-emerald" data-label="Registration ID">{user.reg_id || 'Staff Link'}</td>
                <td className="um-font-semibold" data-label="Full Name">{user.name}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Role"><span className={`um-role-tag um-role-tag--${user.role?.toLowerCase()}`}>{user.role}</span></td>
                <td data-label="Department">{user.department}</td>
                <td data-label="Actions" className="um-actions-cell">
                  <button
                    className="um-icon-btn um-icon-btn--edit"
                    onClick={() => onEditUser(user)}
                    title="Edit Profile"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    className="um-icon-btn um-icon-btn--delete"
                    onClick={() => onDeleteUser(user.id)}
                    title="Delete User"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="um-mobile-cards-viewport">
        {paginatedUsers.length === 0 ? (
          <div className="um-empty-card-fallback">No users found.</div>
        ) : (
          paginatedUsers.map((user) => (
            <div key={user.id} className="um-responsive-data-card">
              <div className="um-card-topline">
                <span className="um-card-code">{user.reg_id || 'Staff Link'}</span>
                <span className={`um-role-tag um-role-tag--${user.role?.toLowerCase()}`}>{user.role}</span>
              </div>
              <h4 className="um-card-heading">{user.name}</h4>
              <p className="um-card-email-sub">{user.email}</p>
              <div className="um-card-metadata-row">
                <span><strong>Department:</strong> {user.department}</span>
              </div>
              <div className="cm-card-action-bar">
                <button className="cm-card-btn cm-card-btn--edit" onClick={() => onEditUser(user)}>
                  <FontAwesomeIcon icon={faPenToSquare} /> Edit
                </button>
                <button className="cm-card-btn cm-card-btn--delete" onClick={() => onDeleteUser(user.id)}>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination 
        currentPage={userPage} 
        totalItems={filteredUsersCount} 
        itemsPerPage={itemsPerPage} 
        onPageChange={setUserPage} 
      />
    </div>
  );
};

export default UserTable;
