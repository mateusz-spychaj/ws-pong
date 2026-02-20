// ---------------------------------------------------------------------------
// QRCode Component - Displays QR code for player connection
// ---------------------------------------------------------------------------

interface QRCodeProps {
  qrCode: string;
  className?: string;
}

export default function QRCode({ qrCode, className }: QRCodeProps) {
  if (!qrCode) return null;

  return (
    <div
      className={
        className ||
        "mx-auto my-[20px] inline-block rounded-[10px] bg-white p-[20px]"
      }
    >
      <img src={qrCode} alt="QR Code" className="h-[300px] w-[300px]" />
    </div>
  );
}
