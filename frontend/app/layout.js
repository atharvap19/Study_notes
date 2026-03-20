import "./globals.css";

export const metadata = {
  title: "DocNotes AI",
  description: "Generate structured AI study notes from any document",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
