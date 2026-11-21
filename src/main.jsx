import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Import All Stylesheets
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/navbar.css';
import './styles/footer.css';
import './styles/landing.css';
import './styles/auth.css';
import './styles/feed.css';
import './styles/donor.css';
import './styles/ngo.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
