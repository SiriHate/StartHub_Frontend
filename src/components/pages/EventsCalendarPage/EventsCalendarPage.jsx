import React, { useState } from 'react';
import NavigationBar from "../../navigation_bar/NavigationBar";
import { Helmet } from "react-helmet";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from "../EventsCalendarPage/EventsCalendarPage.module.css";

function EventsCalendarPage() {
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([
        { id: 1, date: '2023-05-01', title: "Майский праздник" },
        { id: 2, date: '2023-05-09', title: "День Победы" },
        // Добавьте здесь другие события
    ]);

    // Фильтрация событий по выбранной дате
    const eventsForDay = events.filter(event =>
        new Date(event.date).toDateString() === date.toDateString()
    );

    return (
        <>
            <Helmet>
                <title>Календарь событий</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
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
                <div className={styles.eventList}>
                    {eventsForDay.length > 0 ? (
                        <ul>
                            {eventsForDay.map(event => (
                                <li key={event.id}>{event.title}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>На эту дату событий нет.</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default EventsCalendarPage;
