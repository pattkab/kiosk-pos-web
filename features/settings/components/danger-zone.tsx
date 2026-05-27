"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveOrganization, useDeleteOrganization } from "@/hooks/use-organization";
import { TriangleAlert } from "lucide-react";

export function DangerZone() {
  const { activeOrganization } = useActiveOrganization();
  const deleteOrganization = useDeleteOrganization();
  const [confirmation, setConfirmation] = useState("");
  const canDelete = Boolean(activeOrganization?.name && confirmation === activeOrganization.name);

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="h-5 w-5" />
          Danger zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Deleting an organization disables access to its workspace. This action is restricted to owners and is audited.
        </p>
        <div className="max-w-md space-y-2">
          <Label>Type {activeOrganization?.name} to confirm</Label>
          <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </div>
        <Button
          variant="destructive"
          disabled={!canDelete || deleteOrganization.isPending}
          onClick={() => deleteOrganization.mutate()}
        >
          Delete organization
        </Button>
      </CardContent>
    </Card>
  );
}
