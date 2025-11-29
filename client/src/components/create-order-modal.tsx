import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/clerk-react";
import { X, Move, CreditCard, FileText, MapPin, Clock, DollarSign, Info, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { TranslatedText } from '@/components/translated-text';
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
  price: z.string().min(1, "Price is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Please enter a valid price (0 or higher)"),
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
  const { user } = useUser();
  const [paymentType, setPaymentType] = useState<"single" | "group">("single");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<CreateOrderForm | null>(null);

  const CURRENT_USER_ID = user?.id || "guest";

  // Set default scheduled time to 2 hours from now
  const getDefaultScheduledTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toISOString().slice(0, 16);
  };

  // Handle mouse down on header for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea')) {
      return;
    }
    
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
        price: parseFloat(data.price).toString(),
        type: data.type,
        maxParticipants: data.type === "group" ? data.maxParticipants : null,
        tags: data.tags || [],
        creatorId: CURRENT_USER_ID !== "guest" ? CURRENT_USER_ID : null,
        isPaid: false, // Will be updated after payment
      };

      const order = await api.orders.create(orderData);

      // Return order info (payment will be created on payment page)
      return {
        order: order.data,
        amount: parseFloat(data.price)
      };
    },
    onSuccess: (result) => {
      // Store order info for payment page
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        orderId: result.order.id,
        amount: result.amount
      }));
      
      // Redirect to payment page
      window.location.href = `/payment/${result.order.id}`;
    },
    onError: (error: Error) => {
      toast({
        title: "Order Creation Failed",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
      setShowPaymentModal(false);
    },
  });

  const onSubmit = (data: CreateOrderForm) => {
    // Show payment confirmation modal
    setPendingOrderData(data);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (pendingOrderData) {
      createOrderMutation.mutate(pendingOrderData);
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentModal(false);
    setPendingOrderData(null);
  };

  // Multi-provider geocoding with automatic fallback
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    
    setIsGeocoding(true);
    
    // Geocoding providers in order of preference
    const geocodingProviders = [
      {
        name: "OpenStreetMap Nominatim",
        url: `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        parseResponse: (data: any[]) => data.length > 0 ? { 
          lat: parseFloat(data[0].lat), 
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name 
        } : null
      },
      {
        name: "Photon API",
        url: `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`,
        parseResponse: (data: any) => data.features && data.features.length > 0 ? {
          lat: data.features[0].geometry.coordinates[1],
          lng: data.features[0].geometry.coordinates[0],
          display_name: data.features[0].properties.name || address
        } : null
      },
      {
        name: "LocationIQ",
        url: `https://us1.locationiq.com/v1/search.php?key=pk.0f147952a41c209c5446b00b0c7587e9&q=${encodeURIComponent(address)}&format=json&limit=1`,
        parseResponse: (data: any[]) => data.length > 0 ? {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        } : null
      }
    ];

    let lastError = null;
    
    for (let i = 0; i < geocodingProviders.length; i++) {
      const provider = geocodingProviders[i];
      
      try {
        const response = await fetch(provider.url, {
          headers: {
            'User-Agent': 'TapLive-Location-Service'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const result = provider.parseResponse(data);
        
        if (result) {
          // Success! Update form coordinates
          form.setValue('latitude', result.lat);
          form.setValue('longitude', result.lng);
          
          // Trigger map update through parent component
          if (window.mapUpdateLocation) {
            window.mapUpdateLocation(result.lat, result.lng);
          }
          
          toast({
            title: "Location Found",
            description: `📍 ${result.display_name.split(',').slice(0, 3).join(', ')} (via ${provider.name})`,
          });
          
          setIsGeocoding(false);
          return; // Exit successfully
        }
      } catch (error) {
        lastError = error;
        console.warn(`${provider.name} failed:`, error);
        
        // Continue to next provider if not the last one
        if (i < geocodingProviders.length - 1) {
          continue;
        }
      }
    }
    
    // All providers failed
    toast({
      title: "Location Not Found",
      description: "Could not find the specified address using any available service. Please try a different location.",
      variant: "destructive",
    });
    
    setIsGeocoding(false);
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
        className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-2xl rounded-xl fixed z-[9999]"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
          willChange: isDragging ? 'transform' : 'auto'
        }}
        data-testid="create-order-modal" 
        aria-describedby="create-order-description"
      >
        <DialogHeader 
          className="cursor-grab active:cursor-grabbing border-b border-gray-100 pb-3 mb-4 select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-gray-400" />
              <DialogTitle className="text-lg font-bold text-foreground"><TranslatedText>Create Streaming Order</TranslatedText></DialogTitle>
            </div>
          </div>
          <p id="create-order-description" className="text-sm text-muted-foreground"><TranslatedText>Fill out the form below to create a new streaming request. Drag this window to view the map.</TranslatedText></p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><TranslatedText>Stream Title</TranslatedText></FormLabel>
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
                  <FormLabel><TranslatedText>Description</TranslatedText></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your streaming experience..." 
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
                  <FormLabel><TranslatedText>Location</TranslatedText></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Enter location (e.g., New York, NY)" 
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
                    <FormLabel><TranslatedText>Date & Time</TranslatedText></FormLabel>
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
                    <FormLabel><TranslatedText>Duration</TranslatedText></FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                      <FormControl>
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="30"><TranslatedText>30 minutes</TranslatedText></SelectItem>
                        <SelectItem value="60"><TranslatedText>1 hour</TranslatedText></SelectItem>
                        <SelectItem value="120"><TranslatedText>2 hours</TranslatedText></SelectItem>
                        <SelectItem value="180"><TranslatedText>3 hours</TranslatedText></SelectItem>
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
                  <FormLabel><TranslatedText>Category</TranslatedText></FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="music"><TranslatedText>Music & Entertainment</TranslatedText></SelectItem>
                      <SelectItem value="food"><TranslatedText>Food & Dining</TranslatedText></SelectItem>
                      <SelectItem value="travel"><TranslatedText>Travel & Tourism</TranslatedText></SelectItem>
                      <SelectItem value="events"><TranslatedText>Events & Gatherings</TranslatedText></SelectItem>
                      <SelectItem value="education"><TranslatedText>Educational</TranslatedText></SelectItem>
                      <SelectItem value="fitness"><TranslatedText>Fitness & Wellness</TranslatedText></SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-foreground"><TranslatedText>Payment Options</TranslatedText></h4>
              
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
                            <div className="font-medium text-foreground"><TranslatedText>Solo Payment</TranslatedText></div>
                            <div className="text-sm text-muted-foreground"><TranslatedText>Pay the full amount yourself</TranslatedText></div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="group" id="group" data-testid="radio-group" />
                          <Label htmlFor="group" className="flex-1">
                            <div className="font-medium text-foreground"><TranslatedText>Group Payment</TranslatedText></div>
                            <div className="text-sm text-muted-foreground"><TranslatedText>Split the cost with others</TranslatedText></div>
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
                      <FormLabel><TranslatedText>Total Budget</TranslatedText></FormLabel>
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
                        <FormLabel><TranslatedText>Max Participants</TranslatedText></FormLabel>
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
                <TranslatedText>Cancel</TranslatedText>
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={createOrderMutation.isPending}
                data-testid="button-create-order"
              >
                {createOrderMutation.isPending ? <TranslatedText>Creating...</TranslatedText> : <TranslatedText>Proceed to Payment</TranslatedText>}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Mock Payment Confirmation Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[440px] bg-white border-2 border-gray-300 shadow-xl p-0">
          <div className="p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Confirm Payment
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              {/* Order Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="flex items-center gap-1.5 font-semibold text-blue-900 text-sm mb-2">
                  <FileText className="h-4 w-4" />
                  Order Summary
                </h4>
                {pendingOrderData && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs">Title:</span>
                      <span className="font-medium text-xs text-gray-900 max-w-[240px] truncate" title={pendingOrderData.title}>
                        {pendingOrderData.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs">Location:</span>
                      <span className="font-medium text-xs text-gray-900 max-w-[240px] truncate" title={pendingOrderData.address}>
                        {pendingOrderData.address}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs">Duration:</span>
                      <span className="font-medium text-xs text-gray-900">{pendingOrderData.duration} min</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-blue-300">
                      <span className="font-semibold text-blue-900 text-sm">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-900">${pendingOrderData.price}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Policy */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-yellow-900 mb-2">
                  <Info className="h-3.5 w-3.5" />
                  Payment Policy
                </p>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li className="flex items-start gap-1.5">
                    <span className="text-yellow-600 flex-shrink-0">•</span>
                    <span className="leading-tight">Payment held securely until completion</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-yellow-600 flex-shrink-0">•</span>
                    <span className="leading-tight">Free cancellation before provider accepts</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-yellow-600 flex-shrink-0">•</span>
                    <span className="leading-tight">5% penalty after provider accepts</span>
                  </li>
                </ul>
              </div>

              {/* Mock Payment Notice */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-2.5">
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-700 leading-relaxed">
                  <Lock className="h-3.5 w-3.5" />
                  Mock payment for testing. No actual charges.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-10 border-gray-300"
                  onClick={handleCancelPayment}
                  disabled={createOrderMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                  onClick={handleConfirmPayment}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Pay ${pendingOrderData?.price || '0'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
