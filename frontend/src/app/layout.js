import "../styles/globals.css";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              fontFamily: "Arial, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
