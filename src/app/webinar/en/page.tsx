import WebinarPage from "@/components/webinar/WebinarPage";
import { webinarMetadata } from "@/lib/webinar";

/** The free-webinar join page, English. Reached from the EN | हिं switch on `/webinar`. */
export const metadata = webinarMetadata("en");

export default function WebinarEnglishPage() {
  return <WebinarPage lang="en" />;
}
