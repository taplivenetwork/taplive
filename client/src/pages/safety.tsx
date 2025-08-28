import { GeoSafetyPanel } from "@/components/geo-safety-panel";
import { AAGroupPanel } from "@/components/aa-group-panel";
import { TranslatedText } from "@/components/translated-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, AlertTriangle, MapPin, Eye, MessageCircle } from "lucide-react";

export function SafetyPage() {
  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold">
            <TranslatedText>安全与风控系统</TranslatedText>
          </h1>
        </div>
        <p className="text-muted-foreground">
          <TranslatedText>全面的地理安全、天气监控、内容审核和AA拼团功能</TranslatedText>
        </p>
      </div>

      {/* Safety Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-700 dark:text-green-400">
                  <TranslatedText>地理风控</TranslatedText>
                </div>
                <div className="text-sm text-green-600 dark:text-green-300">
                  <TranslatedText>军事基地检测</TranslatedText>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-400">
                  <TranslatedText>天气预警</TranslatedText>
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-300">
                  <TranslatedText>自然灾害预防</TranslatedText>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-700 dark:text-orange-400">
                  <TranslatedText>内容审核</TranslatedText>
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-300">
                  <TranslatedText>关键词检测</TranslatedText>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-700 dark:text-purple-400">
                  <TranslatedText>语音监控</TranslatedText>
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-300">
                  <TranslatedText>实时语音检测</TranslatedText>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="geo-safety" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="geo-safety" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <TranslatedText>地理安全</TranslatedText>
          </TabsTrigger>
          <TabsTrigger value="aa-group" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <TranslatedText>AA拼团</TranslatedText>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geo-safety" className="mt-6">
          <div className="space-y-6">
            {/* Feature Overview */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <TranslatedText>多层安全保护系统</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium">
                      <TranslatedText>地理风险评估</TranslatedText>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <TranslatedText>军事基地和管制区域检测</TranslatedText></li>
                      <li>• <TranslatedText>极地、无人区等极端环境识别</TranslatedText></li>
                      <li>• <TranslatedText>高犯罪率区域风险提醒</TranslatedText></li>
                      <li>• <TranslatedText>电子围栏自动订单取消</TranslatedText></li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">
                      <TranslatedText>天气灾害预警</TranslatedText>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <TranslatedText>暴雨、雷电、龙卷风预警</TranslatedText></li>
                      <li>• <TranslatedText>地震、海啸、山洪监测</TranslatedText></li>
                      <li>• <TranslatedText>雪崩、泥石流危险评估</TranslatedText></li>
                      <li>• <TranslatedText>危险天气自动取消订单</TranslatedText></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geo Safety Panel */}
            <GeoSafetyPanel />

            {/* Content Safety Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-600" />
                  <TranslatedText>内容安全监控</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">
                          <TranslatedText>高风险</TranslatedText>
                        </Badge>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        <TranslatedText>违法活动检测</TranslatedText>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <TranslatedText>毒品交易、武器贩卖、人口贩卖等</TranslatedText>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-orange-300">
                          <TranslatedText>中风险</TranslatedText>
                        </Badge>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        <TranslatedText>不当内容监控</TranslatedText>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <TranslatedText>偷拍、非法拍摄、隐私侵犯等</TranslatedText>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <TranslatedText>实时监控</TranslatedText>
                        </Badge>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        <TranslatedText>语音安全检测</TranslatedText>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <TranslatedText>紧急求救、威胁用语检测</TranslatedText>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    <TranslatedText>AI智能检测流程</TranslatedText>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>1. <TranslatedText>关键词实时检测</TranslatedText></span>
                    <span>→</span>
                    <span>2. <TranslatedText>AI置信度评估</TranslatedText></span>
                    <span>→</span>
                    <span>3. <TranslatedText>自动处理或人工审核</TranslatedText></span>
                    <span>→</span>
                    <span>4. <TranslatedText>订单警告或终止</TranslatedText></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aa-group" className="mt-6">
          <div className="space-y-6">
            {/* AA Group Overview */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <TranslatedText>AA拼团系统</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium">
                      <TranslatedText>智能分账功能</TranslatedText>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <TranslatedText>支持2-50人均摊费用</TranslatedText></li>
                      <li>• <TranslatedText>自动计算每人应付金额</TranslatedText></li>
                      <li>• <TranslatedText>集齐后统一支付处理</TranslatedText></li>
                      <li>• <TranslatedText>未满员自动退款保护</TranslatedText></li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">
                      <TranslatedText>社交分享机制</TranslatedText>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <TranslatedText>生成邀请链接快速分享</TranslatedText></li>
                      <li>• <TranslatedText>QR码扫描快速加入</TranslatedText></li>
                      <li>• <TranslatedText>实时参与进度显示</TranslatedText></li>
                      <li>• <TranslatedText>灵活时间限制设置</TranslatedText></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AA Group Panel */}
            <AAGroupPanel />

            {/* Payment Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <TranslatedText>安全支付流程</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <div className="text-sm font-medium">
                        <TranslatedText>创建拼团</TranslatedText>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <TranslatedText>设置人数和时限</TranslatedText>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 font-bold">2</span>
                      </div>
                      <div className="text-sm font-medium">
                        <TranslatedText>邀请参与</TranslatedText>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <TranslatedText>分享链接或二维码</TranslatedText>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-orange-600 font-bold">3</span>
                      </div>
                      <div className="text-sm font-medium">
                        <TranslatedText>确认支付</TranslatedText>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <TranslatedText>人数集齐后统一扣费</TranslatedText>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-purple-600 font-bold">4</span>
                      </div>
                      <div className="text-sm font-medium">
                        <TranslatedText>服务完成</TranslatedText>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <TranslatedText>自动分账给服务者</TranslatedText>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800 dark:text-yellow-400">
                          <TranslatedText>风险保护机制</TranslatedText>
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          <TranslatedText>拼团失败（人数不足或超时）将自动退款给所有参与者，确保资金安全</TranslatedText>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SafetyPage;