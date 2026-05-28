declare module "qrcode" {
  interface QRCodeToStringOptions {
    type?: "terminal" | "svg" | "utf8";
    small?: boolean;
  }

  interface QRCodeToDataURLOptions {
    type?: "image/png" | "image/webp";
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  }

  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: QRCodeToStringOptions
  ): Promise<string>;
}
