import React from "react";
import { Facebook, Twitter, Github } from "lucide-react";
import yobotLogo from "../assets/yobot-logo.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <img
                src="https://www.yobot.store/images/yobot-logo-blue.png"
                alt="YoBot Logo"
                className="h-8 mr-3 bg-white rounded-full p-1"
              />
              <h3 className="text-white text-xl font-bold">YoBot</h3>
            </div>
            <p>
              Engage smarter. Not harder. AI-powered assistants designed for
              your needs.
            </p>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              <li>
                <a href="#tiers" className="hover:text-white transition-colors">
                  YoBot Starter
                </a>
              </li>
              <li>
                <a href="#tiers" className="hover:text-white transition-colors">
                  YoBot Pro
                </a>
              </li>
              <li>
                <a href="#tiers" className="hover:text-white transition-colors">
                  YoBot Enterprise
                </a>
              </li>
              <li>
                <a href="#tiers" className="hover:text-white transition-colors">
                  Ella
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; 2025 YoBot. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-6 w-6" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
