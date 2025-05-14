import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE;

function App() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [appRef, setAppRef] = useState("");

  const sendSMS = async () => {
    await axios.post(`${API_BASE}/api/notify/sms`, { to, message });
    alert("SMS sent!");
  };

  const makeCall = async () => {
    await axios.post(`${API_BASE}/api/notify/call`, { to, app: appRef });
    alert("Call initiated!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Fonoster Test Panel</h2>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="Phone Number" /><br /><br />
      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="SMS Message" /><br /><br />
      <input value={appRef} onChange={e => setAppRef(e.target.value)} placeholder="Voice App Ref" /><br /><br />
      <button onClick={sendSMS}>Send SMS</button>
      <button onClick={makeCall} style={{ marginLeft: 10 }}>Make Call</button>
    </div>
  );
}

export default App;
