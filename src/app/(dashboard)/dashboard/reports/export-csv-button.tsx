'use client'

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ExportCSVButton({ transactions, monthName }: { 
  transactions: { id: string, date: string, member: string, email: string, description: string, amount: number, type: string }[], 
  monthName: string 
}) {
  const handleExport = () => {
    // CSV Header
    let csv = "Date,Membre,Email,Description,Montant (EUR)\n";
    
    // CSV Rows
    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('fr-FR');
      // Echapper les guillemets et séparateurs
      const member = `"${t.member.replace(/"/g, '""')}"`;
      const email = `"${t.email.replace(/"/g, '""')}"`;
      const desc = `"${t.description.replace(/"/g, '""')}"`;
      csv += `${date},${member},${email},${desc},${t.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `compta_${monthName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Exporter pour la compta (CSV)
    </Button>
  )
}
