import './App.css';
import { useState, FormEvent } from 'react';

function App() {
    const [greeting, setGreeting] = useState<string>('');
    const [customGreeting, setCustomGreeting] = useState<string>('');

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCustomGreeting(greeting);
    };

    return (
        <div className="App">
            <div className="container">
                <h1>Hello World! 🌍</h1>
                <p className="subtitle">Test deployment with new CID</p>

                <form onSubmit={handleSubmit} className="greeting-form">
                    <input
                        type="text"
                        value={greeting}
                        onChange={(e) => setGreeting(e.target.value)}
                        placeholder="Enter your greeting"
                        className="greeting-input"
                    />
                    <button type="submit" className="submit-button">
                        Show Greeting
                    </button>
                </form>

                {customGreeting && (
                    <div className="custom-greeting">
                        <h2>{customGreeting}</h2>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

