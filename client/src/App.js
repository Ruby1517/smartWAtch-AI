import './App.css';
import React, {useState} from 'react';
import VideoFeed from './components/VideoFeed';
import Dashboard from './components/Dashboard';
import AlertsLog from './components/AlertsLog';



function App() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ totalAlerts: 0, people: 0, vehicles: 0});

  const handleAlert = (data) => {
    setAlerts(prev => [data, ...prev.slice(0, 9)]); //Keep last 10
    setStats(prev => ({
      totalAlerts: prev.totalAlerts + 1,
      people: prev.people + (data.type === 'person' ? 1 : 0),
      vehicles: prev.vehicles + (data.type === 'vehivle' ? 1 : 0)
    }))
  }
  return (
    <div className="App">
      <VideoFeed onAlert={handleAlert} />
      <Dashboard stats={stats} />
      <AlertsLog logs={alerts} />

    </div>
  );
}

export default App;
