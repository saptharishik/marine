import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// Components
import Login from './components/Auth/Login';

// Private route wrapper
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/signup" element={<SignUp />} /> */}
          
            {/* <Route path="/chair-activity/:chairId" element={<ChairActivityLog />} />     */}
          <Route path="/chair-selection" element={
            <PrivateRoute>
              {/* <ChairSelection /> */}
            </PrivateRoute>
          } />
          
          <Route path="/chair/:chairId" element={
            <PrivateRoute>
              {/* <ChairMonitor /> */}
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      
    </Router>
  );
}

export default App;
