import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LoginPage from "./components/LoginPage/LoginPage";
import RegistrationPage from "./components/RegistrationPage/RegistrationPage";
import PasswordRecoveryPage from "./components/PasswordRecoveryPage/PasswordRecoveryPage";
import PasswordChangePage from "./components/ChangePasswordPage/ChangePasswordPage";
import NotFoundPage from "./components/NotFoundPage/NotFoundPage";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import HomePage from "./components/HomePage/HomePage";
import MemberProfilePage from "./components/MemberProfile/MemberProfile";
import ArticlesAndNews from "./components/ArticlesAndNews/ArticlesAndNews";
import ConfirmRegistrationPage from "./components/ConfirmRegistrationPage/ConfirmRegistrationPage";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/registration" element={<RegistrationPage/>}/>
                <Route path="/password-recovery" element={<PasswordRecoveryPage/>}/>
                <Route path="/change-password" element={<PasswordChangePage/>}/>
                <Route path="/admin_panel" element={<AdminPanel/>}/>
                <Route path="/home" element={<HomePage/>}/>
                <Route path="/profile" element={<MemberProfilePage/>}/>
                <Route path="/articles-and-news" element={<ArticlesAndNews/>}/>
                <Route path="/confirm-registration" element={<ConfirmRegistrationPage />} />
                <Route path="*" element={<NotFoundPage/>}/>
            </Routes>
        </Router>
    );
};



export default App;
