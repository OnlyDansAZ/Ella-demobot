import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'wouter';
import { 
  Calendar, 
  Clock, 
  Users, 
  Image, 
  MessageSquare, 
  Activity, 
  ArrowLeft,
  Download
} from 'lucide-react';

// Demo data
const PERSONA_DATA = [
  { name: 'Executive', count: 12, color: '#8884d8' },
  { name: 'Casual', count: 24, color: '#82ca9d' },
  { name: 'Sales', count: 18, color: '#ffc658' },
  { name: 'Technical', count: 8, color: '#ff8042' }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const APPOINTMENT_DATA = [
  { date: '2025-04-15', count: 3, type: 'Demo Meeting' },
  { date: '2025-04-16', count: 2, type: 'Product Demo' },
  { date: '2025-04-17', count: 4, type: 'Consultation' },
  { date: '2025-04-18', count: 1, type: 'Follow-up' },
  { date: '2025-04-19', count: 5, type: 'Demo Meeting' },
  { date: '2025-04-20', count: 2, type: 'Product Demo' },
  { date: '2025-04-21', count: 3, type: 'Consultation' }
];

const IMAGE_DATA = [
  { name: 'Logo Designs', count: 15, color: '#0088FE' },
  { name: 'Product Visuals', count: 8, color: '#00C49F' },
  { name: 'Marketing Images', count: 12, color: '#FFBB28' },
  { name: 'Other', count: 7, color: '#FF8042' }
];

const CONVERSATION_DATA = [
  { date: '2025-04-15', count: 28 },
  { date: '2025-04-16', count: 35 },
  { date: '2025-04-17', count: 42 },
  { date: '2025-04-18', count: 30 },
  { date: '2025-04-19', count: 25 },
  { date: '2025-04-20', count: 38 },
  { date: '2025-04-21', count: 45 }
];

// Sample interaction data for demo purposes
const RECENT_INTERACTIONS = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john@example.com',
    type: 'Appointment',
    details: 'Demo Meeting on April 24, 2025, 2:00 PM',
    timestamp: '2025-04-22T14:35:00'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    type: 'Image',
    details: 'Generated logo concept for "TechAdvance"',
    timestamp: '2025-04-22T13:22:00'
  },
  {
    id: 3,
    name: 'Michael Wong',
    email: 'michael@example.com',
    type: 'Conversation',
    details: 'Discussed Enterprise tier features and pricing',
    timestamp: '2025-04-22T11:15:00'
  },
  {
    id: 4,
    name: 'Emma Garcia',
    email: 'emma@example.com',
    type: 'Appointment',
    details: 'Product Demo on April 25, 2025, 11:00 AM',
    timestamp: '2025-04-22T10:08:00'
  },
  {
    id: 5,
    name: 'David Kim',
    email: 'david@example.com',
    type: 'Image',
    details: 'Generated marketing visual for summer campaign',
    timestamp: '2025-04-21T16:42:00'
  }
];

// Define types for the StatCard component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  color?: string;
}

// Card component for stats
const StatCard = ({ title, value, icon, description, color = "blue" }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className={`text-${color}-500`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

export default function DemoDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  return (
    <div className="container py-4 sm:py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">YoBot Demo Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Interactive analytics for demonstrations and presentations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center mb-6">
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 flex items-center gap-2 px-4 py-2">
          <span className="font-semibold">Demo Mode</span>
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
          <span className="text-xs">Data shown is for demonstration purposes only</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="personas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Personas</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>Images</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Appointments" 
              value="42" 
              icon={<Calendar className="h-4 w-4" />}
              description="Last 7 days" 
              color="blue"
            />
            <StatCard 
              title="Personas Used" 
              value="4" 
              icon={<Users className="h-4 w-4" />}
              description="Across all sessions" 
              color="green"
            />
            <StatCard 
              title="Images Generated" 
              value="42" 
              icon={<Image className="h-4 w-4" />}
              description="Last 30 days" 
              color="purple"
            />
            <StatCard 
              title="Conversations" 
              value="243" 
              icon={<MessageSquare className="h-4 w-4" />}
              description="Last 7 days" 
              color="orange"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversations Over Time</CardTitle>
                <CardDescription>Daily conversation volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={CONVERSATION_DATA}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name, props) => [value, 'Conversations']}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Bar dataKey="count" fill="#8884d8" name="Conversations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Persona Distribution</CardTitle>
                <CardDescription>Usage by persona type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PERSONA_DATA}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {PERSONA_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [value, 'Sessions']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>Latest user activities across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-2">User</th>
                      <th className="text-left font-medium p-2">Type</th>
                      <th className="text-left font-medium p-2">Details</th>
                      <th className="text-left font-medium p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_INTERACTIONS.map(interaction => (
                      <tr key={interaction.id} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <div className="bg-primary text-[10px] text-primary-foreground flex items-center justify-center h-full rounded-full">
                                {interaction.name.charAt(0)}
                              </div>
                            </Avatar>
                            <div>
                              <div className="font-medium">{interaction.name}</div>
                              <div className="text-xs text-muted-foreground">{interaction.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className={
                            interaction.type === 'Appointment' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            interaction.type === 'Image' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            'bg-green-50 text-green-800 border-green-200'
                          }>
                            {interaction.type}
                          </Badge>
                        </td>
                        <td className="p-2">{interaction.details}</td>
                        <td className="p-2">
                          <div className="flex flex-col">
                            <span className="text-xs">{formatDate(interaction.timestamp)}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(interaction.timestamp)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments by Day</CardTitle>
              <CardDescription>Distribution of scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={APPOINTMENT_DATA}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [value, 'Bookings']}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Appointments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard 
              title="Total Appointments" 
              value="42" 
              icon={<Calendar className="h-4 w-4" />}
              description="Last 30 days" 
              color="blue"
            />
            <StatCard 
              title="Average Per Day" 
              value="2.8" 
              icon={<Clock className="h-4 w-4" />}
              description="Based on last 30 days" 
              color="green"
            />
            <StatCard 
              title="Most Popular Type" 
              value="Demo Meeting" 
              icon={<Users className="h-4 w-4" />}
              description="43% of all bookings" 
              color="purple"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Types</CardTitle>
              <CardDescription>Distribution by meeting type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Demo Meeting', value: 18, color: '#8884d8' },
                        { name: 'Product Demo', value: 12, color: '#82ca9d' },
                        { name: 'Consultation', value: 8, color: '#ffc658' },
                        { name: 'Follow-up', value: 4, color: '#ff8042' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {PERSONA_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, 'Bookings']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personas Tab */}
        <TabsContent value="personas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard 
              title="Executive Persona" 
              value="12" 
              icon={<Users className="h-4 w-4" />}
              description="Used in conversations" 
              color="blue"
            />
            <StatCard 
              title="Casual Persona" 
              value="24" 
              icon={<Users className="h-4 w-4" />}
              description="Used in conversations" 
              color="green"
            />
            <StatCard 
              title="Sales Persona" 
              value="18" 
              icon={<Users className="h-4 w-4" />}
              description="Used in conversations" 
              color="yellow"
            />
            <StatCard 
              title="Technical Persona" 
              value="8" 
              icon={<Users className="h-4 w-4" />}
              description="Used in conversations" 
              color="purple"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Persona Usage Distribution</CardTitle>
              <CardDescription>Usage by persona type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PERSONA_DATA}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {PERSONA_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, 'Sessions']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Persona Performance</CardTitle>
              <CardDescription>Engagement metrics by persona</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Executive', avgConversationLength: 8.2, conversationCompletionRate: 92, color: '#8884d8' },
                      { name: 'Casual', avgConversationLength: 12.5, conversationCompletionRate: 85, color: '#82ca9d' },
                      { name: 'Sales', avgConversationLength: 15.8, conversationCompletionRate: 78, color: '#ffc658' },
                      { name: 'Technical', avgConversationLength: 10.4, conversationCompletionRate: 94, color: '#ff8042' }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="avgConversationLength" name="Avg. Messages" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="conversationCompletionRate" name="Completion Rate %" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Images" 
              value="42" 
              icon={<Image className="h-4 w-4" />}
              description="Generated in last 30 days" 
              color="purple"
            />
            <StatCard 
              title="Logo Designs" 
              value="15" 
              icon={<Image className="h-4 w-4" />}
              description="Most popular category" 
              color="blue"
            />
            <StatCard 
              title="Average Per Day" 
              value="1.4" 
              icon={<Activity className="h-4 w-4" />}
              description="Based on last 30 days" 
              color="green"
            />
            <StatCard 
              title="Unique Users" 
              value="28" 
              icon={<Users className="h-4 w-4" />}
              description="Who generated images" 
              color="orange"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Image Types Generated</CardTitle>
              <CardDescription>Distribution by image category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={IMAGE_DATA}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {IMAGE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, 'Images']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Generated Images</CardTitle>
              <CardDescription>Recent AI-generated visuals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* These would be real images in production */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="rounded-md overflow-hidden border bg-muted/20 aspect-square flex items-center justify-center relative group">
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="ghost" size="sm" className="text-white">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}