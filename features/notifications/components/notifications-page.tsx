"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAlerts, useNotificationActions, useNotifications } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/store/use-notification-store";
import { AlertCard } from "./alert-card";
import { AlertFilters } from "./alert-filters";
import { PriorityBadge } from "./priority-badge";
import { Archive, Bell, CheckCheck, Settings } from "lucide-react";

export function NotificationsPage() {
  const { filters } = useNotificationStore();
  const alerts = useAlerts(filters);
  const notifications = useNotifications();
  const actions = useNotificationActions();
  const unreadCount = (notifications.data ?? []).filter((entry) => !entry.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Operational alerts, team activity, summaries, and alert acknowledgements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/notifications/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="outline" onClick={() => actions.markAllRead.mutate()} disabled={actions.markAllRead.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Unread</p><p className="text-2xl font-bold">{unreadCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Open alerts</p><p className="text-2xl font-bold">{(alerts.data ?? []).filter((entry) => entry.status === "open").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Critical</p><p className="text-2xl font-bold">{(alerts.data ?? []).filter((entry) => entry.priority === "critical").length}</p></CardContent></Card>
      </div>

      <AlertFilters />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {alerts.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />)
          ) : alerts.data?.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <Bell className="mb-3 h-10 w-10 text-muted-foreground opacity-30" />
                <h3 className="font-semibold">No alerts found</h3>
                <p className="text-sm text-muted-foreground">Try changing the filters or check back later.</p>
              </CardContent>
            </Card>
          ) : (
            alerts.data?.map((alert) => <AlertCard key={alert.id} alert={alert} />)
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="border-b p-4">
              <h2 className="font-semibold">Notification inbox</h2>
            </div>
            <div className="divide-y">
              {(notifications.data ?? []).slice(0, 12).map((notification) => (
                <div key={notification.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    <PriorityBadge priority={notification.priority} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{new Date(notification.created_at ?? new Date()).toLocaleString()}</span>
                    <div className="flex gap-1">
                      {!notification.read_at && (
                        <Button variant="ghost" size="sm" onClick={() => actions.markRead.mutate(notification.id)}>
                          Read
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => actions.archive.mutate(notification.id)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
