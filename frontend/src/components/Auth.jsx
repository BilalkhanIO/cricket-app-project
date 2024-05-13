// frontend/src/components/Auth.js

import React from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';

const Auth = () => {
  return (
    <div>
      <h2>Register</h2>
      <RegisterForm />
      <h2>Login</h2>
      <LoginForm />
    </div>
  );
};

export default Auth;
