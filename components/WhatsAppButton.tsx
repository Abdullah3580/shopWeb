// Replace the phone number with your real WhatsApp business number (country code, no +/spaces).
const WHATSAPP_NUMBER = "8801XXXXXXXXX";

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp এ যোগাযোগ করুন"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-2xl transition"
    >
      💬
    </a>
  );
}
