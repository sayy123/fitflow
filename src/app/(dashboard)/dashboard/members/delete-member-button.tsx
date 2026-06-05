"use client";

import { deleteStudioMemberAction } from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function DeleteMemberButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre ? Cette action est irréversible et supprimera toutes ses réservations.")) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteStudioMemberAction(memberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Membre supprimé avec succès");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="size-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
