import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosbase from "./axiosConfig";
import AuthLayout, { AuthField, GoogleButton, PasswordField } from "./AuthLayout";

const Register = () => {
  const navigate = useNavigate();
  const usernameDom = useRef();
  const fnameDom = useRef();
  const lnameDom = useRef();
  const emailDom = useRef();
  const passwordDom = useRef();
  const confirmPasswordDom = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usernameValue = usernameDom.current.value.trim();
    const fnameValue = fnameDom.current.value.trim();
    const lnameValue = lnameDom.current.value.trim();
    const emailValue = emailDom.current.value.trim();
    const passwordValue = passwordDom.current.value;
    const confirmPasswordValue = confirmPasswordDom.current.value;

    if (!usernameValue || !fnameValue || !lnameValue || !emailValue || !passwordValue || !confirmPasswordValue) {
      alert("Please fill in all fields.");
      return;
    }

    if (passwordValue !== confirmPasswordValue) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await axiosbase.post("user/register", {
        username: usernameValue,
        Fname: fnameValue,
        Lname: lnameValue,
        Email: emailValue,
        PASSWORD: passwordValue,
      });

      alert(response.data.message || "Registration successful!");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed!");
    }
  };

  return (
    <AuthLayout mode="register">
      <header className="auth-form-heading">
        <h2>Create your account</h2>
        <p>Sign up to start chatting, asking questions, and learning with the community.</p>
      </header>
      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <div className="auth-name-row">
          <AuthField
            label="First Name"
            icon="user"
            inputRef={fnameDom}
            type="text"
            placeholder="First name"
            autoComplete="given-name"
            required
          />
          <AuthField
            label="Last Name"
            icon="user"
            inputRef={lnameDom}
            type="text"
            placeholder="Last name"
            autoComplete="family-name"
            required
          />
        </div>
        <AuthField
          label="Username"
          icon="user"
          inputRef={usernameDom}
          type="text"
          placeholder="Choose a username"
          autoComplete="username"
          required
        />
        <AuthField
          label="Email Address"
          icon="mail"
          inputRef={emailDom}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <PasswordField label="Password" inputRef={passwordDom} placeholder="Create a strong password" autoComplete="new-password" />
        <PasswordField label="Confirm Password" inputRef={confirmPasswordDom} placeholder="Confirm your password" autoComplete="new-password" />
        <button className="auth-submit" type="submit">Create Account</button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <GoogleButton>Sign up with Google</GoogleButton>
      <p className="auth-terms">By creating an account, you agree to our<br /><span>Terms of Service</span> and <span>Privacy Policy</span>.</p>
    </AuthLayout>
  );
};

export default Register;
