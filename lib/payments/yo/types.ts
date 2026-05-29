export type YoCollectionMethod =
  | "mtn_mobile_money"
  | "airtel_money"
  | "visa"
  | "mastercard"
  | "card";

export type YoCollectionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type YoApiResponse = {
  status: "OK" | "ERROR";
  statusCode?: string;
  statusMessage?: string;
  transactionReference?: string;
  transactionStatus?: string;
  mnoTransactionReferenceId?: string;
  rawXml?: string;
};

export type InitiateYoCollectionInput = {
  organizationId: string;
  registerSessionId?: string | null;
  cashierId?: string | null;
  amount: number;
  method: YoCollectionMethod;
  payerPhone?: string | null;
  narrative?: string;
};

export type InitiateYoCollectionResult =
  | {
      ok: true;
      collectionId: string;
      externalReference: string;
      status: YoCollectionStatus;
      yoTransactionReference?: string | null;
      message: string;
      checkoutUrl?: string | null;
    }
  | { ok: false; error: string; status?: number };
