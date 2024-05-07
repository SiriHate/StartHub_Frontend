import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LoginPage from "./components/LoginPage/LoginPage";
import RegistrationPage from "./components/RegistrationPage/RegistrationPage";
import PasswordRecoveryPage from "./components/PasswordRecoveryPage/PasswordRecoveryPage";
import PasswordChangePage from "./components/ChangePasswordPage/ChangePasswordPage";
import NotFoundPage from "./components/NotFoundPage/NotFoundPage";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import HomePage from "./components/HomePage/HomePage";
import ArticlesAndNews from "./components/ArticlesAndNews/ArticlesAndNews";
import ConfirmRegistrationPage from "./components/ConfirmRegistrationPage/ConfirmRegistrationPage";
import MemberProfilePage from "./components/MemberProfile/MemberProfile";
import EventsCalendarPage from "./components/EventsCalendarPage/EventsCalendarPage";
import PeopleAndProjects from "./components/PeopleAndProjects/PeopleAndProjects";
import MyProjects from "./components/MyProjects/MyProjects";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/registration" element={<RegistrationPage/>}/>
                <Route path="/password-recovery" element={<PasswordRecoveryPage/>}/>
                <Route path="/change-password" element={<PasswordChangePage/>}/>
                <Route path="/admin_panel" element={<AdminPanel/>}/>
                <Route path="/profile" element={<MemberProfilePage/>}/>
                <Route path="/home" element={<HomePage/>}/>
                <Route path="/articles-and-news" element={<ArticlesAndNews/>}/>
                <Route path="/confirm-registration" element={<ConfirmRegistrationPage/>}/>
                <Route path="/events_calendar" element={<EventsCalendarPage/>}/>
                <Route path="/people_and_projects" element={<PeopleAndProjects/>}/>
                <Route path="/my_projects" element={<MyProjects/>}/>
                <Route path="*" element={<NotFoundPage/>}/>
            </Routes>
        </Router>
    );
};


export default App;
