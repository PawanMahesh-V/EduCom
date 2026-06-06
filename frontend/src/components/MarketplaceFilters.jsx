import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import CustomSelect from './Common/CustomSelect';

const MarketplaceFilters = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  onOpenPostModal
}) => {
  return (
    <div className="mp-toolbar">
      <input
        className="mp-search-input"
        type="text"
        placeholder="Search textbook name, items or course resources..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="mp-toolbar-filter-group">
        <CustomSelect
          options={[
            { value: 'All Roles', label: 'All Roles' },
            { value: 'Student', label: 'Student' },
            { value: 'Teacher', label: 'Teacher' },
            { value: 'Admin', label: 'Admin' },
            { value: 'HOD', label: 'HOD' },
            { value: 'PM', label: 'PM' }
          ]}
          value={roleFilter}
          onChange={(val) => setRoleFilter(val)}
        />
      </div>
      <button
        className="mp-btn-primary"
        onClick={onOpenPostModal}
      >
        <FontAwesomeIcon icon={faPlus} />
        <span>Create Listing</span>
      </button>
    </div>
  );
};

export default MarketplaceFilters;
