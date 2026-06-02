import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/profile");

  return (
    <div className="max-w-md mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--cm-muted)" }}>
          Update your display name and password.
        </p>
      </div>

      <ProfileForm
        currentName={session.user.name ?? ""}
        currentEmail={session.user.email ?? ""}
      />
    </div>
  );
}
