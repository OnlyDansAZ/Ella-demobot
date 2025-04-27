import React, { useState } from "react";
import { Mail, Phone, Info } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send the form data to a server
    console.log("Form submitted:", formData);
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      message: "",
    });
    
    // Show success message (in a real app, this would use a toast or other feedback)
    alert("Message sent! We'll get back to you soon.");
  };

  return (
    <section id="contact" className="py-16 px-4 bg-[#1F2937]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Let's Talk</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Ready to take your productivity to the next level? Get in touch with
            us to learn more or request a personalized demo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-6">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-[#0D82DA] mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <a
                    href="mailto:daniel@yobot.bot"
                    className="text-white hover:text-[#0D82DA] transition-colors"
                  >
                    daniel@yobot.bot
                  </a>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-6 w-6 text-[#0D82DA] mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <a
                    href="tel:+16027850165"
                    className="text-white hover:text-[#0D82DA] transition-colors"
                  >
                    602-785-0165
                  </a>
                </div>
              </div>
              <div className="flex items-start">
                <Info className="h-6 w-6 text-[#0D82DA] mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Support</p>
                  <a
                    href="#"
                    className="text-white hover:text-[#0D82DA] transition-colors"
                  >
                    Visit our support center
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-6">Send Us a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0D82DA]"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0D82DA]"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0D82DA]"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0D82DA] hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
