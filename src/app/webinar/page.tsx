import WebinarPage from "@/components/webinar/WebinarPage";
import { webinarMetadata } from "@/lib/webinar";

/** The free-webinar join page, Hindi — the default, and what the ads point at. */
export const metadata = webinarMetadata("hi");

export default function WebinarHindiPage() {
  return <WebinarPage lang="hi" />;
}
