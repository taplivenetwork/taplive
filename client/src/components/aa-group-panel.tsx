import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, DollarSign, Share2, CheckCircle } from "lucide-react";

interface AAGroupStatus {
  id: string;
  originalOrderId: string;
  totalAmount: number;
  splitAmount: number;
  maxParticipants: number;
  currentParticipants: number;
  participants: any[];
  isComplete: boolean;
  canJoin: boolean;
  timeRemaining: number;
  progressPercentage: number;
}

export function AAGroupPanel() {
  const [selectedOrder, setSelectedOrder] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [expirationHours, setExpirationHours] = useState(24);
  const [aaGroup, setAAGroup] = useState<AAGroupStatus | null>(null);
  const [groupId, setGroupId] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Demo orders for AA group creation
  const demoOrders = [
    { id: 'demo-order-1', title: 'Live Concert Stream', price: 120, type: 'group' },
    { id: 'demo-order-2', title: 'Food Exploration Video', price: 80, type: 'group' },
    { id: 'demo-order-3', title: 'City Night Scene Stream', price: 60, type: 'group' }
  ];

  const createAAGroup = async () => {
    if (!selectedOrder) {
      alert('Please select an order');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder}/create-aa-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxParticipants,
          expirationHours
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAAGroup(result.data);
        setGroupId(result.data.id);
        alert('AA Group created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Creation failed');
      }
    } catch (error) {
      alert('Failed to create AA Group');
    } finally {
      setCreating(false);
    }
  };

  const loadAAGroup = async () => {
    if (!groupId) {
      alert('Please enter group ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/aa-groups/${groupId}`);
      if (response.ok) {
        const result = await response.json();
        setAAGroup(result.data);
      } else {
        alert('Group not found');
      }
    } catch (error) {
      alert('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const joinAAGroup = async () => {
    if (!aaGroup) return;

    try {
      const response = await fetch(`/api/aa-groups/${aaGroup.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user-' + Math.random().toString(36).substr(2, 9)
        })
      });

      if (response.ok) {
        alert('Successfully joined AA Group!');
        loadAAGroup(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join');
      }
    } catch (error) {
      alert('Failed to join AA Group');
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Expired";
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hours ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const generateInviteLink = () => {
    if (aaGroup) {
      const link = `${window.location.origin}/aa-group/${aaGroup.id}`;
      navigator.clipboard.writeText(link);
      alert('Invite link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create AA Group */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Create AA Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Select Order
            </Label>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              data-testid="select-order"
            >
              <option value="">Please select an order</option>
              {demoOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.title} - ¥{order.price}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Max Participants
              </Label>
              <Input
                type="number"
                min="2"
                max="20"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                data-testid="input-max-participants"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Validity Period (Hours)
              </Label>
              <Input
                type="number"
                min="1"
                max="168"
                value={expirationHours}
                onChange={(e) => setExpirationHours(parseInt(e.target.value))}
                data-testid="input-expiration-hours"
              />
            </div>
          </div>

          <Button 
            onClick={createAAGroup}
            disabled={creating || !selectedOrder}
            className="w-full"
            data-testid="button-create-aa-group"
          >
            {creating ? (
              "Creating..."
            ) : (
              "Create AA Group"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Load Existing AA Group */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Join AA Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter group ID"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              data-testid="input-group-id"
            />
            <Button 
              onClick={loadAAGroup}
              disabled={loading}
              data-testid="button-load-group"
            >
              {loading ? "Loading..." : "View"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AA Group Status */}
      {aaGroup && (
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                AA Group Status
              </div>
              <Badge variant={aaGroup.isComplete ? 'default' : 'secondary'}>
                {aaGroup.isComplete ? (
                  "Completed"
                ) : (
                  "In Progress"
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Total Amount: ¥{aaGroup.totalAmount}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Per Person: ¥{aaGroup.splitAmount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{aaGroup.currentParticipants}/{aaGroup.maxParticipants} people</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTimeRemaining(aaGroup.timeRemaining)}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Participation Progress</span>
                <span>{aaGroup.progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={aaGroup.progressPercentage} />
            </div>

            {/* Participants */}
            {aaGroup.participants.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Participants
                </div>
                <div className="space-y-1">
                  {aaGroup.participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <span>Participant {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span>¥{participant.amount}</span>
                        {participant.isPaid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Badge variant="outline" size="sm">
                            Pending Payment
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {aaGroup.canJoin && (
                <Button 
                  onClick={joinAAGroup}
                  className="flex-1"
                  data-testid="button-join-group"
                >
                  Join Group
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={generateInviteLink}
                data-testid="button-share-invite"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>

            {aaGroup.timeRemaining <= 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  This group has expired
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* AA Group Features */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-2">
            AA Group Features
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• Automatic split billing: Support 2-50 people sharing costs</div>
            <div>• Secure payment: Unified payment after full group, automatic refund if not full</div>
            <div>• Time limit: Set validity period from 1-168 hours</div>
            <div>• Real-time status: Participation progress and payment status updated in real-time</div>
            <div>• Share invites: Generate invite links to quickly invite friends</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}