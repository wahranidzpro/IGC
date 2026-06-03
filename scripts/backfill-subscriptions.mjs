import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ozlhyunylifenywugefz.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("Set it: $env:SUPABASE_SERVICE_ROLE_KEY='your-key'");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEFAULT_USERS = [
  { username: "admin", password: "Admin@123", pin: "1234", role: "admin", name: "Admin Principal" },
  { username: "reception", password: "Reception@123", pin: "5678", role: "reception", name: "Reception" },
  { username: "coach", password: "Coach@123", pin: "0000", role: "coach", name: "Coach Principal" },
];

async function createUser(user) {
  const email = `${user.username}@infinitygym.local`;

  const { data: existing } = await supabase
    .from("gym_users")
    .select("id, auth_user_id")
    .eq("username", user.username)
    .maybeSingle();

  if (existing?.auth_user_id) {
    console.log(`  ↳ ${user.username} already has auth_user_id. Ensuring subscription...`);
    const { error: subErr } = await supabase.rpc("ensure_user_subscription", {
      p_user_id: existing.auth_user_id,
    });
    if (subErr) console.log(`  ⚠ ensure_user_subscription error: ${subErr.message}`);
    else console.log(`  ✓ subscription + membership_control ensured`);
    return;
  }

  if (existing && !existing.auth_user_id) {
    console.log(`  ↳ ${user.username} exists in gym_users but no auth link.`);
  }

  console.log(`  Creating Supabase Auth user: ${email}`);
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: user.password,
    email_confirm: true,
    user_metadata: { username: user.username, role: user.role, name: user.name, pin: user.pin },
  });

  if (authErr) {
    if (authErr.message?.includes("already exists")) {
      console.log(`  ↳ Auth user already exists. Finding by email...`);
      const { data: users } = await supabase.auth.admin.listUsers();
      const found = users?.users?.find((u) => u.email === email);
      if (found) {
        await linkAndSubscribe(found.id, user);
      }
      return;
    }
    console.error(`  ✗ Failed to create auth user: ${authErr.message}`);
    return;
  }

  if (authData?.user) {
    await linkAndSubscribe(authData.user.id, user);
  }
}

async function linkAndSubscribe(authUserId, user) {
  const email = `${user.username}@infinitygym.local`;

  const { data: existingGym } = await supabase
    .from("gym_users")
    .select("id")
    .eq("username", user.username)
    .maybeSingle();

  if (existingGym) {
    const { error: upErr } = await supabase
      .from("gym_users")
      .update({ auth_user_id: authUserId })
      .eq("id", existingGym.id);
    if (upErr) console.log(`  ⚠ update gym_users: ${upErr.message}`);
    else console.log(`  ✓ Linked gym_users.${existingGym.id} → auth.${authUserId}`);
  } else {
    console.log(`  Creating gym_users entry...`);
    const { error: insErr } = await supabase.from("gym_users").insert({
      username: user.username,
      password_hash: user.password,
      pin: user.pin,
      role: user.role,
      name: user.name,
      auth_user_id: authUserId,
    });
    if (insErr) {
      console.log(`  ⚠ insert gym_users: ${insErr.message} (service_role may need access)`);
    } else {
      console.log(`  ✓ gym_users created`);
    }
  }

  const { error: subErr } = await supabase.rpc("ensure_user_subscription", {
    p_user_id: authUserId,
  });

  if (subErr) {
    if (subErr.message?.includes("function") && subErr.message?.includes("not found")) {
      console.log(`  ⚠ ensure_user_subscription RPC not found — inserting directly...`);
      await supabase.from("subscriptions").insert({
        user_id: authUserId,
        status: "active",
        plan_name: "Standard",
      }).then((r) => {
        if (r.error) console.log(`  ⚠ subscriptions insert: ${r.error.message}`);
        else console.log(`  ✓ subscription created directly`);
      });
      await supabase.from("memberships_control").insert({
        user_id: authUserId,
        approved_by_admin: user.role === "admin" || user.role === "reception" || user.role === "coach",
        approved_by_reception: user.role === "admin" || user.role === "reception",
      }).then((r) => {
        if (r.error) console.log(`  ⚠ memberships_control insert: ${r.error.message}`);
        else console.log(`  ✓ memberships_control created directly`);
      });
    } else {
      console.log(`  ⚠ ensure_user_subscription error: ${subErr.message}`);
    }
  } else {
    console.log(`  ✓ subscription + memberships_control created`);
  }
}

async function insertDefaultSettings() {
  const defaults = [
    { key: "structure_locked", value: "false" },
    { key: "sync_version", value: "1" },
    { key: "last_migration", value: "014" },
  ];

  for (const s of defaults) {
    const { error } = await supabase.from("settings").upsert(s, { onConflict: "key" });
    if (error) {
      if (error.message?.includes("does not exist")) {
        console.log(`  ⚠ settings table not available yet. Apply migration 014 SQL first.`);
        return;
      }
      console.log(`  ⚠ settings upsert '${s.key}': ${error.message}`);
    }
  }
  console.log(`  ✓ default settings inserted`);
}

async function main() {
  console.log("\n=== INFINITY GYM - Backfill Subscriptions ===\n");
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  console.log("Step 1: Creating users...\n");
  for (const user of DEFAULT_USERS) {
    console.log(`[${user.username}] (${user.role})`);
    await createUser(user);
    console.log();
  }

  console.log("Step 2: Inserting default settings...\n");
  await insertDefaultSettings();

  console.log("\n=== VERIFICATION ===\n");
  for (const user of DEFAULT_USERS) {
    const { data: gu } = await supabase
      .from("gym_users")
      .select("id, username, role, auth_user_id")
      .eq("username", user.username)
      .maybeSingle();

    if (gu) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, plan_name")
        .eq("user_id", gu.auth_user_id)
        .maybeSingle();
      const { data: mc } = await supabase
        .from("memberships_control")
        .select("approved_by_admin, approved_by_reception")
        .eq("user_id", gu.auth_user_id)
        .maybeSingle();

      console.log(`${user.username}:`);
      console.log(`  gym_users:     ✓ (auth_user_id: ${gu.auth_user_id?.slice(0, 8)}...)`);
      console.log(`  subscription:  ${sub ? `✓ (${sub.status})` : "✗ MISSING"}`);
      console.log(`  control:       ${mc ? `✓ (admin:${mc.approved_by_admin}, reception:${mc.approved_by_reception})` : "✗ MISSING"}`);
    } else {
      console.log(`${user.username}: ✗ NOT FOUND in gym_users`);
    }
  }

  console.log("\n=== DONE ===\n");
}

main().catch(console.error);
