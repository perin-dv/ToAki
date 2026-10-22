import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, ContaTesteProvider } from "./auth/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";
import { LoginPage, RegisterPage, RegisterChoicePage, PasswordPage, VerifyEmailPage, PendingPage } from "./pages/AuthPages";
import { PublicHomePage } from "./pages/HomePages";
import CompanyOnboardingPage from "./pages/CompanyOnboardingPage";
import { CompanyPage, CustomerPage, AdminPage } from "./pages/PrivatePages";
import DemoPage from "./pages/DemoPage";
import EntregadorPage from "./pages/EntregadorPage";
import "./styles.css";
import {registrarPwa} from "./lib/pwa";

function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<PublicHomePage/>}/>
    <Route path="/inicio" element={<PrivateRoute area="demo"><DemoPage/></PrivateRoute>}/>
    <Route path="/demonstracao" element={<PrivateRoute area="demo"><DemoPage/></PrivateRoute>}/>
    {import.meta.env.MODE === "e2e" && <Route path="/__e2e_demonstracao" element={<DemoPage/>}/>}
    {import.meta.env.MODE === "e2e" && <Route path="/__e2e_conta" element={<ContaTesteProvider><CustomerPage/></ContaTesteProvider>}/> }
    {import.meta.env.MODE === "e2e" && <Route path="/__e2e_inicio" element={<ContaTesteProvider><DemoPage/></ContaTesteProvider>}/>}
    {import.meta.env.MODE === "e2e" && <Route path="/__e2e_entregador" element={<ContaTesteProvider><EntregadorPage/></ContaTesteProvider>}/>}
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/cadastro" element={<RegisterChoicePage/>}/>
    <Route path="/cadastro/cliente" element={<RegisterPage tipo="cliente"/>}/>
    <Route path="/cadastro/empresa" element={<RegisterPage tipo="empresa"/>}/>
    <Route path="/cadastro/empresa/dados" element={<PrivateRoute area="demo"><CompanyOnboardingPage/></PrivateRoute>}/>
    <Route path="/recuperar-senha" element={<PasswordPage/>}/>
    <Route path="/verificar-email" element={<VerifyEmailPage/>}/>
    <Route path="/acesso-pendente" element={<PendingPage/>}/>
    <Route path="/empresa" element={<PrivateRoute area="empresa"><CompanyPage/></PrivateRoute>}/>
    <Route path="/entregador" element={<PrivateRoute area="demo"><EntregadorPage/></PrivateRoute>}/>
    <Route path="/cliente" element={<PrivateRoute area="cliente"><CustomerPage/></PrivateRoute>}/>
    <Route path="/admin" element={<PrivateRoute area="admin"><AdminPage/></PrivateRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></AuthProvider></BrowserRouter>;
}
registrarPwa();
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
