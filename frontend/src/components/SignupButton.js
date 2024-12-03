import React from 'react';

const SignupButton = ({ loading, disabled, text }) => {
  return (
    <button
      type="submit" // This makes the button submit the form
      disabled={disabled || loading} // Disable button while loading or if explicitly disabled
      style={{
        margin: '10px',
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Signing Up...' : text || 'Sign Up'} {/* Show loading or normal text */}
    </button>
  );
};

export default SignupButton;
