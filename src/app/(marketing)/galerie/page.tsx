import { permanentRedirect } from "next/navigation"

// no video found — this page is a permanent redirect to /galerie-media
export default function GaleriePage() {
  permanentRedirect("/galerie-media")
}
