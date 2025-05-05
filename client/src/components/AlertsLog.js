import React from "react";

const AlertsLog = ({ logs }) => {
    return (
        <div>
            <h2>Alerts Log</h2>
            <ul>
                {logs.map((log, index) => (
                    <li key={index}>{
                        log.timestamp}: {log.type} detected at {log.location}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AlertsLog;