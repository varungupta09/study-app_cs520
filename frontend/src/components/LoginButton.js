import React from 'react';

const LoginButton = ({ loading, disabled, text }) => {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      style={{
        margin: '10px',
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        width: '100%',
      }}
    >
      {loading ? 'Logging In...' : text || 'Login'}
    </button>
  );
};

export default LoginButton;
