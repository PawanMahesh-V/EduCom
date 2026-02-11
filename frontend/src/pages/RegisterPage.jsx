import { authApi } from '../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSchema, registrationSchema } from '../schemas/authSchemas';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import StepEmail from '../components/Register/StepEmail';
import StepDetails from '../components/Register/StepDetails';
import StepSuccess from '../components/Register/StepSuccess';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Steps: 1 = Email, 2 = Details Form, 3 = Success
  const [step, setStep] = useState(1);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  
  // Local state for Step 1 (simple enough not to need full form)
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form for Step 2
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      reg_id: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'Student',
      department: 'CS',
      semester: '1',
      program_year: '1'
    }
  });

  // Check for returning from verify-code page
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const verified = sessionStorage.getItem('registrationVerified');
    const storedEmail = sessionStorage.getItem('verifyEmail');
    
    if (stepParam === 'details' && verified === 'true' && storedEmail) {
      setVerifiedEmail(storedEmail);
      setEmailInput(storedEmail);
      setStep(2);
      // Clear verification flag 
      sessionStorage.removeItem('registrationVerified');
    }
  }, [searchParams]);

  // Handle email submission (Step 1)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    const validation = emailSchema.safeParse({ email: emailInput });
    if (!validation.success) {
      setEmailError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      await authApi.sendRegistrationCode(emailInput);
      // Store email and flow type for VerifyCodePage
      sessionStorage.setItem('verifyEmail', emailInput);
      sessionStorage.setItem('verifyFlow', 'registration');
      navigate('/verify-code');
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration form submit (Step 2)
  const onFinalSubmit = async (data) => {
    setError('');
    setLoading(true);
    
    try {
      await authApi.register({
        reg_id: data.reg_id,
        name: data.name,
        email: verifiedEmail,
        password: data.password,
        role: data.role,
        department: data.department,
        semester: data.role === 'Student' ? data.semester : null,
        program_year: data.role === 'PM' ? data.program_year : null
      });

      // Clear session storage
      sessionStorage.removeItem('verifyEmail');
      sessionStorage.removeItem('verifyFlow');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="register-orb register-orb--1"></div>
        <div className="register-orb register-orb--2"></div>
        <div className="register-orb register-orb--3"></div>
      </div>

      <header className="register-header">
        <button className="register-back-button" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back</span>
        </button>
        <div className="register-brand">
          <FontAwesomeIcon icon={faGraduationCap} className="register-brand-icon" />
          <span className="register-brand-text">
            Edu<span className="register-brand-accent">Com</span>
          </span>
        </div>
      </header>

      <div className="register-content">
        <div className={`register-container ${step === 2 ? 'register-container--wide' : ''}`}>
          {step === 1 && (
            <StepEmail 
                email={emailInput}
                setEmail={setEmailInput}
                loading={loading}
                error={error}
                fieldErrors={{ email: emailError }}
                setFieldErrors={() => setEmailError('')}
                setError={setError}
                onSubmit={handleEmailSubmit}
                onBack={() => navigate('/login')}
            />
          )}
          
          {step === 2 && (
            <StepDetails 
                register={register}
                errors={errors}
                watch={watch}
                onSubmit={handleSubmit(onFinalSubmit)}
                loading={loading}
                error={error}
            />
          )}

          {step === 3 && (
            <StepSuccess onNavigateLogin={() => navigate('/login')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
