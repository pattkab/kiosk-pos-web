"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeContext } from "@/hooks/use-realtime-context";
import { OnlineUser } from "@/types/realtime";
import { useRealtimeStore } from "@/store/use-realtime-store";

type PresencePayload = {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  currentPage: string;
  activity: string;
  onlineAt: string;
};

export function usePresence() {
  const supabase = createClient();
  const pathname = usePathname();
  const { data: context } = useRealtimeContext();
  const orgId = context?.organizationId;
  const setOnlineUsers = useRealtimeStore((state) => state.setOnlineUsers);
  const setConnectionStatus = useRealtimeStore((state) => state.setConnectionStatus);

  useEffect(() => {
    if (!orgId || !context?.profile) return;

    const channel = supabase.channel(`org:${orgId}:presence`, {
      config: { presence: { key: context.profile.id } },
    });

    const syncPresence = () => {
      const state = channel.presenceState<PresencePayload>();
      const users = Object.values(state)
        .flat()
        .reduce<OnlineUser[]>((acc, entry) => {
          if (!acc.some((user) => user.profileId === entry.profileId)) acc.push(entry);
          return acc;
        }, []);
      setOnlineUsers(users);
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          await channel.track({
            profileId: context.profile.id,
            userId: context.profile.id,
            name: context.profile.full_name ?? context.profile.email,
            email: context.profile.email,
            avatarUrl: context.profile.avatar_url,
            currentPage: pathname,
            activity: pathname.startsWith("/pos") ? "Checking out customers" : "Working",
            onlineAt: new Date().toISOString(),
          });
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
        } else {
          setConnectionStatus("connecting");
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [context?.profile, orgId, pathname, setConnectionStatus, setOnlineUsers, supabase]);
}
