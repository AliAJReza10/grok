import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Barber Shop</Link>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/" className="hover:text-accent transition duration-200">Home</Link>
            <Link to="/services" className="hover:text-accent transition duration-200">Services</Link>
            
            {currentUser ? (
              <>
                <Link to="/appointments" className="hover:text-accent transition duration-200">Appointments</Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-accent transition duration-200">
                    <span>{currentUser.name || 'Profile'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 invisible group-hover:visible z-10">
                    <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">My Profile</Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-accent transition duration-200">Login</Link>
                <Link to="/register" className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-dark transition duration-200">Register</Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pb-3 space-y-2">
            <Link to="/" className="block hover:bg-primary-dark py-2 px-4 rounded" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/services" className="block hover:bg-primary-dark py-2 px-4 rounded" onClick={() => setIsMenuOpen(false)}>Services</Link>
            
            {currentUser ? (
              <>
                <Link to="/appointments" className="block hover:bg-primary-dark py-2 px-4 rounded" onClick={() => setIsMenuOpen(false)}>Appointments</Link>
                <Link to="/profile" className="block hover:bg-primary-dark py-2 px-4 rounded" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left hover:bg-primary-dark py-2 px-4 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block hover:bg-primary-dark py-2 px-4 rounded" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block bg-accent text-white py-2 px-4 rounded" onClick={() => setIsMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 