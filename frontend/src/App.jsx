import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// Import all pages
import Home from './pages/Home';
import Login from './pages/login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NewCampaign from './pages/NewCampaign';
import EditCampaign from './pages/EditCampaign';
import CampaignDetail from './pages/CampaignDetail';
import Features from './pages/Features';
import Pricing from './pages/Pricing';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar appears on ALL pages */}
        <Navbar />
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-campaign" element={<NewCampaign />} />
          <Route path="/edit-campaign/:id" element={<EditCampaign />} />
          
          {/* Multiple possible routes for campaign details */}
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/campaign-detail/:id" element={<CampaignDetail />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;