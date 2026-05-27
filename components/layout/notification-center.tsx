"use client";

import Link from "next/link";
import { Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppStore } from "@/store/use-app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { useMarkNotificationRead } from "@/hooks/use-realtime-notifications";
import { useNotifications } from "@/hooks/use-notifications";
import { PriorityBadge } from "@/features/notifications/components/priority-badge";

export function NotificationCenter() {
  const { notifications: localNotifications, markAsRead } = useAppStore();
  const notificationQuery = useNotifications();
  const realtimeNotifications = useRealtimeStore((state) => state.notifications);
  const markRealtimeRead = useMarkNotificationRead();
  const notifications = [
    ...(notificationQuery.data ?? []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      read: Boolean(notification.read_at),
      createdAt: new Date(notification.created_at ?? new Date()),
      priority: notification.priority,
    })),
    ...realtimeNotifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: new Date(notification.createdAt),
      priority: notification.priority ?? "medium",
    })),
    ...localNotifications.filter(
      (notification) => !realtimeNotifications.some((entry) => entry.id === notification.id)
    ).map((notification) => ({ ...notification, priority: "medium" as const })),
  ].filter((notification, index, all) => all.findIndex((entry) => entry.id === notification.id) === index);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex flex-col gap-1 border-b p-4 text-sm transition-colors hover:bg-muted/50",
                    !n.read && "bg-muted/30"
                  )}
                  onClick={() => {
                    markAsRead(n.id);
                    markRealtimeRead(n.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{n.title}</span>
                    <PriorityBadge priority={n.priority} />
                  </div>
                  <p className="text-muted-foreground">{n.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="grid grid-cols-2 gap-2 border-t p-2">
          <Button
            variant="ghost"
            className="w-full text-xs"
            size="sm"
            onClick={() => notifications.forEach((notification) => {
              markAsRead(notification.id);
              markRealtimeRead(notification.id);
            })}
          >
            Mark all as read
          </Button>
          <Button variant="ghost" className="w-full gap-1 text-xs" size="sm" asChild>
            <Link href="/notifications">
              View all
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
