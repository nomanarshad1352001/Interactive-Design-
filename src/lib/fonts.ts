/** Typefaces offered inside the designer, loaded via Google Fonts in layout. */
export const DESIGN_FONTS: { family: string; label: string }[] = [
  { family: "DM Sans", label: "DM Sans" },
  { family: "Archivo Black", label: "Archivo Black" },
  { family: "Bebas Neue", label: "Bebas Neue" },
  { family: "Anton", label: "Anton" },
  { family: "Oswald", label: "Oswald" },
  { family: "Montserrat", label: "Montserrat" },
  { family: "Playfair Display", label: "Playfair" },
  { family: "Fraunces", label: "Fraunces" },
  { family: "Pacifico", label: "Pacifico" },
  { family: "Lobster", label: "Lobster" },
  { family: "Caveat", label: "Caveat" },
  { family: "Righteous", label: "Righteous" },
  { family: "Bungee", label: "Bungee" },
  { family: "Comfortaa", label: "Comfortaa" },
];

export async function ensureFontLoaded(family: string): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`700 64px "${family}"`),
        document.fonts.load(`italic 700 64px "${family}"`),
        document.fonts.load(`400 64px "${family}"`),
      ]),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    /* fall back to a system font silently */
  }
}
