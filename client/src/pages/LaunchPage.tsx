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
  Phone,
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

// Import YoBot logos
import yobotLogo from '@assets/YoBot® Logo Robot Head.png';
import yobotFullLogo from '@assets/YoBot Engange Smarter Logo w no background.png';

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
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img src={yobotLogo} alt="YoBot Logo" className="h-12 w-12" />
            <span className="ml-2 text-white font-bold text-xl">YoBot</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/chat" className="text-white hover:text-blue-200 transition-colors">
              Chat with Ella
            </Link>
            <Link href="/ai-caller" className="bg-white text-[#0D82DA] px-4 py-2 rounded-md font-medium hover:bg-blue-100 transition">
              Make a Call
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0956a3] via-[#0D82DA] to-[#134b73] text-white overflow-hidden">
        {/* Faint logo watermark in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <img src={yobotLogo} alt="YoBot Logo Watermark" className="w-[70%] max-w-[800px]" />
        </div>
        
        <div className="container mx-auto pt-32 pb-20 px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 group">
                Meet <span className="text-[#0D82DA] bg-white px-2 py-1 rounded transition-transform group-hover:scale-105">Ella</span>
              </h1>
              <h2 className="text-2xl md:text-3xl font-medium mb-6">
                Your AI-powered business companion
              </h2>
              <p className="text-lg mb-8 text-blue-100">
                Intelligent voice interaction, seamless scheduling, and personalized assistance for your business needs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#0D82DA] hover:bg-blue-600 text-white transition-all hover:scale-105">
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
                
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-[#0D82DA] transition-all hover:scale-105">
                  <Calendar className="mr-2 h-4 w-4" />
                  <Link href="/book-demo">Book a Live Tour</Link>
                </Button>
                
                <div className="flex gap-4 w-full mt-4">
                  <Link href="/ai-caller" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent border-white text-white hover:bg-white hover:text-[#0D82DA] transition-all hover:scale-105">
                      <Phone className="mr-2 h-4 w-4" />
                      Make a Call
                    </Button>
                  </Link>
                  <Link href="/chat" className="flex-1">
                    <Button className="w-full bg-white text-[#0D82DA] hover:bg-gray-100 transition-all hover:scale-105">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat with Ella
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative h-[400px] w-[320px] bg-white rounded-lg shadow-xl overflow-hidden transform transition-transform hover:scale-[1.02]">
                <div className="bg-[#0D82DA] p-4 text-white flex items-center">
                  <img src={yobotLogo} alt="YoBot Logo" className="h-8 w-8 mr-2 animate-pulse" />
                  <div>
                    <p className="font-medium">Ella</p>
                    <p className="text-xs opacity-80">Online now</p>
                  </div>
                </div>
                <div className="h-[320px] p-4 bg-gray-50 flex flex-col relative">
                  {/* Subtle YoBot face in the background */}
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                    <img src={yobotLogo} alt="" className="w-32 h-32" />
                  </div>
                  <div className="flex flex-col space-y-3 flex-grow">
                    <div className="bg-blue-100 text-blue-900 rounded-lg p-3 max-w-[80%] ml-auto transform transition-all hover:scale-[1.03]">
                      Hi there! How can I assist you today?
                    </div>
                    <div className="bg-blue-100 text-blue-900 rounded-lg p-3 max-w-[80%] ml-auto transform transition-all hover:scale-[1.03]">
                      I can help schedule meetings, answer questions about your business, generate content, and more!
                    </div>
                    <div className="bg-[#0D82DA] text-white rounded-lg p-3 max-w-[80%] transform transition-all hover:scale-[1.03]">
                      Can you tell me about the Enterprise plan?
                    </div>
                    <div className="bg-blue-100 text-blue-900 rounded-lg p-3 max-w-[80%] ml-auto transform transition-all hover:scale-[1.03]">
                      Our Enterprise plan includes dedicated deployment, unlimited personas, SSO integration, and a dedicated account manager. Would you like me to schedule a demo with our team?
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Link href="/ai-caller">
                      <Button variant="outline" size="sm" className="flex-grow border-[#0D82DA] hover:bg-[#0D82DA] hover:text-white transition-all">
                        <Phone className="h-4 w-4 mr-2 text-[#0D82DA] group-hover:text-white" />
                        Make a Call
                      </Button>
                    </Link>
                    <Link href="/chat">
                      <Button size="sm" className="flex-grow bg-[#0D82DA] hover:bg-blue-700 transition-all">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat with Ella
                      </Button>
                    </Link>
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
            <h2 className="text-3xl font-bold mb-4">Why Choose <span className="text-[#0D82DA]">Ella</span>?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ella transforms how your business interacts with clients and manages tasks, delivering measurable ROI through enhanced efficiency and customer satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-[#0D82DA]">
              <CardHeader>
                <div className="h-14 w-14 rounded-full bg-[#0D82DA]/10 flex items-center justify-center mb-4 transform transition-transform hover:rotate-12">
                  <div className="h-10 w-10 rounded-full bg-[#0D82DA]/20 flex items-center justify-center">
                    <Mic className="h-6 w-6 text-[#0D82DA]" />
                  </div>
                </div>
                <CardTitle>Natural Voice Interaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ella understands and responds naturally, creating a seamless conversation flow that mimics human interaction.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-[#0D82DA]">
              <CardHeader>
                <div className="h-14 w-14 rounded-full bg-[#0D82DA]/10 flex items-center justify-center mb-4 transform transition-transform hover:rotate-12">
                  <div className="h-10 w-10 rounded-full bg-[#0D82DA]/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-[#0D82DA]" />
                  </div>
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Effortlessly manage appointments, meetings, and follow-ups with persistent memory and intelligent follow-through.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-[#0D82DA]">
              <CardHeader>
                <div className="h-14 w-14 rounded-full bg-[#0D82DA]/10 flex items-center justify-center mb-4 transform transition-transform hover:rotate-12">
                  <div className="h-10 w-10 rounded-full bg-[#0D82DA]/20 flex items-center justify-center">
                    <Monitor className="h-6 w-6 text-[#0D82DA]" />
                  </div>
                </div>
                <CardTitle>Cross-Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access Ella on any device with responsive design that adapts to desktop, tablet, and mobile interfaces.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-[#0D82DA]">
              <CardHeader>
                <div className="h-14 w-14 rounded-full bg-[#0D82DA]/10 flex items-center justify-center mb-4 transform transition-transform hover:rotate-12">
                  <div className="h-10 w-10 rounded-full bg-[#0D82DA]/20 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-[#0D82DA]" />
                  </div>
                </div>
                <CardTitle>Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gain insights into customer interactions, frequently asked questions, and efficiency metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-[#0D82DA]">
              <CardHeader>
                <div className="h-14 w-14 rounded-full bg-[#0D82DA]/10 flex items-center justify-center mb-4 transform transition-transform hover:rotate-12">
                  <div className="h-10 w-10 rounded-full bg-[#0D82DA]/20 flex items-center justify-center">
                    <Landmark className="h-6 w-6 text-[#0D82DA]" />
                  </div>
                </div>
                <CardTitle>Enterprise Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seamlessly connect with your existing CRM, ERP, and other business systems for data-driven interactions.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-[#0D82DA]">
              <CardHeader>
                <div className="h-14 w-14 rounded-full bg-[#0D82DA]/10 flex items-center justify-center mb-4 transform transition-transform hover:rotate-12">
                  <div className="h-10 w-10 rounded-full bg-[#0D82DA]/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-[#0D82DA]" />
                  </div>
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
      
      {/* Testimonial Section */}
      <section className="py-16 bg-[#0D82DA]/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-gray-200 mr-4"></div>
                <div>
                  <h3 className="text-xl font-bold">Amanda Reynolds</h3>
                  <p className="text-gray-600">CEO, TechInnovate Solutions</p>
                </div>
              </div>
              <blockquote className="text-xl italic text-gray-800 mb-4">
                "Ella booked my last 9 meetings and never sleeps. Our team's productivity has increased by 30% since we started using her for scheduling and client communications."
              </blockquote>
              <div className="flex mt-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent <span className="text-[#0D82DA]">Pricing</span></h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your business needs with our straightforward pricing structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`flex flex-col transform transition-all hover:scale-[1.02] ${tier.highlighted ? 'border-[#0D82DA] shadow-lg' : ''}`}>
                <CardHeader className={`${tier.highlighted ? 'bg-[#0D82DA]/5' : ''} relative`}>
                  {tier.highlighted && (
                    <div className="absolute top-0 right-0 left-0 h-2 bg-[#0D82DA]" />
                  )}
                  <div className="flex justify-between items-center">
                    <CardTitle>{tier.name}</CardTitle>
                    {tier.badge && (
                      <Badge variant="secondary" className="bg-[#0D82DA] text-white hover:bg-[#0D82DA]/90">{tier.badge}</Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-[#0D82DA]">{tier.price}</span>
                  </div>
                  <CardDescription className="mt-2">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start group">
                        <CheckCircle2 className="h-5 w-5 text-[#0D82DA] mr-2 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full transition-all hover:scale-[1.03] ${tier.highlighted ? 'bg-[#0D82DA] hover:bg-[#0D82DA]/90' : ''}`}>
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-[#0D82DA] to-indigo-800 text-white overflow-hidden">
        {/* Background subtle pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px' 
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 drop-shadow-sm">Ready to transform your business with <span className="bg-white text-[#0D82DA] px-2 py-1 rounded">Ella</span>?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-blue-100">
            Book a live tour with Ella and see how our AI assistant can revolutionize your customer interactions and business operations.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-[#0D82DA] hover:bg-blue-50 transition-transform hover:scale-105 shadow-lg"
            asChild
          >
            <Link href="/book-demo" className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Book a Live Tour with Ella
            </Link>
          </Button>
          <div className="mt-10 text-sm text-blue-200 max-w-lg mx-auto">
            <p>Your live tour includes a personalized demonstration focused on your specific business needs and a Q&A session with our team.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-indigo-950 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="mb-6 md:mb-0">
              <img src={yobotFullLogo} alt="YoBot Logo" className="h-32 md:h-24 drop-shadow-md" />
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-indigo-300 hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="text-indigo-300 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-indigo-300 hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="text-indigo-300 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <Separator className="my-6 bg-indigo-800" />
          <div className="text-center">
            <div className="mb-3 font-medium text-blue-400">
              Powered by YoBot® | <span className="italic">Engage Smarter, Not Harder™</span>
            </div>
            <div className="text-indigo-400 text-sm">
              &copy; {new Date().getFullYear()} YoBot AI, Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}