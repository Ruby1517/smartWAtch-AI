import React from "react";

const Dashboard = ({ stats}) => {
    return (
        <div>
            <h2>Dashboard</h2>
            <ul>
                <li>Total Alerts: {stats.totalAlerts}</li>
                <li>People Detected: {stats.people}</li>
                <li>Vehicles Detected: {stats.vehicles}</li>
            </ul>
        </div>
    );
};

export default Dashboard;