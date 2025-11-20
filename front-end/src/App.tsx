import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { UserType } from './types/user';
import DynamicMeta from './components/DynamicMeta';
// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Account from './pages/auth/Account';
import Reports from './pages/Reports';
import Statistics from './pages/Statistics';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import Profile from './pages/citizen/Profile';
import MapPage from './pages/MapPage.tsx';
import AdminDashboard from './pages/admin/AdminDashboard';
import MunicipalityDashboard from './pages/municipality/MunicipalityDashboard';
import AdminCreateMunicipalityUser from "./pages/admin/AdminCreateMunicipalityUser.tsx";
import AdminAssignRoles from "./pages/admin/AdminAssignRoles.tsx";

console.log('App.tsx loaded');

function App() {
  console.log('App component rendering...');
  
  return (
    <Router>
      <AuthProvider>
        <DynamicMeta />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/auth/account" element={<Account />} />
              <Route path="/auth/login/:userType" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />

              {/* Protected Routes - Citizen */}
              <Route
                path="/citizen/*"
                element={
                  <ProtectedRoute allowedRoles={[UserType.CITIZEN]}>
                    <Routes>
                      <Route path="/" element={<CitizenDashboard />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="report/new" element={<MapPage />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Municipality */}
              <Route
                path="/municipality/*"
                element={
                  <ProtectedRoute allowedRoles={[UserType.MUNICIPALITY]}>
                    <Routes>
                      <Route path="/" element={<MunicipalityDashboard />} />
                      {/* Add more municipality routes here */}
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Admin */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={[UserType.ADMIN]}>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="create-municipality-user" element={<AdminCreateMunicipalityUser />} />
                      <Route path="assign-roles" element={<AdminAssignRoles />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Fallback Route */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
