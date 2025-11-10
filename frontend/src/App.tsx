// frontend/src/App.tsx

import React from "react";
// 1. Import routing components
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 2. Import your new component
import CarDetails from "./component/CarDetails";

// Import other pages/components you might have
// import HomePage from './components/HomePage';
// import LoginPage from './components/LoginPage';
// import SignupPage from './components/SignupPage';

import "./App.css"; // Or './index.css'

function App() {
  return (
    // 3. Set up the Router
    <BrowserRouter>
      <div className="App">
        {/* You can have a header/navbar here */}

        {/* 4. Define your application's routes */}
        <Routes>
          {/* <Route path="/" element={<HomePage />} /> */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/signup" element={<SignupPage />} /> */}

          {/* This is your new route for Phase 3! */}
          <Route path="/cars/:id" element={<CarDetails />} />

          {/* Add other routes here */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
