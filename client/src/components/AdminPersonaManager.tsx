import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, RefreshCw, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Persona } from '@/hooks/use-persona';

export default function AdminPersonaManager() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [creatingPersona, setCreatingPersona] = useState(false);
  const [newPersona, setNewPersona] = useState<Partial<Persona>>({
    name: '',
    description: '',
    systemPrompt: ''
  });
  
  const { toast } = useToast();
  
  // Load personas
  const loadPersonas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/personas');
      const data = await response.json();
      
      if (data.success && data.personas) {
        setPersonas(data.personas);
      } else {
        setError('Failed to load personas');
      }
    } catch (err) {
      console.error('Error loading personas:', err);
      setError('Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new persona
  const createPersona = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPersona)
      });
      
      const data = await response.json();
      
      if (data.success && data.persona) {
        setPersonas([...personas, data.persona]);
        setCreatingPersona(false);
        setNewPersona({
          name: '',
          description: '',
          systemPrompt: ''
        });
        toast({
          title: 'Success',
          description: 'Persona created successfully'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create persona'
        });
      }
    } catch (err) {
      console.error('Error creating persona:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create persona'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update an existing persona
  const updatePersona = async () => {
    if (!editingPersona) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/personas/${editingPersona.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingPersona)
      });
      
      const data = await response.json();
      
      if (data.success && data.persona) {
        setPersonas(personas.map(p => p.id === data.persona.id ? data.persona : p));
        setEditingPersona(null);
        toast({
          title: 'Success',
          description: 'Persona updated successfully'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update persona'
        });
      }
    } catch (err) {
      console.error('Error updating persona:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update persona'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a persona
  const deletePersona = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this persona?')) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/personas/${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          setPersonas(personas.filter(p => p.id !== id));
          toast({
            title: 'Success',
            description: 'Persona deleted successfully'
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete persona'
          });
        }
      } catch (err) {
        console.error('Error deleting persona:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete persona'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Load personas on mount
  useEffect(() => {
    loadPersonas();
  }, []);
  
  // Render editor for new or editing persona
  const renderPersonaEditor = (persona: Partial<Persona>, isNew: boolean) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if (isNew) {
        setNewPersona({ ...newPersona, [name]: value });
      } else if (editingPersona) {
        setEditingPersona({ ...editingPersona, [name]: value });
      }
    };
    
    const handleSave = () => {
      if (isNew) {
        createPersona();
      } else {
        updatePersona();
      }
    };
    
    const handleCancel = () => {
      if (isNew) {
        setCreatingPersona(false);
        setNewPersona({
          name: '',
          description: '',
          systemPrompt: ''
        });
      } else {
        setEditingPersona(null);
      }
    };
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isNew ? 'Create New Persona' : 'Edit Persona'}</CardTitle>
          <CardDescription>
            {isNew 
              ? 'Define a new personality for Ella' 
              : `Editing: ${persona.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`name-${isNew ? 'new' : 'edit'}`}>Name</Label>
            <Input 
              id={`name-${isNew ? 'new' : 'edit'}`}
              name="name"
              value={persona.name || ''}
              onChange={handleChange}
              placeholder="Persona name"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`description-${isNew ? 'new' : 'edit'}`}>Description</Label>
            <Input 
              id={`description-${isNew ? 'new' : 'edit'}`}
              name="description"
              value={persona.description || ''}
              onChange={handleChange}
              placeholder="Brief description of this persona"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`systemPrompt-${isNew ? 'new' : 'edit'}`}>System Prompt</Label>
            <Textarea 
              id={`systemPrompt-${isNew ? 'new' : 'edit'}`}
              name="systemPrompt"
              value={persona.systemPrompt || ''}
              onChange={handleChange}
              placeholder="The system instructions that define this persona's behavior"
              className="mt-1"
              rows={10}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-1" />
            {isNew ? 'Create' : 'Update'}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div>
      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Create/Edit Interface */}
      {creatingPersona && renderPersonaEditor(newPersona, true)}
      {editingPersona && renderPersonaEditor(editingPersona, false)}
      
      {/* Actions Bar */}
      <div className="flex justify-between mb-4">
        <div>
          <Button 
            variant="outline" 
            onClick={loadPersonas} 
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <Button
          onClick={() => setCreatingPersona(true)}
          disabled={isLoading || creatingPersona || !!editingPersona}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Persona
        </Button>
      </div>
      
      {/* Personas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Personas</CardTitle>
          <CardDescription>
            Manage the different personalities that Ella can adopt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Default</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground p-4">
                    {isLoading ? 'Loading personas...' : 'No personas available'}
                  </TableCell>
                </TableRow>
              ) : (
                personas.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell className="font-medium">{persona.name}</TableCell>
                    <TableCell>{persona.description}</TableCell>
                    <TableCell>{persona.isDefault ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setEditingPersona(persona)}
                        disabled={isLoading}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deletePersona(persona.id)}
                        disabled={isLoading || persona.isDefault}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* System Prompt Preview */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Persona Prompt Preview</h3>
        <Tabs defaultValue="default">
          <TabsList>
            {personas.map(persona => (
              <TabsTrigger key={persona.id} value={persona.id}>
                {persona.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {personas.map(persona => (
            <TabsContent key={persona.id} value={persona.id}>
              <Card>
                <CardContent className="pt-6">
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
                    {persona.systemPrompt}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}