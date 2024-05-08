import React from 'react';
import NavigationBar from "../NavigationBar/NavigationBar";
import {Helmet} from "react-helmet";
import styles from "./ManageProjectPage.module.css";

function EventsCalendarPage() {
    return (
        <>
            <Helmet>
                <title>Управление проектом</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <div className={styles.peopleAndProjectsPage}>
                <NavigationBar/>
            </div>
        </>
    );
}

export default EventsCalendarPage;
