import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home, ErrorPage } from "./Pages";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
