import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faIdCard, faUser, faLock, faEye, faEyeSlash, 
  faUserGraduate, faBuilding, faGraduationCap, faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';
import { ROLES, DEPARTMENTS } from '../../constants';
import CustomSelect from '../Common/CustomSelect';

const StepDetails = ({ 
    register,
    errors, 
    watch,
    loading, 
    error, 
    onSubmit,
    setValue
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Watch the role field to conditionally render other fields
  const currentRole = watch('role');

  const renderFieldError = (fieldName) => {
    if (!errors[fieldName]) return null;
    return (
      <div className="register-error-message fade-in mt-1">
        <span className="field-error-text">{errors[fieldName].message}</span>
      </div>
    );
  };

  return (
    <>
      <div className="register-welcome">
        <div className="register-verified-badge">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Email Verified</span>
        </div>
        <h1 className="register-title">Complete Your Profile</h1>
        <p className="register-subtitle">Note: Fill in your details. If Role is Teacher/HOD/PM, Registration ID is auto-generated.</p>
      </div>
      <form className="register-form" onSubmit={onSubmit}>
        <div className="register-form-grid">
          {/* Only show Registration ID field for roles that require manual entry */}
          {!['Teacher', 'HOD', 'PM'].includes(currentRole) && (
            <div className="register-form-group">
              <label className="register-label" htmlFor="reg_id">
                Registration ID
              </label>
              <div className="register-input-wrapper">
                <div className="register-input-icon">
                  <FontAwesomeIcon icon={faIdCard} />
                </div>
                <input
                  className={`register-input ${errors.reg_id ? 'register-input--error' : ''}`}
                  type="text"
                  id="reg_id"
                  placeholder="e.g., BCSBS2212263"
                  disabled={loading}
                  {...register('reg_id')}
                />
              </div>
              {renderFieldError('reg_id')}
            </div>
          )}

          <div className="register-form-group">
            <label className="register-label" htmlFor="name">
              Full Name
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <input
                className={`register-input ${errors.name ? 'register-input--error' : ''}`}
                type="text"
                id="name"
                placeholder="Enter your full name"
                disabled={loading}
                {...register('name')}
              />
            </div>
            {renderFieldError('name')}
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="password">
              Password
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <input
                className={`register-input ${errors.password ? 'register-input--error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Create a password"
                disabled={loading}
                {...register('password')}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {renderFieldError('password')}
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <input
                className={`register-input ${errors.confirmPassword ? 'register-input--error' : ''}`}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirm your password"
                disabled={loading}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {renderFieldError('confirmPassword')}
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="role">
              Role
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faUserGraduate} />
              </div>
              <CustomSelect
                options={ROLES.filter(r => r !== 'Admin').map(r => ({
                  value: r,
                  label: r === 'PM' ? 'PM (Program Manager)' : r
                }))}
                value={currentRole}
                onChange={(val) => setValue('role', val, { shouldValidate: true })}
                className="register-select"
              />
            </div>
          </div>

          <div className="register-form-group">
            <label className="register-label" htmlFor="department">
              Department
            </label>
            <div className="register-input-wrapper">
              <div className="register-input-icon">
                <FontAwesomeIcon icon={faBuilding} />
              </div>
              <CustomSelect
                options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                value={watch('department')}
                onChange={(val) => setValue('department', val, { shouldValidate: true })}
                className="register-select"
              />
            </div>
          </div>

          {currentRole === 'Student' && (
            <div className="register-form-group">
              <label className="register-label" htmlFor="semester">
                Semester
              </label>
              <div className="register-input-wrapper">
                <div className="register-input-icon">
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>
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
                  value={watch('semester')}
                  onChange={(val) => setValue('semester', val, { shouldValidate: true })}
                  className="register-select"
                />
              </div>
              {renderFieldError('semester')}
            </div>
          )}

          {currentRole === 'PM' && (
            <div className="register-form-group">
              <label className="register-label" htmlFor="program_year">
                Program Year
              </label>
              <div className="register-input-wrapper">
                <div className="register-input-icon">
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>
                <CustomSelect
                  options={[
                    { value: '1', label: 'Year 1' },
                    { value: '2', label: 'Year 2' },
                    { value: '3', label: 'Year 3' },
                    { value: '4', label: 'Year 4' }
                  ]}
                  value={watch('program_year')}
                  onChange={(val) => setValue('program_year', val, { shouldValidate: true })}
                  className="register-select"
                />
              </div>
              {renderFieldError('program_year')}
            </div>
          )}
        </div>

        {error && (
          <div className="register-error-message fade-in">
            {error}
          </div>
        )}
        
        <button 
          className="register-submit-button" 
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner-small"></div>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>
    </>
  );
};

export default StepDetails;
