import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

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
    <div className="App min-h-screen flex flex-col">
      {/* Global Navbar appears on ALL pages */}
      <Navbar />
      
      {/* Main content area */}
      <main className="flex-1">
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
          
          {/* Campaign detail routes - multiple patterns to catch all possibilities */}
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/campaign-detail/:id" element={<CampaignDetail />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      
      {/* Global Footer appears on ALL pages */}
      <Footer />
    </div>
  );
}

export default App;