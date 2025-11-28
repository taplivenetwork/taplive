import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TranslatedText } from "@/components/translated-text";
import { Play, Users, Clock, MapPin, Eye, Calendar, Star, TrendingUp } from "lucide-react";

interface Stream {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  viewers: number;
  duration: number;
  streamer: string;
  streamerId: string;
  status: string;
  thumbnail: string;
  liveUrl?: string;
  scheduledAt: string;
  createdAt: string;
  category: string;
  price: string;
  currency: string;
  scheduledTime?: string;
}

export default function Streams() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [upcomingStreams, setUpcomingStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError(null);

      const [liveResponse, upcomingResponse] = await Promise.all([
        fetch('/api/streams/live'),
        fetch('/api/streams/upcoming')
      ]);

      if (!liveResponse.ok || !upcomingResponse.ok) {
        throw new Error('Failed to fetch streams');
      }

      const liveData = await liveResponse.json();
      const upcomingData = await upcomingResponse.json();

      setLiveStreams(liveData.data || []);
      setUpcomingStreams(upcomingData.data || []);
    } catch (err) {
      console.error('Error fetching streams:', err);
      setError('Failed to load streams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchStream = (streamId: string) => {
    window.location.href = `/stream/${streamId}`;
  };

  const handleSetReminder = (streamId: string) => {
    // TODO: Implement reminder functionality
    console.log('Set reminder for stream:', streamId);
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Live Now Section Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Skeleton className="w-full h-48 rounded-t-lg" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {[...Array(3)].map((_, j) => (
                        <Skeleton key={j} className="h-4 w-2/3" />
                      ))}
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Section Skeleton */}
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-3" />
                        <div className="flex items-center gap-6">
                          {[...Array(3)].map((_, j) => (
                            <Skeleton key={j} className="h-4 w-24" />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-10 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              <TranslatedText context="streams">Live Streams</TranslatedText>
            </h1>
          </div>
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <div className="text-red-500 mb-4">
                <TrendingUp className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">Connection Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchStreams}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <TranslatedText context="streams">Live Streams</TranslatedText>
          </h1>
          <p className="text-muted-foreground">
            <TranslatedText context="streams">Watch and manage your live streaming sessions</TranslatedText>
          </p>
        </div>

        {/* Live Now Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            <h2 className="text-xl font-semibold">
              <TranslatedText context="streams">Live Now</TranslatedText>
            </h2>
            <Badge variant="secondary" className="ml-2">
              {liveStreams.length} active
            </Badge>
          </div>

          {liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map((stream) => (
                <Card key={stream.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <div className="relative">
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                      {stream.liveUrl ? (
                        <img
                          src={stream.thumbnail}
                          alt={stream.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${stream.liveUrl ? 'hidden' : ''}`}>
                        <Play className="w-12 h-12 text-primary" />
                      </div>
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white animate-pulse">
                      <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
                      <TranslatedText context="streams">Live</TranslatedText>
                    </Badge>
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {stream.viewers}
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {stream.category}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">
                      <TranslatedText>{stream.title}</TranslatedText>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      <TranslatedText>{stream.description}</TranslatedText>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate"><TranslatedText>{stream.location}</TranslatedText></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{stream.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{stream.streamer}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      data-testid={`watch-stream-${stream.id}`}
                      onClick={() => handleWatchStream(stream.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      <TranslatedText context="streams">Watch Stream</TranslatedText>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  <TranslatedText context="streams">No Live Streams</TranslatedText>
                </h3>
                <p className="text-muted-foreground mb-4">
                  <TranslatedText context="streams">No streams are currently live. Check back later!</TranslatedText>
                </p>
                <Button variant="outline" onClick={fetchStreams}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Streams */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              <TranslatedText>Upcoming Streams</TranslatedText>
            </h2>
            <Badge variant="outline" className="ml-2">
              {upcomingStreams.length} scheduled
            </Badge>
          </div>

          {upcomingStreams.length > 0 ? (
            <div className="space-y-4">
              {upcomingStreams.map((stream) => (
                <Card key={stream.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play className="w-8 h-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-lg mb-1 line-clamp-2">
                              <TranslatedText>{stream.title}</TranslatedText>
                            </h4>
                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              <TranslatedText>{stream.description}</TranslatedText>
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate"><TranslatedText>{stream.location}</TranslatedText></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>{stream.scheduledTime} • {stream.duration} min</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{stream.streamer}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 flex-shrink-0" />
                                <span>{stream.currency} {stream.price}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge variant="outline" className="whitespace-nowrap">
                          <TranslatedText>Scheduled</TranslatedText>
                        </Badge>
                        <Button
                          variant="outline"
                          data-testid={`remind-stream-${stream.id}`}
                          onClick={() => handleSetReminder(stream.id)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          <TranslatedText>Set Reminder</TranslatedText>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  <TranslatedText>No Upcoming Streams</TranslatedText>
                </h3>
                <p className="text-muted-foreground mb-4">
                  <TranslatedText>No streams are scheduled yet.</TranslatedText>
                </p>
                <Button variant="outline" onClick={fetchStreams}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}