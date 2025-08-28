import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TranslatedText } from "@/components/translated-text";
import { Play, Users, Clock, MapPin, Eye } from "lucide-react";

export default function Streams() {
  // Mock live streams data
  const liveStreams = [
    {
      id: 1,
      title: "Times Square Night Walk",
      description: "Exploring the bright lights of NYC",
      location: "Times Square, NYC",
      viewers: 23,
      duration: "15 min",
      streamer: "Alex Chen",
      status: "live",
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: 2,
      title: "Golden Gate Bridge View",
      description: "Beautiful sunset view from Marin",
      location: "San Francisco, CA",
      viewers: 8,
      duration: "20 min",
      streamer: "Maria Rodriguez",
      status: "live",
      thumbnail: "/api/placeholder/300/200"
    }
  ];

  const upcomingStreams = [
    {
      id: 3,
      title: "Central Park Concert",
      description: "Live jazz performance in the park",
      location: "Central Park, NYC",
      scheduledTime: "3:00 PM",
      duration: "45 min",
      streamer: "David Kim",
      status: "scheduled"
    },
    {
      id: 4,
      title: "Food Market Tour",
      description: "Exploring local vendors and cuisine",
      location: "Pike Place Market, Seattle",
      scheduledTime: "5:30 PM", 
      duration: "30 min",
      streamer: "Sarah Chen",
      status: "scheduled"
    }
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <TranslatedText>Live Streams</TranslatedText>
          </h1>
          <p className="text-muted-foreground">
            <TranslatedText>Watch and manage your live streaming sessions</TranslatedText>
          </p>
        </div>

        {/* Live Now Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            <TranslatedText>Live Now</TranslatedText>
          </h2>
          
          {liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map((stream) => (
                <Card key={stream.id} className="solid-card overflow-hidden">
                  <div className="relative">
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Play className="w-12 h-12 text-primary" />
                    </div>
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></span>
                      <TranslatedText>Live</TranslatedText>
                    </Badge>
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {stream.viewers}
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <TranslatedText>{stream.title}</TranslatedText>
                    </CardTitle>
                    <CardDescription>
                      <TranslatedText>{stream.description}</TranslatedText>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span><TranslatedText>{stream.location}</TranslatedText></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{stream.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{stream.streamer}</span>
                      </div>
                    </div>
                    
                    <Button className="w-full" data-testid={`watch-stream-${stream.id}`}>
                      <Play className="w-4 h-4 mr-2" />
                      <TranslatedText>Watch Stream</TranslatedText>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="solid-card">
              <CardContent className="text-center py-8">
                <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  <TranslatedText>No Live Streams</TranslatedText>
                </h3>
                <p className="text-muted-foreground">
                  <TranslatedText>No streams are currently live. Check back later!</TranslatedText>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Streams */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            <TranslatedText>Upcoming Streams</TranslatedText>
          </h2>
          
          {upcomingStreams.length > 0 ? (
            <div className="space-y-4">
              {upcomingStreams.map((stream) => (
                <Card key={stream.id} className="solid-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">
                          <TranslatedText>{stream.title}</TranslatedText>
                        </h4>
                        <p className="text-muted-foreground mb-3">
                          <TranslatedText>{stream.description}</TranslatedText>
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span><TranslatedText>{stream.location}</TranslatedText></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{stream.scheduledTime} • {stream.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{stream.streamer}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          <TranslatedText>Scheduled</TranslatedText>
                        </Badge>
                        <Button variant="outline" data-testid={`remind-stream-${stream.id}`}>
                          <TranslatedText>Set Reminder</TranslatedText>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="solid-card">
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  <TranslatedText>No Upcoming Streams</TranslatedText>
                </h3>
                <p className="text-muted-foreground">
                  <TranslatedText>No streams are scheduled yet.</TranslatedText>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}