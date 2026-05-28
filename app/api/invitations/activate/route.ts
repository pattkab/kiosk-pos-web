import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const activateInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
});

export async function POST(request: NextRequest) {
  try {
    const payload = activateInvitationSchema.parse(await request.json());
    const supabase = await createClient();

    const { data: invitation, error: invitationError } = await supabase
      .from("organization_invitations")
      .select("email, accepted_at, cancelled_at, expires_at")
      .eq("token", payload.token)
      .maybeSingle();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { ok: false, error: "Invitation is invalid or expired." },
        { status: 404 },
      );
    }

    if (invitation.accepted_at || invitation.cancelled_at) {
      return NextResponse.json(
        { ok: false, error: "Invitation is no longer active." },
        { status: 409 },
      );
    }

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Invitation has expired." },
        { status: 410 },
      );
    }

    const admin = createAdminClient();
    const { data: createResult, error: createError } =
      await admin.auth.admin.createUser({
      email: invitation.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: { full_name: payload.fullName },
    });

    if (!createError) {
      return NextResponse.json({
        ok: true,
        email: invitation.email,
        userId: createResult.user?.id ?? null,
      });
    }

    if (
      !/already been registered|already registered|already exists/i.test(
        createError.message,
      )
    ) {
      return NextResponse.json(
        { ok: false, error: createError.message },
        { status: 400 },
      );
    }

    let page = 1;
    let matchedUserId: string | null = null;
    while (page <= 10 && !matchedUserId) {
      const { data: usersPage, error: usersError } =
        await admin.auth.admin.listUsers({
          page,
          perPage: 200,
        });
      if (usersError) {
        return NextResponse.json(
          { ok: false, error: usersError.message },
          { status: 400 },
        );
      }
      matchedUserId =
        usersPage.users.find(
          (user) => user.email?.toLowerCase() === invitation.email.toLowerCase(),
        )?.id ?? null;
      page += 1;
    }

    if (!matchedUserId) {
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
      matchedUserId,
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

    return NextResponse.json({
      ok: true,
      email: invitation.email,
      userId: matchedUserId,
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
