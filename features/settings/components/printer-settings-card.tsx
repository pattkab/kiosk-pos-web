"use client";

import { useCallback, useEffect, useState } from "react";
import { Bluetooth, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  clearSavedPrinter,
  getSavedPrinter,
  savePrinter,
  type SavedPrinter,
} from "@/lib/native/printer-storage";
import {
  connectToPrinter,
  disconnectPrinter,
  isPrinterConnected,
  scanForPrinters,
} from "@/lib/native/bluetooth-printer";
import { ensureBluetoothPermissions } from "@/lib/native/bluetooth-permissions";

export function PrinterSettingsCard() {
  const [saved, setSaved] = useState<SavedPrinter | null>(null);
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<SavedPrinter[]>([]);

  const refresh = useCallback(async () => {
    setSaved(getSavedPrinter());
    setConnected(await isPrinterConnected());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleScan() {
    setScanning(true);
    setDevices([]);
    try {
      await ensureBluetoothPermissions();
      const found = await scanForPrinters();
      setDevices(found);
      if (found.length === 0) {
        toast.info("No printers found. Turn on the printer and pair it in Android Settings first.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not scan for printers.",
      );
    } finally {
      setScanning(false);
    }
  }

  async function handleConnect(printer: SavedPrinter) {
    try {
      const ok = await connectToPrinter(printer);
      if (!ok) {
        toast.error("Could not connect. Check the printer is on and paired.");
        return;
      }
      savePrinter(printer);
      setSaved(printer);
      setConnected(true);
      toast.success(`Connected to ${printer.name}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Connection failed.",
      );
    }
  }

  async function handleDisconnect() {
    await disconnectPrinter();
    clearSavedPrinter();
    setSaved(null);
    setConnected(false);
    setDevices([]);
    toast.success("Printer disconnected.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Printer className="h-4 w-4" />
          Bluetooth receipt printer
        </CardTitle>
        <CardDescription>
          Pair your ESC/POS thermal printer in Android Settings, scan here, then
          connect. Receipts print automatically after checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {saved ? (
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">{saved.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {saved.address}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Status: {connected ? "Connected" : "Saved — reconnecting on print"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No printer configured.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={scanning}
            onClick={() => void handleScan()}
          >
            {scanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bluetooth className="mr-2 h-4 w-4" />
            )}
            Scan for printers
          </Button>
          {saved ? (
            <Button type="button" variant="ghost" onClick={() => void handleDisconnect()}>
              Disconnect
            </Button>
          ) : null}
        </div>

        {devices.length > 0 ? (
          <ul className="space-y-2">
            {devices.map((device) => (
              <li key={device.address}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  onClick={() => void handleConnect(device)}
                >
                  <span className="font-medium">{device.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {device.address}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
