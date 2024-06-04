import React, { useEffect } from 'react';
import { Chart, LineController, BarController, PieController, LineElement, BarElement, PointElement, LinearScale, Title, CategoryScale, ArcElement } from 'chart.js';
import styles from './ProjectStatistics.module.css';
import { Helmet } from "react-helmet";
import NavigationBar from "../../navigation_bar/NavigationBar";

// Registering necessary components
Chart.register(LineController, BarController, PieController, LineElement, BarElement, PointElement, LinearScale, Title, CategoryScale, ArcElement);

const ProjectStatistics = () => {
    useEffect(() => {
        const charts = [];

        const createChart = (id, type, data) => {
            const ctx = document.getElementById(id).getContext('2d');
            if (ctx) {
                charts.push(new Chart(ctx, {
                    type: type,
                    data: data,
                }));
            }
        };

        createChart('visitsChart', 'line', {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Visits',
                data: [120, 190, 300, 500, 200, 300, 450],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        });

        createChart('likesChart', 'bar', {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Likes',
                data: [10, 30, 50, 80, 60, 90, 120],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        });

        createChart('chatParticipantsChart', 'line', {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Chat Participants',
                data: [20, 50, 70, 100, 90, 110, 130],
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        });

        createChart('followersChart', 'bar', {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Followers',
                data: [15, 25, 35, 45, 55, 65, 75],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        });

        createChart('videoConferencesChart', 'pie', {
            labels: ['Attended', 'Missed'],
            datasets: [{
                label: 'Video Conferences',
                data: [80, 20],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        });

        return () => {
            charts.forEach(chart => chart.destroy());
        };
    }, []);

    return (
        <>
            <Helmet>
                <title>Статистика проекта</title>
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.statisticsPage}>
                <h2 className={styles.title}>Статистика проекта</h2>
                <div className={styles.statisticsContainer}>
                    <div className={styles.metric}>
                        <h3>Количество посещений проекта</h3>
                        <canvas id="visitsChart"></canvas>
                    </div>
                    <div className={styles.metric}>
                        <h3>Количество лайков проекта</h3>
                        <canvas id="likesChart"></canvas>
                    </div>
                    <div className={styles.metric}>
                        <h3>Количество участников чата проекта</h3>
                        <canvas id="chatParticipantsChart"></canvas>
                    </div>
                    <div className={styles.metric}>
                        <h3>Количество отслеживаний проекта</h3>
                        <canvas id="followersChart"></canvas>
                    </div>
                    <div className={styles.metric}>
                        <h3>Количество посещений видео-конференций</h3>
                        <canvas id="videoConferencesChart"></canvas>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectStatistics;