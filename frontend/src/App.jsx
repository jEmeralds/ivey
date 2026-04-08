import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider } from './context/authContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SharedContent from './pages/SharedContent';
import Home from './pages/Home';
import Login from './pages/login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NewCampaign from './pages/NewCampaign';
import EditCampaign from './pages/EditCampaign';
import CampaignDetail from './pages/CampaignDetail';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import ChatWidget from './components/ChatWidget';
import Support from './pages/Support';
import SocialAdminDashboard from './pages/SocialAdminDashboard';
import BrandPage from './pages/BrandPage';
import GallerySection from './components/GallerySection';
import ProductsPage from './pages/ProductsPage';


function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="App min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300">
          <Navbar />
          <main className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route path="/support" element={<Support />} />
              <Route path="/admin/social" element={<SocialAdminDashboard />} />
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new-campaign" element={<NewCampaign />} />
              <Route path="/edit-campaign/:id" element={<EditCampaign />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/campaign-detail/:id" element={<CampaignDetail />} />
              <Route path="/campaign/:id" element={<CampaignDetail />} />
              <Route path="/shared/:token" element={<SharedContent />} />
              <Route path="*" element={<Home />} />
              <Route path="/brand" element={<BrandPage />} />
              <Route path="/gallery" element={<GallerySection />} />
              <Route path="/brands/:brandId/products" element={<ProductsPage />} />
            </Routes>
          </main>
          <ChatWidget />
          <Footer />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;