import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/security/AuthContext";
import PrivateRoute from "./components/security/PrivateRoute";
import HomePage from "./components/pages/HomePage/HomePage";
import LoginPage from "./components/pages/LoginPage/LoginPage";
import YandexCallback from "./components/pages/LoginPage/YandexCallback";
import RegistrationPage from "./components/pages/RegistrationPage/RegistrationPage";
import PasswordRecoveryPage from "./components/pages/PasswordRecoveryPage/PasswordRecoveryPage";
import PasswordChangePage from "./components/pages/ChangePasswordPage/ChangePasswordPage";
import ConfirmRegistrationPage from "./components/pages/ConfirmRegistrationPage/ConfirmRegistrationPage";
import NotFoundPage from "./components/pages/NotFoundPage/NotFoundPage";
import AdminPanel from "./components/pages/AdminPanel/AdminPanel";
import ArticlesAndNews from "./components/pages/ArticlesAndNews/ArticlesAndNews";
import CreateArticle from "./components/pages/CreateArticle/CreateArticle";
import CreateNews from "./components/pages/CreateNews/CreateNews";
import NewsPage from "./components/pages/NewsPage/NewsPage";
import ArticlePage from "./components/pages/ArticlePage/ArticlePage";
import ManageArticle from "./components/pages/ManageArticle/ManageArticle";
import ManageNews from "./components/pages/ManageNews/ManageNews";
import MemberProfilePage from "./components/pages/MemberProfile/MemberProfile";
import PeopleAndProjects from "./components/pages/PeopleAndProjects/PeopleAndProjects";
import MySpace from "./components/pages/MySpace/MySpace";
import CreateProject from "./components/pages/CreateProject/CreateProject";
import ProjectDetails from "./components/pages/ProjectDetails/ProjectDetails";
import PersonalMemberAccount from "./components/pages/PersonalMemberAccount/PersonalMemberAccount";
import CreateFeedbackForm from "./components/pages/CreateFeedbackForm/CreateFeedbackForm";
import ManageProject from "./components/pages/ManageProject/ManageProject";
import LeaveFeedback from "./components/pages/LeaveFeedback/LeaveFeedback";
import FeedbackPanel from "./components/pages/FeedbackPanel/FeedbackPanel";
import ModeratorPanel from "./components/pages/ModeratorPanel/ModeratorPanel";

const App = () => {
    return (
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/yandex-callback" element={<YandexCallback />} />
                        <Route path="/registration" element={<RegistrationPage />} />
                        <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
                        <Route path="/change-password" element={<PasswordChangePage />} />
                        <Route path="/confirm-registration" element={<ConfirmRegistrationPage />} />
                        <Route element={<PrivateRoute />}>
                            <Route path="/members/personal-account" element={<PersonalMemberAccount />} />
                            <Route path="/members/profile/:userId" element={<MemberProfilePage />} />
                            <Route path="/articles-and-news" element={<ArticlesAndNews />} />
                            <Route path="/moderator_panel" element={<ModeratorPanel />} />
                            <Route path="/create_article" element={<CreateArticle />} />
                            <Route path="/article/:articleId" element={<ArticlePage />} />
                            <Route path="/manage_article/:articleId" element={<ManageArticle />} />
                            <Route path="/create_news" element={<CreateNews />} />
                            <Route path="/news/:newsId" element={<NewsPage />} />
                            <Route path="/manage_news/:newsId" element={<ManageNews />} />
                            <Route path="/people_and_projects" element={<PeopleAndProjects />} />
                            <Route path="/my_space" element={<MySpace />} />
                            <Route path="/create_project" element={<CreateProject />} />
                            <Route path="/project/:projectId" element={<ProjectDetails />} />
                            <Route path="/project/:projectId/leave_feedback" element={<LeaveFeedback />} />
                            <Route path="/manage_project/:projectId" element={<ManageProject />} />
                            <Route path="/project/:projectId/create_feedback" element={<CreateFeedbackForm/>} />
                            <Route path="/project/:projectId/feedbacks" element={<FeedbackPanel/>} />
                            <Route path="/create_feedback_form" element={<CreateFeedbackForm/>} />
                            <Route path="/feedback_panel" element={<FeedbackPanel/>} />
                            <Route path="/admin_panel" element={<AdminPanel/>} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Router>
            </AuthProvider>
    );
};

export default App;