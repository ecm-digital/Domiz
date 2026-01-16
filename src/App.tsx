import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Calculators } from './pages/Calculators';
import { Blog } from './pages/Blog';
import { Services } from './pages/Services';
import { AboutTL } from './pages/AboutTL';
import { SmartHome } from './pages/SmartHome';
import { AddProperty } from './pages/AddProperty';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kalkulatory" element={<Calculators />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/uslugi" element={<Services />} />
            <Route path="/o-tluszczu" element={<AboutTL />} />
            <Route path="/smart-home" element={<SmartHome />} />
            <Route path="/dodaj-nieruchomosc" element={<AddProperty />} />

          </Routes>
        </main>
        <Footer />
      </div>
    </Router >
  );
}

export default App;
