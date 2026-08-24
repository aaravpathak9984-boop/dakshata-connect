import { useEffect } from "react";
import { usePublicSettings } from "@/features/settings/api/queries";

/** Keeps the browser tab title in step with the configured site name. Renders nothing itself. */
export function DocumentTitle() {
  const { data: platform } = usePublicSettings();

  useEffect(() => {
    if (platform?.siteName) {
      document.title = `${platform.siteName} — MoES Capacity Portal`;
    } else {
      document.title = "Dakshata Connect — MoES Capacity Portal";
    }
  }, [platform?.siteName]);

  return null;
}
