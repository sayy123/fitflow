"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { updateOrganizationAction } from "@/app/actions/organizations";
import {
  updateUserProfileAction,
  updatePasswordAction,
  deleteAccountAction,
} from "@/app/actions/auth";
import { uploadAvatarAction, removeAvatarAction } from "@/app/actions/avatars";
import {
  Building2,
  User,
  Lock,
  Phone,
  MapPin,
  Globe,
  Mail,
  ShieldCheck,
  ChevronRight,
  Camera,
  Trash2,
  CreditCard,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SettingsClientProps {
  organization: {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    plan?: string | null;
    stripe_account_id?: string | null;
    stripe_charges_enabled?: boolean | null;
    payment_link?: string | null;
  };
  user: {
    email: string;
    user_metadata?: {
      avatar_url?: string | null;
      full_name?: string | null;
      phone_number?: string | null;
    };
  };
  role: string;
}

export function SettingsClient({
  organization,
  user,
  role,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "studio" | "security" | "billing"
  >("profile");

  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState(
    user.user_metadata?.avatar_url || "",
  );
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Organization State
  const [orgName, setOrgName] = useState(organization.name);
  const [orgAddress, setOrgAddress] = useState(organization.address || "");
  const [orgPhone, setOrgPhone] = useState(organization.phone || "");
  const [orgPaymentLink, setOrgPaymentLink] = useState(organization.payment_link || "");
  const [orgLoading, setOrgLoading] = useState(false);

  // Profile State
  const [userName, setUserName] = useState(user.user_metadata?.full_name || "");
  const [userPhone, setUserPhone] = useState(
    user.user_metadata?.phone_number || "",
  );
  const [profileLoading, setProfileLoading] = useState(false);

  // Password State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Deletion State
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = role === "owner";

  const handleUpdateOrg = async () => {
    setOrgLoading(true);
    const result = await updateOrganizationAction(organization.id, {
      name: orgName,
      address: orgAddress,
      phone: orgPhone,
      payment_link: orgPaymentLink,
    });
    setOrgLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Studio mis à jour");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    const result = await updateUserProfileAction({
      name: userName,
      phone: userPhone,
    });
    setProfileLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Profil mis à jour");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setPasswordLoading(true);
    const result = await updatePasswordAction(password);
    setPasswordLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Mot de passe mis à jour");
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("ATTENTION : Cette action est irréversible. Toutes vos données seront supprimées définitivement. Êtes-vous sûr ?")) {
      return;
    }
    setDeleteLoading(true);
    const result = await deleteAccountAction();
    // if successful, it redirects, otherwise it returns an error
    if (result && result.error) {
      toast.error(result.error);
      setDeleteLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatarAction(formData);
    setAvatarLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Photo de profil mise à jour");
      if (result.url) setAvatarUrl(result.url);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Supprimer votre photo de profil ?")) return;

    setAvatarLoading(true);
    const result = await removeAvatarAction();
    setAvatarLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Photo supprimée");
      setAvatarUrl("");
    }
  };

  const menuItems = [
    {
      id: "profile" as const,
      label: "Mon Profil",
      icon: User,
      desc: "Infos personnelles et contact",
    },
    {
      id: "studio" as const,
      label: "Mon Studio",
      icon: Building2,
      desc: "Informations de l'établissement",
      hidden: !isOwner,
    },
    {
      id: "billing" as const,
      label: "Abonnement",
      icon: CreditCard,
      desc: "Gérer mon forfait et factures",
      hidden: !isOwner,
    },
    {
      id: "security" as const,
      label: "Sécurité",
      icon: ShieldCheck,
      desc: "Mot de passe et accès",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-card-foreground tracking-tight">
          Paramètres
        </h2>
        <p className="text-sm font-medium text-muted-foreground">
          Gérez votre expérience sur Fitloww
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-4 space-y-2">
          {menuItems
            .filter((i) => !i.hidden)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                    isActive
                      ? "bg-primary/5 border-primary/20 text-primary"
                      : "bg-transparent border-transparent text-foreground/80 hover:bg-background hover:border-border",
                  )}
                >
                  <div
                    className={cn(
                      "size-10 rounded-lg flex items-center justify-center transition-colors shrink-0",
                      isActive
                        ? "bg-card text-primary shadow-sm border border-primary/10"
                        : "bg-background text-muted-foreground border border-border/50",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-primary" : "text-gray-700",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-8">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300">
            {activeTab === "billing" && isOwner && (
              <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-foreground">
                <div className="pb-4 border-b border-border/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Gestion de l'Abonnement
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consultez votre grade actuel et améliorez vos capacités.
                    </p>
                  </div>
                  <div className="bg-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground/80 border border-border">
                    Plan {organization.plan || "Starter"}
                  </div>
                </div>

                <div className="bg-background border border-border/50 rounded-2xl p-6 flex items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Besoin de plus de puissance ?
                    </p>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      Passez au grade Premium pour débloquer les membres
                      illimités, la gestion multi-salles et les rapports
                      mensuels.
                    </p>
                  </div>
                  <Link href="/dashboard/billing">
                    <Button className="h-10 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shrink-0">
                      Améliorer mon grade
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Informations de Profil
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mettez à jour vos informations de contact.
                  </p>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-background/50 rounded-xl border border-border/50">
                  <div className="relative group shrink-0">
                    <div className="size-24 rounded-full bg-card border-4 border-white shadow-sm overflow-hidden flex items-center justify-center relative ring-1 ring-gray-100">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profil"
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-10 text-gray-300" />
                      )}
                      {avatarLoading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="size-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 size-8 bg-primary text-primary-foreground rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors border-2 border-white">
                      <Camera className="size-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={avatarLoading}
                      />
                    </label>
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h4 className="text-sm font-semibold text-card-foreground">
                      Photo de profil
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG ou WebP. Taille max 2Mo.
                      <br />
                      Elle sera visible par votre studio et sur le planning.
                    </p>
                    {avatarUrl && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5 mx-auto sm:mx-0 mt-2"
                      >
                        <Trash2 className="size-3.5" /> Supprimer la photo
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">
                        Nom complet
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="rounded-lg border-border h-10 pl-10 text-sm focus:border-primary focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">
                        Email (Lecture seule)
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          value={user.email}
                          disabled
                          className="rounded-lg border-border h-10 pl-10 text-sm bg-background text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">
                        Téléphone mobile
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="Non renseigné"
                          className="rounded-lg border-border h-10 pl-10 text-sm focus:border-primary focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full sm:w-auto h-10 px-6 rounded-lg font-medium text-sm"
                  >
                    {profileLoading
                      ? "Enregistrement..."
                      : "Enregistrer les modifications"}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === "studio" && isOwner && (
              <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Configuration du Studio
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gérez l'identité publique de votre établissement.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Nom commercial
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="rounded-lg border-border h-10 pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Adresse physique
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={orgAddress}
                        onChange={(e) => setOrgAddress(e.target.value)}
                        placeholder="Ex: 12 rue du Sport, Bruxelles"
                        className="rounded-lg border-border h-10 pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Téléphone de contact
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={orgPhone}
                        onChange={(e) => setOrgPhone(e.target.value)}
                        className="rounded-lg border-border h-10 pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Lien de paiement universel
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={orgPaymentLink}
                        onChange={(e) => setOrgPaymentLink(e.target.value)}
                        placeholder="Ex: https://revolut.me/tonnom, lydia-app.com/..., paypal.me/..."
                        className="rounded-lg border-border h-10 pl-10 text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      Vos membres seront redirigés vers ce lien pour régler leurs séances payantes. <br/>
                      <span className="font-semibold text-gray-700">Compatible avec :</span> Revolut, PayPal, Lydia, Paylib, SumUp, Stripe Payment Links, ou toute autre cagnotte.
                    </p>
                  </div>
                  <Button
                    onClick={handleUpdateOrg}
                    disabled={orgLoading}
                    className="w-full sm:w-auto h-10 px-6 rounded-lg font-medium text-sm bg-gray-900 hover:bg-gray-800"
                  >
                    {orgLoading ? "Mise à jour..." : "Mettre à jour le studio"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="pb-4 border-b border-border/50">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Sécurité du Compte
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Protégez votre accès avec un mot de passe robuste.
                  </p>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">
                        Nouveau mot de passe
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="rounded-lg border-border h-10 pl-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">
                        Confirmer le mot de passe
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="rounded-lg border-border h-10 pl-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={passwordLoading || !password}
                    variant="outline"
                    className="w-full sm:w-auto h-10 px-6 rounded-lg font-medium text-sm"
                  >
                    {passwordLoading
                      ? "Mise à jour..."
                      : "Changer le mot de passe"}
                  </Button>
                </form>

                <div className="pt-8 mt-8 border-t border-red-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-600">Supprimer mon compte</h4>
                    </div>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      variant="destructive"
                      className="w-full sm:w-auto h-10 px-6 rounded-lg font-medium text-sm shadow-sm"
                    >
                      {deleteLoading ? "Suppression..." : "Supprimer mon compte"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
