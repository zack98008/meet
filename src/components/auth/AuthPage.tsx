import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { AuthProvider } from "./AuthProvider";

const AuthPageContent = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginForm onRegisterClick={() => setIsLogin(false)} />
  ) : (
    <RegisterForm
      onLoginClick={() => setIsLogin(true)}
      onSuccess={() => setIsLogin(true)}
    />
  );
};

const AuthPage = () => {
  return (
    <AuthProvider>
      <AuthPageContent />
    </AuthProvider>
  );
};

export default AuthPage;
