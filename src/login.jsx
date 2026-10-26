import React, { useRef, useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosbase from "./axiosConfig";
import { AppContext } from "./App";
import AuthLayout, { AuthField, GoogleButton, PasswordField } from "./AuthLayout";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AppContext);
  const emailDom = useRef();
  const passwordDom = useRef();
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailValue = emailDom.current.value.trim();
    const passwordValue = passwordDom.current.value;

    if (!emailValue || !passwordValue) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const { data } = await axiosbase.post("user/login", {
        Email: emailValue,
        PASSWORD: passwordValue,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      setUser({ username: data.username, userid: data.userid });

      alert(data.message || "Login successful!");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to log in. Please try again.");
    }
  };

  return (
    <AuthLayout mode="login">
      <header className="auth-form-heading">
        <h2>Log in to ChatQ</h2>
        <p>Enter your details to access your account.</p>
      </header>
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          label="Email Address"
          icon="mail"
          inputRef={emailDom}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <PasswordField inputRef={passwordDom} />
        <div className="auth-options">
          <label className="remember-option"><input type="checkbox" /> <span>Remember me</span></label>
          <button className="auth-text-button" type="button" onClick={() => setNotice('Password reset is not available yet. Please contact your administrator.')}>Forgot password?</button>
        </div>
        <button className="auth-submit" type="submit">Log In</button>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
      </form>
      <div className="auth-divider"><span>or</span></div>
      <GoogleButton>Sign in with Google</GoogleButton>
      <p className="auth-terms">By continuing, you agree to our<br /><span>Terms of Service</span> and <span>Privacy Policy</span>.</p>
      <p className="auth-preview"><Link to="/preview">Preview the dashboard</Link></p>
    </AuthLayout>
  );
};

export default Login;
