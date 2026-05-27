"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  Building2,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useActiveOrganization } from "@/hooks/use-organization";

export function OrgSwitcher() {
  const [open, setOpen] = React.useState(false);
  const { organizations, activeOrganization, switchOrganization, isLoading } =
    useActiveOrganization();

  if (isLoading)
    return (
      <div className="h-9 w-36 animate-pulse rounded-md bg-muted sm:w-[220px]" />
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an organization"
          className="w-40 justify-between sm:w-[220px]"
        >
          <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          <span className="truncate">
            {activeOrganization?.name || "Select organization"}
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(260px,calc(100vw-1.5rem))] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search organizations..." />
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations.map((organization) => (
                <CommandItem
                  key={organization.id}
                  onSelect={() => {
                    switchOrganization(organization.id);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{organization.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {organization.role}
                    </p>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeOrganization?.id === organization.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem asChild>
                <Link href="/settings" onClick={() => setOpen(false)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Organization settings
                </Link>
              </CommandItem>
              <CommandItem asChild>
                <Link href="/onboarding" onClick={() => setOpen(false)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create organization
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
