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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import {
  createVirtualCoachAction,
  inviteCoachAction,
  deleteCoachAction,
  cancelInvitationAction,
} from "@/app/actions/coaches";
import {
  User,
  Mail,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  UserPlus,
  UserCircle2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachMember {
  id: string;
  display_name: string | null;
  avatar_url?: string | null;
  user_id?: string | null;
  role: string;
}

interface Invitation {
  id: string;
  email: string;
}

interface CoachesClientProps {
  organizationId: string;
  team: CoachMember[];
  invitations: Invitation[];
  plan?: string;
}

export function CoachesClient({
  organizationId,
  team,
  invitations,
  plan,
}: CoachesClientProps) {
  const [virtualName, setVirtualName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateVirtual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!virtualName.trim()) return;
    
    setLoading(true);
    try {
      const result = await createVirtualCoachAction(organizationId, virtualName);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Coach virtuel créé");
        setVirtualName("");
      }
    } catch (err: unknown) {
      console.error("Client side error:", err);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      const result = await inviteCoachAction(organizationId, inviteEmail);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation envoyée");
        setInviteEmail("");
      }
    } catch (err: unknown) {
      console.error("Client side error:", err);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoach = async (id: string) => {
    if (!confirm("Supprimer ce coach ?")) return;
    const result = await deleteCoachAction(organizationId, id);
    if (result.error) toast.error(result.error);
    else toast.success("Coach supprimé");
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm("Annuler cette invitation ?")) return;
    const result = await cancelInvitationAction(organizationId, id);
    if (result.error) toast.error(result.error);
    else toast.success("Invitation annulée");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground tracking-tight">
          Gestion des Coachs
        </h2>
        <p className="text-muted-foreground font-medium text-sm">
          Créez des coachs internes ou invitez des collaborateurs externes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forms Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <UserPlus className="size-4" />
                </div>
                <CardTitle className="text-lg font-semibold text-card-foreground">
                  Ajouter un Coach
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="virtual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-background rounded-lg h-10 p-1">
                  <TabsTrigger
                    value="virtual"
                    className="rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Virtuel
                  </TabsTrigger>
                  <TabsTrigger
                    value="invite"
                    className="rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Inviter
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="virtual" className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Un coach virtuel n'a pas de compte utilisateur. Il sert
                    uniquement à l'attribution des séances dans le planning.
                  </p>
                  <form onSubmit={handleCreateVirtual} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Nom d'affichage
                      </Label>
                      <Input
                        value={virtualName}
                        onChange={(e) => setVirtualName(e.target.value)}
                        placeholder="Ex: Coach Sarah"
                        className="rounded-lg border-border h-10 text-sm"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 rounded-lg font-medium text-sm shadow-sm"
                    >
                      {loading ? "Création..." : "Créer le coach"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="invite" className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    L'invité recevra une notification dans son dashboard pour
                    rejoindre votre studio.
                  </p>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Email du coach
                      </Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        className="rounded-lg border-border h-10 text-sm"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 rounded-lg font-medium text-sm shadow-sm"
                    >
                      {loading ? "Envoi..." : "Envoyer l'invitation"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Upgrade Banner for Starter Plan */}
          {plan !== "premium" && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-3">
              <div className="flex gap-3">
                <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Zap className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 leading-tight">
                    Limite de coachs atteinte ?
                  </p>
                  <p className="text-xs text-amber-700/80 font-medium mt-1">
                    Le plan Starter est limité. Passez au plan supérieur pour ajouter autant de coachs que vous le souhaitez.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/billing" className="block">
                <Button variant="outline" className="w-full h-9 rounded-xl text-xs font-bold bg-card border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300 transition-all">
                  Améliorer mon plan &rarr;
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Coaches */}
          <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-card-foreground">
                  Équipe active
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                  {team.length} membre{team.length > 1 ? "s" : ""}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {team.map((m) => (
                    <TableRow
                      key={m.id}
                      className="hover:bg-background/50 border-border/50 h-16"
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "size-10 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden border border-border shadow-sm",
                              m.user_id
                                ? "bg-primary/5 text-primary"
                                : "bg-orange-50 text-orange-600",
                            )}
                          >
                            {m.avatar_url ? (
                              <img
                                src={m.avatar_url}
                                alt={m.display_name ?? ""}
                                className="size-full object-cover"
                              />
                            ) : m.user_id ? (
                              <UserCircle2 className="size-5" />
                            ) : (
                              <span>VIR</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-card-foreground">
                              {m.display_name}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">
                              {m.role === "owner"
                                ? "Propriétaire"
                                : m.role === "coach"
                                  ? "Coach"
                                  : m.role}
                              {m.user_id ? "" : " • Virtuel"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {m.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCoach(m.id)}
                            className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                        {m.role === "owner" && (
                          <span className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                            Admin
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-semibold text-card-foreground">
                  Invitations en attente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {invitations.map((inv) => (
                      <TableRow
                        key={inv.id}
                        className="hover:bg-background/50 border-border/50 h-16"
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="size-10 rounded-full bg-background flex items-center justify-center border border-border">
                              <Clock className="size-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-700">
                                {inv.email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                En attente d'acceptation
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvite(inv.id)}
                            className="text-sm font-medium text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50"
                          >
                            Annuler
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

