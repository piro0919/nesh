import webpush from "web-push";

export type VapidKeys = {
  publicKey: string;
  privateKey: string;
};

export function generateVapidKeys(): VapidKeys {
  return webpush.generateVAPIDKeys();
}
