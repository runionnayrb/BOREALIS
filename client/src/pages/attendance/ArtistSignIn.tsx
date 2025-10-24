import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle2, LogIn, LogOut, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import type { PublicArtist, ArtistGroup } from "@shared/schema";
import logoPath from "@assets/LaPerle-logo-basic_1760100706441.png";
import { getBestGPSReading, formatAccuracy, getGeolocationErrorMessage, type GPSReading } from "@/lib/geolocation";

interface AttendanceRecord {
  artistId: string;
  date: string;
  signInTime: string | null;
  signOutTime: string | null;
  signedInBy: string;
  latitude: number;
  longitude: number;
}

function getArtistDisplayName(artist: PublicArtist): string {
  return artist.stageName || `${artist.firstName} ${artist.lastName}`;
}

export default function ArtistSignIn() {
  const [selectedArtist, setSelectedArtist] = useState<PublicArtist | null>(null);
  const [pin, setPin] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geolocation, setGeolocation] = useState<GPSReading | null>(null);
  const [locationProgress, setLocationProgress] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const { toast } = useToast();

  const { data: artists = [], isLoading } = useQuery<PublicArtist[]>({
    queryKey: ["/api/attendance/artists"],
  });

  const { data: artistGroups = [] } = useQuery<ArtistGroup[]>({
    queryKey: ["/api/attendance/artist-groups"],
  });

  const availableArtists = artists;

  const signInMutation = useMutation({
    mutationFn: async ({ artistId, pinCode, latitude, longitude, accuracy }: {
      artistId: string;
      pinCode: string;
      latitude: number;
      longitude: number;
      accuracy: number;
    }) => {
      return apiRequest("POST", "/api/attendance/sign-in", { artistId, pinCode, latitude, longitude, accuracy });
    },
    onSuccess: () => {
      toast({
        title: "Signed In",
        description: "You have successfully signed in.",
      });
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Invalid PIN or location.";
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If GPS accuracy is mentioned in the error, show fallback
      if (errorMessage.includes("accuracy") || errorMessage.includes("signal")) {
        setShowFallback(true);
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async ({ artistId, pinCode, latitude, longitude, accuracy }: {
      artistId: string;
      pinCode: string;
      latitude: number;
      longitude: number;
      accuracy: number;
    }) => {
      return apiRequest("POST", "/api/attendance/sign-out", { artistId, pinCode, latitude, longitude, accuracy });
    },
    onSuccess: () => {
      toast({
        title: "Signed Out",
        description: "You have successfully signed out.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Sign Out Failed",
        description: error.message || "Invalid PIN or location.",
        variant: "destructive",
      });
    },
  });

  const { data: currentRecord } = useQuery<AttendanceRecord | null>({
    queryKey: ["/api/attendance/status", selectedArtist?.id],
    enabled: !!selectedArtist,
  });

  const isSignedIn = currentRecord && currentRecord.signInTime && !currentRecord.signOutTime;

  const handleArtistSelect = async (artist: PublicArtist) => {
    setSelectedArtist(artist);
    setPin("");
    setIsGettingLocation(true);
    setLocationError(null);
    setShowFallback(false);
    setLocationProgress("Requesting location access...");

    if (!("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support geolocation.");
      setIsGettingLocation(false);
      setShowFallback(true);
      return;
    }

    try {
      // Take multiple GPS readings and select the best one
      const reading = await getBestGPSReading(
        3, // Take 3 readings
        10000, // 10 second timeout
        (reading, readingNumber, total) => {
          setLocationProgress(`Getting location reading ${readingNumber} of ${total}... (accuracy: ${formatAccuracy(reading.accuracy)})`);
        }
      );

      setGeolocation(reading);
      setIsGettingLocation(false);
      
      // Show warning if accuracy is not great
      if (reading.accuracy > 50) {
        setLocationProgress(`Location acquired with ${formatAccuracy(reading.accuracy)} accuracy`);
        setShowFallback(true);
      } else {
        setLocationProgress(`Location acquired with ${formatAccuracy(reading.accuracy)} accuracy`);
      }
    } catch (error: any) {
      const errorMessage = getGeolocationErrorMessage(error);
      setLocationError(errorMessage);
      setIsGettingLocation(false);
      setShowFallback(true);
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClose = () => {
    setSelectedArtist(null);
    setPin("");
    setGeolocation(null);
    setLocationError(null);
    setLocationProgress("");
    setShowFallback(false);
    queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
  };

  const handleSubmit = () => {
    if (pin.length !== 4 || !geolocation || !selectedArtist) return;

    if (isSignedIn) {
      signOutMutation.mutate({
        artistId: selectedArtist.id,
        pinCode: pin,
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
        accuracy: geolocation.accuracy,
      });
    } else {
      signInMutation.mutate({
        artistId: selectedArtist.id,
        pinCode: pin,
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
        accuracy: geolocation.accuracy,
      });
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const ungroupedArtists = availableArtists.filter(a => !a.artistGroupId);
  
  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-8">
          <img src={logoPath} alt="La Perle" className="h-36 w-auto" data-testid="img-logo" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Artist Sign In</h1>
          <p className="text-gray-600">Tap your photo to sign in or out</p>
        </div>

        {availableArtists.length === 0 ? (
          <Card className="p-12 text-center">
            <UserCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No artists available for sign-in</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {ungroupedArtists.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-black">No Group</h2>
                  <Badge variant="secondary">{ungroupedArtists.length}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {ungroupedArtists.map((artist) => (
                    <Card
                      key={artist.id}
                      data-testid={`card-artist-${artist.id}`}
                      className="p-4 text-center cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => handleArtistSelect(artist)}
                    >
                      <Avatar className="w-20 h-20 mx-auto mb-3">
                        {artist.photoUrl ? (
                          <AvatarImage src={artist.photoUrl} alt={getArtistDisplayName(artist)} />
                        ) : null}
                        <AvatarFallback>
                          <UserCircle2 className="w-12 h-12" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm line-clamp-2">{getArtistDisplayName(artist)}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {artistGroups.map((group) => {
              const groupArtists = availableArtists.filter(a => a.artistGroupId === group.id);
              if (groupArtists.length === 0) return null;

              return (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-black">{group.name}</h2>
                    <Badge variant="secondary">{groupArtists.length}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {groupArtists.map((artist) => (
                      <Card
                        key={artist.id}
                        data-testid={`card-artist-${artist.id}`}
                        className="p-4 text-center cursor-pointer hover-elevate active-elevate-2 transition-all"
                        onClick={() => handleArtistSelect(artist)}
                      >
                        <Avatar className="w-20 h-20 mx-auto mb-3">
                          {artist.photoUrl ? (
                            <AvatarImage src={artist.photoUrl} alt={getArtistDisplayName(artist)} />
                          ) : null}
                          <AvatarFallback>
                            <UserCircle2 className="w-12 h-12" />
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm line-clamp-2">{getArtistDisplayName(artist)}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedArtist} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-pin-entry">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                {selectedArtist?.photoUrl ? (
                  <AvatarImage src={selectedArtist.photoUrl} alt={selectedArtist ? getArtistDisplayName(selectedArtist) : ''} />
                ) : null}
                <AvatarFallback>
                  <UserCircle2 className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <span>{selectedArtist ? getArtistDisplayName(selectedArtist) : ''}</span>
            </DialogTitle>
            <DialogDescription>
              {isGettingLocation ? (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {locationProgress}
                </span>
              ) : locationError ? (
                <span className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  Location unavailable
                </span>
              ) : geolocation ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  {locationProgress || `Location verified (${formatAccuracy(geolocation.accuracy)})`}
                </span>
              ) : (
                <>
                  {isSignedIn ? (
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Enter PIN to sign out
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Enter PIN to sign in
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isGettingLocation ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
              <p className="text-sm text-muted-foreground text-center">{locationProgress}</p>
            </div>
          ) : locationError ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
              {showFallback && (
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Troubleshooting tips:</strong>
                    <ul className="list-disc ml-4 mt-2 space-y-1">
                      <li>Move near a window for better GPS signal</li>
                      <li>Check that location services are enabled</li>
                      <li>Try refreshing the page</li>
                      <li>Contact a stage manager if issues persist</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  if (selectedArtist) {
                    handleArtistSelect(selectedArtist);
                  }
                }}
                data-testid="button-retry-location"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {showFallback && geolocation && geolocation.accuracy > 50 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    GPS accuracy is lower than ideal ({formatAccuracy(geolocation.accuracy)}). 
                    For best results, move near a window or closer to the center of the venue.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      pin.length > i ? "bg-primary border-primary" : "border-border"
                    }`}
                    data-testid={`pin-indicator-${i}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <Button
                    key={digit}
                    variant="outline"
                    size="lg"
                    className="h-16 text-2xl"
                    onClick={() => handlePinInput(digit.toString())}
                    disabled={signInMutation.isPending || signOutMutation.isPending || pin.length >= 4 || !geolocation}
                    data-testid={`button-pin-${digit}`}
                  >
                    {digit}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16"
                  onClick={handleBackspace}
                  disabled={signInMutation.isPending || signOutMutation.isPending || pin.length === 0}
                  data-testid="button-pin-backspace"
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 text-2xl"
                  onClick={() => handlePinInput("0")}
                  disabled={signInMutation.isPending || signOutMutation.isPending || pin.length >= 4 || !geolocation}
                  data-testid="button-pin-0"
                >
                  0
                </Button>
                <div />
              </div>

              {(signInMutation.isPending || signOutMutation.isPending) && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
