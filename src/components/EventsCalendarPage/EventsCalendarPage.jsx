import React, { useState } from 'react';
import NavigationBar from "../NavigationBar/NavigationBar";
import { Helmet } from "react-helmet";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from "../EventsCalendarPage/EventsCalendarPage.module.css";

function EventsCalendarPage() {
    const [date, setDate] = useState(new Date());

    return (
        <>
            <Helmet>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.eventsCalendarPage}>
                <h2 className={styles.title}>Календарь событий</h2>
                <Calendar
                    className={styles.calendar}
                    onChange={setDate}
                    value={date}
                    tileClassName={({ date }) => {
                        return date.toDateString() === new Date().toDateString()
                            ? styles.today
                            : '';
                    }}
                />
            </div>
        </>
    );
}

export default EventsCalendarPage;
