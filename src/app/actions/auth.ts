"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/emails/send";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const registerSchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire 8 caractères minimum"),
  studioName: z
    .string()
    .min(2, "Le nom du studio est trop court")
    .optional()
    .or(z.literal("")),
  role: z.enum(["member", "manager"]),
});

export async function registerAction(prevState: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password, studioName, role } = parsed.data;
  const plan = (formData.get("plan") as string) || "starter";

  try {
    const adminSupabase = createAdminClient();

    // 0. Vérifier manuellement si l'utilisateur existe déjà pour un message d'erreur plus propre
    const { data: { users } } = await adminSupabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return { error: "Cette adresse email est déjà enregistrée. Veuillez vous connecter." };
    }

    // 1. Créer le compte Supabase (AUTO-CONFIRMÉ via Admin API)
    // Cela permet de se connecter instantanément sans cliquer sur un mail
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // IMPORTANT: Pas de mail de confirmation requis
        user_metadata: { full_name: name },
      });

    if (authError) {
      console.error("Registration auth error:", authError);
      if (authError.message.includes("already registered")) {
        return { error: "Cet email est déjà utilisé." };
      }
      return {
        error: "Erreur lors de la création du compte : " + authError.message,
      };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { error: "Impossible de récupérer l'utilisateur créé." };
    }

    // Lazy link to organizations based on email (for both roles)
    const studioMemberships = await prisma.studio_members.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    for (const sm of studioMemberships) {
      await prisma.org_members.upsert({
        where: {
          organization_id_user_id: {
            organization_id: sm.organization_id,
            user_id: userId,
          },
        },
        update: {
          display_name: name || sm.full_name,
        },
        create: {
          organization_id: sm.organization_id,
          user_id: userId,
          role: "member",
          display_name: name || sm.full_name,
        },
      });
    }

    // 1.5 Lazy link to invitations (Coaches/Staff)
    const pendingInvites = await prisma.org_invitations.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    for (const invite of pendingInvites) {
      await prisma.org_members.upsert({
        where: {
          organization_id_user_id: {
            organization_id: invite.organization_id,
            user_id: userId,
          },
        },
        update: {
          role: invite.role,
          display_name: name,
        },
        create: {
          organization_id: invite.organization_id,
          user_id: userId,
          role: invite.role,
          display_name: name,
        },
      });
      // Supprimer l'invitation une fois utilisée
      await prisma.org_invitations.delete({
        where: { id: invite.id },
      });
    }

    // 2. Toujours créer un profil utilisateur (facturation, abonnement)
    await prisma.user_profiles.create({
      data: {
        user_id: userId,
        plan: plan,
        subscription_status: plan === "starter" ? "trialing" : "active",
        trial_ends_at: plan === "starter" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
      }
    });

    // 3. Créer l'organisation et le membre (Manager only)
    // On ne crée PAS de nouveau studio s'il accepte une invitation existante
    if (role === "manager" && studioName && pendingInvites.length === 0) {
      const slug = studioName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      await prisma.$transaction(async (tx) => {
        // Create the Organization (Studio)
        const org = await tx.organizations.create({
          data: {
            name: studioName,
            slug: slug,
            onboarding_completed: true,
          },
        });

        // Link User as Owner
        await tx.org_members.create({
          data: {
            organization_id: org.id,
            user_id: userId,
            role: "owner",
            display_name: name,
          },
        });
      });

      try {
        await sendWelcomeEmail(name, studioName, email);
      } catch (e) {
        console.error("Welcome email error:", e);
      }
    }

    // 3. Connecter l'utilisateur pour définir les cookies de session
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Auto sign-in error:", signInError);
      return {
        redirect:
          "/login?message=" +
          encodeURIComponent("Compte créé ! Veuillez vous connecter."),
      };
    }
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return { error: "Une erreur est survenue lors de l'inscription." };
  }

  redirect("/dashboard");
}

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      return { error: "Identifiants invalides." };
    }

    revalidatePath("/", "layout");
  } catch (error: unknown) {
    console.error("Login system error:", error);
    return { error: "Une erreur est survenue." };
  }

  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const host = (await headers()).get("host");
  
  // Utiliser NEXT_PUBLIC_APP_URL s'il est défini, sinon utiliser l'hôte actuel
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
  const redirectUrl = `${siteUrl.replace(/\/$/, "")}/api/auth/callback`;

  console.log(`[signInWithGoogleAction] Redirecting via: ${redirectUrl}`);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google sign in error:", error.message);
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendVerificationAction(email: string) {
  const supabase = await createClient();
  const host = (await headers()).get("host");
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "http://localhost:3000");
  const redirectUrl = `${siteUrl.replace(/\/$/, "")}/api/auth/callback`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error("Resend error:", error.message);
    return { error: "Erreur lors de l'envoi : " + error.message };
  }

  return { success: true };
}

export async function updateUserProfileAction(data: {
  name: string;
  phone?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    data: { full_name: data.name, phone: data.phone },
  });

  if (error) {
    console.error("Update profile error:", error.message);
    return { error: error.message };
  }

  // Mettre à jour aussi dans org_members pour la cohérence
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await prisma.org_members.updateMany({
      where: { user_id: user.id },
      data: { display_name: data.name },
    });
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updatePasswordAction(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Update password error:", error.message);
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteAccountAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Non autorisé" };
  }

  try {
    const adminSupabase = createAdminClient();
    
    // Deleting the user via Supabase Admin API will cascade delete their
    // user_profile, org_memberships, etc. per the database schema.
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
    
    if (error) {
      console.error("Delete user error:", error.message);
      return { error: "Erreur lors de la suppression de votre compte." };
    }

    // Sign out the user locally
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Delete system error:", error);
    return { error: "Une erreur interne est survenue." };
  }

  redirect("/register?message=account_deleted");
}
