import React, { useState, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  ChevronRight,
  CheckCircle2,
  Play,
  Mic,
  MessageSquare,
  Monitor,
  BarChart3,
  Landmark,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Import YoBot logo
import yobotLogo from '@assets/New Upscaled Head Only Logo.png';

export default function LaunchPage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const pricingTiers = [
    {
      name: 'Starter',
      badge: 'Most Popular',
      price: '$5,000 + $499/mo',
      description: 'Perfect for small to medium businesses',
      features: [
        'Custom AI assistant with your branding',
        'Voice interaction capabilities',
        'Basic scheduling & calendar integration',
        'Up to 3 custom personas',
        'Email and chat support',
      ],
      highlighted: true,
      cta: 'Get Started'
    },
    {
      name: 'Pro',
      badge: '',
      price: 'Contact for Pricing',
      description: 'Advanced features for growing businesses',
      features: [
        'Everything in Starter',
        'Advanced integrations (CRM, ERP)',
        'Custom knowledge base training',
        'Up to 7 custom personas',
        'Priority support',
      ],
      highlighted: false,
      cta: 'Contact Sales'
    },
    {
      name: 'Enterprise',
      badge: '',
      price: 'Contact for Pricing',
      description: 'Enterprise-grade solution with maximum customization',
      features: [
        'Everything in Pro',
        'Dedicated server deployment',
        'Enterprise SSO & security',
        'Unlimited custom personas',
        'Dedicated account manager',
      ],
      highlighted: false,
      cta: 'Contact Sales'
    },
    {
      name: 'Platinum',
      badge: 'Limited',
      price: 'Contact for Pricing',
      description: 'White-glove implementation with complete customization',
      features: [
        'Everything in Enterprise',
        'Custom AI model fine-tuning',
        'Advanced analytics dashboard',
        'Custom integration development',
        '24/7 dedicated support',
      ],
      highlighted: false,
      cta: 'Contact Sales'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-900 to-indigo-700 text-white">
        <div className="container mx-auto py-20 px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Meet <span className="text-amber-400">Ella</span>
              </h1>
              <h2 className="text-2xl md:text-3xl font-medium mb-6">
                Your AI-powered business companion
              </h2>
              <p className="text-lg mb-8 text-indigo-100">
                Intelligent voice interaction, seamless scheduling, and personalized assistance for your business needs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                      <Play className="mr-2 h-4 w-4" />
                      Watch Demo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] p-0 bg-black">
                    <div className="aspect-video relative bg-black">
                      {/* Replace with your actual demo video */}
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <p>Demo video would play here</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-800">
                  <Calendar className="mr-2 h-4 w-4" />
                  <Link href="/book-demo">Book a Live Tour</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative h-[400px] w-[320px] bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-indigo-800 p-4 text-white flex items-center">
                  <img src={yobotLogo} alt="YoBot Logo" className="h-8 w-8 mr-2" />
                  <div>
                    <p className="font-medium">Ella</p>
                    <p className="text-xs opacity-80">Online now</p>
                  </div>
                </div>
                <div className="h-[320px] p-4 bg-gray-50 flex flex-col">
                  <div className="flex flex-col space-y-3 flex-grow">
                    <div className="bg-indigo-100 text-indigo-900 rounded-lg p-3 max-w-[80%] ml-auto">
                      Hi there! How can I assist you today?
                    </div>
                    <div className="bg-indigo-100 text-indigo-900 rounded-lg p-3 max-w-[80%] ml-auto">
                      I can help schedule meetings, answer questions about your business, generate content, and more!
                    </div>
                    <div className="bg-indigo-600 text-white rounded-lg p-3 max-w-[80%]">
                      Can you tell me about the Enterprise plan?
                    </div>
                    <div className="bg-indigo-100 text-indigo-900 rounded-lg p-3 max-w-[80%] ml-auto">
                      Our Enterprise plan includes dedicated deployment, unlimited personas, SSO integration, and a dedicated account manager. Would you like me to schedule a demo with our team?
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-grow">
                      <Mic className="h-4 w-4 mr-2" />
                      Speak to Ella
                    </Button>
                    <Button size="sm" className="flex-grow">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Ella?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ella transforms how your business interacts with clients and manages tasks, delivering measurable ROI through enhanced efficiency and customer satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Mic className="h-6 w-6 text-indigo-700" />
                </div>
                <CardTitle>Natural Voice Interaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ella understands and responds naturally, creating a seamless conversation flow that mimics human interaction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-indigo-700" />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Effortlessly manage appointments, meetings, and follow-ups with persistent memory and intelligent follow-through.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Monitor className="h-6 w-6 text-indigo-700" />
                </div>
                <CardTitle>Cross-Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access Ella on any device with responsive design that adapts to desktop, tablet, and mobile interfaces.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-indigo-700" />
                </div>
                <CardTitle>Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gain insights into customer interactions, frequently asked questions, and efficiency metrics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Landmark className="h-6 w-6 text-indigo-700" />
                </div>
                <CardTitle>Enterprise Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seamlessly connect with your existing CRM, ERP, and other business systems for data-driven interactions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-700" />
                </div>
                <CardTitle>Security & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Enterprise-grade security with role-based access control and compliance with industry standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your business needs with our straightforward pricing structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`flex flex-col ${tier.highlighted ? 'border-indigo-500 shadow-lg' : ''}`}>
                <CardHeader className={`${tier.highlighted ? 'bg-indigo-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <CardTitle>{tier.name}</CardTitle>
                    {tier.badge && (
                      <Badge variant="secondary">{tier.badge}</Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{tier.price}</span>
                  </div>
                  <CardDescription className="mt-2">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-2 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full ${tier.highlighted ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}>
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your business with Ella?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Book a live tour with Ella and see how our AI assistant can revolutionize your customer interactions and business operations.
          </p>
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
            <Calendar className="mr-2 h-5 w-5" />
            Book a Live Tour with Ella
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-indigo-950 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img src={yobotLogo} alt="YoBot Logo" className="h-10 w-10 mr-3" />
              <div>
                <h3 className="text-xl font-bold">YoBot</h3>
                <p className="text-indigo-300 text-sm">Transforming business communication</p>
              </div>
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-indigo-300 hover:text-white">About</Link>
              <Link href="/privacy" className="text-indigo-300 hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-indigo-300 hover:text-white">Terms</Link>
              <Link href="/contact" className="text-indigo-300 hover:text-white">Contact</Link>
            </div>
          </div>
          <Separator className="my-6 bg-indigo-800" />
          <div className="text-center text-indigo-400 text-sm">
            &copy; {new Date().getFullYear()} YoBot AI, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}