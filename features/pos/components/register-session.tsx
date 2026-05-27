"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterSession } from "@/hooks/use-pos";
import { useSessionStore } from "@/store/use-session-store";
import { formatCurrency } from "@/lib/utils";
import { Banknote, History, Lock, LogOut, Unlock } from "lucide-react";

export function RegisterSession() {
  const { currentSession, isClosingRegister, setIsClosingRegister } = useSessionStore();
  const { openRegister, closeRegister } = useRegisterSession();
  const [openingBalance, setOpeningBalance] = useState("0");
  const [closingBalance, setClosingBalance] = useState("");
  const [notes, setNotes] = useState("");

  if (currentSession) {
    return (
      <Dialog open={isClosingRegister} onOpenChange={setIsClosingRegister}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Close register
            </DialogTitle>
            <DialogDescription>
              Count the cash drawer and record the actual closing balance for reconciliation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Opening balance</span>
                <span className="font-bold">{formatCurrency(currentSession.opening_balance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Opened</span>
                <span className="font-bold">{new Date(currentSession.opened_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actual closing cash</Label>
              <Input
                className="h-12 text-lg font-bold"
                type="number"
                min="0"
                value={closingBalance}
                onChange={(event) => setClosingBalance(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional reconciliation note" />
            </div>

            <Button
              className="h-12 w-full"
              disabled={closeRegister.isPending || closingBalance === ""}
              onClick={() =>
                closeRegister.mutate(
                  { actualClosingBalance: Number(closingBalance), notes },
                  { onSuccess: () => setIsClosingRegister(false) }
                )
              }
            >
              {closeRegister.isPending ? "Closing..." : "Close register"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!currentSession} onOpenChange={() => undefined}>
      <DialogContent className="max-w-[440px] p-0" onPointerDownOutside={(event) => event.preventDefault()}>
        <div className="p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-10 w-10 text-primary" />
          </div>

          <DialogHeader className="mt-6 text-center">
            <DialogTitle className="text-3xl font-black">Register locked</DialogTitle>
            <DialogDescription className="text-base">
              Enter the starting cash balance to open your checkout session.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-2 text-left">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Starting balance</Label>
            <div className="relative">
              <Banknote className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                className="h-16 pl-12 text-2xl font-black"
                value={openingBalance}
                onChange={(event) => setOpeningBalance(event.target.value)}
              />
            </div>
          </div>

          <Button
            className="mt-6 h-16 w-full text-lg font-black"
            onClick={() => openRegister.mutate(Number(openingBalance))}
            disabled={openRegister.isPending}
          >
            <Unlock className="mr-2 h-5 w-5" />
            {openRegister.isPending ? "Opening..." : "Open register"}
          </Button>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <History className="h-4 w-4" />
            Register history is tracked for every shift.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
