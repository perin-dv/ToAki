import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";
import { LoginPage, RegisterPage, PasswordPage, VerifyEmailPage, PendingPage } from "./pages/AuthPages";
import { CompanyPage, CustomerPage, AdminPage } from "./pages/PrivatePages";
import DemoPage from "./pages/DemoPage";
import "./styles.css";

function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<Navigate to="/login" replace/>}/>
    <Route path="/demonstracao" element={<DemoPage/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/cadastro" element={<RegisterPage/>}/>
    <Route path="/recuperar-senha" element={<PasswordPage/>}/>
    <Route path="/verificar-email" element={<VerifyEmailPage/>}/>
    <Route path="/acesso-pendente" element={<PendingPage/>}/>
    <Route path="/empresa" element={<PrivateRoute area="empresa"><CompanyPage/></PrivateRoute>}/>
    <Route path="/cliente" element={<PrivateRoute area="cliente"><CustomerPage/></PrivateRoute>}/>
    <Route path="/admin" element={<PrivateRoute area="admin"><AdminPage/></PrivateRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></AuthProvider></BrowserRouter>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
