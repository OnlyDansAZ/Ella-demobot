import React from "react";
import { 
  Phone, Calendar, FileText, CreditCard, 
  Mic, Clock, CheckCircle 
} from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
}

const Feature: React.FC<FeatureProps> = ({
  icon,
  title,
  description,
  iconBgColor,
  iconColor,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-[#0D82DA] transition-colors">
      <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center mb-4`}>
        <div className={`${iconColor}`}>{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Calls & Texting",
      description: "Handle incoming calls, make outbound calls, and manage text conversations with natural language processing.",
      iconBgColor: "bg-blue-500/20",
      iconColor: "text-[#0D82DA]",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Calendar Sync",
      description: "Seamlessly integrate with your calendar to schedule appointments, send invites, and manage your availability.",
      iconBgColor: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Record Keeping",
      description: "Automatically generate notes, transcribe calls, and maintain records of all your interactions.",
      iconBgColor: "bg-green-500/20",
      iconColor: "text-green-400",
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Bill Pay",
      description: "Handle recurring payments, track expenses, and manage financial tasks with security and ease.",
      iconBgColor: "bg-red-500/20",
      iconColor: "text-red-400",
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "Custom Voice & Personality",
      description: "Customize your bot's tone, voice, and personality to match your brand or personal preferences.",
      iconBgColor: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "24/7 Availability",
      description: "Your assistant is always on duty, handling tasks and responding to queries around the clock.",
      iconBgColor: "bg-pink-500/20",
      iconColor: "text-pink-400",
    },
  ];

  return (
    <section id="features" className="py-16 px-4 bg-[#1F2937]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What YoBot Can Do</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            From managing your schedule to handling calls, YoBot is designed to make
            your life easier with powerful AI capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Feature key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
