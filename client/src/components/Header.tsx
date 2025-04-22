import React from "react";
import { Link } from "wouter";
import yobotLogo from "../assets/yobot-logo.png";
import yobotTransparentLogo from "../assets/yobot-transparent-logo.png";

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-[#0D82DA] to-blue-700 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <img
            src={yobotTransparentLogo}
            alt="YoBot Logo"
            className="h-12 mr-3"
          />
          <div>
            <p className="text-sm text-blue-100">Engage smarter. Not harder.</p>
          </div>
        </div>
        <nav>
          <ul className="flex flex-wrap space-x-4 md:space-x-6 justify-center">
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
                href="/chat"
                className="bg-white text-[#0D82DA] px-4 py-2 rounded-md font-medium hover:bg-blue-100 transition"
              >
                Chat with Ella
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
