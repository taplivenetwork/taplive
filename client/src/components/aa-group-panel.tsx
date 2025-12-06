import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, DollarSign, Share2, CheckCircle } from "lucide-react";
import { TranslatedText } from "./translated-text";

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
    { id: 'demo-order-1', title: '演唱会现场直播', price: 120, type: 'group' },
    { id: 'demo-order-2', title: '美食探店拍摄', price: 80, type: 'group' },
    { id: 'demo-order-3', title: '城市夜景直播', price: 60, type: 'group' }
  ];

  const createAAGroup = async () => {
    if (!selectedOrder) {
      alert('请选择一个订单');
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
        alert('AA拼团创建成功！');
      } else {
        const error = await response.json();
        alert(error.message || '创建失败');
      }
    } catch (error) {
      alert('创建AA拼团失败');
    } finally {
      setCreating(false);
    }
  };

  const loadAAGroup = async () => {
    if (!groupId) {
      alert('请输入群组ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/aa-groups/${groupId}`);
      if (response.ok) {
        const result = await response.json();
        setAAGroup(result.data);
      } else {
        alert('未找到该群组');
      }
    } catch (error) {
      alert('加载群组失败');
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
        alert('成功加入AA拼团！');
        loadAAGroup(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.message || '加入失败');
      }
    } catch (error) {
      alert('加入AA拼团失败');
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "已过期";
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  const generateInviteLink = () => {
    if (aaGroup) {
      const link = `${window.location.origin}/aa-group/${aaGroup.id}`;
      navigator.clipboard.writeText(link);
      alert('邀请链接已复制到剪贴板！');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create AA Group */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <TranslatedText>创建AA拼团</TranslatedText>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              <TranslatedText>选择订单</TranslatedText>
            </Label>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              data-testid="select-order"
            >
              <option value="">请选择订单</option>
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
                <TranslatedText>最大参与人数</TranslatedText>
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
                <TranslatedText>有效期（小时）</TranslatedText>
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
              <TranslatedText>创建中...</TranslatedText>
            ) : (
              <TranslatedText>创建AA拼团</TranslatedText>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Load Existing AA Group */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <TranslatedText>加入AA拼团</TranslatedText>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入群组ID"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              data-testid="input-group-id"
            />
            <Button 
              onClick={loadAAGroup}
              disabled={loading}
              data-testid="button-load-group"
            >
              {loading ? <TranslatedText>加载中...</TranslatedText> : <TranslatedText>查看</TranslatedText>}
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
                <TranslatedText>AA拼团状态</TranslatedText>
              </div>
              <Badge variant={aaGroup.isComplete ? 'default' : 'secondary'}>
                {aaGroup.isComplete ? (
                  <TranslatedText>已完成</TranslatedText>
                ) : (
                  <TranslatedText>进行中</TranslatedText>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span><TranslatedText>总金额</TranslatedText>: ¥{aaGroup.totalAmount}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span><TranslatedText>人均</TranslatedText>: ¥{aaGroup.splitAmount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{aaGroup.currentParticipants}/{aaGroup.maxParticipants} <TranslatedText>人</TranslatedText></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTimeRemaining(aaGroup.timeRemaining)}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span><TranslatedText>参与进度</TranslatedText></span>
                <span>{aaGroup.progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={aaGroup.progressPercentage} />
            </div>

            {/* Participants */}
            {aaGroup.participants.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  <TranslatedText>参与者</TranslatedText>
                </div>
                <div className="space-y-1">
                  {aaGroup.participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <span>参与者 {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span>¥{participant.amount}</span>
                        {participant.isPaid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <TranslatedText>待支付</TranslatedText>
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
                  <TranslatedText>加入拼团</TranslatedText>
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={generateInviteLink}
                data-testid="button-share-invite"
              >
                <Share2 className="w-4 h-4 mr-1" />
                <TranslatedText>分享</TranslatedText>
              </Button>
            </div>

            {aaGroup.timeRemaining <= 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <TranslatedText>该拼团已过期</TranslatedText>
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
            <TranslatedText>AA拼团功能</TranslatedText>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• <TranslatedText>自动分账：支持2-50人均摊费用</TranslatedText></div>
            <div>• <TranslatedText>安全支付：集齐后统一支付，未满员自动退款</TranslatedText></div>
            <div>• <TranslatedText>时间限制：可设置1-168小时有效期</TranslatedText></div>
            <div>• <TranslatedText>实时状态：参与进度和支付状态实时更新</TranslatedText></div>
            <div>• <TranslatedText>分享邀请：生成邀请链接快速邀请好友</TranslatedText></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}