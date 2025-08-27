import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { api, invalidateOrders } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertOrder } from "@shared/schema";

const createOrderSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  category: z.string().min(1, "Please select a category"),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(1, "Address is required"),
  scheduledAt: z.string().min(1, "Scheduled time is required"),
  duration: z.number().min(10, "Duration must be at least 10 minutes").max(480),
  price: z.string().min(1, "Price is required"),
  type: z.enum(["single", "group"]),
  maxParticipants: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLocation?: { lat: number; lng: number };
}

export function CreateOrderModal({ open, onOpenChange, selectedLocation }: CreateOrderModalProps) {
  const { toast } = useToast();
  const [paymentType, setPaymentType] = useState<"single" | "group">("single");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Set default scheduled time to 2 hours from now
  const getDefaultScheduledTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toISOString().slice(0, 16);
  };

  // Handle mouse down on header for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Reset position when modal opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      latitude: selectedLocation?.lat || 40.7128,
      longitude: selectedLocation?.lng || -74.0060,
      address: "",
      scheduledAt: getDefaultScheduledTime(),
      duration: 60,
      price: "",
      type: "single",
      tags: [],
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CreateOrderForm) => {
      const orderData: InsertOrder = {
        title: data.title,
        description: data.description,
        category: data.category,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        address: data.address,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        price: data.price,
        type: data.type,
        maxParticipants: data.type === "group" ? data.maxParticipants : null,
        tags: data.tags || [],
        creatorId: null, // Would be set from auth context
      };

      return api.orders.create(orderData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order created successfully!",
      });
      invalidateOrders();
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateOrderForm) => {
    createOrderMutation.mutate(data);
  };

  // Geocoding function using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLocation = { lat: parseFloat(lat), lng: parseFloat(lon) };
        
        // Update form coordinates
        form.setValue('latitude', newLocation.lat);
        form.setValue('longitude', newLocation.lng);
        
        // Trigger map update through parent component
        if (window.mapUpdateLocation) {
          window.mapUpdateLocation(newLocation.lat, newLocation.lng);
        }
        
        toast({
          title: "Location Found",
          description: `Map updated to: ${data[0].display_name.split(',').slice(0, 3).join(', ')}`,
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find the specified address. Please try a different location.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Geocoding Error",
        description: "Failed to search for location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Debounced geocoding
  useEffect(() => {
    const address = form.watch('address');
    if (!address || address.length < 3) return;

    const timeoutId = setTimeout(() => {
      geocodeAddress(address);
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [form.watch('address')]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={modalRef}
        className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-2xl rounded-xl fixed"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        data-testid="create-order-modal" 
        aria-describedby="create-order-description"
      >
        <DialogHeader 
          className="cursor-grab active:cursor-grabbing border-b border-gray-100 pb-3 mb-4"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-gray-400" />
              <DialogTitle className="text-lg font-bold text-foreground">Create Streaming Order</DialogTitle>
            </div>
          </div>
          <p id="create-order-description" className="text-sm text-muted-foreground">Fill out the form below to create a new streaming request. Drag this window to view the map.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What would you like to stream?" 
                      {...field} 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the streaming experience you want..." 
                      rows={3}
                      {...field} 
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Enter location (e.g., San Francisco, CA)" 
                        {...field} 
                        data-testid="input-location"
                        className={isGeocoding ? "pr-8" : ""}
                      />
                      {isGeocoding && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {selectedLocation && (
                    <p className="text-xs text-blue-600">
                      Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                        data-testid="input-scheduled-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                      <FormControl>
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="music">Music & Entertainment</SelectItem>
                      <SelectItem value="food">Food & Dining</SelectItem>
                      <SelectItem value="travel">Travel & Tourism</SelectItem>
                      <SelectItem value="events">Events & Gatherings</SelectItem>
                      <SelectItem value="education">Educational</SelectItem>
                      <SelectItem value="fitness">Fitness & Wellness</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-foreground">Payment Options</h4>
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setPaymentType(value as "single" | "group");
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="single" id="solo" data-testid="radio-single" />
                          <Label htmlFor="solo" className="flex-1">
                            <div className="font-medium text-foreground">Solo Payment</div>
                            <div className="text-sm text-muted-foreground">Pay the full amount yourself</div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="group" id="group" data-testid="radio-group" />
                          <Label htmlFor="group" className="flex-1">
                            <div className="font-medium text-foreground">Group Payment</div>
                            <div className="text-sm text-muted-foreground">Split the cost with others</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Budget</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                          <Input 
                            placeholder="0" 
                            className="pl-8"
                            {...field} 
                            data-testid="input-price"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {paymentType === "group" && (
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Participants</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="4" 
                            min="2" 
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-participants"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={createOrderMutation.isPending}
                data-testid="button-create-order"
              >
                {createOrderMutation.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
