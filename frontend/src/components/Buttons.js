import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ to, text }) => (
  <Link to={to}>
    <button style={{ margin: '10px', padding: '10px 20px', fontSize: '16px' }}>
      {text}
    </button>
  </Link>
);

export default Button;