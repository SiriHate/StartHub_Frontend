import React from 'react';
import NavigationBar from "../NavigationBar/NavigationBar";
import styles from './PeopleAndProjects.module.css';
import {Helmet} from "react-helmet";

function PeopleAndProjects() {
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

export default PeopleAndProjects;