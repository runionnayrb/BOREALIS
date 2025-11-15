import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import logoPath from "@assets/LaPerle-logo-basic_1760100706441.png";

interface MyIpResponse {
  yourIp: string;
  isTrusted: boolean;
  trustedIpsCount: number;
  headers: {
    'x-forwarded-for'?: string;
    'x-real-ip'?: string;
  };
}

export default function MyIP() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<MyIpResponse>({
    queryKey: ["/api/attendance/my-ip"],
  });

  const handleCopy = () => {
    if (data?.yourIp) {
      navigator.clipboard.writeText(data.yourIp);
      setCopied(true);
      toast({
        description: "IP address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <img src={logoPath} alt="La Perle" className="h-36 w-auto" data-testid="img-logo" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Check Your IP Address</h1>
          <p className="text-muted-foreground">
            This page shows what IP address the server sees from your device
          </p>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className={`absolute inset-0 ${data?.isTrusted ? 'bg-primary/20' : 'bg-destructive/20'} rounded-full animate-ping`} />
              <div className={`relative ${data?.isTrusted ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'} rounded-full p-6`}>
                {data?.isTrusted ? (
                  <Wifi className="w-12 h-12" />
                ) : (
                  <WifiOff className="w-12 h-12" />
                )}
              </div>
            </div>

            <div className="text-center space-y-4 w-full">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your IP Address</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-2xl font-mono font-bold bg-muted px-4 py-2 rounded">
                    {data?.yourIp || 'unknown'}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    data-testid="button-copy-ip"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Badge 
                  variant={data?.isTrusted ? "default" : "destructive"}
                  className="text-sm px-4 py-1"
                >
                  {data?.isTrusted ? "✓ Trusted WiFi" : "✗ Not Trusted"}
                </Badge>
              </div>

              {!data?.isTrusted && (
                <div className="bg-muted p-4 rounded-lg text-left space-y-2">
                  <p className="font-semibold">To add this IP to trusted list:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Copy the IP address above</li>
                    <li>Go to Admin Dashboard</li>
                    <li>Click on "System Configuration" tab</li>
                    <li>Scroll to "Trusted WiFi IPs"</li>
                    <li>Click "Add IP Address"</li>
                    <li>Paste the IP and add a description (e.g., "La Perle WiFi")</li>
                  </ol>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>Trusted IPs configured: {data?.trustedIpsCount || 0}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
