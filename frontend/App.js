import { useEffect, useState } from "react";
import axios from "axios";

function App() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        axios.get("https://wert-effh.onrender.com")
            .then(response => setMessage(response.data.message))
            .catch(error => console.log(error));
    }, []);

    return (
        <div>
            <h1>MERN App</h1>
            <p>{message}</p>
        </div>
    );
}

export default App;
