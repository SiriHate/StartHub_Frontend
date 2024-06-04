import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LoginPage from "./components/pages/LoginPage/LoginPage";
import RegistrationPage from "./components/pages/RegistrationPage/RegistrationPage";
import PasswordRecoveryPage from "./components/pages/PasswordRecoveryPage/PasswordRecoveryPage";
import PasswordChangePage from "./components/pages/ChangePasswordPage/ChangePasswordPage";
import NotFoundPage from "./components/pages/NotFoundPage/NotFoundPage";
import AdminPanel from "./components/pages/AdminPanel/AdminPanel";
import ArticlesAndNews from "./components/pages/ArticlesAndNews/ArticlesAndNews";
import ConfirmRegistrationPage from "./components/pages/ConfirmRegistrationPage/ConfirmRegistrationPage";
import MemberProfilePage from "./components/pages/MemberProfile/MemberProfile";
import EventsCalendarPage from "./components/pages/EventsCalendarPage/EventsCalendarPage";
import PeopleAndProjects from "./components/pages/PeopleAndProjects/PeopleAndProjects";
import MyProjects from "./components/pages/MyProjects/MyProjects";
import CreateProject from "./components/pages/CreateProject/CreateProject";
import ProjectDetails from "./components/pages/ProjectDetails/ProjectDetails";
import PersonalMemberAccount from "./components/pages/PersonalMemberAccount/PersonalMemberAccount";
import CreateArticle from "./components/pages/CreateArticle/CreateArticle";
import CreateNews from "./components/pages/CreateNews/CreateNews";
import NewsPage from "./components/pages/NewsPage/NewsPage";
import ArticlePage from "./components/pages/ArticlePage/ArticlePage";
import MyChatsPage from "./components/pages/MyChatsPage/MyChatsPage";
import ManageProject from "./components/pages/ManageProject/ManageProject";
import ProjectStatistic from "./components/pages/ProjectStatistics/ProjectStatistics";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/registration" element={<RegistrationPage/>}/>
                <Route path="/password-recovery" element={<PasswordRecoveryPage/>}/>
                <Route path="/change-password" element={<PasswordChangePage/>}/>
                <Route path="/admin_panel" element={<AdminPanel/>}/>
                <Route path="/members/personal-account" element={<PersonalMemberAccount/>}/>
                <Route path="/members/profile/:userId" element={<MemberProfilePage/>}/>
                <Route path="/articles-and-news" element={<ArticlesAndNews/>}/>
                <Route path="/create_article" element={<CreateArticle/>}/>
                <Route path="/article/:articleId" element={<ArticlePage/>}/>
                <Route path="/create_news" element={<CreateNews/>}/>
                <Route path="/news/:newsId" element={<NewsPage/>}/>
                <Route path="/confirm-registration" element={<ConfirmRegistrationPage/>}/>
                <Route path="/events_calendar" element={<EventsCalendarPage/>}/>
                <Route path="/people_and_projects" element={<PeopleAndProjects/>}/>
                <Route path="/my_projects" element={<MyProjects/>}/>
                <Route path="/create_project" element={<CreateProject/>}/>
                <Route path="/project/:projectId" element={<ProjectDetails/>}/>
                <Route path="/project/:projectId/statistics" element={<ProjectStatistic/>}/>
                <Route path="/manage_project/:projectId" element={<ManageProject/>}/>
                <Route path="/my_chats" element={<MyChatsPage/>}/>
                <Route path="*" element={<NotFoundPage/>}/>
            </Routes>
        </Router>
    );
};


export default App;
