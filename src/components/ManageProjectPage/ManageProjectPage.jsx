import React from 'react';
import NavigationBar from "../NavigationBar/NavigationBar";
import {Helmet} from "react-helmet";
import styles from "../ManageProjectPage/ManageProjectPage.module.css";

function EventsCalendarPage() {
    return (
        <>
            <Helmet>
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
