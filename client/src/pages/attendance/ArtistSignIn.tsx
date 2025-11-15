import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle2, LogIn, LogOut, Wifi, AlertCircle } from "lucide-react";
import type { PublicArtist, ArtistGroup, Artist } from "@shared/schema";
import logoPath from "@assets/LaPerle-logo-basic_1760100706441.png";

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
  return artist.preferredName || `${artist.firstName} ${artist.lastName}`;
}

export default function ArtistSignIn() {
  const [selectedArtist, setSelectedArtist] = useState<PublicArtist | null>(null);
  const [pin, setPin] = useState("");
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<'sign-in' | 'sign-out' | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: artists = [], isLoading } = useQuery<PublicArtist[]>({
    queryKey: ["/api/attendance/artists"],
  });

  const { data: artistGroups = [] } = useQuery<ArtistGroup[]>({
    queryKey: ["/api/attendance/artist-groups"],
  });

  // Show all artists - authentication check happens on selection
  const availableArtists = artists;

  const signInMutation = useMutation({
    mutationFn: async ({ artistId, pinCode }: {
      artistId: string;
      pinCode: string;
    }) => {
      return apiRequest("POST", "/api/attendance/sign-in", { artistId, pinCode });
    },
    onSuccess: () => {
      // Clear any existing timeout before setting a new one
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
      
      // Clear PIN to prevent re-submission
      setPin("");
      setNetworkError(null);
      setSuccessAction('sign-in');
      setShowSuccess(true);
      
      // Auto-close success screen after 3 seconds
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
        handleClose();
      }, 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Something went wrong. Please try again.";
      
      // Clear PIN on error
      setPin("");
      
      // Check if it's a network/WiFi error
      if (errorMessage.toLowerCase().includes("wifi") || errorMessage.toLowerCase().includes("la perle")) {
        setNetworkError(errorMessage);
      } else {
        setNetworkError(null);
      }
      
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async ({ artistId, pinCode }: {
      artistId: string;
      pinCode: string;
    }) => {
      return apiRequest("POST", "/api/attendance/sign-out", { artistId, pinCode });
    },
    onSuccess: () => {
      // Clear any existing timeout before setting a new one
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
      
      // Clear PIN to prevent re-submission
      setPin("");
      setNetworkError(null);
      setSuccessAction('sign-out');
      setShowSuccess(true);
      
      // Auto-close success screen after 3 seconds
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
        handleClose();
      }, 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Something went wrong. Please try again.";
      
      // Clear PIN on error
      setPin("");
      
      setNetworkError(null);
      
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const { data: currentRecord } = useQuery<AttendanceRecord | null>({
    queryKey: ["/api/attendance/status", selectedArtist?.id],
    enabled: !!selectedArtist && !showSuccess,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const isSignedIn = currentRecord && currentRecord.signInTime && !currentRecord.signOutTime;

  const handleArtistSelect = useCallback((artist: PublicArtist) => {
    // Clear any pending timeout and reset success states
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setShowSuccess(false);
    setSuccessAction(null);

    setSelectedArtist(artist);
    setPin("");
  }, []);

  const handlePinInput = useCallback((digit: string) => {
    setPin(prev => {
      if (prev.length < 4) {
        return prev + digit;
      }
      return prev;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
  }, []);

  const handleClose = useCallback(() => {
    // Clear any pending timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    
    // Reset all state
    setSelectedArtist(null);
    setPin("");
    setNetworkError(null);
    setShowSuccess(false);
    setSuccessAction(null);
    queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
  }, []);

  useEffect(() => {
    if (pin.length === 4 && selectedArtist && !signInMutation.isPending && !signOutMutation.isPending) {
      if (isSignedIn) {
        signOutMutation.mutate({
          artistId: selectedArtist.id,
          pinCode: pin,
        });
      } else {
        signInMutation.mutate({
          artistId: selectedArtist.id,
          pinCode: pin,
        });
      }
    }
  }, [pin, selectedArtist, isSignedIn, signInMutation, signOutMutation]);

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
          {!showSuccess && (
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
              </DialogDescription>
            </DialogHeader>
          )}

          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <Avatar className="relative w-32 h-32">
                  {selectedArtist?.photoUrl ? (
                    <AvatarImage src={selectedArtist.photoUrl} alt={selectedArtist ? getArtistDisplayName(selectedArtist) : ''} />
                  ) : null}
                  <AvatarFallback className="text-4xl">
                    <UserCircle2 className="w-20 h-20" />
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">
                  {successAction === 'sign-in' ? 'Welcome!' : 'See you later!'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {successAction === 'sign-in' 
                    ? "You've been signed in successfully" 
                    : "You've been signed out successfully"
                  }
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                This window will close automatically...
              </div>
            </div>
          ) : (
            <>
              {networkError && (
                <Alert variant="destructive" className="mb-4">
                  <Wifi className="h-4 w-4" />
                  <AlertDescription>
                    <strong>WiFi Error:</strong> {networkError}
                    <div className="mt-2 text-sm">
                      <p>Please ensure you're connected to the theater WiFi network and try again.</p>
                      <p className="mt-1">If the problem persists, contact a stage manager.</p>
                    </div>
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
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePinInput(digit.toString());
                }}
                disabled={signInMutation.isPending || signOutMutation.isPending || pin.length >= 4}
                data-testid={`button-pin-${digit}`}
              >
                {digit}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="h-16"
              onPointerDown={(e) => {
                e.preventDefault();
                handleBackspace();
              }}
              disabled={signInMutation.isPending || signOutMutation.isPending || pin.length === 0}
              data-testid="button-pin-backspace"
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-16 text-2xl"
              onPointerDown={(e) => {
                e.preventDefault();
                handlePinInput("0");
              }}
              disabled={signInMutation.isPending || signOutMutation.isPending || pin.length >= 4}
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
