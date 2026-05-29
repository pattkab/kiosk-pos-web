export function isYoPaymentsConfigured() {
  return Boolean(
    process.env.YO_PAYMENTS_API_USERNAME &&
      process.env.YO_PAYMENTS_API_PASSWORD,
  );
}

export function getYoPaymentsConfig() {
  const username = process.env.YO_PAYMENTS_API_USERNAME;
  const password = process.env.YO_PAYMENTS_API_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Yo Payments is not configured. Set YO_PAYMENTS_API_USERNAME and YO_PAYMENTS_API_PASSWORD.",
    );
  }

  const sandbox = process.env.YO_PAYMENTS_SANDBOX === "true";

  return {
    username,
    password,
    sandbox,
    apiUrl: sandbox
      ? "https://sandbox.yo.co.ug/services/yopaymentsdev/task.php"
      : "https://paymentsapi1.yo.co.ug/ybs/task.php",
    ipnUrl:
      process.env.YO_PAYMENTS_IPN_URL ??
      `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/api/payments/yo/webhook`,
    cardCheckoutUrlTemplate: process.env.YO_CARD_CHECKOUT_URL ?? null,
  };
}
