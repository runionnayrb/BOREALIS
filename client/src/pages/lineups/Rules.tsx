import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Rules() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rules & Automation</h1>
          <p className="text-muted-foreground mt-1">
            Manage lineup rules, warnings, and auto-assignment configurations
          </p>
        </div>
        <Button data-testid="button-add-rule">
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
          <TabsTrigger value="linked-positions" data-testid="tab-linked-positions">Linked Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                Rules feature is under development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This tab will allow you to create hard block rules and warnings
                for lineup validation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="linked-positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                Linked Positions feature is under development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This tab will allow you to configure linked positions for automatic
                artist assignment across related positions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
