export const CUSTOMER_UPDATED_EVENT = "gtg:customer-updated";
export const CUSTOMER_PROFILE_REFRESH_EVENT = "gtg:customer-profile-refresh";
export const OPEN_COIN_PURCHASE_EVENT = "gtg:open-coin-purchase";

export type CustomerUpdatedDetail = {
  ad?: string;
  soyad?: string;
  coin?: number;
};

export type OpenCoinPurchaseDetail = {
  packageNr?: number;
};
