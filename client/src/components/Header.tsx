import React, { useState } from "react";
import { Link } from "wouter";
import yobotLogo from "../assets/yobot-logo.png";
import yobotTransparentLogo from "../assets/yobot-transparent-logo.png";

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-[#0D82DA] to-blue-700 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-row justify-between items-center">
          {/* Logo & Tagline */}
          <div className="flex items-center">
            <img
              src={yobotTransparentLogo}
              alt="YoBot Logo"
              className="h-12 mr-3"
            />
            <div>
              <p className="text-sm text-blue-100">Engage smarter. Not harder.</p>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              {!mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-6 justify-center items-center">
              <li>
                <a
                  href="#features"
                  className="text-white hover:text-blue-200 transition py-2 inline-block"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#tiers"
                  className="text-white hover:text-blue-200 transition py-2 inline-block"
                >
                  Plans
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-white hover:text-blue-200 transition py-2 inline-block"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-white hover:text-blue-200 transition py-2 inline-block"
                >
                  Admin
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-caller"
                  className="text-white hover:text-blue-200 transition py-2 inline-block"
                >
                  Make a Call
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="bg-white text-[#0D82DA] px-4 py-2 rounded-md font-medium hover:bg-blue-100 transition"
                >
                  Chat with Ella
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} pt-4`}>
          <nav className="border-t border-blue-400 pt-4">
            <ul className="flex flex-col space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-white hover:text-blue-200 transition block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#tiers"
                  className="text-white hover:text-blue-200 transition block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Plans
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-white hover:text-blue-200 transition block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-white hover:text-blue-200 transition block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-caller"
                  className="text-white hover:text-blue-200 transition block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Make a Call
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/chat"
                  className="bg-white text-[#0D82DA] px-4 py-2 rounded-md font-medium hover:bg-blue-100 transition inline-block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Chat with Ella
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
