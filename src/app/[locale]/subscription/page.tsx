import { redirect } from "next/navigation";

// This page predates PayPal billing (see git history) and was a
// disabled "coming soon" placeholder. The real, working billing UI now
// lives at /billing (usage, subscription status, cancel). This route
// is kept only so any old bookmark/link to /subscription still lands
// somewhere useful instead of showing a stale "not built yet" message.
export default function SubscriptionRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/billing`);
}
