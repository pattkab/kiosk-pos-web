import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { buildInvitationEmailTemplate } from "@/lib/email/invitation-template";
import { getConfiguredAppUrl } from "@/lib/app-url";

const MAX_EMAIL_RETRIES = 3;

async function sendWithRetry(
  resend: Resend,
  payload: Parameters<Resend["emails"]["send"]>[0],
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_EMAIL_RETRIES; attempt += 1) {
    try {
      const result = await resend.emails.send(payload);
      if (result.error) throw new Error(result.error.message);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_EMAIL_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Email provider request failed.");
}

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Email service is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      invitationId?: string;
      organizationId?: string;
    };

    if (!body.invitationId || !body.organizationId) {
      return NextResponse.json(
        { ok: false, error: "invitationId and organizationId are required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { data: canManage, error: permissionError } = await supabase.rpc(
      "has_org_permission",
      {
        p_organization_id: body.organizationId,
        p_permission: "team.manage",
      },
    );
    if (permissionError || !canManage) {
      return NextResponse.json(
        {
          ok: false,
          error: "You do not have permission to send invite emails.",
        },
        { status: 403 },
      );
    }

    const { data: invitation, error: invitationError } = await supabase
      .from("organization_invitations")
      .select(
        "id, organization_id, name, email, role, token, invited_by, accepted_at, cancelled_at",
      )
      .eq("id", body.invitationId)
      .eq("organization_id", body.organizationId)
      .maybeSingle();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { ok: false, error: "Invitation not found." },
        { status: 404 },
      );
    }

    if (invitation.accepted_at || invitation.cancelled_at) {
      return NextResponse.json(
        { ok: false, error: "Invitation is no longer active." },
        { status: 409 },
      );
    }

    const [{ data: org }, { data: inviter }] = await Promise.all([
      supabase
        .from("organizations")
        .select("name")
        .eq("id", invitation.organization_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", invitation.invited_by)
        .maybeSingle(),
    ]);

    const baseUrl = getConfiguredAppUrl({ allowLocalhost: false });
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    const inviterName = inviter?.full_name || inviter?.email || null;

    const template = buildInvitationEmailTemplate({
      organizationName: org?.name ?? "Your organization",
      inviteeName: invitation.name ?? null,
      role: invitation.role,
      inviterName,
      inviteUrl,
    });

    const resend = new Resend(resendApiKey);
    await sendWithRetry(resend, {
      from: fromEmail,
      to: invitation.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    await supabase
      .from("organization_invitations")
      .update({ resent_at: new Date().toISOString() })
      .eq("id", invitation.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send invitation email.",
      },
      { status: 500 },
    );
  }
}
