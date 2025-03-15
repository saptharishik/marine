import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// Components
import Login from './components/Auth/Login';

// Private route wrapper
const PrivateRoute = ({ children }) => {

  
  
  
  return children;
};

function App() {
  return (
    <Router>
      
        <Routes>
          <Route path="/" element={<Login />} />
          
          
          
          
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      
    </Router>
  );
}

export default App;
