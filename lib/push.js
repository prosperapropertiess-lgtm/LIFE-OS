// Sends a web push notification to all stored subscriptions.
// Requires env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

export async function sendPush(title, body, url = "/") {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:prosperapropertiess@gmail.com";

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not set — skipping push notifications");
    return { skipped: true };
  }

  // Dynamic import so the module doesn't blow up if web-push isn't installed yet
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(email, publicKey, privateKey);

  const { getSupabase } = await import("./supabase.js");
  const sb = getSupabase();
  const { data: subs } = await sb.from("push_subscriptions").select("endpoint, keys");

  if (!subs || subs.length === 0) return { sent: 0 };

  const payload = JSON.stringify({ title, body, url, tag: "life-os-cron" });
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      ).catch(async (err) => {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410) {
          await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        throw err;
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed };
}
