"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtimeStore } from "@/store/use-realtime-store";

export function PresenceAvatars() {
  const onlineUsers = useRealtimeStore((state) => state.onlineUsers);
  const visibleUsers = onlineUsers.slice(0, 4);
  const overflow = Math.max(0, onlineUsers.length - visibleUsers.length);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="hidden items-center -space-x-2 sm:flex">
      {visibleUsers.map((user) => (
        <Avatar key={user.profileId} className="h-8 w-8 border-2 border-background">
          <AvatarImage src={user.avatarUrl ?? ""} alt={user.name} />
          <AvatarFallback className="text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-bold">
          +{overflow}
        </div>
      )}
      <span className="ml-3 text-xs text-muted-foreground">{onlineUsers.length} online</span>
    </div>
  );
}
