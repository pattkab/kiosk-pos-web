import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const activateInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters."),
});

type InvitationRecord = {
  id: string;
  organization_id: string;
  email: string;
  role: "owner" | "admin" | "manager" | "cashier";
  invited_by: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  expires_at: string;
};

type ProfileRecord = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
};

type AdminClient = SupabaseClient;

function isAlreadyRegisteredError(error: { message: string }) {
  return /already been registered|already registered|already exists/i.test(
    error.message,
  );
}

async function findAuthUserIdByEmail(admin: AdminClient, email: string) {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 25) {
    const { data: usersPage, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) throw error;

    const user = usersPage.users.find(
      (entry) => entry.email?.toLowerCase() === normalizedEmail,
    );
    if (user) return user.id;
    if (usersPage.users.length < 200) break;

    page += 1;
  }

  return null;
}

async function ensureProfileForAuthUser(
  admin: AdminClient,
  userId: string,
  email: string,
  fullName: string,
) {
  const normalizedEmail = email.toLowerCase();

  const { data: matchingProfiles, error: matchingProfilesError } = await admin
    .from("profiles")
    .select("id, auth_user_id, email, full_name, created_at")
    .or(`auth_user_id.eq.${userId},email.eq.${normalizedEmail}`)
    .order("created_at", { ascending: true });

  if (matchingProfilesError) throw matchingProfilesError;

  const profiles = (matchingProfiles ?? []) as ProfileRecord[];
  const emailProfile =
    profiles.find(
      (profile) => profile.email.toLowerCase() === normalizedEmail,
    ) ?? null;
  const authProfile =
    profiles.find((profile) => profile.auth_user_id === userId) ?? null;
  const profile = emailProfile ?? authProfile;

  if (!profile) {
    const { data: insertedProfile, error: insertError } = await admin
      .from("profiles")
      .insert({
        auth_user_id: userId,
        email: normalizedEmail,
        full_name: fullName,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    return insertedProfile.id as string;
  }

  const duplicateIds = profiles
    .filter(
      (entry) =>
        entry.id !== profile.id &&
        (entry.auth_user_id === userId ||
          entry.email.toLowerCase() === normalizedEmail),
    )
    .map((entry) => entry.id);

  if (duplicateIds.length > 0) {
    const { error: deleteError } = await admin
      .from("profiles")
      .delete()
      .in("id", duplicateIds);

    if (deleteError) throw deleteError;
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      auth_user_id: userId,
      email: normalizedEmail,
      full_name: profile.full_name ?? fullName,
    })
    .eq("id", profile.id);

  if (updateError) throw updateError;

  return profile.id;
}

async function acceptInvitationForProfile(
  admin: AdminClient,
  invitation: InvitationRecord,
  profileId: string,
) {
  const { data: member, error: memberError } = await admin
    .from("organization_members")
    .upsert(
      {
        organization_id: invitation.organization_id,
        profile_id: profileId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        removed_at: null,
      },
      { onConflict: "organization_id,profile_id" },
    )
    .select("id")
    .single();

  if (memberError) throw memberError;

  const { error: invitationError } = await admin
    .from("organization_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)
    .is("accepted_at", null)
    .is("cancelled_at", null);

  if (invitationError) throw invitationError;

  await admin.from("activity_logs").insert({
    organization_id: invitation.organization_id,
    profile_id: profileId,
    action: "ACCEPT_INVITATION",
    entity_type: "organization_member",
    entity_id: (member?.id as string | undefined) ?? profileId,
    metadata: { role: invitation.role, email: invitation.email },
  });

  return invitation.organization_id;
}

export async function POST(request: NextRequest) {
  try {
    const payload = activateInvitationSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: invitation, error: invitationError } = await admin
      .from("organization_invitations")
      .select(
        "id, organization_id, email, role, invited_by, accepted_at, cancelled_at, expires_at",
      )
      .eq("token", payload.token)
      .maybeSingle();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { ok: false, error: "Invitation is invalid or expired." },
        { status: 404 },
      );
    }

    const invitationRecord = invitation as InvitationRecord;

    if (invitationRecord.accepted_at || invitationRecord.cancelled_at) {
      return NextResponse.json(
        { ok: false, error: "Invitation is no longer active." },
        { status: 409 },
      );
    }

    if (new Date(invitationRecord.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Invitation has expired." },
        { status: 410 },
      );
    }

    const { data: createResult, error: createError } =
      await admin.auth.admin.createUser({
        email: invitationRecord.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: { full_name: payload.fullName },
      });

    let userId = createResult.user?.id ?? null;

    if (createError) {
      if (!isAlreadyRegisteredError(createError)) {
        return NextResponse.json(
          { ok: false, error: createError.message },
          { status: 400 },
        );
      }

      userId = await findAuthUserIdByEmail(admin, invitationRecord.email);
      if (!userId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Invited account exists but could not be resolved. Contact support.",
          },
          { status: 404 },
        );
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(
        userId,
        {
          password: payload.password,
          email_confirm: true,
          user_metadata: { full_name: payload.fullName },
        },
      );
      if (updateError) {
        return NextResponse.json(
          { ok: false, error: updateError.message },
          { status: 400 },
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Account could not be created." },
        { status: 500 },
      );
    }

    const profileId = await ensureProfileForAuthUser(
      admin,
      userId,
      invitationRecord.email,
      payload.fullName,
    );
    const organizationId = await acceptInvitationForProfile(
      admin,
      invitationRecord,
      profileId,
    );

    return NextResponse.json({
      ok: true,
      email: invitationRecord.email,
      organizationId,
      userId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to activate invitation.",
      },
      { status: 500 },
    );
  }
}
