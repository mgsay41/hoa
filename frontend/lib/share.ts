/** WhatsApp share link: opens WhatsApp with the text ready, and the user picks a contact or group. */
export function whatsappLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
