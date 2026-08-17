import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store } from './store/store';
import AuthInitializer from './store/AuthInitializer';

// 1. MUST IMPORT BrowserRouter
import { BrowserRouter } from 'react-router-dom'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      {/* 2. MUST WRAP EVERYTHING ELSE */}
      <BrowserRouter>  
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)