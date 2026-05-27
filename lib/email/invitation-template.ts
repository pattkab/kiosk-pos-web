const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export function buildInvitationEmailTemplate(params: {
  organizationName: string;
  inviteeName: string | null;
  role: string;
  inviterName: string | null;
  inviteUrl: string;
}) {
  const orgName = escapeHtml(params.organizationName);
  const invitee = params.inviteeName ? escapeHtml(params.inviteeName) : "there";
  const role = escapeHtml(params.role.replaceAll("_", " "));
  const inviter = params.inviterName ? escapeHtml(params.inviterName) : "your team";
  const inviteUrl = escapeHtml(params.inviteUrl);

  const subject = `You're invited to join ${orgName} on Kiosk POS`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <p style="margin:0 0 12px">Hi ${invitee},</p>
      <p style="margin:0 0 12px">${inviter} invited you to join <strong>${orgName}</strong> as <strong>${role}</strong> in Kiosk POS.</p>
      <p style="margin:0 0 16px">
        <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
          Accept invitation
        </a>
      </p>
      <p style="margin:0 0 12px;font-size:12px;color:#6b7280">
        If the button does not work, copy and open this link:
      </p>
      <p style="margin:0;font-size:12px;word-break:break-all;color:#2563eb">${inviteUrl}</p>
    </div>
  `;

  const text = [
    `Hi ${params.inviteeName ?? "there"},`,
    "",
    `${params.inviterName ?? "Your team"} invited you to join ${params.organizationName} as ${params.role.replaceAll("_", " ")} in Kiosk POS.`,
    "",
    `Accept invitation: ${params.inviteUrl}`,
  ].join("\n");

  return { subject, html, text };
}
