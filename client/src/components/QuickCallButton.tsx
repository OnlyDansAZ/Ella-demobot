import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Phone, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const callFormSchema = z.object({
  to: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format"),
  script: z.string()
    .min(20, "Script must be at least 20 characters")
    .max(2000, "Script is too long"),
  voice: z.string()
});

type CallFormValues = z.infer<typeof callFormSchema>;

export default function QuickCallButton({ 
  latestMessage = '',
  persona = 'default',
  buttonStyle = 'icon', // 'icon', 'text', or 'full'
  className = ''
}: { 
  latestMessage?: string; 
  persona?: string;
  buttonStyle?: 'icon' | 'text' | 'full';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  
  // Form setup
  const form = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      to: '',
      script: latestMessage || "Hello, this is Ella from YoBot. I'm calling to follow up about our recent conversation.",
      voice: 'female',
    },
  });
  
  // Mutation to make a phone call
  const makeCallMutation = useMutation({
    mutationFn: (values: CallFormValues) => {
      const callData = {
        ...values,
        persona: persona
      };
      return apiRequest('/api/phone-call', 'POST', callData);
    },
    onSuccess: () => {
      toast({
        title: "Call initiated",
        description: "Your call is being processed",
      });
      setOpen(false);
      form.reset({
        to: '',
        script: latestMessage || "Hello, this is Ella from YoBot. I'm calling to follow up about our recent conversation.",
        voice: 'female',
      });
    },
    onError: (error) => {
      toast({
        title: "Call failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: CallFormValues) => {
    makeCallMutation.mutate(values);
  };
  
  // Render different button styles
  const renderButtonContent = () => {
    switch (buttonStyle) {
      case 'icon':
        return <Phone className="h-4 w-4" />;
      case 'text':
        return "Call";
      case 'full':
        return (
          <>
            <Phone className="h-4 w-4 mr-2" />
            Make Call
          </>
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={buttonStyle === 'icon' ? 'icon' : 'default'} 
          className={className}
        >
          {renderButtonContent()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make an AI Phone Call</DialogTitle>
          <DialogDescription>
            Let Ella make a voice call based on your conversation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the recipient's phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="voice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="script"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Script</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What Ella should say on the call..." 
                      className="h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Edit the script as needed for the call
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#0D82DA] hover:bg-[#0956a3]"
                disabled={makeCallMutation.isPending}
              >
                {makeCallMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Make Call
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}