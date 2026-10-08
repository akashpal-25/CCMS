export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
};

export const validateComplaintForm = (formData) => {
  const errors = {};
  if (!formData.domain) errors.domain = 'Please select a domain.';
  if (!formData.category) errors.category = 'Please select a category.';
  if (!formData.title || formData.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters.';
  }
  if (!formData.description || formData.description.trim().length < 20) {
    errors.description = 'Please provide a detailed description (minimum 20 characters).';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validatePasswordStrength = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('At least 8 characters.');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter.');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter.');
  if (!/[0-9]/.test(password)) errors.push('One number.');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character.');
  return errors;
};