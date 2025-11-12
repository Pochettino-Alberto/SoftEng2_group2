import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function DynamicMeta() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;

    // Default meta
    let title = "Participium";
    let favicon = "/mole-antonelliana.png";

    // Custom for Municipality
    if (pathname.startsWith("/municipality")) {
      title = "Participium - Officer";
      favicon = "/icons/municipality.png";
    }

    // Custom for Admin
    else if (pathname.startsWith("/admin")) {
      title = "Participium - Admin";
      favicon = "/icons/admin.png";
    }

    // Update document title
    document.title = title;

    // Update or create favicon link
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [location.pathname]);

  return null;
}
