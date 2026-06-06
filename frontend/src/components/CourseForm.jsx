import React from 'react';
import CustomSelect from './Common/CustomSelect';

const CourseForm = ({ 
  isOpen, 
  isEditMode, 
  formData, 
  teachers, 
  onInputChange, 
  onSelectChange, 
  onSubmit, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="cm-modal-overlay">
      <div className="cm-modal-box cm-modal-box--medium fade-in">
        <h2>{isEditMode ? 'Edit Course' : 'Create New Course'}</h2>
        <form onSubmit={onSubmit} className="cm-modal-form">
          <div className="cm-modal-grid-2col">
            <div className="cm-form-group">
              <label>Course Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={onInputChange}
                placeholder="e.g., CSC-441"
                required
              />
            </div>
            <div className="cm-form-group">
              <label>Course Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                placeholder="e.g., Data Mining"
                required
              />
            </div>
            <div className="cm-form-group">
              <label>Department Target</label>
              <CustomSelect
                options={[
                  { value: 'CS', label: 'CS' },
                  { value: 'BBA', label: 'BBA' },
                  { value: 'IT', label: 'IT' }
                ]}
                value={formData.department}
                onChange={(val) => onSelectChange('department', val)}
              />
            </div>
            <div className="cm-form-group">
              <label>Academic Semester</label>
              <CustomSelect
                options={[
                  { value: '1', label: 'Semester 1' },
                  { value: '2', label: 'Semester 2' },
                  { value: '3', label: 'Semester 3' },
                  { value: '4', label: 'Semester 4' },
                  { value: '5', label: 'Semester 5' },
                  { value: '6', label: 'Semester 6' },
                  { value: '7', label: 'Semester 7' },
                  { value: '8', label: 'Semester 8' }
                ]}
                value={formData.semester}
                onChange={(val) => onSelectChange('semester', val)}
                placeholder="Select Semester"
              />
            </div>
            <div className="cm-form-group cm-form-group--full">
              <label>Assigned Faculty Mentor</label>
              <CustomSelect
                options={teachers.map(t => ({ 
                  value: t.id, 
                  label: `${t.name} ${t.role ? `(${t.role})` : ''}` 
                }))}
                value={formData.teacher_id}
                onChange={(val) => onSelectChange('teacher_id', val)}
                placeholder="Link Teacher Profile"
              />
            </div>
          </div>
          <div className="cm-modal-action-footer">
            <button type="button" className="cm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="cm-btn-primary">{isEditMode ? 'Update Course' : 'Save Course'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
