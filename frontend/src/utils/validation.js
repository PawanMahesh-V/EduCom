export const isValidEmail = (email) => {
    if (!email) return false;

    const trimmedEmail = email.trim().toLowerCase();

    // Check domain first
    const allowedDomains = ['@szabist.pk', '@szabist.edu.pk'];
    const hasValidDomain = allowedDomains.some(domain => trimmedEmail.endsWith(domain));

    if (!hasValidDomain) return false;

    // Basic email structure regex (checking local part before @)
    // This allows alphanumeric, dots, underscores, hyphens
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(trimmedEmail);
};

export const isValidPassword = (password) => {
    return password && password.length >= 6;
};
export const isValidRegId = (regId) => {
    if (!regId) return false;
    // Alphanumeric only (letters and numbers)
    const regIdRegex = /^[a-zA-Z0-9]+$/;
    return regIdRegex.test(regId.trim());
};
export const isValidName = (name) => {
    if (!name) return false;
    // Letters and spaces only
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name.trim());
};
export const getEmailError = (email) => {
    if (!email) return 'Please enter your email address.';

    const trimmedEmail = email.trim().toLowerCase();
    const allowedDomains = ['@szabist.pk', '@szabist.edu.pk'];
    const hasValidDomain = allowedDomains.some(domain => trimmedEmail.endsWith(domain));

    if (!hasValidDomain) {
        return 'Only @szabist.pk or @szabist.edu.pk email addresses are allowed.';
    }

    if (!isValidEmail(email)) {
        return 'Please enter a valid email address.';
    }

    return null;
};