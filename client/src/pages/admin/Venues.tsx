import { useState } from "react";
import { useRouter } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Venue {
  id: number;
  name: string;
  address: string;
}

const SAMPLE_VENUES: Venue[] = [
  { id: 1, name: "Samuel Moscovitch Arena", address: "5555 Av. Casgrain, Montreal, QC" },
  { id: 2, name: "Outremont Arena", address: "1000 Av. Van Horne, Montreal, QC" },
];

export default function AdminVenues() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [, navigate] = useRouter();
  const { user } = useAuth();
  
  const [venues, setVenues] = useState<Venue[]>(SAMPLE_VENUES);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  const t = {
    en: {
      venues: "Venue Management",
      addVenue: "Add New Venue",
      venueName: "Venue Name",
      address: "Address",
      add: "Add",
      cancel: "Cancel",
      venueAdded: "Venue added successfully",
      error: "Error adding venue",
      fillAllFields: "Please fill in all fields",
      edit: "Edit",
      delete: "Delete",
      venueDeleted: "Venue deleted successfully",
    },
    fr: {
      venues: "Gestion des Arénas",
      addVenue: "Ajouter un Nouvel Aréna",
      venueName: "Nom de l'Aréna",
      address: "Adresse",
      add: "Ajouter",
      cancel: "Annuler",
      venueAdded: "Aréna ajouté avec succès",
      error: "Erreur lors de l'ajout de l'aréna",
      fillAllFields: "Veuillez remplir tous les champs",
      edit: "Modifier",
      delete: "Supprimer",
      venueDeleted: "Aréna supprimé avec succès",
    },
  };

  const labels = t[language];

  const handleAddVenue = async () => {
    if (!venueName || !venueAddress) {
      toast.error(labels.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newVenue: Venue = {
        id: Math.max(...venues.map(v => v.id), 0) + 1,
        name: venueName,
        address: venueAddress,
      };
      setVenues([...venues, newVenue]);
      
      toast.success(labels.venueAdded);
      setVenueName("");
      setVenueAddress("");
      setOpen(false);
    } catch (error) {
      toast.error(labels.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVenue = (id: number) => {
    setVenues(venues.filter(v => v.id !== id));
    toast.success(labels.venueDeleted);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            {labels.venues}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
          >
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>

        {/* Add Venue Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {labels.addVenue}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.addVenue}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.venueName}</label>
                <Input
                  type="text"
                  placeholder="Venue name"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.address}</label>
                <Input
                  type="text"
                  placeholder="Street address"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddVenue}
                  disabled={isLoading}
                >
                  {labels.add}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {labels.cancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Venues List */}
        <div className="space-y-4">
          {venues.map((venue) => (
            <Card key={venue.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{venue.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{venue.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info("Edit feature coming soon")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVenue(venue.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              {language === "en"
                ? "Manage game venues. Add, edit, or remove venues where games are played."
                : "Gérez les arénas de jeu. Ajoutez, modifiez ou supprimez les arénas où les matchs sont joués."}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
