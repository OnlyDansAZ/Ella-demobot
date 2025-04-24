import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function BookDemo() {
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    phoneNumber: '',
    position: '',
    employeeCount: '',
    useCase: '',
    preferredDate: '',
    preferredTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formState.name || !formState.email || !formState.company) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      toast({
        title: "Demo request submitted",
        description: "We'll be in touch shortly to confirm your live tour with Ella.",
        variant: "default"
      });
    }, 1500);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" className="p-0 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Book a Live Tour with Ella</h1>
      </div>
      
      <Separator className="my-6" />
      
      {isSuccess ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <CardTitle className="text-green-800">Request Received!</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Thank you for your interest in booking a live tour with Ella.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-green-700">
            <p className="mb-4">
              We've received your request and our team will reach out to you within 1 business day to confirm your appointment and provide you with a personalized demo link.
            </p>
            <p className="mb-4">
              During your scheduled tour, you'll get to interact directly with Ella and see how she can be customized to meet your specific business needs.
            </p>
            <p>
              If you have any questions in the meantime, please contact us at <span className="font-medium">support@yobot.ai</span>
            </p>
          </CardContent>
          <CardFooter>
            <Button className="mr-4" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
            <Button variant="outline">
              <Link href="/ella-chat">Try Ella Demo</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Schedule Your Personalized Demo</CardTitle>
              <CardDescription>
                Complete the form below to book a live tour with Ella tailored to your business needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    placeholder="John Smith"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="company"
                    name="company"
                    value={formState.company}
                    onChange={handleInputChange}
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formState.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Your Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={formState.position}
                    onChange={handleInputChange}
                    placeholder="CEO, Director of Marketing, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Company Size</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('employeeCount', value)}
                    value={formState.employeeCount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="useCase">What are you hoping to achieve with Ella?</Label>
                <Textarea
                  id="useCase"
                  name="useCase"
                  value={formState.useCase}
                  onChange={handleInputChange}
                  placeholder="Tell us about your specific use case and requirements..."
                  rows={4}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                  Preferred Demo Time
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      value={formState.preferredDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('preferredTime', value)}
                      value={formState.preferredTime}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                        <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                        <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                        <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                        <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  All times are in Eastern Time (ET). We'll do our best to accommodate your preference.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="flex items-center">
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Processing...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>Book My Live Demo</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}